import React, { useRef } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { FaFilePdf, FaShieldAlt, FaChartBar, FaMapMarkerAlt } from "react-icons/fa";
import useReportPdfExport from "../hooks/useReportPdfExport.js";
import logo from "../assets/logo.jpg";
import "../styles/Report.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminReport = ({ data }) => {
  const {
    dateRange,
    kpiCards,
    reportMetrics,
    transactionSummary,
    regionalData,
    systemPerformance
  } = data;

  const reportRef = useRef(null);

  const dateRangeLabels = {
    today: "Today",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    quarter: "Last 90 Days"
  };

  const periodDisplay = dateRangeLabels[dateRange] || "Custom Period";

  const exportReportPdf = useReportPdfExport(reportRef, {
    fileName: () => `MCCS-Admin-Report-${periodDisplay.replace(/\s+/g, "-")}.pdf`
  });

  const handleDownloadPdf = async () => {
    try {
      await exportReportPdf();
    } catch (_error) {
      alert("There was an error generating the PDF. Please try again.");
    }
  };

  const transactionTrendData = {
    labels: transactionSummary?.labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Total Transactions",
        data: transactionSummary?.totalTransactions || [1200, 1350, 1180, 1420, 1560, 1890, 1650],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true
      },
      {
        label: "Flagged Transactions",
        data: transactionSummary?.flaggedTransactions || [38, 42, 35, 45, 52, 61, 48],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true
      }
    ]
  };

  const regionalChartData = {
    labels: regionalData?.regions || ["North", "South", "East", "West", "Central"],
    datasets: [
      {
        label: "Fraud Rate (%)",
        data: regionalData?.fraudRates || [2.8, 3.2, 2.4, 3.1, 2.6],
        backgroundColor: [
          "rgba(99, 102, 241, 0.7)",
          "rgba(239, 68, 68, 0.7)",
          "rgba(34, 197, 94, 0.7)",
          "rgba(245, 158, 11, 0.7)",
          "rgba(168, 85, 247, 0.7)"
        ]
      }
    ]
  };

  const performanceData = {
    labels: systemPerformance?.labels || ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Model Accuracy (%)",
        data: systemPerformance?.accuracy || [96.8, 97.1, 97.2, 97.5],
        backgroundColor: "rgba(34, 197, 94, 0.7)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="report-container" ref={reportRef}>
      <div className="report-header">
        <div className="logo-container">
          <img src={logo} alt="MCCS Logo" className="report-logo" />
        </div>
        <div className="report-title">
          <h1>Admin Dashboard Report</h1>
          <p className="report-period">{periodDisplay}</p>
        </div>
        <div className="report-actions">
          <button className="download-button" onClick={handleDownloadPdf}>
            <FaFilePdf className="button-icon" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="report-summary">
        <div className="summary-card">
          <h3>
            <FaChartBar /> Total Transactions
          </h3>
          <div className="summary-value">
            {kpiCards?.[0]?.metrics?.[2]?.value?.toLocaleString() || "36,852"}
          </div>
          <div className="summary-change positive">
            {kpiCards?.[0]?.trend?.value || "+4.2%"} vs previous period
          </div>
        </div>
        <div className="summary-card">
          <h3>
            <FaShieldAlt /> Flagged Transactions
          </h3>
          <div className="summary-value">
            {kpiCards?.[1]?.metrics?.[2]?.value?.toLocaleString() || "1,104"}
          </div>
          <div className="summary-change negative">
            {kpiCards?.[1]?.trend?.value || "+1.6%"} vs previous period
          </div>
        </div>
        <div className="summary-card">
          <h3>Fraud Rate</h3>
          <div className="summary-value">
            {((kpiCards?.[2]?.metrics?.[2]?.value || 0.026) * 100).toFixed(2)}%
          </div>
          <div className="summary-change positive">
            {kpiCards?.[2]?.trend?.value || "-0.4%"} vs previous period
          </div>
        </div>
        <div className="summary-card">
          <h3>Approval Rate</h3>
          <div className="summary-value">
            {((kpiCards?.[3]?.metrics?.[2]?.value || 0.927) * 100).toFixed(2)}%
          </div>
          <div className="summary-change positive">
            {kpiCards?.[3]?.trend?.value || "+0.9%"} vs previous period
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="section-header">
          <h2>Transaction Trends</h2>
          <p className="section-description">
            Daily transaction volume and fraud detection over {periodDisplay.toLowerCase()}
          </p>
        </div>
        <div className="chart-container elevated" style={{ background: "white", height: 350 }}>
          <Line
            data={transactionTrendData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                  labels: {
                    usePointStyle: true
                  }
                },
                tooltip: {
                  mode: "index",
                  intersect: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => value.toLocaleString()
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <div className="report-grid">
        <div className="report-section elevated">
          <div className="section-header">
            <h2>
              <FaMapMarkerAlt /> Regional Fraud Rates
            </h2>
            <p className="section-description">
              Comparative fraud prevalence across key MCCS operating regions
            </p>
          </div>
          <div className="chart-container" style={{ background: "white", height: 320 }}>
            <Bar
              data={regionalChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `${value}%`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="report-section elevated">
          <div className="section-header">
            <h2>System Performance</h2>
            <p className="section-description">
              Model accuracy benchmarks over the selected period
            </p>
          </div>
          <div className="chart-container" style={{ background: "white", height: 320 }}>
            <Bar
              data={performanceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `${value}%`
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="report-section elevated">
        <div className="section-header">
          <h2>Operational Highlights</h2>
          <p className="section-description">
            Key insights and system alerts impacting enterprise-wide fraud management
          </p>
        </div>
        <div className="report-insights">
          {reportMetrics?.map((metric) => (
            <div key={metric.id} className="insight-card">
              <h3>{metric.title}</h3>
              <div className="insight-value">{metric.headline}</div>
              {metric.change && (
                <div
                  className={`insight-change ${
                    metric.changeDirection === "positive"
                      ? "positive"
                      : metric.changeDirection === "negative"
                      ? "negative"
                      : ""
                  }`}
                >
                  {metric.change}
                </div>
              )}
              <p className="insight-subtitle">{metric.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="report-section elevated">
        <div className="section-header">
          <h2>Fraud Channel Distribution</h2>
          <p className="section-description">
            Breakdown of fraud-related incidents by channel and category
          </p>
        </div>
        <div className="chart-pie-wrapper">
          <Pie
            data={{
              labels: ["Card Present", "Card Not Present", "Account Takeover", "Refund Fraud"],
              datasets: [
                {
                  data: [42, 28, 19, 11],
                  backgroundColor: ["#3b82f6", "#ef4444", "#f59e0b", "#10b981"],
                  borderColor: "#ffffff",
                  borderWidth: 1
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom"
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminReport;
