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
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
  const chartOptions = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: isDesktop,
          position: isMobile ? 'bottom' : 'top',
          labels: {
            font: { size: isMobile ? 10 : 12 },
            padding: isMobile ? 8 : 12
          }
        },
        tooltip: {
          enabled: true,
          titleFont: { size: isMobile ? 11 : 14 },
          bodyFont: { size: isMobile ? 10 : 13 },
          padding: isMobile ? 8 : 12
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: isMobile ? 45 : 0,
            minRotation: isMobile ? 45 : 0,
            font: { size: isMobile ? 9 : 12 },
            callback: function(value, index) {
              if (isMobile && index % 2 !== 0) return '';
              return this.getLabelForValue(value);
            }
          },
          grid: { display: isDesktop }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => value + '%',
            font: { size: isMobile ? 9 : 12 }
          },
          grid: { lineWidth: isMobile ? 0.5 : 1 }
        }
      },
      animation: false,
      transitions: {
        active: { animation: { duration: 0 } }
      },
      elements: {
        line: {
          tension: 0.4,
          borderWidth: isMobile ? 1.5 : 2
        },
        point: {
          radius: isMobile ? 2 : 4,
          hitRadius: isMobile ? 8 : 10
        }
      },
      hover: { animationDuration: 0 },
      responsiveAnimationDuration: 0
    };
  }, []);

  // Memoize transaction types chart options
  const transactionTypesOptions = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: isDesktop,
          position: isMobile ? 'bottom' : 'top',
          labels: {
            usePointStyle: true,
            padding: isMobile ? 8 : 20,
            font: { size: isMobile ? 10 : 12 },
            boxWidth: isMobile ? 10 : 15
          }
        },
        tooltip: {
          enabled: true,
          titleFont: { size: isMobile ? 11 : 14 },
          bodyFont: { size: isMobile ? 10 : 13 }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: isMobile ? 9 : 12 },
            maxRotation: isMobile ? 45 : 0,
            minRotation: isMobile ? 45 : 0
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            drawBorder: false,
            lineWidth: isMobile ? 0.5 : 1
          },
          ticks: {
            precision: 0,
            font: { size: isMobile ? 9 : 12 }
          }
        }
      },
      animation: false,
      barPercentage: isMobile ? 0.6 : 0.7,
      categoryPercentage: isMobile ? 0.5 : 0.6
    };
  }, []);

  return (
    <div className="w-full px-6 sm:px-8 lg:px-12 py-4" style={{ marginTop: '80px', position: 'relative', zIndex: 1 }}>
      {/* Navigation Tabs */}
      <div 
        className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide"
        style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px', 
          overflowX: 'auto',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0'
        }}
      >
        <button 
          className={`px-4 py-2 whitespace-nowrap transition-all flex-shrink-0`}
          style={{
            padding: '12px 20px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'dashboard' ? '600' : '500',
            color: activeTab === 'dashboard' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'dashboard' ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onClick={() => setActiveTab('dashboard')}
          onMouseEnter={(e) => {
            if (activeTab !== 'dashboard') {
              e.target.style.color = '#1e293b';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'dashboard') {
              e.target.style.color = '#64748b';
            }
          }}
        >
          Dashboard
        </button>
        <button 
          className={`px-4 py-2 whitespace-nowrap transition-all flex-shrink-0`}
          style={{
            padding: '12px 20px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'reports' ? '600' : '500',
            color: activeTab === 'reports' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'reports' ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onClick={() => setActiveTab('reports')}
          onMouseEnter={(e) => {
            if (activeTab !== 'reports') {
              e.target.style.color = '#1e293b';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'reports') {
              e.target.style.color = '#64748b';
            }
          }}
        >
          Reports
        </button>
        <button 
          className={`px-4 py-2 whitespace-nowrap transition-all flex-shrink-0`}
          style={{
            padding: '12px 20px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'alerts' ? '600' : '500',
            color: activeTab === 'alerts' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'alerts' ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onClick={() => setActiveTab('alerts')}
          onMouseEnter={(e) => {
            if (activeTab !== 'alerts') {
              e.target.style.color = '#1e293b';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'alerts') {
              e.target.style.color = '#64748b';
            }
          }}
        >
          Alerts
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <>
        {/* Dashboard Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-sm font-medium whitespace-nowrap text-gray-700">Time Range:</label>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option>Last 24 h.</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-sm font-medium whitespace-nowrap text-gray-700">Transaction Type:</label>
              <select 
                value={transactionType} 
                onChange={(e) => setTransactionType(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option>All Transactions</option>
                <option>Online</option>
                <option>In-store</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              onClick={handleGenerateReport}
            >
              {showReport ? 'Hide Report' : 'Generate Report'}
            </button>
            {showReport && (
              <button 
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                onClick={toggleEmailModal}
              >
                <FaEnvelope className="w-4 h-4" />
                Send Report
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2 truncate" title="TOTAL TRANSACTIONS">Total Transactions</h3>
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.totalTransactions.value.toLocaleString()}
                </div>
                <div className={`text-sm font-medium ${stats.totalTransactions.change.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.totalTransactions.change}
                </div>
              </>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2 truncate" title="FRAUD RATE">Fraud Rate</h3>
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.fraudRate.value}
                </div>
                <div className={`text-sm font-medium ${stats.fraudRate.change.includes('+') ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.fraudRate.change}
                </div>
              </>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2 truncate" title="FINANCIAL IMPACT">Financial Impact</h3>
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.financialImpact.value}
                </div>
                <div className={`text-sm font-medium ${stats.financialImpact.change.includes('+') ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.financialImpact.change}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-sm p-4 lg:p-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900 truncate" title="Fraud Detection Trend">Fraud Detection Trend</h3>
              <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className="w-full aspect-[16/10] lg:h-[320px] lg:aspect-auto min-w-0">
              <Line data={fraudTrendData} options={chartOptions} />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-sm p-4 lg:p-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900 truncate" title="Transaction Types">Transaction Types</h3>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
              >
                <option>All Types</option>
                <option>Online</option>
                <option>In-store</option>
              </select>
            </div>
            <div className="w-full aspect-[16/10] lg:h-[320px] lg:aspect-auto min-w-0">
              <Bar data={transactionTypesData} options={transactionTypesOptions} />
            </div>
          </div>
        </div>

        {/* Recent Alerts Table */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 truncate" title="Recent Alerts">Recent Alerts</h3>
          {alertsLoading ? (
            <div className="text-sm text-gray-500">Loading alerts...</div>
          ) : recentAlerts.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">No recent alerts found</div>
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
                          className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
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
      </>
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Header Section */}
          {!showReport && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h2 className="text-xl font-semibold text-blue-500 mb-2">
                Generate Your Report
              </h2>
              <p className="text-sm text-gray-600">
                Select a report type below and click "Generate Report" to create a comprehensive fraud detection report for your store.
              </p>
            </div>
          )}

          {/* Report Type Selection */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Report Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setReportType('monthly-summary')}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  reportType === 'monthly-summary' 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border-2 border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                  Monthly Fraud Detection Summary
                </h3>
                <p className="text-sm text-gray-600 leading-snug">
                  Comprehensive monthly overview of fraud detection metrics and trends
                </p>
              </div>

              <div
                onClick={() => setReportType('transaction-analysis')}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  reportType === 'transaction-analysis' 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border-2 border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                  Transaction Type Analysis
                </h3>
                <p className="text-sm text-gray-600 leading-snug">
                  Detailed breakdown of transactions by type (online vs in-store)
                </p>
              </div>

              <div
                onClick={() => setReportType('risk-assessment')}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  reportType === 'risk-assessment' 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border-2 border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                  Risk Assessment Report
                </h3>
                <p className="text-sm text-gray-600 leading-snug">
                  Risk score distribution and high-risk transaction analysis
                </p>
              </div>

              <div
                onClick={() => setReportType('custom-date-range')}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  reportType === 'custom-date-range' 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border-2 border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                  Custom Date Range Report
                </h3>
                <p className="text-sm text-gray-600 leading-snug">
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              onClick={handleGenerateReport}
            >
              {showReport ? 'Hide Report' : 'Generate Report'}
            </button>
            {showReport && (
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                onClick={toggleEmailModal}
              >
                <FaEnvelope />
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
                    className="w-full px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              
              <div className="flex gap-3">
                <button 
                  className="flex-1 px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  onClick={handleSubmitFlag}
                >
                  Flag as Fraudulent
                </button>
                <button 
                  className="flex-1 px-4 py-2 text-sm font-medium bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  onClick={handleCloseFlagModal}
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
