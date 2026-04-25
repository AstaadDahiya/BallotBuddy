import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('renders the BallotBuddy logo text', () => {
    render(<ProgressBar currentStep={1} />);
    expect(screen.getByText('BallotBuddy')).toBeInTheDocument();
  });

  it('shows the correct step label', () => {
    render(<ProgressBar currentStep={3} />);
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
  });

  it('shows step 1 of 5 initially', () => {
    render(<ProgressBar currentStep={1} />);
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('renders the progressbar ARIA role', () => {
    render(<ProgressBar currentStep={2} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('sets aria-valuenow to the current step', () => {
    render(<ProgressBar currentStep={4} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '4');
  });

  it('sets aria-valuemin and aria-valuemax correctly', () => {
    render(<ProgressBar currentStep={1} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '5');
  });

  it('renders the banner role header', () => {
    render(<ProgressBar currentStep={1} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders 5 step dots', () => {
    const { container } = render(<ProgressBar currentStep={1} />);
    const dots = container.querySelectorAll('.progress-step-dot');
    expect(dots).toHaveLength(5);
  });

  it('marks completed steps correctly at step 3', () => {
    const { container } = render(<ProgressBar currentStep={3} />);
    const completedDots = container.querySelectorAll('.progress-step-dot.completed');
    const currentDots = container.querySelectorAll('.progress-step-dot.current');
    expect(completedDots).toHaveLength(2); // Steps 1 and 2
    expect(currentDots).toHaveLength(1);  // Step 3
  });

  it('calculates progress bar width correctly at step 1', () => {
    const { container } = render(<ProgressBar currentStep={1} />);
    const fill = container.querySelector('.progress-bar-fill');
    expect(fill.style.width).toBe('0%');
  });

  it('calculates progress bar width correctly at step 5', () => {
    const { container } = render(<ProgressBar currentStep={5} />);
    const fill = container.querySelector('.progress-bar-fill');
    expect(fill.style.width).toBe('100%');
  });

  it('calculates progress bar width correctly at step 3', () => {
    const { container } = render(<ProgressBar currentStep={3} />);
    const fill = container.querySelector('.progress-bar-fill');
    expect(fill.style.width).toBe('50%');
  });
});
