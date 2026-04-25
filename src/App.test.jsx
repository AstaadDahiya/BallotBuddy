import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { detectStep } from './utils';

// Mock the analytics module to prevent Firebase initialization in tests
vi.mock('./analytics', () => ({
  logEvent: vi.fn(),
  AnalyticsEvents: {
    journeyStarted: vi.fn(),
    messageSent: vi.fn(),
    regionSelected: vi.fn(),
    pollingStationSearch: vi.fn(),
    calendarEventAdded: vi.fn(),
    languageChanged: vi.fn(),
    fontSizeChanged: vi.fn(),
    journeyReset: vi.fn(),
  },
  default: {
    journeyStarted: vi.fn(),
    messageSent: vi.fn(),
    regionSelected: vi.fn(),
    pollingStationSearch: vi.fn(),
    calendarEventAdded: vi.fn(),
    languageChanged: vi.fn(),
    fontSizeChanged: vi.fn(),
    journeyReset: vi.fn(),
  },
}));

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('font-large');
});

// ──────────────────────────────────────────────
// detectStep unit tests
// ──────────────────────────────────────────────
describe('detectStep', () => {
  it('returns 1 with no messages', () => {
    expect(detectStep([])).toBe(1);
  });

  it('returns 1 when no keywords match', () => {
    const msgs = [{ role: 'assistant', content: 'Hello! Welcome.' }];
    expect(detectStep(msgs)).toBe(1);
  });

  it('returns 2 for candidate/manifesto keywords', () => {
    const msgs = [{ role: 'assistant', content: 'Let us research the candidate running in your area.' }];
    expect(detectStep(msgs)).toBe(2);
  });

  it('returns 3 for polling/booth keywords', () => {
    const msgs = [{ role: 'assistant', content: 'Find your polling booth location.' }];
    expect(detectStep(msgs)).toBe(3);
  });

  it('returns 4 for cast/ballot/evm keywords', () => {
    const msgs = [{ role: 'assistant', content: 'Time to cast your ballot using the EVM.' }];
    expect(detectStep(msgs)).toBe(4);
  });

  it('returns 5 for result keywords', () => {
    const msgs = [{ role: 'assistant', content: 'The result will be announced soon.' }];
    expect(detectStep(msgs)).toBe(5);
  });

  it('ignores user messages', () => {
    const msgs = [{ role: 'user', content: 'Tell me about the result.' }];
    expect(detectStep(msgs)).toBe(1);
  });

  it('returns highest priority step when multiple keywords match', () => {
    const msgs = [
      { role: 'assistant', content: 'Research candidate manifesto at your polling booth, then cast your ballot for the result.' },
    ];
    expect(detectStep(msgs)).toBe(5);
  });
});

// ──────────────────────────────────────────────
// App integration tests
// ──────────────────────────────────────────────
describe('BallotBuddy App', () => {
  it('renders the home screen initially', () => {
    render(<App />);
    expect(screen.getAllByText(/BallotBuddy/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Your Election Journey Starts Here/i)).toBeInTheDocument();
  });

  it('renders the progress bar', () => {
    render(<App />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the sidebar', () => {
    render(<App />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('renders the timeline', () => {
    render(<App />);
    expect(screen.getByText('Election Timeline')).toBeInTheDocument();
  });

  it('allows user to select region and start journey', () => {
    render(<App />);
    const startButton = screen.getByRole('button', { name: /Start your election journey/i });
    expect(startButton).toBeDisabled();

    const select = screen.getByLabelText(/Select your region/i);
    fireEvent.change(select, { target: { value: 'India — Delhi (NCT)' } });
    expect(startButton).not.toBeDisabled();
  });

  it('shows step 1 of 5 on initial render', () => {
    render(<App />);
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('renders accessibility controls', () => {
    render(<App />);
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
    expect(screen.getByText('Text Size')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
  });
});
