/** Region data: India-focused with Indian states as primary */
export const REGIONS = [
  { group: 'India', options: [
    'India — Andhra Pradesh', 'India — Arunachal Pradesh', 'India — Assam',
    'India — Bihar', 'India — Chhattisgarh', 'India — Goa',
    'India — Gujarat', 'India — Haryana', 'India — Himachal Pradesh',
    'India — Jharkhand', 'India — Karnataka', 'India — Kerala',
    'India — Madhya Pradesh', 'India — Maharashtra', 'India — Manipur',
    'India — Meghalaya', 'India — Mizoram', 'India — Nagaland',
    'India — Odisha', 'India — Punjab', 'India — Rajasthan',
    'India — Sikkim', 'India — Tamil Nadu', 'India — Telangana',
    'India — Tripura', 'India — Uttar Pradesh', 'India — Uttarakhand',
    'India — West Bengal', 'India — Delhi (NCT)', 'India — Jammu & Kashmir',
    'India — Ladakh', 'India — Chandigarh', 'India — Puducherry',
  ]},
  { group: 'Other Countries', options: [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  ]},
];

/** Election timeline steps */
export const TIMELINE_STEPS = [
  { id: 1, title: 'Voter Registration', description: 'Check eligibility & enroll', icon: '📋' },
  { id: 2, title: 'Candidate Research', description: 'Know who\'s running', icon: '🔍' },
  { id: 3, title: 'Polling Day Logistics', description: 'Where, when & what to bring', icon: '🗓️' },
  { id: 4, title: 'Casting Your Vote', description: 'Step-by-step at the booth', icon: '🗳️' },
  { id: 5, title: 'Results & Next Steps', description: 'After the election', icon: '📊' },
];

/** Language options with Indian languages */
export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
];

/** Build system prompt for the AI */
export function buildSystemPrompt(region, language) {
  const langPrefix = language && language !== 'English'
    ? `Respond in ${language}: `
    : '';
  return `${langPrefix}You are BallotBuddy, a friendly civic education assistant. The user is from ${region}. Walk them through voter registration, candidate research, polling day logistics, and results — one step at a time. Keep answers under 100 words. Use simple language. Always end with a question to keep them going.`;
}

/**
 * Regex patterns to detect dates in AI responses.
 * Matches formats like: January 15, 2026 | 15 January 2026 | 15/01/2026 | 2026-01-15 | Jan 15 | 15th March
 */
export const DATE_PATTERNS = [
  /(\d{1,2})\s*(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s*,?\s*(\d{4})?/gi,
  /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*(st|nd|rd|th)?\s*,?\s*(\d{4})?/gi,
  /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g,
  /(\d{4})-(\d{2})-(\d{2})/g,
];

/** Parse a detected date string into a Date object (best-effort) */
export function parseDateString(dateStr) {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  // Try common Indian format dd/mm/yyyy
  const parts = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (parts) return new Date(parts[3], parts[2] - 1, parts[1]);
  return null;
}

/** Generate a Google Calendar event URL */
export function generateCalendarUrl(title, date) {
  const formatDate = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  };
  const dateStr = formatDate(date);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dateStr}/${dateStr}`,
    details: 'Added via BallotBuddy — Your Election Journey Guide',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** localStorage helpers */
const STORAGE_KEY = 'ballotbuddy_state';

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
