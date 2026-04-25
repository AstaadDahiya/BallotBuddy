import PropTypes from 'prop-types';
import { TIMELINE_STEPS } from '../constants';

/**
 * ProgressBar — Fixed header with logo, progress track, and step dots.
 */
export default function ProgressBar({ currentStep }) {
  const progress = ((currentStep - 1) / (TIMELINE_STEPS.length - 1)) * 100;

  return (
    <header className="progress-bar-container" role="banner">
      <div className="progress-bar-logo">
        <span className="logo-icon" aria-hidden="true">🗳️</span>
        <span>BallotBuddy</span>
      </div>

      <div
        className="progress-bar-track"
        role="progressbar"
        aria-label={`Election journey progress: step ${currentStep} of ${TIMELINE_STEPS.length}`}
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={TIMELINE_STEPS.length}
      >
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="progress-bar-steps" aria-hidden="true">
        {TIMELINE_STEPS.map((step) => (
          <div
            key={step.id}
            className={`progress-step-dot ${
              step.id < currentStep ? 'completed' :
              step.id === currentStep ? 'current' : ''
            }`}
            title={step.title}
          />
        ))}
      </div>

      <span className="progress-step-label">
        Step {currentStep} of {TIMELINE_STEPS.length}
      </span>
    </header>
  );
}

ProgressBar.propTypes = {
  /** The current active step (1-5) */
  currentStep: PropTypes.number.isRequired,
};
