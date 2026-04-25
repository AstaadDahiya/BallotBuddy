import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary — Catches JavaScript errors in child component tree
 * and displays a user-friendly fallback UI instead of crashing the whole app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-label="Application error"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#060E1A',
            color: '#F5F5F5',
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <h1 style={{ fontSize: '2rem', color: '#C9A84C', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#C8C8D0', marginBottom: '1.5rem', maxWidth: '500px' }}>
            BallotBuddy encountered an unexpected error. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            aria-label="Reload the application"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #C9A84C, #D4B95F)',
              color: '#060E1A',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
