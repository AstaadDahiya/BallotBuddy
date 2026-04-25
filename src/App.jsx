import { useEffect, useMemo, useCallback, useRef } from 'react';
import ProgressBar from './components/ProgressBar';
import Sidebar from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import ChatPanel from './components/ChatPanel';
import useChat from './hooks/useChat';
import usePersistentState from './hooks/usePersistentState';
import { AnalyticsEvents } from './analytics';
import { detectStep } from './utils';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';



export default function App() {
  // Persistent state via custom hook
  const [region, setRegion, clearRegion] = usePersistentState('ballotbuddy_region', '');
  const [started, setStarted, clearStarted] = usePersistentState('ballotbuddy_started', false);
  const [fontSize, setFontSize] = usePersistentState('ballotbuddy_fontSize', 'normal');
  const [language, setLanguage] = usePersistentState('ballotbuddy_language', 'English');

  // Chat state via custom hook
  const { messages, setMessages, isLoading, sendMessage, startChat, resetChat } = useChat(region, language);

  // Restore persisted messages on mount (ref avoids setState-in-effect lint)
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (!hasRestoredRef.current) {
      hasRestoredRef.current = true;
      try {
        const raw = localStorage.getItem('ballotbuddy_messages');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch {
        // noop
      }
    }
  }, [setMessages]);

  // Persist messages on change
  useEffect(() => {
    if (hasRestoredRef.current) {
      try {
        localStorage.setItem('ballotbuddy_messages', JSON.stringify(messages));
      } catch {
        // Storage full or unavailable
      }
    }
  }, [messages]);

  // Derive current step from messages (pure computation, no useEffect + setState)
  const currentStep = useMemo(() => {
    if (messages.length === 0) return 1;
    return detectStep(messages);
  }, [messages]);

  // Apply font size class to HTML element
  useEffect(() => {
    document.documentElement.classList.toggle('font-large', fontSize === 'large');
  }, [fontSize]);

  /**
   * Handle region change with analytics tracking.
   */
  const handleRegionChange = useCallback((newRegion) => {
    setRegion(newRegion);
    AnalyticsEvents.regionSelected(newRegion);
  }, [setRegion]);

  /**
   * Handle font size change with analytics tracking.
   */
  const handleFontSizeChange = useCallback((newSize) => {
    setFontSize(newSize);
    AnalyticsEvents.fontSizeChanged(newSize);
  }, [setFontSize]);

  /**
   * Handle language change with analytics tracking.
   */
  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    AnalyticsEvents.languageChanged(newLang);
  }, [setLanguage]);

  /**
   * Start the journey — send initial greeting to AI.
   */
  const handleStart = useCallback(async () => {
    setStarted(true);
    await startChat();
  }, [setStarted, startChat]);

  /**
   * Reset the journey.
   */
  const handleReset = useCallback(() => {
    setStarted(false);
    resetChat();
    clearRegion();
    clearStarted();
    try {
      localStorage.removeItem('ballotbuddy_messages');
    } catch {
      // noop
    }
    AnalyticsEvents.journeyReset();
  }, [setStarted, resetChat, clearRegion, clearStarted]);

  return (
    <div className="app-layout">
      <ProgressBar currentStep={currentStep} />

      <div className="app-main-wrapper">
        <Sidebar
          currentStep={currentStep}
          started={started}
          fontSize={fontSize}
          onFontSizeChange={handleFontSizeChange}
          language={language}
          onLanguageChange={handleLanguageChange}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          onReset={handleReset}
        />

        {!started ? (
          <HomeScreen
            region={region}
            onRegionChange={handleRegionChange}
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
