import { useState } from 'react';
import PropTypes from 'prop-types';
import { AnalyticsEvents } from '../analytics';

/**
 * PollingStationFinder — ZIP/pincode input + Google Maps embed for nearby polling stations.
 */
export default function PollingStationFinder({ googleMapsApiKey }) {
  const [pincode, setPincode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (pincode.trim()) {
      setSearchQuery(pincode.trim());
      AnalyticsEvents.pollingStationSearch(pincode.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

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
          onChange={(e) => setPincode(e.target.value)}
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
