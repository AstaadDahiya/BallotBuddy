import { memo, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { DATE_PATTERNS, parseDateString, generateCalendarUrl } from '../constants';
import { AnalyticsEvents } from '../analytics';

/**
 * CalendarButton — Detects dates in text and renders a Google Calendar link.
 * Only renders if a valid date is found in the provided text.
 *
 * Google Services Used:
 *   - Google Calendar API (event creation via URL)
 *   - Firebase Analytics (calendar event tracking)
 *
 * Performance:
 *   - Date detection is memoized to avoid regex re-execution on re-renders
 *   - Component wrapped in React.memo
 *
 * @param {Object} props
 * @param {string} props.text - The text content to scan for dates
 * @returns {JSX.Element|null}
 */
function CalendarButton({ text }) {
  /** Memoize date detection to avoid regex re-execution on every render */
  const dateInfo = useMemo(() => {
    const dates = [];
    for (const pattern of DATE_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        dates.push(match[0]);
      }
    }

    if (dates.length === 0) return null;

    const dateStr = dates[0];
    const parsed = parseDateString(dateStr);
    if (!parsed) return null;

    return {
      dateStr,
      calendarUrl: generateCalendarUrl(`Election Event — ${dateStr}`, parsed),
    };
  }, [text]);

  /** Track calendar event addition in Firebase Analytics */
  const handleClick = useCallback(() => {
    if (dateInfo) {
      AnalyticsEvents.calendarEventAdded(dateInfo.dateStr);
    }
  }, [dateInfo]);

  if (!dateInfo) return null;

  return (
    <div className="calendar-btn-wrapper">
      <a
        href={dateInfo.calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="calendar-btn"
        aria-label={`Add ${dateInfo.dateStr} to Google Calendar`}
        role="button"
        onClick={handleClick}
      >
        <span aria-hidden="true">📅</span>
        Add to My Calendar
      </a>
    </div>
  );
}

CalendarButton.propTypes = {
  /** The text content to scan for dates */
  text: PropTypes.string.isRequired,
};

export default memo(CalendarButton);
