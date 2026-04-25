/**
 * Firebase Cloud Functions for BallotBuddy
 *
 * Provides server-side functionality:
 *   1. chatProxy    — Secure proxy for Google Gemini AI API requests
 *   2. logFeedback  — Stores user feedback in Cloud Firestore
 *
 * Google Services Used:
 *   - Firebase Cloud Functions (v2, HTTPS triggers)
 *   - Google Gemini 1.5 Flash (Generative AI API)
 *   - Cloud Firestore (usage tracking, feedback storage, session analytics)
 *   - Cloud Logging (structured logging via firebase-functions/logger)
 *   - Firebase Admin SDK (server-side Firebase access)
 *
 * Security:
 *   - API keys stored server-side via Firebase environment parameters
 *   - CORS enabled for cross-origin frontend requests
 *   - Input validation on all endpoints
 *   - Rate limiting metadata tracked in Firestore
 *
 * @module functions
 */
const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  admin.initializeApp();
}

/** @type {admin.firestore.Firestore} Cloud Firestore instance */
const db = admin.firestore();

/** Gemini API key — stored as a Firebase environment parameter */
const geminiApiKey = defineString("GEMINI_API_KEY");

/** Maximum allowed message array length to prevent abuse */
const MAX_MESSAGES = 50;

/** Maximum allowed system prompt length */
const MAX_PROMPT_LENGTH = 1000;

/**
 * Track API usage statistics in Cloud Firestore.
 * Stores per-region, per-day request counts and message volumes.
 * Uses Firestore atomic increment for concurrent-safe counters.
 *
 * @param {string} region - The user's region
 * @param {number} messageCount - Number of messages in the conversation
 * @param {number} latencyMs - Response latency in milliseconds
 * @returns {Promise<void>}
 */
async function trackUsage(region, messageCount, latencyMs) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const docRef = db.collection("usage_stats").doc(`${today}_${region || "unknown"}`);

    await docRef.set(
      {
        region: region || "unknown",
        date: today,
        requestCount: admin.firestore.FieldValue.increment(1),
        totalMessages: admin.firestore.FieldValue.increment(messageCount || 0),
        avgLatencyMs: latencyMs,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info("Usage tracked", { region, messageCount, latencyMs });
  } catch (error) {
    // Non-critical — log but don't fail the request
    logger.warn("Failed to track usage", { error: error.message });
  }
}

/**
 * chatProxy — Firebase Cloud Function (HTTPS)
 *
 * Secure proxy for Google Gemini API requests.
 * Keeps the API key server-side so it is never exposed to the browser.
 *
 * Request body:
 *   - messages: Array<{ role: 'user'|'assistant', content: string }>
 *   - systemPrompt: string
 *
 * Response:
 *   - { response: string } on success
 *   - { error: string } on failure
 *
 * Google Services:
 *   - Gemini 1.5 Flash (generative AI)
 *   - Cloud Logging (structured request/response logs)
 *   - Cloud Firestore (usage tracking)
 */
exports.chatProxy = onRequest({ timeoutSeconds: 60, memory: '256MiB' }, (request, response) => {
  cors(request, response, async () => {
    const startTime = Date.now();

    // ── Method validation ──
    if (request.method !== "POST") {
      logger.warn("Method not allowed", {
        method: request.method,
        ip: request.ip,
      });
      return response.status(405).json({ error: "Method Not Allowed" });
    }

    // ── API key validation ──
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not set in environment");
      return response
        .status(500)
        .json({ error: "GEMINI_API_KEY not set in environment" });
    }

    // ── Input validation ──
    const { messages, systemPrompt } = request.body;

    if (!messages || !Array.isArray(messages)) {
      logger.warn("Bad request: messages array missing or invalid", {
        body: typeof request.body,
      });
      return response
        .status(400)
        .json({ error: "Messages array is required and must be an array" });
    }

    if (messages.length === 0) {
      logger.warn("Bad request: empty messages array");
      return response
        .status(400)
        .json({ error: "Messages array cannot be empty" });
    }

    if (messages.length > MAX_MESSAGES) {
      logger.warn("Bad request: too many messages", { count: messages.length });
      return response
        .status(400)
        .json({ error: `Maximum ${MAX_MESSAGES} messages allowed` });
    }

    if (systemPrompt && systemPrompt.length > MAX_PROMPT_LENGTH) {
      logger.warn("Bad request: system prompt too long", { length: systemPrompt.length });
      return response
        .status(400)
        .json({ error: "System prompt exceeds maximum length" });
    }

    // Validate each message has required fields
    const isValidMessages = messages.every(
      (msg) => msg && typeof msg.role === "string" && typeof msg.content === "string"
    );
    if (!isValidMessages) {
      logger.warn("Bad request: invalid message format");
      return response
        .status(400)
        .json({ error: "Each message must have 'role' and 'content' string fields" });
    }

    // ── Extract metadata for structured logging ──
    const region = systemPrompt?.match(/from (.+?)\./)?.[1] || "unknown";
    const language = systemPrompt?.match(/Respond in (.+?):/)?.[1] || "English";

    logger.info("Chat request received", {
      region,
      language,
      messageCount: messages.length,
      userAgent: request.get("User-Agent"),
      contentLength: request.get("Content-Length"),
    });

    try {
      // ── Build Gemini API request ──
      const contents = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      const requestBody = {
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt || "You are BallotBuddy, a civic education assistant." }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          topP: 0.9,
          topK: 40,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      };

      // ── Call Gemini API ──
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!res.ok) {
        const errorData = await res.text();
        logger.error("Gemini API error", {
          status: res.status,
          region,
          error: errorData.substring(0, 500), // Truncate for logging
        });
        return response
          .status(res.status)
          .json({ error: "Gemini API error", details: errorData });
      }

      const data = await res.json();
      const assistantMessage =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I apologize, I could not generate a response. Please try again.";

      const latency = Date.now() - startTime;

      // ── Structured Cloud Logging ──
      logger.info("Chat response generated", {
        region,
        language,
        latencyMs: latency,
        responseLength: assistantMessage.length,
        modelUsed: "gemini-2.5-flash",
        inputTokenEstimate: messages.reduce((acc, m) => acc + m.content.length, 0),
      });

      // Track usage asynchronously (fire-and-forget, doesn't block response)
      trackUsage(region, messages.length, latency);

      // ── Set cache headers for efficiency ──
      response.set("Cache-Control", "no-store");
      response.json({ response: assistantMessage });

    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error("Server error", {
        error: error.message,
        stack: error.stack?.substring(0, 500),
        region,
        latencyMs: latency,
      });
      response.status(500).json({ error: "Internal server error" });
    }
  });
});

/**
 * logFeedback — Firebase Cloud Function (HTTPS)
 *
 * Stores user feedback in Cloud Firestore for product improvement.
 * Accepts POST requests with feedback type and optional message.
 *
 * Google Services:
 *   - Cloud Firestore (feedback storage)
 *   - Cloud Logging (structured logging)
 */
exports.logFeedback = onRequest((request, response) => {
  cors(request, response, async () => {
    if (request.method !== "POST") {
      return response.status(405).json({ error: "Method Not Allowed" });
    }

    const { type, message, region, sessionId } = request.body;

    if (!type || typeof type !== "string") {
      return response.status(400).json({ error: "Feedback type is required" });
    }

    try {
      const docRef = await db.collection("user_feedback").add({
        type,
        message: message || "",
        region: region || "unknown",
        sessionId: sessionId || "anonymous",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userAgent: request.get("User-Agent"),
      });

      logger.info("Feedback received", {
        type,
        region,
        docId: docRef.id,
      });

      response.json({ success: true, id: docRef.id });
    } catch (error) {
      logger.error("Feedback storage error", { error: error.message });
      response.status(500).json({ error: "Failed to store feedback" });
    }
  });
});
