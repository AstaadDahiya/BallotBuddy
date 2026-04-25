import { useState, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AnalyticsEvents } from '../analytics';

/**
 * PollingStationFinder — ZIP/pincode input + Google Maps embed for nearby polling stations.
 *
 * Google Services Used:
 *   - Google Maps Embed API (real-time map rendering)
 *   - Firebase Analytics (polling station search tracking)
 *
 * @param {Object} props
 * @param {string} props.googleMapsApiKey - Google Maps API key for the embed
 * @returns {JSX.Element}
 */
function PollingStationFinder({ googleMapsApiKey }) {
  const [pincode, setPincode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  /** Execute polling station search and log analytics */
  const handleSearch = useCallback(() => {
    if (pincode.trim()) {
      setSearchQuery(pincode.trim());
      AnalyticsEvents.pollingStationSearch(pincode.trim());
    }
  }, [pincode]);

  /** Handle Enter key for quick search */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  /** Handle pincode input change */
  const handlePincodeChange = useCallback((e) => {
    setPincode(e.target.value);
  }, []);

  /** Google Maps Embed API URL */
  const mapSrc = searchQuery
    ? `https://www.google.com/maps/embed/v1/search?key=${googleMapsApiKey}&q=polling+station+near+${encodeURIComponent(searchQuery)}`
    : '';

  return (
    <div className="polling-finder">
      <div className="polling-finder-input-row">
        <input
          type="text"
          className="form-input"
          placeholder="Enter PIN / ZIP code"
          value={pincode}
          onChange={handlePincodeChange}
          onKeyDown={handleKeyDown}
          aria-label="Enter your PIN code or ZIP code to find nearby polling stations"
          id="polling-pincode-input"
        />
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleSearch}
          disabled={!pincode.trim()}
          aria-label="Search for polling stations"
          id="polling-search-btn"
        >
          🔎
        </button>
      </div>

      {searchQuery && (
        <div className="polling-map-container">
          <iframe
            title={`Map showing polling stations near ${searchQuery}`}
            src={mapSrc}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            aria-label={`Google Maps showing polling stations near ${searchQuery}`}
          />
        </div>
      )}
    </div>
  );
}

PollingStationFinder.propTypes = {
  /** Google Maps API key for the embed */
  googleMapsApiKey: PropTypes.string.isRequired,
};

export default memo(PollingStationFinder);
