import PropTypes from "prop-types";
import { formatMetricValue } from "./utils";

const KpiCard = ({ title, metrics, trend }) => {
  return (
    <article className="admin-dashboard__kpi-card" aria-label={`${title} summary`}>
      <header className="admin-dashboard__kpi-header">
        <h3>{title}</h3>
        {trend?.value ? (
          <span className={`admin-dashboard__kpi-trend admin-dashboard__kpi-trend--${trend.direction ?? "neutral"}`}>
            {trend.value}
            {trend.context ? <em>{trend.context}</em> : null}
          </span>
        ) : null}
      </header>
      <dl className="admin-dashboard__kpi-metrics">
        {metrics.map((metric) => (
          <div key={metric.label} className="admin-dashboard__kpi-metric">
            <dt>{metric.label}</dt>
            <dd>{formatMetricValue(metric.value, metric.type)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
};

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      type: PropTypes.oneOf(["count", "percentage", "currency"]).isRequired
    })
  ).isRequired,
  trend: PropTypes.shape({
    value: PropTypes.string,
    context: PropTypes.string,
    direction: PropTypes.oneOf(["positive", "negative", "neutral"])
  })
};

KpiCard.defaultProps = {
  trend: null
};

export default KpiCard;
