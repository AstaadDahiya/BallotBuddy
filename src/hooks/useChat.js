import { useState, useCallback } from 'react';
import { buildSystemPrompt } from '../constants';
import { logEvent } from '../analytics';

const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

/**
 * useChat — Custom hook encapsulating all chat logic with the Gemini API.
 * Handles message state, API communication, loading state, and error handling.
 *
 * @param {string} region - The user's selected region
 * @param {string} language - The user's selected language
 * @returns {{ messages: Array, isLoading: boolean, sendMessage: Function, startChat: Function, resetChat: Function }}
 */
export default function useChat(region, language) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Send a user message to the Gemini API via the proxy.
   * Appends the user message immediately, then appends the assistant response.
   */
  const sendMessage = useCallback(async (userText) => {
    const userMsg = { role: 'user', content: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(region, language);

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, systemPrompt }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      const assistantMsg = { role: 'assistant', content: data.response };
      setMessages((prev) => [...prev, assistantMsg]);
      logEvent('message_sent', { region, language, messageCount: updatedMessages.length });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = {
        role: 'assistant',
        content: `I'm sorry, I encountered an issue: ${error.message}. Please make sure the API proxy is running and your API keys are valid.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, region, language]);

  /**
   * Start a new chat session with an initial greeting.
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
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [initialMsg], systemPrompt }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }
      setMessages([initialMsg, { role: 'assistant', content: data.response }]);
      logEvent('journey_started', { region, language });
    } catch (error) {
      console.error('Start error:', error);
      setMessages([initialMsg, {
        role: 'assistant',
        content: `Welcome to BallotBuddy! 🗳️ I'm having trouble connecting to the AI service: ${error.message}. Please ensure the proxy server is running and try again.`,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [region, language]);

  /**
   * Reset the chat — clear all messages.
   */
  const resetChat = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, setMessages, isLoading, sendMessage, startChat, resetChat };
}
