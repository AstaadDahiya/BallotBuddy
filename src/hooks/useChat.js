import { useState, useCallback, useRef } from 'react';
import { buildSystemPrompt } from '../constants';
import { logEvent, startPerformanceTrace, AnalyticsEvents } from '../analytics';

/** API base URL — empty in production (same-origin), configurable in dev */
const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

/** Request timeout in milliseconds to prevent hanging connections */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * useChat — Custom hook encapsulating all chat logic with the Gemini API.
 * Handles message state, API communication, loading state, error handling,
 * and Firebase Performance tracing.
 *
 * Performance optimizations:
 *   - Uses functional setState to avoid stale closures & reduce re-renders
 *   - AbortController for request cancellation and timeout handling
 *   - Firebase Performance traces for API latency monitoring
 *
 * @param {string} region - The user's selected region
 * @param {string} language - The user's selected language
 * @returns {{ messages: Array, setMessages: Function, isLoading: boolean, sendMessage: Function, startChat: Function, resetChat: Function }}
 */
export default function useChat(region, language) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  /** Ref to the current AbortController for request cancellation */
  const abortControllerRef = useRef(null);

  /**
   * Make an API request to the Gemini proxy with timeout and performance tracing.
   * @param {Array} messagePayload - Messages to send
   * @param {string} systemPrompt - System prompt for the AI
   * @returns {Promise<string>} The assistant's response text
   * @throws {Error} On network/API errors
   */
  const fetchAIResponse = useCallback(async (messagePayload, systemPrompt) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Set up request timeout
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Start Firebase Performance trace
    const trace = startPerformanceTrace('ai_chat_request');
    if (trace) {
      trace.putAttribute('region', region || 'unknown');
      trace.putAttribute('language', language || 'English');
      trace.putAttribute('message_count', String(messagePayload.length));
    }

    const startTime = performance.now();

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagePayload, systemPrompt }),
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      // Track response latency
      const latencyMs = Math.round(performance.now() - startTime);
      AnalyticsEvents.aiResponseTime(latencyMs, region);

      return data.response;
    } finally {
      clearTimeout(timeoutId);
      if (trace) {
        try { trace.stop(); } catch { /* trace already stopped */ }
      }
      abortControllerRef.current = null;
    }
  }, [region, language]);

  /**
   * Send a user message to the Gemini API via the proxy.
   * Appends the user message immediately (optimistic), then fires the API call.
   * Uses functional setState to avoid stale closure over messages.
   */
  const sendMessage = useCallback(async (userText) => {
    const userMsg = { role: 'user', content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Build the complete message list for the API
    const updatedMessages = [...messages, userMsg];

    try {
      const systemPrompt = buildSystemPrompt(region, language);
      const responseText = await fetchAIResponse(updatedMessages, systemPrompt);
      const assistantMsg = { role: 'assistant', content: responseText };
      setMessages((prev) => [...prev, assistantMsg]);
      logEvent('message_sent', { region, language, messageCount: updatedMessages.length });
    } catch (error) {
      if (error.name === 'AbortError') {
        console.info('[BallotBuddy] Request aborted (timeout or cancellation)');
        return;
      }
      console.error('Chat error:', error);
      const errorMsg = {
        role: 'assistant',
        content: `I'm sorry, I encountered an issue: ${error.message}. Please make sure the API proxy is running and your API keys are valid.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
      AnalyticsEvents.errorOccurred('chat_error', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [messages, fetchAIResponse, region, language]);

  /**
   * Start a new chat session with an initial greeting.
   * Sends the first message and receives the AI's welcome response.
   */
  const startChat = useCallback(async () => {
    const initialMsg = {
      role: 'user',
      content: `Hi! I'm from ${region}. Help me get started with my election journey.`,
    };
    setMessages([initialMsg]);
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(region, language);
      const responseText = await fetchAIResponse([initialMsg], systemPrompt);
      setMessages([initialMsg, { role: 'assistant', content: responseText }]);
      logEvent('journey_started', { region, language });
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Start error:', error);
      setMessages([initialMsg, {
        role: 'assistant',
        content: `Welcome to BallotBuddy! 🗳️ I'm having trouble connecting to the AI service: ${error.message}. Please ensure the proxy server is running and try again.`,
      }]);
      AnalyticsEvents.errorOccurred('start_error', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [region, language, fetchAIResponse]);

  /**
   * Reset the chat — clear all messages and cancel in-flight requests.
   */
  const resetChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
  }, []);

  return { messages, setMessages, isLoading, sendMessage, startChat, resetChat };
}
