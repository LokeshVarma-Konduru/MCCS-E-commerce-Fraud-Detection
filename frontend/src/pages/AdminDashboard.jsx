import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import FiltersBar from "../components/adminDashboard/FiltersBar.jsx";
import KpiCard from "../components/adminDashboard/KpiCard.jsx";
import TransactionsTable from "../components/adminDashboard/TransactionsTable.jsx";
import ReportSummaries from "../components/adminDashboard/ReportSummaries.jsx";
import USFraudHeatmap from "../components/adminDashboard/USFraudHeatmap.jsx";
import { usaMapData } from "../components/adminDashboard/usMapData.js";
import "../styles/AdminDashboard.css";

const riskLevelLabels = {
  high: "High risk",
  medium: "Moderate risk",
  low: "Low risk"
};

const stateRegions = {
  ak: "west",
  al: "south",
  ar: "south",
  az: "west",
  ca: "west",
  co: "west",
  ct: "north",
  dc: "north",
  de: "north",
  fl: "south",
  ga: "south",
  hi: "west",
  ia: "central",
  id: "west",
  il: "central",
  in: "central",
  ks: "central",
  ky: "south",
  la: "south",
  ma: "north",
  md: "north",
  me: "north",
  mi: "north",
  mn: "north",
  mo: "central",
  ms: "south",
  mt: "west",
  nc: "south",
  nd: "central",
  ne: "central",
  nh: "north",
  nj: "north",
  nm: "west",
  nv: "west",
  ny: "north",
  oh: "north",
  ok: "central",
  or: "west",
  pa: "north",
  ri: "north",
  sc: "south",
  sd: "central",
  tn: "south",
  tx: "south",
  ut: "west",
  va: "south",
  vt: "north",
  wa: "west",
  wi: "north",
  wv: "south",
  wy: "west"
};

const baseFraudRates = {
  ak: 0.02,
  al: 0.031,
  ar: 0.028,
  az: 0.029,
  ca: 0.041,
  co: 0.021,
  ct: 0.024,
  dc: 0.037,
  de: 0.022,
  fl: 0.033,
  ga: 0.032,
  hi: 0.021,
  ia: 0.02,
  id: 0.018,
  il: 0.028,
  in: 0.026,
  ks: 0.021,
  ky: 0.025,
  la: 0.034,
  ma: 0.026,
  md: 0.025,
  me: 0.016,
  mi: 0.028,
  mn: 0.019,
  mo: 0.025,
  ms: 0.035,
  mt: 0.017,
  nc: 0.03,
  nd: 0.018,
  ne: 0.019,
  nh: 0.017,
  nj: 0.034,
  nm: 0.026,
  nv: 0.036,
  ny: 0.039,
  oh: 0.026,
  ok: 0.027,
  or: 0.022,
  pa: 0.029,
  ri: 0.023,
  sc: 0.028,
  sd: 0.018,
  tn: 0.027,
  tx: 0.031,
  ut: 0.019,
  va: 0.024,
  vt: 0.015,
  wa: 0.027,
  wi: 0.02,
  wv: 0.028,
  wy: 0.016
};

const regionBaselines = {
  west: 6200,
  south: 7000,
  north: 6400,
  central: 5600
};

const deriveRiskKey = (value) => {
  if (value >= 0.034) {
    return "high";
  }
  if (value >= 0.024) {
    return "medium";
  }
  return "low";
};

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState({
    dateRange: "30d",
    region: "all",
    paymentType: "all",
    riskLevel: "all"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6
  });

  const emitFilterChange = useCallback((_payload) => {
    // TODO: Wire filter analytics / backend query trigger.
  }, []);

  const emitPaginate = useCallback((_payload) => {
    // TODO: Replace with backend pagination when available.
  }, []);

  const emitMapSelect = useCallback((_payload) => {
    // TODO: Connect to detailed regional drill-down.
  }, []);

  const emitViewTransaction = useCallback((_payload) => {
    // TODO: Route to transaction detail drawer.
  }, []);

  const filterOptions = useMemo(
    () => ({
      dateRange: [
        { value: "today", label: "Today" },
              { value: "7d", label: "Last 7 days" },
        { value: "30d", label: "Last 30 days" },
        { value: "quarter", label: "Last 90 days" }
      ],
      region: [
        { value: "all", label: "All Regions" },
        { value: "north", label: "Northern Markets" },
        { value: "central", label: "Central Markets" },
        { value: "south", label: "Southern Markets" },
        { value: "west", label: "Western Markets" }
      ],
      paymentType: [
        { value: "all", label: "All Payment Types" },
        { value: "credit-card", label: "Credit Card" },
        { value: "debit-card", label: "Debit Card" },
        { value: "digital-wallet", label: "Digital Wallet" },
        { value: "bank-transfer", label: "Bank Transfer" }
      ],
      riskLevel: [
        { value: "all", label: "All Risk Bands" },
        { value: "high", label: "High risk" },
        { value: "medium", label: "Moderate risk" },
        { value: "low", label: "Low risk" }
      ]
    }),
    []
  );

  const baseTransactions = useMemo(
    () => [
      {
        id: "tx-1048",
        time: "08:42",
        store: "Store 104 - Midtown",
        region: "North Region",
        regionKey: "north",
        transactionId: "TX-1048",
        amount: 248.3,
        paymentType: "Credit Card",
        paymentKey: "credit-card",
        riskScore: 0.82,
        riskLevel: "High",
        riskKey: "high",
        status: "Flagged",
        statusKey: "flagged"
      },
      {
        id: "tx-2051",
        time: "09:15",
        store: "Store 205 - Riverside",
        region: "West Region",
        regionKey: "west",
        transactionId: "TX-2051",
        amount: 58.32,
        paymentType: "Debit Card",
        paymentKey: "debit-card",
        riskScore: 0.35,
        riskLevel: "Medium",
        riskKey: "medium",
        status: "Approved",
        statusKey: "approved"
      },
      {
        id: "tx-3109",
        time: "09:48",
        store: "Store 310 - Downtown",
        region: "Central Region",
        regionKey: "central",
        transactionId: "TX-3109",
        amount: 914.55,
        paymentType: "Bank Transfer",
        paymentKey: "bank-transfer",
        riskScore: 0.91,
        riskLevel: "High",
        riskKey: "high",
        status: "Under Review",
        statusKey: "review"
      },
      {
        id: "tx-4183",
        time: "10:22",
        store: "Store 418 - Lakeside",
        region: "South Region",
        regionKey: "south",
        transactionId: "TX-4183",
        amount: 132.12,
        paymentType: "Digital Wallet",
        paymentKey: "digital-wallet",
        riskScore: 0.18,
        riskLevel: "Low",
        riskKey: "low",
        status: "Approved",
        statusKey: "approved"
      },
      {
        id: "tx-5120",
        time: "11:03",
        store: "Store 512 - Harbor",
        region: "North Region",
        regionKey: "north",
        transactionId: "TX-5120",
        amount: 341.76,
        paymentType: "Credit Card",
        paymentKey: "credit-card",
        riskScore: 0.47,
        riskLevel: "Medium",
        riskKey: "medium",
        status: "Under Review",
        statusKey: "review"
      },
      {
        id: "tx-6094",
        time: "11:58",
        store: "Store 609 - Hillcrest",
        region: "West Region",
        regionKey: "west",
        transactionId: "TX-6094",
        amount: 688.4,
        paymentType: "Credit Card",
        paymentKey: "credit-card",
        riskScore: 0.76,
        riskLevel: "High",
        riskKey: "high",
        status: "Flagged",
        statusKey: "flagged"
      },
      {
        id: "tx-7021",
        time: "12:34",
        store: "Store 702 - Seaside",
        region: "South Region",
        regionKey: "south",
        transactionId: "TX-7021",
        amount: 92.18,
        paymentType: "Debit Card",
        paymentKey: "debit-card",
        riskScore: 0.22,
        riskLevel: "Low",
        riskKey: "low",
        status: "Approved",
        statusKey: "approved"
      },
      {
        id: "tx-8450",
        time: "13:16",
        store: "Store 845 - Capital Plaza",
        region: "Central Region",
        regionKey: "central",
        transactionId: "TX-8450",
        amount: 411.27,
        paymentType: "Digital Wallet",
        paymentKey: "digital-wallet",
        riskScore: 0.51,
        riskLevel: "Medium",
        riskKey: "medium",
        status: "Approved",
        statusKey: "approved"
      },
      {
        id: "tx-9304",
        time: "14:07",
        store: "Store 930 - Innovation Hub",
        region: "North Region",
        regionKey: "north",
        transactionId: "TX-9304",
        amount: 1021.65,
        paymentType: "Bank Transfer",
        paymentKey: "bank-transfer",
        riskScore: 0.88,
        riskLevel: "High",
        riskKey: "high",
        status: "Flagged",
        statusKey: "flagged"
      },
      {
        id: "tx-10012",
        time: "15:42",
        store: "Store 1001 - Market Street",
        region: "West Region",
        regionKey: "west",
        transactionId: "TX-10012",
        amount: 268.94,
        paymentType: "Credit Card",
        paymentKey: "credit-card",
        riskScore: 0.49,
        riskLevel: "Medium",
        riskKey: "medium",
        status: "Under Review",
        statusKey: "review"
      },
      {
        id: "tx-11045",
        time: "16:18",
        store: "Store 1104 - Lakeshore",
        region: "South Region",
        regionKey: "south",
        transactionId: "TX-11045",
        amount: 842.55,
        paymentType: "Digital Wallet",
        paymentKey: "digital-wallet",
        riskScore: 0.79,
        riskLevel: "High",
        riskKey: "high",
        status: "Flagged",
        statusKey: "flagged"
      },
      {
        id: "tx-12031",
        time: "17:26",
        store: "Store 1203 - Tech Park",
        region: "Central Region",
        regionKey: "central",
        transactionId: "TX-12031",
        amount: 119.74,
        paymentType: "Debit Card",
        paymentKey: "debit-card",
        riskScore: 0.16,
        riskLevel: "Low",
        riskKey: "low",
        status: "Approved",
        statusKey: "approved"
      }
    ],
    []
  );

  const kpiCards = useMemo(
    () => [
      {
        id: "total-transactions",
        title: "Total Transactions",
        metrics: [
          { label: "Today", value: 1248, type: "count" },
          { label: "7d", value: 8924, type: "count" },
          { label: "30d", value: 36852, type: "count" }
        ],
        trend: { value: "+4.2%", context: "vs prev 30d", direction: "positive" }
      },
      {
        id: "flagged-transactions",
        title: "Flagged Transactions",
        metrics: [
          { label: "Today", value: 38, type: "count" },
          { label: "7d", value: 268, type: "count" },
          { label: "30d", value: 1104, type: "count" }
        ],
        trend: { value: "+1.6%", context: "investigate drivers", direction: "negative" }
      },
      {
        id: "fraud-rate",
        title: "Fraud Rate",
        metrics: [
          { label: "Today", value: 0.031, type: "percentage" },
          { label: "7d", value: 0.028, type: "percentage" },
          { label: "30d", value: 0.026, type: "percentage" }
        ],
        trend: { value: "-0.4%", context: "vs prev 30d", direction: "positive" }
      },
      {
        id: "approval-rate",
        title: "Approval Rate",
        metrics: [
          { label: "Today", value: 0.942, type: "percentage" },
          { label: "7d", value: 0.934, type: "percentage" },
          { label: "30d", value: 0.927, type: "percentage" }
        ],
        trend: { value: "+0.9%", context: "policy adjustments", direction: "positive" }
      }
    ],
    []
  );

  const reportMetrics = useMemo(
    () => [
      {
        id: "model-accuracy",
        title: "Model Accuracy (30d)",
        headline: "97.2%",
        change: "+0.8%",
        changeDirection: "positive",
        subtitle: "Consistent precision across card-present transactions.",
        sparkline: [92, 93, 95, 96, 97, 97.2]
      },
      {
        id: "flagging-rate",
        title: "Flagging Rate Trend",
        headline: "3.1%",
        change: "-0.3%",
        changeDirection: "positive",
        subtitle: "Steady decline after rules tuning deployment.",
        sparkline: [3.8, 3.6, 3.5, 3.3, 3.2, 3.1]
      },
      {
        id: "drift-level",
        title: "Estimated Drift Level",
        headline: "Low",
        change: null,
        changeDirection: "neutral",
        subtitle: "Feature stability within acceptable thresholds.",
        sparkline: [28, 24, 22, 20, 18, 17]
      },
      {
        id: "error-rate",
        title: "Error Rate Trend",
        headline: "0.6%",
        change: "+0.1%",
        changeDirection: "negative",
        subtitle: "Slight spike tied to payment gateway latency.",
        sparkline: [0.3, 0.4, 0.5, 0.55, 0.6, 0.6]
      }
    ],
    []
  );

  const baseStateMetrics = useMemo(() => {
    return usaMapData.locations.map((location) => {
      const region = stateRegions[location.id] ?? "central";
      const baselineRate = baseFraudRates[location.id] ?? 0.02;
      const baselineVolume = regionBaselines[region] + ((location.id.charCodeAt(0) + location.id.charCodeAt(1)) % 6) * 420;
      const riskKey = deriveRiskKey(baselineRate);

      return {
        id: location.id,
        name: location.name,
        region,
        value: baselineRate,
        riskKey,
        riskLevelLabel: riskLevelLabels[riskKey],
        flagged: Math.max(60, Math.round(baselineRate * baselineVolume))
      };
    });
  }, []);

  const mapMetrics = useMemo(() => {
    return baseStateMetrics.map((metric) => {
      const matchesRegion = filters.region === "all" || metric.region === filters.region;
      const matchesRisk = filters.riskLevel === "all" || metric.riskKey === filters.riskLevel;
      return {
        ...metric,
        isMuted: !(matchesRegion && matchesRisk)
      };
    });
  }, [baseStateMetrics, filters.region, filters.riskLevel]);

  useEffect(() => {
    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      const filtered = baseTransactions.filter((transaction) => {
        const matchesRegion = filters.region === "all" || transaction.regionKey === filters.region;
        const matchesPayment = filters.paymentType === "all" || transaction.paymentKey === filters.paymentType;
        const matchesRisk = filters.riskLevel === "all" || transaction.riskKey === filters.riskLevel;
        return matchesRegion && matchesPayment && matchesRisk;
      });
      setDisplayedTransactions(filtered);
      setIsLoading(false);
    }, 280);

    return () => clearTimeout(timeoutId);
  }, [baseTransactions, filters]);

  const totalPages = Math.max(1, Math.ceil(displayedTransactions.length / pagination.pageSize));

  useEffect(() => {
    if (pagination.page > totalPages) {
      setPagination((prev) => ({ ...prev, page: totalPages }));
    }
  }, [pagination.page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return displayedTransactions.slice(start, start + pagination.pageSize);
  }, [displayedTransactions, pagination.page, pagination.pageSize]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    emitFilterChange({ name, value });
  };

  const handlePaginate = (nextPage) => {
    setPagination((prev) => {
      const boundedPage = Math.min(Math.max(nextPage, 1), totalPages);
      return { ...prev, page: boundedPage };
    });
    emitPaginate({ page: nextPage, pageSize: pagination.pageSize });
  };

  const handleViewTransaction = (transactionId) => {
    emitViewTransaction({ transactionId });
  };

  const handleSelectState = (stateMetric) => {
    emitMapSelect(stateMetric);
  };

  if (authLoading) {
    return (
      <div className="admin-dashboard__loading" role="status">
        Loading dashboard...
      </div>
    );
  }

  if (!user || user.role !== "Admin") {
    return (
      <section className="admin-dashboard__restricted" role="alert">
        <h1>Admins only</h1>
        <p>This area consolidates sensitive program insights. Please sign in with an administrator account.</p>
      </section>
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-dashboard__intro">
            Unified oversight for enterprise fraud prevention, combining Store Manager transaction intelligence with high-level report signals.
          </p>
        </div>
        <span className="admin-dashboard__role-badge" aria-label="Admins only access">
          Admins only
        </span>
      </header>

      <USFraudHeatmap
        metrics={mapMetrics}
        onSelectState={handleSelectState}
        headline="Fraud intensity across the United States"
        description="Placeholder fraud-rate gradient by state. TODO: hook into regional analytics feed."
      />

      <div className="admin-dashboard__controls">
        <FiltersBar filters={filters} onChange={handleFilterChange} options={filterOptions} />
      </div>

      <section className="admin-dashboard__summary" aria-label="Key performance indicators">
        <div className="admin-dashboard__kpi-grid">
          {kpiCards.map((card) => (
            <KpiCard key={card.id} title={card.title} metrics={card.metrics} trend={card.trend} />
          ))}
        </div>
      </section>

      <ReportSummaries reports={reportMetrics} />

      <TransactionsTable
        rows={paginatedRows}
        isLoading={isLoading}
        pagination={{ page: pagination.page, totalPages, pageSize: pagination.pageSize }}
        onPaginate={handlePaginate}
        onViewTransaction={handleViewTransaction}
      />
    </main>
  );
};

export default AdminDashboard;
