import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import FiltersBar from "../components/adminDashboard/FiltersBar.jsx";
import KpiCard from "../components/adminDashboard/KpiCard.jsx";
import TransactionsTable from "../components/adminDashboard/TransactionsTable.jsx";
import ReportSummaries from "../components/adminDashboard/ReportSummaries.jsx";
import USFraudHeatmap from "../components/adminDashboard/USFraudHeatmap.jsx";
import { usaMapData } from "../components/adminDashboard/usMapData.js";
import RealtimeAlertsPanel from "../components/RealtimeAlertsPanel.jsx";
import AdminReport from "../components/AdminReport.jsx";
import FlaggedTransactionsPanel from "../components/FlaggedTransactionsPanel.jsx";
import { FaFileAlt, FaEnvelope } from "react-icons/fa";
import { getStores, sendReportEmail } from "../api.js";
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
  const { isConnected, fraudAlerts, clearAlerts, removeAlert } = useSocket();
  const [filters, setFilters] = useState({
    dateRange: "30d",
    store: "all",
    region: "all",
    paymentType: "all",
    riskLevel: "all"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6
  });
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null);

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
      store: [
        { value: "all", label: "All Stores" },
        ...stores.map(store => ({
          value: store.storeID,
          label: `${store.storeID} - ${store.storeName}`
        }))
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
    [stores]
  );

  // Fetch stores on component mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoadingStores(true);
        const response = await getStores();
        if (response.data && response.data.success) {
          setStores(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

  const baseTransactions = useMemo(
    () => [
      {
        id: "tx-1048",
        time: "08:42",
        store: "Store 104 - Midtown",
        storeID: "S104",
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
        storeID: "S205",
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
        storeID: "S310",
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
        storeID: "S418",
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
        storeID: "S512",
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
        storeID: "S609",
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
        storeID: "S702",
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
        storeID: "S845",
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
        storeID: "S930",
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
        storeID: "S1001",
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
        storeID: "S1104",
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
        storeID: "S1203",
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
        const matchesStore = filters.store === "all" || transaction.storeID === filters.store;
        const matchesRegion = filters.region === "all" || transaction.regionKey === filters.region;
        const matchesPayment = filters.paymentType === "all" || transaction.paymentKey === filters.paymentType;
        const matchesRisk = filters.riskLevel === "all" || transaction.riskKey === filters.riskLevel;
        return matchesStore && matchesRegion && matchesPayment && matchesRisk;
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

  const toggleEmailModal = () => {
    setShowEmailModal(!showEmailModal);
    setEmailSent(false);
    setEmailError(null);
    setEmailAddress("");
  };

  const handleGenerateReport = () => {
    const newReportState = !showReport;
    setShowReport(newReportState);

    if (newReportState) {
      setTimeout(() => {
        if (reportRef.current) {
          reportRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  const getReportPdfData = async () => {
    if (!reportRef.current) return null;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [imgWidth, imgHeight]
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

      const pdfBase64 = pdf.output("datauristring");
      return pdfBase64.split(",")[1];
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    }
  };

  const handleSendReportEmail = async () => {
    if (!emailAddress) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setSendingEmail(true);
      setEmailError(null);

      const pdfData = await getReportPdfData();
      if (!pdfData) {
        throw new Error("Failed to generate PDF report");
      }

      const dateRangeLabels = {
        today: "Today",
        "7d": "Last 7 Days",
        "30d": "Last 30 Days",
        quarter: "Last 90 Days"
      };
      const periodLabel = dateRangeLabels[filters.dateRange] || "Custom Period";
      const emailSubject = `MCCS Admin Report - ${periodLabel}`;
      const emailMessage = `This report contains comprehensive fraud detection metrics and insights for ${periodLabel}.`;

      const userName = user?.name || "";
      const userRole = user?.role || "";

      const response = await sendReportEmail(
        emailAddress,
        emailSubject,
        emailMessage,
        pdfData,
        `admin-report-${filters.dateRange}.pdf`,
        userName,
        userRole
      );

      if (response.data.success) {
        setEmailSent(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSent(false);
          setEmailAddress("");
        }, 3000);
      } else {
        throw new Error(response.data.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending report email:", error);
      setEmailError(error.message || "Failed to send email. Please try again.");
    } finally {
      setSendingEmail(false);
    }
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
          <div 
            className="admin-dashboard__actions" 
            style={{ 
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px"
            }}
          >
            <button
              className="generate-report-button"
              onClick={handleGenerateReport}
              style={{
                padding: "10px 20px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "500",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#2563eb"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#3b82f6"}
            >
              <FaFileAlt />
              {showReport ? "Hide Report" : "Generate Report"}
            </button>
            {showReport && (
              <button
                className="send-report-button"
                onClick={toggleEmailModal}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
              >
                <FaEnvelope />
                Send Report
              </button>
            )}
          </div>
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

      <RealtimeAlertsPanel
        title="Live Fraud Alerts"
        description="Streaming high-risk transactions from every store and channel."
        alerts={fraudAlerts}
        isConnected={isConnected}
        onClearAlerts={clearAlerts}
        onRemoveAlert={removeAlert}
        scopeLabel="All stores"
        className="admin-dashboard__alerts-panel"
      />

      <div style={{ marginTop: "24px" }}>
        <FlaggedTransactionsPanel showStoreFilter />
      </div>

      <TransactionsTable
        rows={paginatedRows}
        isLoading={isLoading}
        pagination={{ page: pagination.page, totalPages, pageSize: pagination.pageSize }}
        onPaginate={handlePaginate}
        onViewTransaction={handleViewTransaction}
      />

      {showReport && (
        <div
          ref={reportRef}
          className="report-view"
          style={{
            background: "white",
            padding: "32px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
            margin: "24px 0"
          }}
        >
          <AdminReport
            data={{
              dateRange: filters.dateRange,
              kpiCards,
              reportMetrics,
              transactionSummary: {
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                totalTransactions: [1200, 1350, 1180, 1420, 1560, 1890, 1650],
                flaggedTransactions: [38, 42, 35, 45, 52, 61, 48]
              },
              regionalData: {
                regions: ["North", "South", "East", "West", "Central"],
                fraudRates: [2.8, 3.2, 2.4, 3.1, 2.6]
              },
              systemPerformance: {
                labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                accuracy: [96.8, 97.1, 97.2, 97.5]
              }
            }}
          />
        </div>
      )}

      {showEmailModal && (
        <div
          className="email-modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            className="email-modal"
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              minWidth: "400px",
              maxWidth: "500px"
            }}
          >
            <div
              className="email-modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}
            >
              <h3>Send Report via Email</h3>
              <button
                className="close-button"
                onClick={toggleEmailModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280"
                }}
              >
                ✕
              </button>
            </div>
            <div className="email-modal-body">
              {!emailSent ? (
                <>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "500"
                      }}
                    >
                      Email Address: <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="Enter recipient's email address"
                      className="email-input"
                      disabled={sendingEmail}
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px"
                      }}
                    />
                  </div>

                  {user && (
                    <div
                      className="user-info-notice"
                      style={{
                        backgroundColor: "#f3f4f6",
                        borderRadius: "6px",
                        padding: "12px",
                        marginBottom: "16px",
                        fontSize: "13px",
                        color: "#4b5563"
                      }}
                    >
                      Report will be sent from: <strong>{user.name}</strong> ({user.role})
                    </div>
                  )}

                  {emailError && (
                    <p
                      className="email-error"
                      style={{ color: "#ef4444", marginBottom: "16px" }}
                    >
                      {emailError}
                    </p>
                  )}

                  <button
                    className="send-button"
                    onClick={handleSendReportEmail}
                    disabled={sendingEmail}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      width: "100%"
                    }}
                  >
                    {sendingEmail ? "Sending..." : "Send Report"}
                  </button>
                </>
              ) : (
                <div
                  className="success-message"
                  style={{
                    textAlign: "center",
                    color: "#10b981",
                    fontWeight: "600"
                  }}
                >
                  Report sent successfully!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminDashboard;
