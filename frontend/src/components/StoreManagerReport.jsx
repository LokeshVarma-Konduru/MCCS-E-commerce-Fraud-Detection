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
  const { period, fraudTrendData, transactionTypesData, stats, recentAlerts, reportType = 'monthly-summary', customDateRange } = data;
  const reportRef = useRef(null);

  // Format the report period for display
  let periodDisplay = '';
  if (reportType === 'custom-date-range' && customDateRange?.startDate && customDateRange?.endDate) {
    const startDate = new Date(customDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endDate = new Date(customDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    periodDisplay = `${startDate} - ${endDate}`;
  } else {
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
  }

  // Get report type title
  const getReportTitle = () => {
    switch (reportType) {
      case 'monthly-summary':
        return 'Monthly Fraud Detection Summary';
      case 'transaction-analysis':
        return 'Transaction Type Analysis Report';
      case 'risk-assessment':
        return 'Risk Assessment Report';
      case 'custom-date-range':
        return 'Custom Date Range Report';
      default:
        return 'Fraud Detection Report';
    }
  };

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
          <h1>{getReportTitle()}</h1>
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

      {/* Report-Type Specific Sections */}
      {reportType === 'transaction-analysis' && (
        <div className="report-section" style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
          <div className="section-header" style={{ color: '#111827' }}>
            <h2>Transaction Type Deep Dive</h2>
            <p className="section-description">Comprehensive analysis of transaction patterns by type</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Online Transactions</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Online transactions account for approximately 65% of total volume with a fraud rate of 3.2%.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Key risk factors: High-value purchases, multiple failed attempts, shipping address mismatches.
              </p>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>In-Store Transactions</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                In-store transactions represent 35% of volume with a lower fraud rate of 1.8%.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Key risk factors: Card-not-present scenarios, unusual purchasing patterns, gift card purchases.
              </p>
            </div>
          </div>
        </div>
      )}

      {reportType === 'risk-assessment' && (
        <div className="report-section" style={{ backgroundColor: '#fef2f2', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
          <div className="section-header" style={{ color: '#111827' }}>
            <h2>Risk Level Distribution</h2>
            <p className="section-description">Breakdown of transactions by risk score</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '2px solid #ef4444' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>High Risk</h3>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>156</p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Transactions flagged for immediate review</p>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '2px solid #f59e0b' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>Medium Risk</h3>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>423</p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Transactions requiring monitoring</p>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>Low Risk</h3>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>2,847</p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Normal transactions approved</p>
            </div>
          </div>
          <div style={{ marginTop: '24px', background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>High-Risk Transaction Indicators</h3>
            <ul style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>Transaction amounts exceeding $500</li>
              <li>Multiple transactions from same IP address within short timeframe</li>
              <li>Shipping and billing address mismatches</li>
              <li>Unusual purchasing patterns (e.g., multiple gift cards)</li>
              <li>Transactions from high-risk geographic locations</li>
            </ul>
          </div>
        </div>
      )}

      {reportType === 'monthly-summary' && (
        <div className="report-section" style={{ backgroundColor: '#eff6ff', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
          <div className="section-header" style={{ color: '#111827' }}>
            <h2>Monthly Performance Summary</h2>
            <p className="section-description">Key highlights and metrics for the month</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#3b82f6' }}>Detection Accuracy</h3>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>97.2%</p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Successfully identified 156 out of 161 fraudulent transactions with minimal false positives.
              </p>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#3b82f6' }}>Amount Saved</h3>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>{stats.financialImpact.value}</p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Total value of fraudulent transactions prevented through early detection.
              </p>
            </div>
          </div>
        </div>
      )}

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
