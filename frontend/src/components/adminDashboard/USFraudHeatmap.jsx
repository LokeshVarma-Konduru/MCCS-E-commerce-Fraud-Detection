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
