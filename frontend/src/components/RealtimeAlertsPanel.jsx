import PropTypes from "prop-types";
import { FaBell, FaTimes } from "react-icons/fa";
import "../styles/RealtimeAlertsPanel.css";

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "—";
  }
  const numericAmount = Number(amount);
  return `$${numericAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatDateTime = (value) => {
  try {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
      return "Just now";
    }
    return date.toLocaleString();
  } catch (_error) {
    return "Just now";
  }
};

const getRiskClass = (riskLevel = "") => {
  const normalized = riskLevel.toLowerCase();
  if (normalized === "high") {
    return "realtime-alerts__risk-badge realtime-alerts__risk-badge--high";
  }
  if (normalized === "medium") {
    return "realtime-alerts__risk-badge realtime-alerts__risk-badge--medium";
  }
  return "realtime-alerts__risk-badge realtime-alerts__risk-badge--low";
};

const getRiskLabel = (riskLevel = "") => {
  if (!riskLevel) {
    return "Medium Risk";
  }
  return `${riskLevel.charAt(0).toUpperCase()}${riskLevel.slice(1)} Risk`;
};

const RealtimeAlertsPanel = ({
  title,
  description,
  alerts,
  isConnected,
  onClearAlerts,
  onRemoveAlert,
  className = "",
  scopeLabel,
  emptyStateTitle = "No fraud alerts",
  emptyStateDescription = "Alerts will appear here when fraudulent transactions are detected.",
  maxHeight = 400
}) => {
  return (
    <section className={`realtime-alerts ${className}`}>
      <header className="realtime-alerts__header">
        <div className="realtime-alerts__titles">
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>

        <div className="realtime-alerts__badge-group">
          <span
            className={
              isConnected
                ? "realtime-alerts__status-pill realtime-alerts__status-pill--connected"
                : "realtime-alerts__status-pill realtime-alerts__status-pill--disconnected"
            }
          >
            {isConnected ? "● Connected" : "○ Disconnected"}
          </span>
          {scopeLabel && (
            <span className="realtime-alerts__status-pill realtime-alerts__status-pill--scope">
              {scopeLabel}
            </span>
          )}
          {alerts.length > 0 && (
            <span className="realtime-alerts__status-pill realtime-alerts__status-pill--count">
              {alerts.length} Alert{alerts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {alerts.length > 0 && onClearAlerts && (
          <button type="button" className="realtime-alerts__clear" onClick={onClearAlerts}>
            Clear All
          </button>
        )}
      </header>

      <div className="realtime-alerts__body" style={{ maxHeight }}>
        {alerts.length === 0 ? (
          <div className="realtime-alerts__empty">
            <FaBell aria-hidden="true" className="realtime-alerts__empty-icon" />
            <p className="realtime-alerts__empty-title">{emptyStateTitle}</p>
            <p className="realtime-alerts__empty-description">{emptyStateDescription}</p>
          </div>
        ) : (
          alerts.map((alert, index) => {
            const key = alert.transactionId || alert.transactionIdShort || `alert-${index}`;
            const details = [
              { label: "Amount", value: formatCurrency(alert.amount) },
              { label: "Probability", value: alert.probability ? `${alert.probability}%` : "—", highlight: true },
              {
                label: "Payment",
                value: alert.paymentMethod ? alert.paymentMethod : "—",
                capitalize: true
              },
              {
                label: "Device",
                value: alert.deviceUsed ? alert.deviceUsed : "—",
                capitalize: true
              },
              {
                label: "Category",
                value: alert.productCategory ? alert.productCategory : "—",
                capitalize: true
              },
              { label: "Model", value: alert.modelUsed || "—" }
            ];

            if (alert.storeName || alert.storeID) {
              details.push({
                label: "Store",
                value: alert.storeName || alert.storeID || "—"
              });
            }

            if (alert.transactionType) {
              details.push({
                label: "Type",
                value: alert.transactionType,
                capitalize: true
              });
            }

            return (
              <article key={key} className="realtime-alerts__item">
                {onRemoveAlert && alert.transactionId && (
                  <button
                    type="button"
                    className="realtime-alerts__dismiss"
                    onClick={() => onRemoveAlert(alert.transactionId)}
                    aria-label="Dismiss alert"
                  >
                    <FaTimes aria-hidden="true" />
                  </button>
                )}

                <div className="realtime-alerts__item-header">
                  <div>
                    <div className="realtime-alerts__item-title">
                      <h4>⚠️ {alert.transactionIdShort || "Fraud Alert"}</h4>
                      <span className={getRiskClass(alert.riskLevel)}>
                        {getRiskLabel(alert.riskLevel)}
                      </span>
                    </div>
                    <span className="realtime-alerts__timestamp">
                      {formatDateTime(alert.timestamp)}
                    </span>
                  </div>
                </div>

                <dl className="realtime-alerts__details">
                  {details.map(({ label, value, highlight, capitalize: shouldCapitalize }) => (
                    <div key={`${key}-${label}`} className="realtime-alerts__detail">
                      <dt>{label}</dt>
                      <dd
                        className={[
                          highlight ? "realtime-alerts__detail-value--highlight" : "",
                          shouldCapitalize ? "realtime-alerts__detail-value--capitalize" : ""
                        ].join(" ").trim()}
                      >
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

RealtimeAlertsPanel.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  alerts: PropTypes.arrayOf(PropTypes.object).isRequired,
  isConnected: PropTypes.bool,
  onClearAlerts: PropTypes.func,
  onRemoveAlert: PropTypes.func,
  className: PropTypes.string,
  scopeLabel: PropTypes.string,
  emptyStateTitle: PropTypes.string,
  emptyStateDescription: PropTypes.string,
  maxHeight: PropTypes.number
};

RealtimeAlertsPanel.defaultProps = {
  description: "",
  isConnected: false,
  onClearAlerts: null,
  onRemoveAlert: null,
  className: "",
  scopeLabel: "",
  emptyStateTitle: "No fraud alerts",
  emptyStateDescription: "Alerts will appear here when fraudulent transactions are detected.",
  maxHeight: 400
};

export default RealtimeAlertsPanel;
