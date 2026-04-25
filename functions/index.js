/**
 * Firebase Cloud Function: chatProxy
 * Secure proxy for Google Gemini API requests.
 * Keeps the API key server-side so it is never exposed to the browser.
 * Includes structured logging and Firestore usage tracking.
 */
const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK for Firestore access
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Define the API key as a Firebase parameter (set via .env or firebase CLI)
const geminiApiKey = defineString("GEMINI_API_KEY");

/**
 * Track usage statistics in Firestore for analytics and monitoring.
 * Stores per-region, per-day request counts and message volumes.
 * @param {string} region - The user's region
 * @param {number} messageCount - Number of messages in the conversation
 */
async function trackUsage(region, messageCount) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const docRef = db.collection("usage_stats").doc(`${today}_${region || "unknown"}`);

    await docRef.set(
      {
        region: region || "unknown",
        date: today,
        requestCount: admin.firestore.FieldValue.increment(1),
        totalMessages: admin.firestore.FieldValue.increment(messageCount || 0),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    // Non-critical — log but don't fail the request
    logger.warn("Failed to track usage:", error.message);
  }
}

exports.chatProxy = onRequest((request, response) => {
  cors(request, response, async () => {
    const startTime = Date.now();

    // Only allow POST
    if (request.method !== "POST") {
      logger.warn("Method not allowed", { method: request.method });
      return response.status(405).send("Method Not Allowed");
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not set.");
      return response
        .status(500)
        .json({ error: "GEMINI_API_KEY not set in environment" });
    }

    const { messages, systemPrompt } = request.body;
    if (!messages) {
      logger.warn("Bad request: messages array missing");
      return response
        .status(400)
        .json({ error: "Messages array is required" });
    }

    // Extract metadata for logging
    const region = systemPrompt?.match(/from (.+?)\./)?.[1] || "unknown";
    const language = systemPrompt?.match(/Respond in (.+?):/)?.[1] || "English";

    logger.info("Chat request received", {
      region,
      language,
      messageCount: messages.length,
      userAgent: request.get("User-Agent"),
    });

    try {
      // Convert chat messages to Gemini format
      const contents = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      const requestBody = {
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          topP: 0.9,
        },
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
          error: errorData,
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
      logger.info("Chat response generated", {
        region,
        language,
        latencyMs: latency,
        responseLength: assistantMessage.length,
      });

      // Track usage asynchronously (don't block the response)
      trackUsage(region, messages.length);

      response.json({ response: assistantMessage });
    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error("Server error", {
        error: error.message,
        region,
        latencyMs: latency,
      });
      response.status(500).json({ error: "Internal server error" });
    }
  });
});
