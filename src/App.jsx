import { useState, useEffect, useCallback } from 'react';
import ProgressBar from './components/ProgressBar';
import Sidebar from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import ChatPanel from './components/ChatPanel';
import { buildSystemPrompt, loadState, saveState, clearState } from './constants';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

/**
 * Detect current step from assistant messages using keyword heuristics.
 */
function detectStep(messages) {
  const assistantTexts = messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content.toLowerCase())
    .join(' ');

  if (assistantTexts.includes('result') || assistantTexts.includes('after the election'))
    return 5;
  if (assistantTexts.includes('cast') || assistantTexts.includes('evm') || assistantTexts.includes('ballot'))
    return 4;
  if (assistantTexts.includes('polling') || assistantTexts.includes('booth') || assistantTexts.includes('logistics'))
    return 3;
  if (assistantTexts.includes('candidate') || assistantTexts.includes('manifesto') || assistantTexts.includes('research'))
    return 2;
  return 1;
}

export default function App() {
  // Load persisted state
  const saved = loadState();

  const [region, setRegion] = useState(saved?.region || '');
  const [started, setStarted] = useState(saved?.started || false);
  const [messages, setMessages] = useState(saved?.messages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(saved?.fontSize || 'normal');
  const [language, setLanguage] = useState(saved?.language || 'English');
  const [currentStep, setCurrentStep] = useState(saved?.currentStep || 1);

  // Persist state changes
  useEffect(() => {
    saveState({ region, started, messages, fontSize, language, currentStep });
  }, [region, started, messages, fontSize, language, currentStep]);

  // Apply font size class to HTML element
  useEffect(() => {
    document.documentElement.classList.toggle('font-large', fontSize === 'large');
  }, [fontSize]);

  // Detect step from messages
  useEffect(() => {
    // setState in useEffect is generally discouraged, but here it's deriving state from messages.
    // A better approach would be to calculate currentStep during rendering or use useMemo,
    // but to avoid massive refactoring, we'll keep the logic but use a standard derived state pattern or disable lint for this line.
    if (messages.length > 0) {
      const newStep = detectStep(messages);
      if (newStep !== currentStep) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentStep(newStep);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  /**
   * Send a message to the Gemini API via the Express proxy.
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
        body: JSON.stringify({
          messages: updatedMessages,
          systemPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }
      const assistantMsg = { role: 'assistant', content: data.response };
      setMessages((prev) => [...prev, assistantMsg]);
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
   * Start the journey — send initial greeting to AI.
   */
  const handleStart = useCallback(async () => {
    setStarted(true);
    setMessages([]);
    setCurrentStep(1);

    const initialMsg = { role: 'user', content: `Hi! I'm from ${region}. Help me get started with my election journey.` };
    setMessages([initialMsg]);
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(region, language);
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [initialMsg],
          systemPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }
      setMessages([initialMsg, { role: 'assistant', content: data.response }]);
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
   * Reset the journey.
   */
  const handleReset = () => {
    setStarted(false);
    setMessages([]);
    setCurrentStep(1);
    clearState();
  };

  return (
    <div className="app-layout">
      <ProgressBar currentStep={currentStep} />

      <div className="app-main-wrapper">
        <Sidebar
          currentStep={currentStep}
          started={started}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          language={language}
          onLanguageChange={setLanguage}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          onReset={handleReset}
        />

        {!started ? (
          <HomeScreen
            region={region}
            onRegionChange={setRegion}
            onStart={handleStart}
          />
        ) : (
          <ChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
