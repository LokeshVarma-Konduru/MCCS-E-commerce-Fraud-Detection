import PropTypes from "prop-types";
import { currencyFormatter } from "./utils";

const TransactionsTable = ({ rows, isLoading, pagination, onPaginate, onViewTransaction }) => {
  const showEmptyState = !isLoading && rows.length === 0;
  const skeletonRows = Array.from({ length: pagination.pageSize });

  const handlePrevious = () => {
    if (pagination.page > 1) {
      onPaginate(pagination.page - 1);
    }
  };

  const handleNext = () => {
    if (pagination.page < pagination.totalPages) {
      onPaginate(pagination.page + 1);
    }
  };

  return (
    <section className="admin-dashboard__section" aria-labelledby="admin-transactions-heading">
      <div className="admin-dashboard__section-header">
        <div>
          <h2 id="admin-transactions-heading">Organization-wide transactions</h2>
          <p className="admin-dashboard__section-subtitle">
            Placeholder data representing consolidated transaction feed. TODO: replace with API results.
          </p>
        </div>
      </div>
      <div className="admin-dashboard__table-container">
        <table className="admin-dashboard__table">
          <caption className="sr-only">Paginated transactions table showing filters applied</caption>
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Store</th>
              <th scope="col">Transaction ID</th>
              <th scope="col">Amount</th>
              <th scope="col">Payment Type</th>
              <th scope="col">Risk Score</th>
              <th scope="col">Status</th>
              <th scope="col" className="admin-dashboard__table-actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? skeletonRows.map((_, index) => (
                  <tr key={`skeleton-${index}`} className="admin-dashboard__table-row--skeleton">
                    <td colSpan={8}>
                      <div className="admin-dashboard__skeleton-line" />
                    </td>
                  </tr>
                ))
              : null}
            {showEmptyState ? (
              <tr>
                <td colSpan={8} className="admin-dashboard__empty-state">
                  <p>No transactions match the current filters.</p>
                  <p className="admin-dashboard__empty-state-hint">
                    Adjust filters or refresh once backend data is connected.
                  </p>
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? rows.map((row) => (
                  <tr key={row.id}>
                    <td data-title="Time">{row.time}</td>
                    <td data-title="Store">
                      <span className="admin-dashboard__store-name">{row.store}</span>
                      <span className="admin-dashboard__store-region">{row.region}</span>
                    </td>
                    <td data-title="Transaction ID">
                      <code className="admin-dashboard__code">{row.transactionId}</code>
                    </td>
                    <td data-title="Amount">{currencyFormatter.format(row.amount)}</td>
                    <td data-title="Payment Type">{row.paymentType}</td>
                    <td data-title="Risk Score">
                      <span className={`admin-dashboard__risk-badge admin-dashboard__risk-badge--${row.riskKey}`}>
                        {row.riskScore.toFixed(2)}
                      </span>
                    </td>
                    <td data-title="Status">
                      <span className={`admin-dashboard__status admin-dashboard__status--${row.statusKey}`}>
                        {row.status}
                      </span>
                    </td>
                    <td data-title="Actions" className="admin-dashboard__table-actions">
                      <button
                        type="button"
                        className="admin-dashboard__table-button"
                        onClick={() => onViewTransaction(row.transactionId)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
      <div className="admin-dashboard__pagination" role="group" aria-label="Pagination controls">
        <button
          type="button"
          className="admin-dashboard__pagination-button"
          onClick={handlePrevious}
          disabled={pagination.page === 1}
        >
          Previous
        </button>
        <span className="admin-dashboard__pagination-info">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          type="button"
          className="admin-dashboard__pagination-button"
          onClick={handleNext}
          disabled={pagination.page === pagination.totalPages}
        >
          Next
        </button>
      </div>
    </section>
  );
};

TransactionsTable.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      store: PropTypes.string.isRequired,
      region: PropTypes.string.isRequired,
      transactionId: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      paymentType: PropTypes.string.isRequired,
      riskScore: PropTypes.number.isRequired,
      riskKey: PropTypes.oneOf(["high", "medium", "low"]).isRequired,
      status: PropTypes.string.isRequired,
      statusKey: PropTypes.oneOf(["flagged", "approved", "review"]).isRequired
    })
  ).isRequired,
  isLoading: PropTypes.bool.isRequired,
  pagination: PropTypes.shape({
    page: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired
  }).isRequired,
  onPaginate: PropTypes.func.isRequired,
  onViewTransaction: PropTypes.func.isRequired
};

export default TransactionsTable;
