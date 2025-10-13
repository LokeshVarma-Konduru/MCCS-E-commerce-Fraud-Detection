import PropTypes from "prop-types";

const FilterSelect = ({ label, id, value, options, onChange }) => {
  return (
    <label htmlFor={id} className="admin-dashboard__filter-control">
      <span className="admin-dashboard__filter-label">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="admin-dashboard__filter-select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

FilterSelect.propTypes = {
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired
};

const FiltersBar = ({ filters, onChange, options }) => {
  return (
    <section className="admin-dashboard__filters" aria-label="Global filters">
      <form className="admin-dashboard__filters-form" onSubmit={(event) => event.preventDefault()}>
        <FilterSelect
          label="Date Range"
          id="admin-filter-date"
          value={filters.dateRange}
          options={options.dateRange}
          onChange={(value) => onChange("dateRange", value)}
        />
        <FilterSelect
          label="Store / Region"
          id="admin-filter-region"
          value={filters.region}
          options={options.region}
          onChange={(value) => onChange("region", value)}
        />
        <FilterSelect
          label="Payment Type"
          id="admin-filter-payment"
          value={filters.paymentType}
          options={options.paymentType}
          onChange={(value) => onChange("paymentType", value)}
        />
        <FilterSelect
          label="Risk Level"
          id="admin-filter-risk"
          value={filters.riskLevel}
          options={options.riskLevel}
          onChange={(value) => onChange("riskLevel", value)}
        />
      </form>
      <p className="admin-dashboard__inline-note">
        TODO: replace with filter metadata supplied by configuration service.
      </p>
    </section>
  );
};

FiltersBar.propTypes = {
  filters: PropTypes.shape({
    dateRange: PropTypes.string.isRequired,
    region: PropTypes.string.isRequired,
    paymentType: PropTypes.string.isRequired,
    riskLevel: PropTypes.string.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.shape({
    dateRange: PropTypes.array.isRequired,
    region: PropTypes.array.isRequired,
    paymentType: PropTypes.array.isRequired,
    riskLevel: PropTypes.array.isRequired
  }).isRequired
};

export default FiltersBar;
