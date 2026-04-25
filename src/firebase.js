/**
 * Firebase Configuration & Service Initialization Module
 * 
 * Centralizes all Firebase service initialization for BallotBuddy.
 * Services initialized:
 *   - Firebase App (core)
 *   - Firebase Analytics (GA4 event tracking)
 *   - Firebase Performance Monitoring (Web Vitals, custom traces)
 *   - Cloud Firestore (usage analytics, feedback storage)
 * 
 * All services gracefully degrade if unavailable (e.g., in test/SSR environments).
 * 
 * @module firebase
 */
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent as firebaseLogEvent, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getPerformance, trace as perfTrace } from 'firebase/performance';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Firebase configuration — uses environment variables for flexibility.
 * Falls back to project defaults; services gracefully degrade if unconfigured.
 * @type {import('firebase/app').FirebaseOptions}
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ballotbuddy-3ad28',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

/** @type {import('firebase/app').FirebaseApp | null} */
let app = null;

/** @type {import('firebase/analytics').Analytics | null} */
let analytics = null;

/** @type {import('firebase/performance').FirebasePerformance | null} */
let performance = null;

/** @type {import('firebase/firestore').Firestore | null} */
let db = null;

/**
 * Initialize all Firebase services.
 * Analytics and Performance are async and gracefully degrade if unsupported
 * (e.g., in test environments, SSR, or when cookies are blocked).
 * 
 * @returns {Promise<void>}
 */
async function initFirebase() {
  try {
    if (!firebaseConfig.apiKey) {
      console.info('[BallotBuddy] Firebase: No API key configured, skipping initialization');
      return;
    }

    // Initialize Firebase App (singleton)
    app = initializeApp(firebaseConfig);

    // Initialize Cloud Firestore
    try {
      db = getFirestore(app);
      console.info('[BallotBuddy] Cloud Firestore initialized');
    } catch (error) {
      console.warn('[BallotBuddy] Firestore unavailable:', error.message);
    }

    // Initialize Firebase Analytics (GA4)
    const analyticsSupported = await isAnalyticsSupported();
    if (analyticsSupported) {
      analytics = getAnalytics(app);
      console.info('[BallotBuddy] Firebase Analytics (GA4) initialized');
    }

    // Initialize Firebase Performance Monitoring
    try {
      performance = getPerformance(app);
      console.info('[BallotBuddy] Firebase Performance Monitoring initialized');
    } catch (error) {
      console.warn('[BallotBuddy] Performance Monitoring unavailable:', error.message);
    }

  } catch (error) {
    console.warn('[BallotBuddy] Firebase initialization error:', error.message);
  }
}

// Initialize on module load
initFirebase();

// ─────────────────────────────────────────────────
// Analytics API
// ─────────────────────────────────────────────────

/**
 * Log a custom analytics event to Firebase Analytics (GA4).
 * Silently no-ops if Analytics is not initialized.
 *
 * @param {string} eventName - The event name (e.g., 'journey_started')
 * @param {Object} [params={}] - Optional event parameters
 */
export function logEvent(eventName, params = {}) {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, params);
    } catch (error) {
      console.warn('[BallotBuddy] Analytics event error:', error.message);
    }
  }
}

/**
 * Pre-defined analytics event loggers for common user actions.
 * Each method wraps logEvent with standardized parameter schemas.
 * 
 * @namespace AnalyticsEvents
 */
export const AnalyticsEvents = {
  /** Track when a user starts their election journey */
  journeyStarted: (region, language) =>
    logEvent('journey_started', { region, language }),
  /** Track each message sent to the AI assistant */
  messageSent: (region, language, messageCount) =>
    logEvent('message_sent', { region, language, message_count: messageCount }),
  /** Track region selection */
  regionSelected: (region) =>
    logEvent('region_selected', { region }),
  /** Track polling station searches */
  pollingStationSearch: (pincode) =>
    logEvent('polling_station_search', { pincode }),
  /** Track calendar event additions */
  calendarEventAdded: (dateStr) =>
    logEvent('calendar_event_added', { date: dateStr }),
  /** Track language changes */
  languageChanged: (language) =>
    logEvent('language_changed', { language }),
  /** Track font size changes */
  fontSizeChanged: (fontSize) =>
    logEvent('font_size_changed', { font_size: fontSize }),
  /** Track journey resets */
  journeyReset: () =>
    logEvent('journey_reset'),
  /** Track page views */
  pageView: (pageName) =>
    logEvent('page_view', { page_name: pageName }),
  /** Track errors for monitoring */
  errorOccurred: (errorType, errorMessage) =>
    logEvent('error_occurred', { error_type: errorType, error_message: errorMessage }),
  /** Track AI response latency */
  aiResponseTime: (latencyMs, region) =>
    logEvent('ai_response_time', { latency_ms: latencyMs, region }),
};

// ─────────────────────────────────────────────────
// Performance Monitoring API
// ─────────────────────────────────────────────────

/**
 * Start a custom performance trace.
 * Used to measure specific operations like API calls or render times.
 * 
 * @param {string} traceName - Name for the trace (e.g., 'ai_chat_request')
 * @returns {{ stop: Function, putAttribute: Function } | null} Trace object or null
 */
export function startPerformanceTrace(traceName) {
  if (performance) {
    try {
      const t = perfTrace(performance, traceName);
      t.start();
      return t;
    } catch (error) {
      console.warn('[BallotBuddy] Performance trace error:', error.message);
    }
  }
  return null;
}

// ─────────────────────────────────────────────────
// Firestore API (Client-side analytics/feedback)
// ─────────────────────────────────────────────────

/**
 * Log a user feedback entry to Cloud Firestore.
 * Stores anonymous usage feedback for product improvement.
 * 
 * @param {Object} feedbackData - The feedback data
 * @param {string} feedbackData.type - Feedback type ('helpful'|'unhelpful'|'suggestion')
 * @param {string} [feedbackData.message] - Optional feedback message
 * @param {string} [feedbackData.region] - User's region
 * @returns {Promise<string|null>} Document ID or null on failure
 */
export async function logFeedback(feedbackData) {
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'user_feedback'), {
        ...feedbackData,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
      });
      return docRef.id;
    } catch (error) {
      console.warn('[BallotBuddy] Firestore feedback error:', error.message);
    }
  }
  return null;
}

/**
 * Log a chat session summary to Cloud Firestore for analytics.
 * Tracks conversation patterns to improve AI response quality.
 * 
 * @param {Object} sessionData - Session data to log
 * @param {string} sessionData.region - User's region
 * @param {string} sessionData.language - User's language
 * @param {number} sessionData.messageCount - Total messages in session
 * @param {number} sessionData.stepsCompleted - Number of timeline steps completed
 * @returns {Promise<void>}
 */
export async function logSessionAnalytics(sessionData) {
  if (db) {
    try {
      await addDoc(collection(db, 'session_analytics'), {
        ...sessionData,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.warn('[BallotBuddy] Session analytics error:', error.message);
    }
  }
}

export default AnalyticsEvents;
