import { memo } from 'react';
import PropTypes from 'prop-types';
import { REGIONS } from '../constants';

/**
 * HomeScreen — Region selector + CTA to start the election journey.
 * Memoized to prevent re-renders when unrelated parent state changes.
 *
 * @param {Object} props
 * @param {string} props.region - The currently selected region
 * @param {Function} props.onRegionChange - Callback when user changes region
 * @param {Function} props.onStart - Callback when user clicks Start
 * @returns {JSX.Element}
 */
function HomeScreen({ region, onRegionChange, onStart }) {
  return (
    <main className="home-screen" role="main">
      <div className="home-card">
        <div className="home-badge">
          <span aria-hidden="true">✨</span>
          AI-Powered Civic Education
        </div>

        <h1 className="home-title">Your Election Journey Starts Here</h1>

        <p className="home-subtitle">
          BallotBuddy walks you through every step of the election process —
          from registration to results — with a friendly AI assistant by your side.
        </p>

        <form
          className="home-form"
          onSubmit={(e) => { e.preventDefault(); if (region) onStart(); }}
        >
          <div className="form-group">
            <label htmlFor="region-select" className="form-label">
              Select your region
            </label>
            <select
              id="region-select"
              className="form-select"
              value={region}
              onChange={(e) => onRegionChange(e.target.value)}
              aria-label="Select your country or state"
              required
            >
              <option value="">— Choose your state / country —</option>
              {REGIONS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!region}
            aria-label="Start your election journey"
            id="start-journey-btn"
          >
            <span aria-hidden="true">🚀</span>
            Start My Election Journey
          </button>
        </form>

        <div className="home-features">
          <div className="home-feature">
            <span className="home-feature-icon" aria-hidden="true">📋</span>
            <span className="home-feature-text">Registration</span>
          </div>
          <div className="home-feature">
            <span className="home-feature-icon" aria-hidden="true">🔍</span>
            <span className="home-feature-text">Candidates</span>
          </div>
          <div className="home-feature">
            <span className="home-feature-icon" aria-hidden="true">🗳️</span>
            <span className="home-feature-text">Voting Day</span>
          </div>
          <div className="home-feature">
            <span className="home-feature-icon" aria-hidden="true">📊</span>
            <span className="home-feature-text">Results</span>
          </div>
        </div>
      </div>
    </main>
  );
}

HomeScreen.propTypes = {
  /** The currently selected region */
  region: PropTypes.string.isRequired,
  /** Callback when user changes region selection */
  onRegionChange: PropTypes.func.isRequired,
  /** Callback when user clicks the Start button */
  onStart: PropTypes.func.isRequired,
};

export default memo(HomeScreen);
