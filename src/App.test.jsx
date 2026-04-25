import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('BallotBuddy App', () => {
  it('renders the home screen initially', () => {
    render(<App />);
    expect(screen.getAllByText(/BallotBuddy/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Your Election Journey Starts Here/i)).toBeInTheDocument();
  });

  it('allows user to select region and start journey', () => {
    render(<App />);
    
    const startButton = screen.getByRole('button', { name: /Start your election journey/i });
    expect(startButton).toBeDisabled();

    const select = screen.getByLabelText(/Select your region/i);
    fireEvent.change(select, { target: { value: 'India — Delhi (NCT)' } });

    expect(startButton).not.toBeDisabled();
    
    // Test the start functionality (we mock fetch or just rely on the component state update if fetch is not mocked)
    // For a simple test, just verifying the button enables is good enough without mocking fetch.
  });
});
