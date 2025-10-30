import PropTypes from "prop-types";

const ReportSummaryCard = ({ title, headline, change, changeDirection, subtitle, sparkline }) => {
  const maxValue = Math.max(...sparkline, 0);

  return (
    <article className="admin-dashboard__report-card">
      <header className="admin-dashboard__report-header">
        <h3>{title}</h3>
        {change ? (
          <span
            className={`admin-dashboard__report-change admin-dashboard__report-change--${changeDirection}`}
            aria-label={`Change ${change}`}
          >
            {change}
          </span>
        ) : null}
      </header>
      <p className="admin-dashboard__report-headline">{headline}</p>
      {subtitle ? <p className="admin-dashboard__report-subtitle">{subtitle}</p> : null}
      <div className="admin-dashboard__sparkline" role="img" aria-label={`${title} trend placeholder`}>
        {sparkline.map((value, index) => {
          const height = maxValue === 0 ? 0 : (value / maxValue) * 100;
          return (
            <span
              key={`${title}-spark-${index}`}
              style={{ height: `${height}%` }}
              className="admin-dashboard__sparkline-bar"
            />
          );
        })}
      </div>
      <p className="admin-dashboard__report-footnote">TODO: Replace with live metrics from reporting service.</p>
    </article>
  );
};

ReportSummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  headline: PropTypes.string.isRequired,
  change: PropTypes.string,
  changeDirection: PropTypes.oneOf(["positive", "negative", "neutral"]),
  subtitle: PropTypes.string,
  sparkline: PropTypes.arrayOf(PropTypes.number).isRequired
};

ReportSummaryCard.defaultProps = {
  change: null,
  changeDirection: "neutral",
  subtitle: null
};

const ReportSummaries = ({ reports }) => {
  return (
    <section className="admin-dashboard__section" aria-labelledby="admin-reports-heading">
      <div className="admin-dashboard__section-header">
        <div>
          <h2 id="admin-reports-heading">Reports snapshot</h2>
          <p className="admin-dashboard__section-subtitle">
            Summaries adapted from Developer reports without technical tooling.
          </p>
        </div>
      </div>
      <div className="admin-dashboard__reports-grid">
        {reports.map((report) => (
          <ReportSummaryCard
            key={report.id}
            title={report.title}
            headline={report.headline}
            change={report.change}
            changeDirection={report.changeDirection}
            subtitle={report.subtitle}
            sparkline={report.sparkline}
          />
        ))}
      </div>
    </section>
  );
};

ReportSummaries.propTypes = {
  reports: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      headline: PropTypes.string.isRequired,
      change: PropTypes.string,
      changeDirection: PropTypes.oneOf(["positive", "negative", "neutral"]),
      subtitle: PropTypes.string,
      sparkline: PropTypes.arrayOf(PropTypes.number).isRequired
    })
  ).isRequired
};

export default ReportSummaries;
