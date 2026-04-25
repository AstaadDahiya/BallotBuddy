import { TIMELINE_STEPS } from '../constants';
import PollingStationFinder from './PollingStationFinder';
import AccessibilityControls from './AccessibilityControls';

/**
 * Sidebar — Election timeline, polling finder, and accessibility controls.
 */
export default function Sidebar({
  currentStep,
  started,
  fontSize,
  onFontSizeChange,
  language,
  onLanguageChange,
  googleMapsApiKey,
  onReset,
}) {
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

      {/* Polling Station Finder */}
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
            onClick={onReset}
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
