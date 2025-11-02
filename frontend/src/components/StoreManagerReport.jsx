import React, { useRef } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
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
} from 'chart.js';
import { FaFilePdf, FaChartLine, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import useReportPdfExport from '../hooks/useReportPdfExport.js';
import logo from '../assets/logo.jpg';

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

const StoreManagerReport = ({ data }) => {
  const { period, fraudTrendData, transactionTypesData, stats, recentAlerts } = data;
  const reportRef = useRef(null);
  
  // Format the report period for display
  let periodDisplay = '';
  switch (period) {
    case 'Last 24 h.':
      periodDisplay = 'Last 24 Hours';
      break;
    case 'Last 7 days':
      periodDisplay = 'Last 7 Days';
      break;
    case 'Last 30 days':
      periodDisplay = 'Last 30 Days';
      break;
    default:
      periodDisplay = period;
  }

  const exportReportPdf = useReportPdfExport(reportRef, {
    fileName: () => `MCCS-Store-Manager-Report-${periodDisplay}.pdf`
  });

  const handleDownloadPdf = async () => {
    try {
      await exportReportPdf();
    } catch (error) {
      alert('There was an error generating the PDF. Please try again.');
    }
  };


  return (
    <div className="report-container" ref={reportRef}>
      <div className="report-header">
        <div className="logo-container">
          <img src={logo} alt="MCCS Logo" className="report-logo" />
        </div>
        <div className="report-title">
          <h1>Fraud Detection Report</h1>
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
          <h3>Total Transactions</h3>
          <div className="summary-value">{stats.totalTransactions.value.toLocaleString()}</div>
          <div className={`summary-change ${stats.totalTransactions.change.includes('+') ? 'positive' : 'negative'}`}>
            {stats.totalTransactions.change}
          </div>
        </div>
        <div className="summary-card">
          <h3>Fraud Rate</h3>
          <div className="summary-value">{stats.fraudRate.value}</div>
          <div className={`summary-change ${stats.fraudRate.change.includes('+') ? 'negative' : 'positive'}`}>
            {stats.fraudRate.change}
          </div>
        </div>
        <div className="summary-card">
          <h3>Financial Impact</h3>
          <div className="summary-value">{stats.financialImpact.value}</div>
          <div className={`summary-change ${stats.financialImpact.change.includes('+') ? 'negative' : 'positive'}`}>
            {stats.financialImpact.change}
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="section-header" style={{ color: '#111827' }}>
          <h2>Fraud Detection Trend</h2>
          <p className="section-description">Fraud rate trend over {periodDisplay.toLowerCase()}</p>
        </div>
        <div className="chart-container elevated" style={{ background: 'white', height: 300 }}>
          <Line 
            data={fraudTrendData}
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
                    callback: value => value + '%'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <div className="report-charts-grid">
        <div className="report-chart-column">
          <div className="section-header">
            <h2>Transaction Types</h2>
            <p className="section-subheader">Distribution by transaction type</p>
          </div>
          <div className="chart-container">
            <Bar 
              data={transactionTypesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      usePointStyle: true,
                      padding: 20
                    }
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: false
                    }
                  },
                  y: {
                    beginAtZero: true,
                    grid: {
                      drawBorder: false
                    },
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }}
            />
          </div>
        </div>
        <div className="report-chart-column">
          <div className="section-header">
            <h2>Merchant Categories</h2>
            <p className="section-subheader">Transaction volume by merchant type</p>
          </div>
          <div className="chart-container">
            <Pie 
              data={{
                labels: ['Exchange', 'Commissary', 'Food & Hospitality', 'Recreation', 'Marine Mart'],
                datasets: [
                  {
                    data: [45, 25, 15, 10, 5],
                    backgroundColor: [
                      '#60a5fa', // Exchange (blue)
                      '#f87171', // Commissary (red)
                      '#4ade80', // Food & Hospitality (green)
                      '#fbbf24', // Recreation (yellow)
                      '#a78bfa'  // Marine Mart (purple)
                    ]
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 15,
                      padding: 15
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="section-header" style={{ color: '#111827' }}>
          <h2>Recent Alerts</h2>
          <p className="section-description">Most recent fraud alerts requiring attention</p>
        </div>
        <div className="alerts-table-container">
          {recentAlerts.length === 0 ? (
            <div className="no-alerts">No recent alerts found</div>
          ) : (
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((alert, index) => (
                  <tr key={index}>
                    <td>{alert.time}</td>
                    <td>{alert.transactionId}</td>
                    <td>{alert.type}</td>
                    <td>{alert.amount}</td>
                    <td>
                      <span className={`risk-badge ${alert.riskScore.toLowerCase()}`}>
                        {alert.riskScore}
                      </span>
                    </td>
                    <td>{alert.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="report-section insights-section">
        <div className="section-header">
          <h2>Key Insights & Recommendations</h2>
          <p className="section-subheader">Analysis and actionable insights from the data</p>
        </div>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon"><FaChartLine /></div>
            <h3>Trend Analysis</h3>
            <p>
              {parseFloat(stats.totalTransactions.change) > 0 
                ? `Transaction volume has increased by ${stats.totalTransactions.change}. This growth indicates increased store activity.` 
                : `Transaction volume has decreased by ${stats.totalTransactions.change}. Monitor this trend to identify potential issues.`}
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon"><FaExclamationTriangle /></div>
            <h3>Fraud Patterns</h3>
            <p>
              {parseFloat(stats.fraudRate.value) > 2
                ? "We've detected an elevated fraud rate. Most suspicious activities involve high-value transactions and gift card purchases."
                : "Fraud rate remains at acceptable levels. Continue monitoring for any unusual patterns in transaction behavior."}
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon"><FaLightbulb /></div>
            <h3>Recommendations</h3>
            <p>
              {parseFloat(stats.fraudRate.value) > 2
                ? "Consider implementing additional verification for transactions over $100. Review staff training on fraud detection procedures."
                : "Maintain current fraud prevention practices. Consider periodic staff refresher training on identifying suspicious transactions."}
            </p>
          </div>
        </div>
      </div>

      <div className="report-footer">
        <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} • MCCS Fraud Detection System</p>
      </div>
    </div>
  );
};

export default StoreManagerReport;
