/**
 * Firebase Analytics integration for BallotBuddy.
 * Tracks key user actions to understand engagement and improve the experience.
 * Uses Firebase Analytics (part of Google Analytics 4).
 */
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent as firebaseLogEvent, isSupported } from 'firebase/analytics';

/**
 * Firebase configuration — uses environment variables for flexibility.
 * Falls back to empty strings; analytics simply won't initialize if unconfigured.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ballotbuddy-gemini',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let analytics = null;

/**
 * Initialize Firebase app and Analytics.
 * Analytics initialization is async and gracefully degrades if unsupported
 * (e.g., in test environments, SSR, or when cookies are blocked).
 */
async function initAnalytics() {
  try {
    const supported = await isSupported();
    if (supported && firebaseConfig.apiKey) {
      const app = initializeApp(firebaseConfig);
      analytics = getAnalytics(app);
      console.info('[BallotBuddy] Firebase Analytics initialized');
    }
  } catch (error) {
    console.warn('[BallotBuddy] Firebase Analytics unavailable:', error.message);
  }
}

// Initialize on module load
initAnalytics();

/**
 * Log a custom analytics event.
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
 * Pre-defined event loggers for common user actions.
 */
export const AnalyticsEvents = {
  journeyStarted: (region, language) =>
    logEvent('journey_started', { region, language }),
  messageSent: (region, language, messageCount) =>
    logEvent('message_sent', { region, language, message_count: messageCount }),
  regionSelected: (region) =>
    logEvent('region_selected', { region }),
  pollingStationSearch: (pincode) =>
    logEvent('polling_station_search', { pincode }),
  calendarEventAdded: (dateStr) =>
    logEvent('calendar_event_added', { date: dateStr }),
  languageChanged: (language) =>
    logEvent('language_changed', { language }),
  fontSizeChanged: (fontSize) =>
    logEvent('font_size_changed', { font_size: fontSize }),
  journeyReset: () =>
    logEvent('journey_reset'),
};

export default AnalyticsEvents;
