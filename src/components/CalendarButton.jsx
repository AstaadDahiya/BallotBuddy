import { DATE_PATTERNS, parseDateString, generateCalendarUrl } from '../constants';

/**
 * CalendarButton — Detects dates in text and renders a Google Calendar link.
 * Only renders if a date is found in the provided text.
 */
export default function CalendarButton({ text }) {
  const dates = [];

  for (const pattern of DATE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      dates.push(match[0]);
    }
  }

  if (dates.length === 0) return null;

  // Try to parse the first detected date
  const dateStr = dates[0];
  const parsed = parseDateString(dateStr);

  if (!parsed) return null;

  const calendarUrl = generateCalendarUrl(
    `Election Event — ${dateStr}`,
    parsed
  );

  return (
    <div className="calendar-btn-wrapper">
      <a
        href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="calendar-btn"
        aria-label={`Add ${dateStr} to Google Calendar`}
        role="button"
      >
        <span aria-hidden="true">📅</span>
        Add to My Calendar
      </a>
    </div>
  );
}
