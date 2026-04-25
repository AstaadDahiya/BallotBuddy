import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CalendarButton from './CalendarButton';

describe('CalendarButton', () => {
  it('returns null when no dates in text', () => {
    const { container } = render(<CalendarButton text="Hello, welcome!" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a calendar link when date is detected', () => {
    render(<CalendarButton text="Register by January 15, 2026 to vote." />);
    expect(screen.getByText('Add to My Calendar')).toBeInTheDocument();
  });

  it('creates a Google Calendar URL', () => {
    render(<CalendarButton text="Deadline is January 15, 2026." />);
    const link = screen.getByRole('button', { name: /Add .* to Google Calendar/ });
    expect(link).toHaveAttribute('href');
    expect(link.getAttribute('href')).toContain('calendar.google.com');
  });

  it('opens link in new tab', () => {
    render(<CalendarButton text="Vote on March 20, 2026." />);
    const link = screen.getByText('Add to My Calendar');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has correct ARIA label with the date', () => {
    render(<CalendarButton text="Event on January 15, 2026." />);
    const link = screen.getByRole('button');
    expect(link.getAttribute('aria-label')).toContain('Google Calendar');
  });

  it('does not render for text without date patterns', () => {
    const { container } = render(<CalendarButton text="No dates here, just regular text about elections." />);
    expect(container.querySelector('.calendar-btn')).toBeNull();
  });
});
