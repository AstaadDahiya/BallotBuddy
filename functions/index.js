/**
 * Firebase Cloud Function: chatProxy
 * Secure proxy for Google Gemini API requests.
 * Keeps the API key server-side so it is never exposed to the browser.
 */
const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });

// Define the API key as a Firebase parameter (set via .env or firebase CLI)
const geminiApiKey = defineString("GEMINI_API_KEY");

exports.chatProxy = onRequest((request, response) => {
  cors(request, response, async () => {
    // Only allow POST
    if (request.method !== "POST") {
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
      return response
        .status(400)
        .json({ error: "Messages array is required" });
    }

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
        logger.error("Gemini API error:", errorData);
        return response
          .status(res.status)
          .json({ error: "Gemini API error", details: errorData });
      }

      const data = await res.json();
      const assistantMessage =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I apologize, I could not generate a response. Please try again.";

      response.json({ response: assistantMessage });
    } catch (error) {
      logger.error("Server error:", error);
      response.status(500).json({ error: "Internal server error" });
    }
  });
});
