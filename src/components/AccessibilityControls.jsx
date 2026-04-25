import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { LANGUAGES } from '../constants';

/**
 * AccessibilityControls — Font size toggle + language selector.
 * Memoized to prevent re-renders when chat state changes.
 *
 * Accessibility features:
 *   - ARIA radiogroup for font size toggle
 *   - Proper labeling with htmlFor/aria-labelledby
 *   - Focus-visible styles for keyboard navigation
 *
 * @param {Object} props
 * @param {string} props.fontSize - Current font size ('normal'|'large')
 * @param {Function} props.onFontSizeChange - Font size change callback
 * @param {string} props.language - Currently selected language name
 * @param {Function} props.onLanguageChange - Language change callback
 * @returns {JSX.Element}
 */
function AccessibilityControls({
  fontSize,
  onFontSizeChange,
  language,
  onLanguageChange,
}) {
  /** Handle normal font size selection */
  const handleNormalFont = useCallback(() => {
    onFontSizeChange('normal');
  }, [onFontSizeChange]);

  /** Handle large font size selection */
  const handleLargeFont = useCallback(() => {
    onFontSizeChange('large');
  }, [onFontSizeChange]);

  /** Handle language selection change */
  const handleLanguageSelect = useCallback((e) => {
    onLanguageChange(e.target.value);
  }, [onLanguageChange]);

  return (
    <div className="a11y-controls">
      {/* Font Size Toggle */}
      <div className="form-group">
        <span className="form-label" id="font-size-label">Text Size</span>
        <div className="font-toggle" role="radiogroup" aria-labelledby="font-size-label">
          <button
            className={`font-toggle-btn ${fontSize === 'normal' ? 'active' : ''}`}
            onClick={handleNormalFont}
            role="radio"
            aria-checked={fontSize === 'normal'}
            aria-label="Normal text size"
            id="font-toggle-normal"
          >
            A
          </button>
          <button
            className={`font-toggle-btn ${fontSize === 'large' ? 'active' : ''}`}
            onClick={handleLargeFont}
            role="radio"
            aria-checked={fontSize === 'large'}
            aria-label="Large text size"
            id="font-toggle-large"
            style={{ fontSize: '1.15em' }}
          >
            A+
          </button>
        </div>
      </div>

      {/* Language Selector */}
      <div className="form-group">
        <label htmlFor="language-select" className="form-label">
          Language
        </label>
        <select
          id="language-select"
          className="form-select"
          value={language}
          onChange={handleLanguageSelect}
          aria-label="Select response language"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.name}>
              {lang.native} — {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

AccessibilityControls.propTypes = {
  /** Current font size setting */
  fontSize: PropTypes.oneOf(['normal', 'large']).isRequired,
  /** Callback when font size changes */
  onFontSizeChange: PropTypes.func.isRequired,
  /** Currently selected language name */
  language: PropTypes.string.isRequired,
  /** Callback when language changes */
  onLanguageChange: PropTypes.func.isRequired,
};

export default memo(AccessibilityControls);
