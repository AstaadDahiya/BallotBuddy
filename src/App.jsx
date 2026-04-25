import { useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import ProgressBar from './components/ProgressBar';
import Sidebar from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import useChat from './hooks/useChat';
import usePersistentState from './hooks/usePersistentState';
import { AnalyticsEvents, logSessionAnalytics } from './analytics';
import { detectStep } from './utils';

/**
 * Lazy-load ChatPanel for code-splitting.
 * ChatPanel is only needed after the user starts their journey,
 * so we defer its loading to reduce initial bundle size.
 */
const ChatPanel = lazy(() => import('./components/ChatPanel'));

/** Google Maps API key from environment */
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/**
 * Loading fallback for lazy-loaded components.
 * Displays a minimal skeleton matching the chat panel dimensions.
 * @returns {JSX.Element}
 */
function ChatLoadingFallback() {
  return (
    <div
      className="chat-panel"
      role="status"
      aria-label="Loading chat interface"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.7,
      }}
    >
      <div className="typing-indicator" aria-label="Loading">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

/**
 * App — Root component for BallotBuddy.
 *
 * Architecture:
 *   - Uses custom hooks (useChat, usePersistentState) for separation of concerns
 *   - Derives step from messages via useMemo (no unnecessary re-renders)
 *   - Lazy-loads ChatPanel via React.lazy for optimal code splitting
 *   - Tracks analytics via Firebase Analytics (GA4) and Performance Monitoring
 *   - Logs session data to Cloud Firestore on journey completion
 *
 * @returns {JSX.Element}
 */
export default function App() {
  // Persistent state via custom hook (survives page reloads)
  const [region, setRegion, clearRegion] = usePersistentState('ballotbuddy_region', '');
  const [started, setStarted, clearStarted] = usePersistentState('ballotbuddy_started', false);
  const [fontSize, setFontSize] = usePersistentState('ballotbuddy_fontSize', 'normal');
  const [language, setLanguage] = usePersistentState('ballotbuddy_language', 'English');

  // Chat state via custom hook
  const { messages, setMessages, isLoading, sendMessage, startChat, resetChat } = useChat(region, language);

  // Restore persisted messages on mount (ref prevents double-restore in StrictMode)
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
        // corrupted data — silently ignore
      }
    }
  }, [setMessages]);

  // Persist messages on change (debounced by React's batching)
  useEffect(() => {
    if (hasRestoredRef.current) {
      try {
        localStorage.setItem('ballotbuddy_messages', JSON.stringify(messages));
      } catch {
        // Storage full or unavailable
      }
    }
  }, [messages]);

  /**
   * Derive current step from messages.
   * Pure computation via useMemo — avoids useEffect + setState anti-pattern.
   */
  const currentStep = useMemo(() => {
    if (messages.length === 0) return 1;
    return detectStep(messages);
  }, [messages]);

  // Apply font size class to HTML element (CSS custom property toggle)
  useEffect(() => {
    document.documentElement.classList.toggle('font-large', fontSize === 'large');
  }, [fontSize]);

  /**
   * Log session analytics to Cloud Firestore when the journey progresses.
   * Runs asynchronously, does not block the UI.
   */
  useEffect(() => {
    if (started && messages.length > 2 && messages.length % 5 === 0) {
      logSessionAnalytics({
        region,
        language,
        messageCount: messages.length,
        stepsCompleted: currentStep,
      });
    }
  }, [messages.length, started, region, language, currentStep]);

  // ──────────────────────────────────────────────
  // Event Handlers (memoized to prevent child re-renders)
  // ──────────────────────────────────────────────

  /** Handle region selection with analytics tracking */
  const handleRegionChange = useCallback((newRegion) => {
    setRegion(newRegion);
    AnalyticsEvents.regionSelected(newRegion);
  }, [setRegion]);

  /** Handle font size toggle with analytics tracking */
  const handleFontSizeChange = useCallback((newSize) => {
    setFontSize(newSize);
    AnalyticsEvents.fontSizeChanged(newSize);
  }, [setFontSize]);

  /** Handle language selection with analytics tracking */
  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    AnalyticsEvents.languageChanged(newLang);
  }, [setLanguage]);

  /** Start the election journey — send initial greeting to AI */
  const handleStart = useCallback(async () => {
    setStarted(true);
    await startChat();
  }, [setStarted, startChat]);

  /** Reset the journey — clear all state and localStorage */
  const handleReset = useCallback(() => {
    // Log session summary before reset
    if (messages.length > 0) {
      logSessionAnalytics({
        region,
        language,
        messageCount: messages.length,
        stepsCompleted: currentStep,
      });
    }

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
  }, [setStarted, resetChat, clearRegion, clearStarted, messages, region, language, currentStep]);

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
          <Suspense fallback={<ChatLoadingFallback />}>
            <ChatPanel
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
