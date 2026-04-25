import { useState, useRef, useEffect, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import CalendarButton from './CalendarButton';

/**
 * ChatMessage — Memoized individual chat message bubble.
 * Only re-renders when the message content or role changes.
 *
 * @param {Object} props
 * @param {Object} props.msg - Message object with role and content
 * @returns {JSX.Element}
 */
const ChatMessage = memo(function ChatMessage({ msg }) {
  return (
    <div className={`chat-bubble ${msg.role}`}>
      <div className="chat-bubble-label">
        {msg.role === 'assistant' ? '🗳️ BallotBuddy' : 'You'}
      </div>
      <div>{msg.content}</div>
      {/* Calendar button for assistant messages with dates */}
      {msg.role === 'assistant' && (
        <CalendarButton text={msg.content} />
      )}
    </div>
  );
});

ChatMessage.propTypes = {
  msg: PropTypes.shape({
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * ChatPanel — AI chat interface with Gemini API integration.
 * User bubbles on right, assistant on left. Includes calendar detection.
 *
 * Performance optimizations:
 *   - Individual messages wrapped in React.memo (ChatMessage)
 *   - Event handlers memoized with useCallback
 *   - Scroll behavior uses requestAnimationFrame for smooth 60fps
 *
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects
 * @param {Function} props.onSendMessage - Callback when user sends a message
 * @param {boolean} props.isLoading - Whether the AI is generating a response
 * @returns {JSX.Element}
 */
function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages (uses rAF for smooth scrolling)
  useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages, isLoading]);

  /** Handle form submission — send message and clear input */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  }, [input, isLoading, onSendMessage]);

  /** Handle Enter key for quick send (Shift+Enter for newline) */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  /** Handle input change */
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

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
          <ChatMessage key={`${msg.role}-${i}`} msg={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="typing-indicator" role="status" aria-label="BallotBuddy is typing">
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
          onChange={handleInputChange}
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

export default memo(ChatPanel);
