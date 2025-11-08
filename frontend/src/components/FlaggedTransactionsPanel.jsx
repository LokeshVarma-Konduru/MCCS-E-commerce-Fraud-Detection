import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { getFlaggedTransactions } from "../api.js";
import "../styles/FlaggedTransactions.css";

const DATE_RANGES = [
  { value: "all", label: "All Time" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" }
];

const toISODate = (date) => date.toISOString().split("T")[0];

const getRangeDates = (range) => {
  if (range === "all") {
    return {};
  }
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);

  switch (range) {
    case "7d":
      start.setDate(start.getDate() - 6);
      break;
    case "30d":
      start.setDate(start.getDate() - 29);
      break;
    case "90d":
      start.setDate(start.getDate() - 89);
      break;
    default:
      return {};
  }

  start.setHours(0, 0, 0, 0);

  return {
    startDate: toISODate(start),
    endDate: toISODate(end)
  };
};

const deriveRiskPill = (score) => {
  if (typeof score !== "number") return "neutral";
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
};

const FlaggedTransactionsPanel = ({
  title = "Manually Flagged Transactions",
  pageSize = 10,
  className = "",
  showStoreFilter = false,
  storeContext = null,
  emptyStateMessage = "No manually flagged transactions found.",
  compact = false
}) => {
  const [dateRange, setDateRange] = useState("30d");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  const [storeIdFilter, setStoreIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const appliedStoreId = showStoreFilter ? storeIdFilter.trim() : "";

  const fetchFlaggedTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: pageSize
      };

      const rangeDates =
        dateRange === "custom"
          ? {
              startDate: customDates.start || undefined,
              endDate: customDates.end || undefined
            }
          : getRangeDates(dateRange);

      if (rangeDates.startDate) params.startDate = rangeDates.startDate;
      if (rangeDates.endDate) params.endDate = rangeDates.endDate;

      const storeRefParam = storeContext?.storeRef;
      const storeIdParam = storeContext?.storeID;

      if (storeRefParam) {
        params.storeRef = storeRefParam;
      }
      if (storeIdParam) {
        params.storeID = storeIdParam;
      }
      if (appliedStoreId) {
        params.storeID = appliedStoreId;
      }

      const response = await getFlaggedTransactions(params);

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Unable to load flagged transactions");
      }

      setTransactions(response.data.transactions || []);
      setPagination(response.data.pagination || { total: 0, pages: 0 });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error loading flagged transactions:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [
    appliedStoreId,
    customDates.end,
    customDates.start,
    dateRange,
    page,
    pageSize,
    storeContext?.storeID,
    storeContext?.storeRef
  ]);

  useEffect(() => {
    fetchFlaggedTransactions();
  }, [fetchFlaggedTransactions]);

  useEffect(() => {
    setPage(1);
  }, [dateRange, customDates.start, customDates.end, appliedStoreId, storeContext?.storeID, storeContext?.storeRef]);

  const formattedTransactions = useMemo(
    () =>
      transactions.map((txn) => {
        const riskScore =
          typeof txn.riskScore === "number"
            ? txn.riskScore
            : txn.probabilities?.[0]?.[1]
            ? Math.round(txn.probabilities[0][1] * 100)
            : null;

        const reviewer = txn.reviewedBy;
        const reviewerLabel = reviewer
          ? `${reviewer.name || "Reviewer"}${reviewer.role ? ` • ${reviewer.role}` : ""}`
          : "—";

        const storeLabel =
          txn.storeRef?.storeName ||
          (txn.storeID ? `Store ${txn.storeID}` : storeContext?.storeID ? `Store ${storeContext.storeID}` : "—");

        return {
          id: txn._id,
          amount: typeof txn.transactionAmount === "number" ? txn.transactionAmount.toFixed(2) : null,
          status: txn.status || "rejected",
          riskScore,
          riskLevel: deriveRiskPill(riskScore),
          notes: txn.notes || "",
          reviewerLabel,
          storeLabel,
          storeID: txn.storeRef?.storeID || txn.storeID || storeContext?.storeID || null,
          reviewedAt: txn.reviewedAt ? new Date(txn.reviewedAt) : null
        };
      }),
    [storeContext, transactions]
  );

  const handleRefresh = () => {
    fetchFlaggedTransactions();
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    if (value !== "custom") {
      setCustomDates({ start: "", end: "" });
    }
  };

  const handleCustomDateChange = (key, value) => {
    setCustomDates((prev) => ({ ...prev, [key]: value }));
    if (value) {
      setDateRange("custom");
    }
  };

  const panelClasses = ["flagged-panel"];
  if (compact) panelClasses.push("flagged-panel--compact");
  if (className) panelClasses.push(className);

  return (
    <section className={panelClasses.join(" ")}>
      <div className="flagged-panel__header">
        <div>
          <h3>{title}</h3>
          <p>Manual review activity from the fraud investigation team.</p>
        </div>
        <div className="flagged-panel__header-actions">
          {lastUpdated && (
            <span className="flagged-panel__meta">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button className="flagged-panel__refresh" onClick={handleRefresh} type="button" disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="flagged-panel__filters">
        <div className="flagged-panel__range-buttons">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              className={`flagged-panel__range-btn ${dateRange === range.value ? "is-active" : ""}`}
              onClick={() => handleDateRangeChange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="flagged-panel__inline-filters">
          <label className="flagged-panel__custom-date">
            <span>Start</span>
            <input
              type="date"
              value={customDates.start}
              max={customDates.end || undefined}
              onChange={(e) => handleCustomDateChange("start", e.target.value)}
            />
          </label>
          <label className="flagged-panel__custom-date">
            <span>End</span>
            <input
              type="date"
              value={customDates.end}
              min={customDates.start || undefined}
              onChange={(e) => handleCustomDateChange("end", e.target.value)}
            />
          </label>

          {showStoreFilter && (
            <label className="flagged-panel__store-filter" htmlFor="flagged-store-filter">
              <span>Store ID</span>
              <input
                id="flagged-store-filter"
                type="text"
                placeholder="e.g., S104"
                value={storeIdFilter}
                onChange={(e) => setStoreIdFilter(e.target.value)}
              />
            </label>
          )}
        </div>
      </div>

      <div className="flagged-panel__table">
        {loading ? (
          <div className="flagged-panel__state">Loading flagged transactions…</div>
        ) : error ? (
          <div className="flagged-panel__state flagged-panel__state--error">
            <p>{error}</p>
            <button type="button" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        ) : formattedTransactions.length === 0 ? (
          <div className="flagged-panel__state flagged-panel__state--empty">{emptyStateMessage}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Store</th>
                <th>Reviewer</th>
                <th>Reviewed</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {formattedTransactions.map((txn) => (
                <tr key={txn.id}>
                  <td>
                    <span className="flagged-panel__mono">{txn.id?.slice(-8) || "—"}</span>
                  </td>
                  <td>{txn.amount ? `$${txn.amount}` : "—"}</td>
                  <td>
                    <span className={`flagged-panel__status flagged-panel__status--${txn.status}`}>
                      {txn.status === "under_review" ? "Under review" : "Rejected"}
                    </span>
                  </td>
                  <td>
                    {typeof txn.riskScore === "number" ? (
                      <span className={`flagged-panel__risk flagged-panel__risk--${txn.riskLevel}`}>
                        {txn.riskScore}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className="flagged-panel__store">
                      <span>{txn.storeLabel}</span>
                      {txn.storeID && <span className="flagged-panel__store-id">{txn.storeID}</span>}
                    </div>
                  </td>
                  <td>{txn.reviewerLabel}</td>
                  <td>{txn.reviewedAt ? txn.reviewedAt.toLocaleString() : "—"}</td>
                  <td title={txn.notes || ""} className="flagged-panel__notes">
                    {txn.notes ? (txn.notes.length > 60 ? `${txn.notes.slice(0, 57)}…` : txn.notes) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formattedTransactions.length > 0 && pagination.pages > 1 && (
        <div className="flagged-panel__pagination">
          <button type="button" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
            Previous
          </button>
          <span>
            Page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
            disabled={page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

FlaggedTransactionsPanel.propTypes = {
  title: PropTypes.string,
  pageSize: PropTypes.number,
  className: PropTypes.string,
  showStoreFilter: PropTypes.bool,
  storeContext: PropTypes.shape({
    storeRef: PropTypes.string,
    storeID: PropTypes.string
  }),
  emptyStateMessage: PropTypes.string,
  compact: PropTypes.bool
};

export default FlaggedTransactionsPanel;
