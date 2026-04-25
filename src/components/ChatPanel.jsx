import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import CalendarButton from './CalendarButton';

/**
 * ChatPanel — AI chat interface with Gemini API integration.
 * User bubbles on right, assistant on left. Includes calendar detection.
 */
export default function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-panel" role="main" aria-label="AI chat assistant">
      {/* Messages */}
      <div
        className="chat-messages"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${msg.role}`}
          >
            <div className="chat-bubble-label">
              {msg.role === 'assistant' ? '🗳️ BallotBuddy' : 'You'}
            </div>
            <div>{msg.content}</div>
            {/* Calendar button for assistant messages with dates */}
            {msg.role === 'assistant' && (
              <CalendarButton text={msg.content} />
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="typing-indicator" aria-label="BallotBuddy is typing">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form className="chat-input-area" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Ask about your election journey..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Type your message to BallotBuddy"
          id="chat-message-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
          id="chat-send-btn"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

ChatPanel.propTypes = {
  /** Array of message objects with role ('user'|'assistant') and content */
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.oneOf(['user', 'assistant']).isRequired,
      content: PropTypes.string.isRequired,
    })
  ).isRequired,
  /** Callback when user sends a message */
  onSendMessage: PropTypes.func.isRequired,
  /** Whether the AI is currently generating a response */
  isLoading: PropTypes.bool.isRequired,
};
