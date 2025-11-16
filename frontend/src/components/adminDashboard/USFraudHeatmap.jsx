import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { usaMapData } from "./usMapData";
import { getHeatmapColor } from "./utils";

const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;

const USFraudHeatmap = ({ metrics, onSelectState, headline, description }) => {
  const [hoveredState, setHoveredState] = useState(null);
  const headingId = "admin-heatmap-heading";
  const svgTitleId = "admin-heatmap-svg-title";

  const valueDomain = useMemo(() => {
    const activeValues = metrics
      .filter((metric) => !metric.isMuted)
      .map((metric) => metric.value);

    if (activeValues.length === 0) {
      return { min: 0, max: 0 };
    }

    return {
      min: Math.min(...activeValues),
      max: Math.max(...activeValues)
    };
  }, [metrics]);

  const handleStateEnter = (metric) => {
    if (!metric) {
      setHoveredState(null);
      return;
    }
    setHoveredState(metric);
  };

  const handleStateLeave = () => {
    setHoveredState(null);
  };

  const renderTooltip = () => {
    if (!hoveredState) {
      return null;
    }

    return (
      <div className="admin-dashboard__map-tooltip" role="status">
        <p className="admin-dashboard__map-tooltip-title">{hoveredState.name}</p>
        <p className="admin-dashboard__map-tooltip-value">
          Fraud rate: <span>{formatPercent(hoveredState.value)}</span>
        </p>
        <p className="admin-dashboard__map-tooltip-detail">
          Flagged: {hoveredState.flagged.toLocaleString()} · Risk level: {hoveredState.riskLevelLabel}
        </p>
        <p className="admin-dashboard__map-tooltip-footnote">TODO: replace with live regional telemetry.</p>
      </div>
    );
  };

  return (
    <section className="admin-dashboard__section admin-dashboard__map" aria-labelledby={headingId}>
      <div className="admin-dashboard__section-header">
        <div>
          <h2 id={headingId}>{headline}</h2>
          {description ? <p className="admin-dashboard__section-subtitle">{description}</p> : null}
        </div>
        <div className="admin-dashboard__map-legend" aria-label="Fraud rate scale">
          <span>{formatPercent(valueDomain.min)}</span>
          <div className="admin-dashboard__map-gradient" aria-hidden="true" />
          <span>{formatPercent(valueDomain.max)}</span>
        </div>
      </div>
      <div className="admin-dashboard__map-content">
        <svg
          className="admin-dashboard__map-svg"
          viewBox={usaMapData.viewBox}
          role="img"
          aria-labelledby={`${headingId} ${svgTitleId}`}
          tabIndex={0}
        >
          <title id={svgTitleId}>{headline}</title>
          {usaMapData.locations.map((location) => {
            const metric = metrics.find((item) => item.id === location.id);
            const fillColor = metric
              ? getHeatmapColor(metric.value, valueDomain.min, valueDomain.max)
              : "#e2e8f0";
            const dimOpacity = metric?.isMuted ? 0.35 : 1;

            return (
              <path
                key={location.id}
                d={location.path}
                className="admin-dashboard__map-state"
                fill={fillColor}
                opacity={dimOpacity}
                onMouseEnter={() => handleStateEnter(metric)}
                onMouseLeave={handleStateLeave}
                onFocus={() => handleStateEnter(metric)}
                onBlur={handleStateLeave}
                onClick={() => (metric ? onSelectState(metric) : undefined)}
                tabIndex={0}
                aria-label={metric ? `${metric.name}: fraud rate ${formatPercent(metric.value)}` : `${location.name}: no data`}
              />
            );
          })}
          
          {/* Store Markers */}
          {stores.map((store) => {
            // Handle different coordinate formats
            let latitude, longitude;
            
            if (store.coordinates && store.coordinates.coordinates && Array.isArray(store.coordinates.coordinates)) {
              // GeoJSON format: [longitude, latitude]
              [longitude, latitude] = store.coordinates.coordinates;
            } else if (store.coordinates && typeof store.coordinates.latitude === 'number' && typeof store.coordinates.longitude === 'number') {
              // Legacy format: { latitude, longitude }
              latitude = store.coordinates.latitude;
              longitude = store.coordinates.longitude;
            } else {
              // Invalid coordinates
              return null;
            }
            
            // Validate coordinates are numbers
            if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
                isNaN(latitude) || isNaN(longitude) || 
                !isFinite(latitude) || !isFinite(longitude)) {
              return null;
            }
            
            // Filter out stores outside US bounds completely - very strict filtering
            // Continental US bounds: lat 25.5-47.5, lng -124.5 to -66.5
            if (latitude < 25.5 || latitude > 47.5 || longitude < -124.5 || longitude > -66.5) {
              return null;
            }
            
            const coords = latLngToSvg(
              latitude, 
              longitude, 
              usaMapData.viewBox
            );
            
            // Determine store color based on fraud rate - only green and red
            let storeColor = '#10b981'; // Default green
            if (store.fraudStats) {
              if (store.fraudStats.fraudRate > 3) {
                storeColor = '#ef4444'; // Red for high fraud (>3%)
              } else {
                storeColor = '#10b981'; // Green for low fraud (≤3%)
              }
            } else {
              // Fallback to status-based colors if no fraud stats
              const statusColors = {
                active: '#10b981',
                inactive: '#ef4444',
                maintenance: '#ef4444'
              };
              storeColor = statusColors[store.status] || statusColors.active;
            }
            
            return (
              <g 
                key={store._id || store.storeID}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  handleStoreEnter(store);
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation();
                  handleStoreLeave();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStoreClick(store);
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="6"
                  fill={storeColor}
                  stroke="white"
                  strokeWidth="2"
                  className="admin-dashboard__store-marker"
                />
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="3"
                  fill="white"
                />
              </g>
            );
          })}
        </svg>
        {renderTooltip()}
      </div>
    </section>
  );
};

USFraudHeatmap.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      flagged: PropTypes.number.isRequired,
      riskLevelLabel: PropTypes.string.isRequired,
      isMuted: PropTypes.bool
    })
  ).isRequired,
  onSelectState: PropTypes.func,
  headline: PropTypes.string.isRequired,
  description: PropTypes.string
};

USFraudHeatmap.defaultProps = {
  onSelectState: () => {},
  description: null
};

export default USFraudHeatmap;
