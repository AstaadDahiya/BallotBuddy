import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HomeScreen from './HomeScreen';

const defaultProps = {
  region: '',
  onRegionChange: vi.fn(),
  onStart: vi.fn(),
};

describe('HomeScreen', () => {
  it('renders the main heading', () => {
    render(<HomeScreen {...defaultProps} />);
    expect(screen.getByText('Your Election Journey Starts Here')).toBeInTheDocument();
  });

  it('renders the badge', () => {
    render(<HomeScreen {...defaultProps} />);
    expect(screen.getByText(/AI-Powered Civic Education/)).toBeInTheDocument();
  });

  it('renders the region dropdown', () => {
    render(<HomeScreen {...defaultProps} />);
    expect(screen.getByLabelText(/Select your region/i)).toBeInTheDocument();
  });

  it('disables start button when no region', () => {
    render(<HomeScreen {...defaultProps} region="" />);
    expect(screen.getByRole('button', { name: /Start your election journey/i })).toBeDisabled();
  });

  it('enables start button with region', () => {
    render(<HomeScreen {...defaultProps} region="India — Delhi (NCT)" />);
    expect(screen.getByRole('button', { name: /Start your election journey/i })).not.toBeDisabled();
  });

  it('calls onRegionChange on dropdown change', () => {
    const fn = vi.fn();
    render(<HomeScreen {...defaultProps} onRegionChange={fn} />);
    fireEvent.change(screen.getByLabelText(/Select your region/i), { target: { value: 'India — Kerala' } });
    expect(fn).toHaveBeenCalledWith('India — Kerala');
  });

  it('calls onStart on form submit', () => {
    const fn = vi.fn();
    render(<HomeScreen {...defaultProps} region="India — Delhi (NCT)" onStart={fn} />);
    fireEvent.click(screen.getByRole('button', { name: /Start your election journey/i }));
    expect(fn).toHaveBeenCalled();
  });

  it('renders feature cards', () => {
    render(<HomeScreen {...defaultProps} />);
    expect(screen.getByText('Registration')).toBeInTheDocument();
    expect(screen.getByText('Candidates')).toBeInTheDocument();
    expect(screen.getByText('Voting Day')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('has the main ARIA role', () => {
    render(<HomeScreen {...defaultProps} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
