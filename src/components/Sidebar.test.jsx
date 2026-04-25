import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar';

const defaultProps = {
  currentStep: 1,
  started: false,
  fontSize: 'normal',
  onFontSizeChange: vi.fn(),
  language: 'English',
  onLanguageChange: vi.fn(),
  googleMapsApiKey: 'test-key',
  onReset: vi.fn(),
};

describe('Sidebar', () => {
  it('renders the Election Timeline heading', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Election Timeline')).toBeInTheDocument();
  });

  it('renders all 5 timeline steps', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Voter Registration')).toBeInTheDocument();
    expect(screen.getByText('Candidate Research')).toBeInTheDocument();
    expect(screen.getByText('Polling Day Logistics')).toBeInTheDocument();
    expect(screen.getByText('Casting Your Vote')).toBeInTheDocument();
    expect(screen.getByText('Results & Next Steps')).toBeInTheDocument();
  });

  it('renders the Accessibility section', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
  });

  it('renders the complementary ARIA role', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('renders timeline as a list', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders 5 list items', () => {
    render(<Sidebar {...defaultProps} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
  });

  it('does not show polling station finder when not started', () => {
    render(<Sidebar {...defaultProps} started={false} />);
    expect(screen.queryByText('Find My Polling Station')).not.toBeInTheDocument();
  });

  it('shows polling station finder when started', () => {
    render(<Sidebar {...defaultProps} started={true} />);
    expect(screen.getByText('Find My Polling Station')).toBeInTheDocument();
  });

  it('does not show reset button when not started', () => {
    render(<Sidebar {...defaultProps} started={false} />);
    expect(screen.queryByText(/Start Over/)).not.toBeInTheDocument();
  });

  it('shows reset button when started', () => {
    render(<Sidebar {...defaultProps} started={true} />);
    expect(screen.getByText(/Start Over/)).toBeInTheDocument();
  });

  it('marks the first step as current when currentStep is 1', () => {
    const { container } = render(<Sidebar {...defaultProps} currentStep={1} />);
    const items = container.querySelectorAll('.timeline-item');
    expect(items[0].classList.contains('current')).toBe(true);
  });

  it('marks earlier steps as completed at step 3', () => {
    const { container } = render(<Sidebar {...defaultProps} currentStep={3} />);
    const items = container.querySelectorAll('.timeline-item');
    expect(items[0].classList.contains('completed')).toBe(true);
    expect(items[1].classList.contains('completed')).toBe(true);
    expect(items[2].classList.contains('current')).toBe(true);
  });

  it('sets aria-current on the current step', () => {
    render(<Sidebar {...defaultProps} currentStep={2} />);
    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });
});
