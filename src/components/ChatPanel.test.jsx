import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatPanel from './ChatPanel';

const defaultProps = {
  messages: [],
  onSendMessage: vi.fn(),
  isLoading: false,
};

describe('ChatPanel', () => {
  it('renders the chat panel with main role', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the message log', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('renders user messages', () => {
    const messages = [{ role: 'user', content: 'Hello there!' }];
    render(<ChatPanel {...defaultProps} messages={messages} />);
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('renders assistant messages', () => {
    const messages = [{ role: 'assistant', content: 'Welcome to BallotBuddy!' }];
    render(<ChatPanel {...defaultProps} messages={messages} />);
    expect(screen.getByText('Welcome to BallotBuddy!')).toBeInTheDocument();
    expect(screen.getAllByText(/BallotBuddy/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders multiple messages in order', () => {
    const messages = [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
    ];
    const { container } = render(<ChatPanel {...defaultProps} messages={messages} />);
    const bubbles = container.querySelectorAll('.chat-bubble');
    expect(bubbles).toHaveLength(2);
    expect(bubbles[0].classList.contains('user')).toBe(true);
    expect(bubbles[1].classList.contains('assistant')).toBe(true);
  });

  it('shows typing indicator when loading', () => {
    render(<ChatPanel {...defaultProps} isLoading={true} />);
    expect(screen.getByLabelText('BallotBuddy is typing')).toBeInTheDocument();
  });

  it('hides typing indicator when not loading', () => {
    render(<ChatPanel {...defaultProps} isLoading={false} />);
    expect(screen.queryByLabelText('BallotBuddy is typing')).not.toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Send message/i })).toBeDisabled();
  });

  it('disables input when loading', () => {
    render(<ChatPanel {...defaultProps} isLoading={true} />);
    expect(screen.getByLabelText(/Type your message/i)).toBeDisabled();
  });

  it('calls onSendMessage when form is submitted', () => {
    const fn = vi.fn();
    render(<ChatPanel {...defaultProps} onSendMessage={fn} />);
    const input = screen.getByLabelText(/Type your message/i);
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }));
    expect(fn).toHaveBeenCalledWith('test message');
  });

  it('clears input after sending', () => {
    render(<ChatPanel {...defaultProps} onSendMessage={vi.fn()} />);
    const input = screen.getByLabelText(/Type your message/i);
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }));
    expect(input.value).toBe('');
  });

  it('has aria-live polite on the message log', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'polite');
  });
});
