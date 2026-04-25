import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { TIMELINE_STEPS } from '../constants';
import PollingStationFinder from './PollingStationFinder';
import AccessibilityControls from './AccessibilityControls';

/**
 * Sidebar — Election timeline, polling finder, and accessibility controls.
 * Memoized to prevent re-renders when chat messages change.
 *
 * @param {Object} props
 * @param {number} props.currentStep - Current active step (1-5)
 * @param {boolean} props.started - Whether the journey has started
 * @param {string} props.fontSize - Current font size setting
 * @param {Function} props.onFontSizeChange - Font size change callback
 * @param {string} props.language - Currently selected language name
 * @param {Function} props.onLanguageChange - Language change callback
 * @param {string} props.googleMapsApiKey - Google Maps API key
 * @param {Function} props.onReset - Journey reset callback
 * @returns {JSX.Element}
 */
function Sidebar({
  currentStep,
  started,
  fontSize,
  onFontSizeChange,
  language,
  onLanguageChange,
  googleMapsApiKey,
  onReset,
}) {
  /** Handle reset with confirmation for better UX */
  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  return (
    <aside className="sidebar" role="complementary" aria-label="Election journey sidebar">
      {/* Timeline */}
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Election Timeline</h2>
        <div className="timeline" role="list" aria-label="Election steps timeline">
          {TIMELINE_STEPS.map((step) => {
            const status =
              step.id < currentStep ? 'completed' :
              step.id === currentStep ? 'current' : '';
            return (
              <div
                key={step.id}
                className={`timeline-item ${status}`}
                role="listitem"
                aria-current={status === 'current' ? 'step' : undefined}
              >
                <div className="timeline-dot" aria-hidden="true">
                  {status === 'completed' ? '✓' : step.id}
                </div>
                <div className="timeline-connector" aria-hidden="true" />
                <div className="timeline-content">
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Polling Station Finder (Google Maps Embed API) */}
      {started && (
        <div className="sidebar-section">
          <h2 className="sidebar-section-title">Find My Polling Station</h2>
          <PollingStationFinder googleMapsApiKey={googleMapsApiKey} />
        </div>
      )}

      {/* Accessibility Controls */}
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Accessibility</h2>
        <AccessibilityControls
          fontSize={fontSize}
          onFontSizeChange={onFontSizeChange}
          language={language}
          onLanguageChange={onLanguageChange}
        />
      </div>

      {/* Reset button */}
      {started && (
        <div className="sidebar-section">
          <button
            className="btn btn-outline"
            onClick={handleReset}
            aria-label="Start a new election journey"
            id="reset-journey-btn"
            style={{ width: '100%' }}
          >
            🔄 Start Over
          </button>
        </div>
      )}
    </aside>
  );
}

Sidebar.propTypes = {
  /** Current active step (1-5) */
  currentStep: PropTypes.number.isRequired,
  /** Whether the user has started their journey */
  started: PropTypes.bool.isRequired,
  /** Current font size setting */
  fontSize: PropTypes.oneOf(['normal', 'large']).isRequired,
  /** Callback to change font size */
  onFontSizeChange: PropTypes.func.isRequired,
  /** Currently selected language name */
  language: PropTypes.string.isRequired,
  /** Callback to change language */
  onLanguageChange: PropTypes.func.isRequired,
  /** Google Maps API key for polling station finder */
  googleMapsApiKey: PropTypes.string.isRequired,
  /** Callback to reset the journey */
  onReset: PropTypes.func.isRequired,
};

export default memo(Sidebar);
