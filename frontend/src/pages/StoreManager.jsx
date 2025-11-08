import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FaEnvelope } from 'react-icons/fa';
import '../styles/StoreManager.css';
import '../styles/Report.css';
import { getStoreManagerStats, getFraudTrends, getTransactionTypeDistribution, getRecentAlerts, sendReportEmail, updateTransactionStatus } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import RealtimeAlertsPanel from '../components/RealtimeAlertsPanel.jsx';
import StoreManagerReport from '../components/StoreManagerReport';
import FlaggedTransactionsPanel from '../components/FlaggedTransactionsPanel.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StoreManager = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { isConnected, fraudAlerts, clearAlerts, removeAlert } = useSocket();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('Last 30 days');
  const [transactionType, setTransactionType] = useState('All Transactions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('monthly-summary');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Create a reference for the report section
  const reportRef = useRef(null);
  
  // User state
  
  // Email report state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flaggingTransaction, setFlaggingTransaction] = useState(null);
  const [flagNotes, setFlagNotes] = useState('');
  const [flagError, setFlagError] = useState(null);

  // State for real data
  const [stats, setStats] = useState({
    totalTransactions: {
      value: 0,
      change: ''
    },
    fraudRate: {
      value: '0%',
      change: ''
    },
    financialImpact: {
      value: '$0',
      change: ''
    }
  });
  
  const [fraudTrendData, setFraudTrendData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Fraud Rate',
        data: [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  });
  
  const [transactionTypesData, setTransactionTypesData] = useState({
    labels: [],
    datasets: []
  });
  
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('All Types');
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  
  // Function to toggle email modal
  const toggleEmailModal = () => {
    setShowEmailModal(!showEmailModal);
    setEmailSent(false);
    setEmailError(null);
    setEmailAddress('');
  };
  
  // Function to handle report generation with scrolling
  const handleGenerateReport = () => {
    const newReportState = !showReport;
    setShowReport(newReportState);
    
    // If showing the report, scroll to it after a short delay to ensure rendering
    if (newReportState) {
      setTimeout(() => {
        if (reportRef.current) {
          reportRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };
  
  // Function to send report via email
  const handleSendReportEmail = async () => {
    if (!emailAddress) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    try {
      setSendingEmail(true);
      setEmailError(null);
      
      // Get PDF data
      const pdfData = await getReportPdfData();
      if (!pdfData) {
        throw new Error('Failed to generate PDF report');
      }
      
      // Check if PDF data is too large (>10MB)
      if (pdfData.length > 10 * 1024 * 1024) {
        // Show warning and attempt to compress further
        console.warn('PDF file is very large, attempting to compress further');
      }
      
      // Create a more professional email message
      const periodLabel = timeRange;
      const emailSubject = `MCCS Store Manager Report - ${periodLabel}`;
      
      // Create a more professional message
      let emailMessage = `This report contains fraud detection metrics and insights for ${periodLabel}.`;
      
      // Use the current user's information automatically
      let userName = '';
      let userRole = '';
      
      if (currentUser) {
        userName = currentUser.name || '';
        userRole = currentUser.role || '';
      }
      
      // Send email with PDF attachment including current user's information
      const response = await sendReportEmail(
        emailAddress,
        emailSubject,
        emailMessage,
        pdfData,
        `store-manager-report-${timeRange.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        userName,
        userRole
      );
      
      if (response.data.success) {
        setEmailSent(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSent(false);
          setEmailAddress('');
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending report email:', error);
      
      // Handle specific error for payload too large
      if (error.message && error.message.includes('too large')) {
        setEmailError('The report is too large to send via email. Please try downloading it instead.');
      } else {
        setEmailError(error.message || 'Failed to send email. Please try again.');
      }
    } finally {
      setSendingEmail(false);
    }
  };
  
  // Function to convert HTML report to PDF and get base64 data
  const getReportPdfData = async () => {
    if (!reportRef.current) return null;
    
    try {
      // Use html2canvas and jsPDF to convert the report to PDF
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      // Capture the entire report as a single image
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Enable CORS for external images
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          // Make sure all elements are visible in the clone
          const clonedReport = clonedDoc.querySelector('.report-container');
          if (clonedReport) {
            clonedReport.style.height = 'auto';
            clonedReport.style.overflow = 'visible';
            
            // Fix header layout for PDF
            const header = clonedDoc.querySelector('.report-header');
            if (header) {
              header.style.display = 'flex';
              header.style.justifyContent = 'space-between';
              header.style.alignItems = 'center';
              header.style.width = '100%';
              header.style.marginBottom = '40px';
              header.style.paddingBottom = '24px';
              header.style.borderBottom = '1px solid #e5e7eb';
            }
            
            // Fix title container
            const titleContainer = clonedDoc.querySelector('.report-title');
            if (titleContainer) {
              titleContainer.style.textAlign = 'center';
              titleContainer.style.flexGrow = '1';
              titleContainer.style.margin = '0';
              titleContainer.style.padding = '0 20px';
            }
            
            // Fix download button container (hide it in PDF)
            const actionsContainer = clonedDoc.querySelector('.report-actions');
            if (actionsContainer) {
              actionsContainer.style.display = 'none';
            }
            
            // Ensure charts grid is properly displayed side by side in PDF
            const chartsGrid = clonedDoc.querySelector('.report-charts-grid');
            if (chartsGrid) {
              chartsGrid.style.display = 'grid';
              chartsGrid.style.gridTemplateColumns = '1fr 1fr';
              chartsGrid.style.gap = '32px';
              chartsGrid.style.margin = '40px 0';
              chartsGrid.style.width = '100%';
            }
            
            // Style each chart column for PDF
            const chartColumns = clonedDoc.querySelectorAll('.report-chart-column');
            chartColumns.forEach(column => {
              column.style.background = 'white';
              column.style.borderRadius = '12px';
              column.style.padding = '24px';
              column.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              column.style.border = '1px solid #e5e7eb';
              column.style.display = 'flex';
              column.style.flexDirection = 'column';
            });
            
            // Style chart containers for PDF
            const chartContainers = clonedDoc.querySelectorAll('.report-chart-column .chart-container');
            chartContainers.forEach(container => {
              container.style.height = '350px';
              container.style.flexGrow = '1';
              container.style.minHeight = '300px';
            });
            
            // Make sure all sections are visible
            const sections = clonedReport.querySelectorAll('.report-charts-grid, .report-charts, .report-metrics, .insights-section, .financial-metrics, .monthly-trends, .key-insights');
            sections.forEach(section => {
              if (section) {
                section.style.display = section.classList.contains('report-charts-grid') ? 'grid' : 'block';
                section.style.visibility = 'visible';
              }
            });
            
            // Make sure the footer with timestamp is visible
            const footer = clonedDoc.querySelector('.report-footer');
            if (footer) {
              footer.style.display = 'block';
              footer.style.visibility = 'visible';
            }
          }
        }
      });
      
      // Create a PDF with dimensions matching the canvas aspect ratio
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [imgWidth, imgHeight]
      });
      
      // Add the image to fill the entire PDF with high quality
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Convert PDF to base64
      const pdfBase64 = pdf.output('datauristring');
      return pdfBase64.split(',')[1]; // Remove the data URI prefix
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  // Handle flagging a transaction
  const handleFlagTransaction = (alert) => {
    const transactionId = alert.fullTransactionId || alert.transactionId.replace('#TRX-', '');
    
    setFlaggingTransaction({
      id: transactionId,
      displayId: alert.transactionId,
      amount: alert.amount,
      type: alert.type
    });
    setShowFlagModal(true);
    setFlagNotes('');
    setFlagError(null);
  };

  // Submit flag transaction
  const handleSubmitFlag = async () => {
    if (!flaggingTransaction) return;
    
    try {
      setFlagError(null);
      
      const response = await updateTransactionStatus(
        flaggingTransaction.id,
        'rejected',
        flagNotes || 'Manually flagged as fraudulent by store manager'
      );
      
      if (response.data.success) {
        setShowFlagModal(false);
        setFlaggingTransaction(null);
        setFlagNotes('');
        
        const alertsResponse = await getRecentAlerts(5, transactionType, { 
          storeRef: storeRefId, 
          storeID: storeHumanId 
        });
        if (alertsResponse.data && alertsResponse.data.success) {
          setRecentAlerts(alertsResponse.data.data);
        }
        
        alert('Transaction successfully flagged as fraudulent');
      } else {
        throw new Error(response.data.error || 'Failed to flag transaction');
      }
    } catch (error) {
      console.error('Error flagging transaction:', error);
      setFlagError(error.message || 'Failed to flag transaction. Please try again.');
    }
  };

  // Close flag modal
  const handleCloseFlagModal = () => {
    setShowFlagModal(false);
    setFlaggingTransaction(null);
    setFlagNotes('');
    setFlagError(null);
  };

  // Convert timeRange to period parameter for API calls
  const getPeriodFromTimeRange = (range) => {
    switch (range) {
      case 'Last 24 h.':
        return 'day';
      case 'Last 7 days':
        return 'week';
      case 'Last 30 days':
        return 'month';
      default:
        return 'day';
    }
  };

  // Derive store context from logged-in user
  const storeRefId = currentUser?.storeRef?._id || null;
  const storeHumanId = currentUser?.storeRef?.storeID || currentUser?.storeID || null;
  const storeName = currentUser?.storeRef?.storeName || null;
  const storeDisplayLabel = storeName
    ? `${storeName}${storeHumanId ? ` · ${storeHumanId}` : ''}`
    : storeHumanId
      ? `Store ${storeHumanId}`
      : 'Assigned store';

  const flaggedStoreContext = useMemo(() => {
    if (!storeRefId && !storeHumanId) {
      return null;
    }
    return {
      ...(storeRefId ? { storeRef: storeRefId } : {}),
      ...(storeHumanId ? { storeID: storeHumanId } : {})
    };
  }, [storeRefId, storeHumanId]);

  // Fetch stats data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const period = getPeriodFromTimeRange(timeRange);
        const response = await getStoreManagerStats(period, transactionType, { storeRef: storeRefId, storeID: storeHumanId });
        
        if (response.data && response.data.success) {
          const { totalTransactions, fraudRate, financialImpact } = response.data.data;
          setStats({
            totalTransactions: {
              value: totalTransactions.value,
              change: totalTransactions.change
            },
            fraudRate: {
              value: fraudRate.value,
              change: fraudRate.change
            },
            financialImpact: {
              value: financialImpact.value,
              change: financialImpact.change
            }
          });
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching store manager stats:', err);
        setError('Failed to load statistics');
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange, transactionType, authLoading, currentUser]);

  // Fetch fraud trend data
  useEffect(() => {
    const fetchFraudTrends = async () => {
      try {
        const period = getPeriodFromTimeRange(timeRange);
        const response = await getFraudTrends(period, transactionType, { storeRef: storeRefId, storeID: storeHumanId });
        
        if (response.data && response.data.success) {
          const trendData = response.data.data;
          
          setFraudTrendData({
            labels: trendData.map(item => item.date),
            datasets: [
              {
                label: 'Fraud Rate',
                data: trendData.map(item => item.fraudRate),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
              }
            ]
          });
        }
      } catch (err) {
        console.error('Error fetching fraud trends:', err);
      }
    };

    fetchFraudTrends();
  }, [timeRange, transactionType, authLoading, currentUser]);

  // Fetch transaction type distribution data
  useEffect(() => {
    const fetchTransactionTypes = async () => {
      try {
        const period = getPeriodFromTimeRange(timeRange);
        const typeFilter = transactionTypeFilter !== 'All Types' ? transactionTypeFilter : null;
        const response = await getTransactionTypeDistribution(period, typeFilter, { storeRef: storeRefId, storeID: storeHumanId });
        
        if (response.data && response.data.success) {
          const { categories, series } = response.data.data;
          
          setTransactionTypesData({
            labels: categories,
            datasets: [
              {
                label: 'Legitimate',
                data: series[0].data,
                backgroundColor: 'rgba(34, 197, 94, 0.7)', // Green for legitimate
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1
              },
              {
                label: 'Fraudulent',
                data: series[1].data,
                backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red for fraudulent
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 1
              }
            ]
          });
        }
      } catch (err) {
        console.error('Error fetching transaction types:', err);
      }
    };

    fetchTransactionTypes();
  }, [timeRange, transactionTypeFilter, authLoading, currentUser]);

  // Fetch recent alerts
  useEffect(() => {
    const fetchRecentAlerts = async () => {
      try {
        setAlertsLoading(true);
        const response = await getRecentAlerts(5, transactionType, { storeRef: storeRefId, storeID: storeHumanId });
        
        if (response.data && response.data.success) {
          setRecentAlerts(response.data.data);
        }
        setAlertsLoading(false);
      } catch (err) {
        console.error('Error fetching recent alerts:', err);
        setAlertsLoading(false);
      }
    };

    fetchRecentAlerts();
  }, [transactionType, authLoading, currentUser]);

  // Memoize chart options to prevent unnecessary re-renders
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true // Keep tooltips enabled
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value + '%'
        }
      }
    },
    animation: false, // Completely disable all animations
    transitions: {
      active: {
        animation: {
          duration: 0 // Disable transitions when hovering
        }
      }
    },
    elements: {
      line: {
        tension: 0.4 // Keep the curve smooth but don't animate it
      }
    },
    hover: {
      animationDuration: 0 // Disable hover animations
    },
    responsiveAnimationDuration: 0 // Disable animations on resize
  }), []); // Empty dependency array means this will only be calculated once

  // Memoize transaction types chart options
  const transactionTypesOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        enabled: true
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
    },
    animation: false,
    barPercentage: 0.7,
    categoryPercentage: 0.6
  }), []);

  return (
    <div className="store-manager-container">
      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
        <button 
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="dashboard-content">
        {/* Dashboard Controls */}
        <div className="dashboard-controls">
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="select-control"
            >
              <option>Last 24 h.</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="transaction-type-selector">
            <label>Transaction Type:</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="select-control"
            >
              <option>All Transactions</option>
              <option>Online</option>
              <option>In-store</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Transactions</h3>
            {loading ? (
              <div className="loading-indicator">Loading...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <>
                <div className="stat-value">
                  {stats.totalTransactions.value.toLocaleString()}
                </div>
                <div className={`stat-change ${stats.totalTransactions.change.includes('+') ? 'positive' : 'negative'}`}>
                  {stats.totalTransactions.change}
                </div>
              </>
            )}
          </div>
          <div className="stat-card">
            <h3>Fraud Rate</h3>
            {loading ? (
              <div className="loading-indicator">Loading...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <>
                <div className="stat-value">
                  {stats.fraudRate.value}
                </div>
                <div className={`stat-change ${stats.fraudRate.change.includes('+') ? 'negative' : 'positive'}`}>
                  {stats.fraudRate.change}
                </div>
              </>
            )}
          </div>
          <div className="stat-card">
            <h3>Financial Impact</h3>
            {loading ? (
              <div className="loading-indicator">Loading...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <>
                <div className="stat-value">
                  {stats.financialImpact.value}
                </div>
                <div className={`stat-change ${stats.financialImpact.change.includes('+') ? 'negative' : 'positive'}`}>
                  {stats.financialImpact.change}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-container">
            <div className="chart-header">
              <h3>Fraud Detection Trend</h3>
              <select className="time-select">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className="chart-wrapper">
              <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                <Line data={fraudTrendData} options={chartOptions} />
              </div>
            </div>
          </div>
          <div className="transaction-types">
            <div className="chart-header">
              <h3>Transaction Types</h3>
              <select 
                className="type-select"
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
              >
                <option>All Types</option>
                <option>Online</option>
                <option>In-store</option>
              </select>
            </div>
            <div className="chart-wrapper">
              <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                <Bar data={transactionTypesData} options={transactionTypesOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts Table */}
        <div className="recent-alerts">
          <h3>Recent Alerts</h3>
          {alertsLoading ? (
            <div className="loading-indicator">Loading alerts...</div>
          ) : recentAlerts.length === 0 ? (
            <div className="no-alerts">No recent alerts found</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                    <td>
                      {alert.status !== 'Flagged' && alert.status !== 'Under Review' ? (
                        <button
                          onClick={() => handleFlagTransaction(alert)}
                          className="flag-button"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          Flag as Fraud
                        </button>
                      ) : (
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>Already flagged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ marginTop: '24px' }}>
          <FlaggedTransactionsPanel
            title="Manual Review Activity"
            pageSize={5}
            storeContext={flaggedStoreContext}
            emptyStateMessage="No manually flagged transactions for your store yet."
            compact
          />
        </div>
      </div>
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <div className="reports-content">
          {/* Header Section */}
          {!showReport && (
            <div style={{
              background: "white",
              padding: "20px 24px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              <h2 style={{ color: "#6366f1", fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>
                Generate Your Report
              </h2>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                Select a report type below and click "Generate Report" to create a comprehensive fraud detection report for your store.
              </p>
            </div>
          )}

          {/* Report Type Selection */}
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            marginBottom: "20px"
          }}>
            <h2 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600", color: "#111827" }}>
              Select Report Type
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
              <div
                onClick={() => setReportType('monthly-summary')}
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  border: reportType === 'monthly-summary' ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                  backgroundColor: reportType === 'monthly-summary' ? "#eff6ff" : "white",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px", color: "#111827" }}>
                  Monthly Fraud Detection Summary
                </h3>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, lineHeight: "1.4" }}>
                  Comprehensive monthly overview of fraud detection metrics and trends
                </p>
              </div>

              <div
                onClick={() => setReportType('transaction-analysis')}
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  border: reportType === 'transaction-analysis' ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                  backgroundColor: reportType === 'transaction-analysis' ? "#eff6ff" : "white",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px", color: "#111827" }}>
                  Transaction Type Analysis
                </h3>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, lineHeight: "1.4" }}>
                  Detailed breakdown of transactions by type (online vs in-store)
                </p>
              </div>

              <div
                onClick={() => setReportType('risk-assessment')}
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  border: reportType === 'risk-assessment' ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                  backgroundColor: reportType === 'risk-assessment' ? "#eff6ff" : "white",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px", color: "#111827" }}>
                  Risk Assessment Report
                </h3>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, lineHeight: "1.4" }}>
                  Risk score distribution and high-risk transaction analysis
                </p>
              </div>

              <div
                onClick={() => setReportType('custom-date-range')}
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  border: reportType === 'custom-date-range' ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                  backgroundColor: reportType === 'custom-date-range' ? "#eff6ff" : "white",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px", color: "#111827" }}>
                  Custom Date Range Report
                </h3>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, lineHeight: "1.4" }}>
                  Create a report for any specific date range you choose
                </p>
              </div>
            </div>

            {/* Custom Date Range Picker */}
            {reportType === 'custom-date-range' && (
              <div style={{
                padding: "14px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                marginTop: "12px"
              }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px", color: "#111827" }}>
                  Select Date Range
                </h3>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px", color: "#374151" }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px", color: "#374151" }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reports Controls */}
          <div style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "20px"
          }}>
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
              {showReport ? 'Hide Report' : 'Generate Report'}
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
                <FaEnvelope className="button-icon" />
                Send Report
              </button>
            )}
          </div>
        </div>
      )}

      {/* Alerts Tab Content */}
      {activeTab === 'alerts' && (
        <RealtimeAlertsPanel
          title="Live Store Alerts"
          description="Real-time notifications for high-risk transactions detected in your assigned store."
          alerts={fraudAlerts}
          isConnected={isConnected}
          onClearAlerts={clearAlerts}
          onRemoveAlert={removeAlert}
          scopeLabel={storeDisplayLabel}
          emptyStateTitle="No alerts for your store yet"
          emptyStateDescription="Fraud alerts will appear here instantly when transactions in your store are flagged."
        />
      )}

      {/* Report View */}
      {showReport && (activeTab === 'dashboard' || activeTab === 'reports') && (
        <div ref={reportRef} className="report-view" style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          margin: '24px 0'
        }}>
          <StoreManagerReport
            data={{
              period: timeRange,
              fraudTrendData,
              transactionTypesData,
              stats,
              recentAlerts,
              reportType: activeTab === 'reports' ? reportType : 'monthly-summary',
              customDateRange
            }}
          />
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="email-modal-overlay">
          <div className="email-modal">
            <div className="email-modal-header">
              <h3>Send Report via Email</h3>
              <button className="close-button" onClick={toggleEmailModal}>
                ✕
              </button>
            </div>
            <div className="email-modal-body">
              {!emailSent ? (
                <>
                  <div className="form-group">
                    <label>Email Address: <span className="required">*</span></label>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="Enter recipient's email address"
                      className="email-input"
                      disabled={sendingEmail}
                      required
                    />
                  </div>
                  
                  {currentUser && (
                    <div className="user-info-notice">
                      <p>Report will be sent from: <strong>{currentUser.name}</strong> ({currentUser.role})</p>
                    </div>
                  )}
                  
                  {emailError && <p className="email-error">{emailError}</p>}
                  <button 
                    className="send-button"
                    onClick={handleSendReportEmail}
                    disabled={sendingEmail}
                  >
                    {sendingEmail ? 'Sending...' : 'Send Report'}
                  </button>
                </>
              ) : (
                <div className="success-message">
                  <p>Report sent successfully!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Flag Transaction Modal */}
      {showFlagModal && flaggingTransaction && (
        <div className="email-modal-overlay">
          <div className="email-modal">
            <div className="email-modal-header">
              <h3>Flag Transaction as Fraudulent</h3>
              <button className="close-button" onClick={handleCloseFlagModal}>
                ✕
              </button>
            </div>
            <div className="email-modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p><strong>Transaction:</strong> {flaggingTransaction.displayId}</p>
                <p><strong>Amount:</strong> {flaggingTransaction.amount}</p>
                <p><strong>Type:</strong> {flaggingTransaction.type}</p>
              </div>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Notes (Optional):
                </label>
                <textarea
                  value={flagNotes}
                  onChange={(e) => setFlagNotes(e.target.value)}
                  placeholder="Enter reason for flagging this transaction..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              {flagError && (
                <p className="email-error" style={{ color: '#ef4444', marginBottom: '16px' }}>
                  {flagError}
                </p>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="send-button"
                  onClick={handleSubmitFlag}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Flag as Fraudulent
                </button>
                <button 
                  onClick={handleCloseFlagModal}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManager;
