/**
 * Firebase Analytics integration for BallotBuddy.
 * 
 * Re-exports from the centralized firebase.js module for backward compatibility.
 * All analytics, performance, and Firestore APIs are now in firebase.js.
 * 
 * @module analytics
 * @see {@link ./firebase.js} for the full Firebase service initialization
 */
export {
  logEvent,
  AnalyticsEvents,
  startPerformanceTrace,
  logFeedback,
  logSessionAnalytics,
} from './firebase.js';

export { AnalyticsEvents as default } from './firebase.js';
