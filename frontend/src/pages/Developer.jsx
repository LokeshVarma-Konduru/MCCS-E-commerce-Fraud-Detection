import React, { useState, useEffect, useRef } from 'react';
import { FaChartPie, FaEnvelope } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import Report from '../components/Report';
import APIIntegration from './APIIntegration';
import ModelPerformance from './ModelPerformance';
import TransactionMonitoring from './TransactionMonitoring';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { getTransactions, getDashboardStats, getApiUsageStats, sendReportEmail, getRecentAlerts, updateTransactionStatus } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import RealtimeAlertsPanel from '../components/RealtimeAlertsPanel.jsx';
import FlaggedTransactionsPanel from '../components/FlaggedTransactionsPanel.jsx';
import '../styles/Developer.css';
import '../styles/Report.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Developer = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeScale, setTimeScale] = useState('24H');
  const [exportDateRange, setExportDateRange] = useState('last7days');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('7d');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  
  const { user } = useAuth();
  const { isConnected, fraudAlerts, removeAlert, clearAlerts } = useSocket();
  
  // Email report state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const reportRef = useRef(null);

  // Recent Alerts state
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Flag transaction modal state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flaggingTransaction, setFlaggingTransaction] = useState(null);
  const [flagNotes, setFlagNotes] = useState('');
  const [flagError, setFlagError] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [limit, setLimit] = useState(5);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',  // 'legitimate' or 'fraudulent'
    productCategory: '',
    paymentMethod: ''
  });
  
  // Stats state
  const [stats, setStats] = useState({
    totalTransactions: {
      value: 0,
      change: '0% from last month'
    },
    fraudDetectionRate: {
      value: '0%',
      change: '0% from last month'
    },
    apiResponseTime: {
      value: '0ms',
      change: '0ms from last month'
    }
  });
  
  const [statsPeriod, setStatsPeriod] = useState('7d'); // Changed to match report period options
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  
  // State for API Performance chart
  const [performanceData, setPerformanceData] = useState({
    '1H': { labels: [], data: [] },
    '24H': { labels: [], data: [] },
    '7D': { labels: [], data: [] }
  });
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  // Filter options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: '0', label: 'Legitimate' },
    { value: '1', label: 'Fraudulent' }
  ];
  
  const productCategoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'home & garden', label: 'Home & Garden' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'toys & games', label: 'Toys & Games' },
    { value: 'health & beauty', label: 'Health & Beauty' }
  ];
  
  const paymentMethodOptions = [
    { value: '', label: 'All Payment Methods' },
    { value: 'credit card', label: 'Credit Card' },
    { value: 'debit card', label: 'Debit Card' },
    { value: 'bank transfer', label: 'Bank Transfer' },
    { value: 'paypal', label: 'PayPal' }
  ];

  // Fetch real transaction data
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        
        // Prepare query parameters
        const queryParams = {
          page: currentPage,
          limit: limit,
          prediction: filters.status,
          productCategory: filters.productCategory,
          paymentMethod: filters.paymentMethod
        };
        
        // Remove empty filters
        Object.keys(queryParams).forEach(key => 
          !queryParams[key] && delete queryParams[key]
        );
        
        const response = await getTransactions(queryParams);
        
        if (response.data.success) {
          // Transform the data to match the expected format
          const formattedTransactions = response.data.transactions.map(transaction => ({
            id: transaction._id,
            amount: transaction.transactionAmount.toFixed(2),
            merchant: transaction.productCategory || 'Unknown',
            time: new Date(transaction.createdAt).toLocaleString(),
            status: transaction.predictions[0] === 0 ? 'Legitimate' : 'Fraudulent'
          }));
          
          setTransactions(formattedTransactions);
          
          // Update pagination state
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.pages);
            setTotalTransactions(response.data.pagination.total);
          }
        } else {
          setError('Failed to fetch transactions');
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Error fetching transactions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, limit, filters]);
  
  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setStatsLoading(true);
        // Map statsPeriod (24h, 7d, 30d) to getDashboardStats period (day, week, month)
        const periodMap = {
          '24h': 'day',
          '7d': 'week',
          '30d': 'month'
        };
        const apiPeriod = periodMap[statsPeriod] || 'week';
        const response = await getDashboardStats(apiPeriod);
        
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          setStatsError('Failed to fetch dashboard statistics');
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        
        // Handle authentication errors specifically
        if (err.response && err.response.status === 401) {
          setStatsError('Authentication required. Please log in to view dashboard statistics.');
        } else {
          setStatsError('Error fetching dashboard statistics');
        }
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [statsPeriod]);

  // Fetch API usage stats for the performance chart
  useEffect(() => {
    const fetchApiUsageStats = async () => {
      try {
        setChartLoading(true);
        setChartError(null);
        
        // Map timeScale to API period parameter
        const periodMap = {
          '1H': 'day',
          '24H': 'day',
          '7D': 'week'
        };
        
        const response = await getApiUsageStats(periodMap[timeScale]);
        
        if (response.data.success) {
          const { callsOverTime, averageResponseTime } = response.data.data;
          
          // Process data based on timeScale
          if (timeScale === '1H') {
            // For 1H, we need to simulate hourly data since we only have daily data
            // Create 60 minute intervals with slight variations around the average
            const hourlyData = {
              labels: Array.from({length: 60}, (_, i) => `${59-i}m`),
              data: Array.from({length: 60}, () => {
                // Add some random variation to the average response time
                return Math.max(10, Math.round(averageResponseTime * (0.9 + Math.random() * 0.2)));
              })
            };
            
            setPerformanceData(prev => ({
              ...prev,
              '1H': hourlyData
            }));
          } else if (timeScale === '24H') {
            // For 24H, create hourly data for the current day
            const hourlyData = {
              labels: Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`),
              data: Array.from({length: 24}, () => {
                // Add some random variation to the average response time
                return Math.max(10, Math.round(averageResponseTime * (0.9 + Math.random() * 0.2)));
              })
            };
            
            setPerformanceData(prev => ({
              ...prev,
              '24H': hourlyData
            }));
          } else if (timeScale === '7D') {
            // For 7D, use the actual daily data from callsOverTime
            // If we have less than 7 days of data, fill in the missing days
            const now = new Date();
            const last7Days = Array.from({length: 7}, (_, i) => {
              const date = new Date(now);
              date.setDate(date.getDate() - (6-i));
              return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            });
            
            // Create a map of dates to response times from the API data
            const responseTimeByDate = {};
            callsOverTime.forEach(item => {
              responseTimeByDate[item._id] = Math.max(10, Math.round(averageResponseTime));
            });
            
            // Create the data array with actual or estimated values
            const data = last7Days.map(date => {
              return responseTimeByDate[date] || Math.max(10, Math.round(averageResponseTime * (0.9 + Math.random() * 0.2)));
            });
            
            // Format the labels as day names
            const labels = last7Days.map(dateStr => {
              const date = new Date(dateStr);
              return date.toLocaleDateString('en-US', { weekday: 'short' });
            });
            
            setPerformanceData(prev => ({
              ...prev,
              '7D': { labels, data }
            }));
          }
        } else {
          setChartError('Failed to fetch API usage statistics');
        }
      } catch (err) {
        console.error('Error fetching API usage stats:', err);
        
        // Handle authentication errors specifically
        if (err.response && err.response.status === 401) {
          setChartError('Authentication required. Please log in to view API performance.');
        } else {
          setChartError('Error fetching API performance data');
        }
      } finally {
        setChartLoading(false);
      }
    };
    
    fetchApiUsageStats();
  }, [timeScale]);

  // Fetch recent alerts
  useEffect(() => {
    const fetchRecentAlerts = async () => {
      try {
        setAlertsLoading(true);
        const response = await getRecentAlerts(5, 'All Transactions', {});

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
  }, []);

  const chartData = {
    labels: performanceData[timeScale].labels,
    datasets: [
      {
        label: 'Response Time (ms)',
        data: performanceData[timeScale].data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
          color: '#7f8c8d'
        }
      },
      y: {
        beginAtZero: false,
        min: Math.min(...performanceData[timeScale].data) - 5,
        max: Math.max(...performanceData[timeScale].data) + 5,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#7f8c8d'
        }
      }
    }
  };

  const recentLogs = [
    {
      type: 'success',
      title: 'API Request Successful',
      subtitle: 'Response time: 235ms',
      time: '1 minute ago',
      icon: '✓'
    },
    {
      type: 'info',
      title: 'Model Performance Update',
      subtitle: 'Accuracy improved by 1.2%',
      time: '1 hour ago',
      icon: 'ℹ'
    }
  ];

  // Helper function to calculate date range from period
  const getDateRange = (period) => {
    const now = new Date();
    const endDate = new Date(now);
    
    let startDate = new Date(now);
    
    switch(period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        // For 24h, endDate is current time
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }
    
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  // Helper function to group transactions by time buckets
  const groupTransactionsByTime = (transactions, period) => {
    const groups = {};
    
    transactions.forEach(txn => {
      const date = new Date(txn.createdAt);
      let key;
      
      if (period === '24h') {
        // Group by hour
        key = date.getHours();
      } else if (period === '7d') {
        // Group by day of week (0 = Sunday, 1 = Monday, etc.)
        key = date.getDay();
      } else {
        // Group by day of month for 30d
        key = date.getDate();
      }
      
      if (!groups[key]) {
        groups[key] = 0;
      }
      groups[key]++;
    });
    
    return groups;
  };

  // Helper function to generate timeline labels
  const getTimelineLabels = (period) => {
    if (period === '24h') {
      return ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM', '11 PM'];
    } else if (period === '7d') {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    } else {
      // For 30d, generate day labels
      const labels = [];
      const today = new Date();
      for (let i = 29; i >= 0; i -= 4) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
      }
      return labels;
    }
  };

  // Helper function to generate timeline data array
  const getTimelineData = (groups, period) => {
    if (period === '24h') {
      // Return hourly data (24 hours) - but Report component expects sampled data
      // The Report component will handle the full 24h display internally
      const data = Array(24).fill(0);
      Object.keys(groups).forEach(hour => {
        data[parseInt(hour)] = groups[hour];
      });
      // Return sampled hours for display (matches Report component expectation)
      return [data[0], data[4], data[8], data[12], data[16], data[20], data[23]];
    } else if (period === '7d') {
      // Return daily data (7 days) - map day of week to array index
      const data = Array(7).fill(0);
      Object.keys(groups).forEach(day => {
        const dayIndex = parseInt(day);
        // Map Sunday (0) to index 0, Monday (1) to index 1, etc.
        data[dayIndex] = groups[day];
      });
      return data;
    } else {
      // For 30d, return daily data sampled (8 data points for 30 days)
      const data = [];
      const today = new Date();
      for (let i = 29; i >= 0; i -= 4) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayKey = date.getDate();
        data.push(groups[dayKey] || 0);
      }
      return data;
    }
  };

  // Fetch and calculate report data
  useEffect(() => {
    const fetchReportData = async () => {
      if (!showReport) return; // Only fetch when report is visible
      
      setReportLoading(true);
      try {
        // Calculate date range
        const { startDate, endDate } = getDateRange(reportPeriod);
        
        // Fetch all transactions for the period
        const transactionsResponse = await getTransactions({
          startDate,
          endDate,
          limit: 9999 // Get all transactions
        });
        
        // Fetch dashboard stats for avgResponseTime
        const periodMap = {
          '24h': 'day',
          '7d': 'week',
          '30d': 'month'
        };
        const statsResponse = await getDashboardStats(periodMap[reportPeriod] || 'week');
        
        if (transactionsResponse.data.success && statsResponse.data.success) {
          const allTransactions = transactionsResponse.data.transactions || [];
          
          // Calculate metrics
          const total = allTransactions.length;
          const legitimate = allTransactions.filter(t => t.predictions && t.predictions[0] === 0).length;
          const fraudulent = allTransactions.filter(t => t.predictions && t.predictions[0] === 1).length;
          const suspicious = allTransactions.filter(t => t.status === 'under_review').length;
          const detectionRate = total > 0 ? ((legitimate / total) * 100).toFixed(1) : 0;
          
          // Calculate average transaction value
          const totalAmount = allTransactions.reduce((sum, t) => sum + (t.transactionAmount || 0), 0);
          const avgTransactionValue = total > 0 ? (totalAmount / total).toFixed(2) : 0;
          
          // Get avgResponseTime from stats
          const avgResponseTimeStr = statsResponse.data.data?.apiResponseTime?.value || '0ms';
          const avgResponseTime = parseInt(avgResponseTimeStr.replace('ms', '')) || 0;
          
          // Group transactions by merchant category
          const categoryGroups = {};
          allTransactions.forEach(txn => {
            const category = txn.productCategory || 'Unknown';
            // Map product categories to display names
            const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);
            if (!categoryGroups[displayCategory]) {
              categoryGroups[displayCategory] = 0;
            }
            categoryGroups[displayCategory]++;
          });
          
          // Group transactions by time for timeline
          const timeGroups = groupTransactionsByTime(allTransactions, reportPeriod);
          const timelineLabels = getTimelineLabels(reportPeriod);
          const timelineData = getTimelineData(timeGroups, reportPeriod);
          
          // Calculate financial impact (for 30d only)
          let financialImpact = {
            preventedLoss: 0,
            operationalSavings: 0,
            roi: 0
          };
          
          if (reportPeriod === '30d') {
            const fraudulentAmount = allTransactions
              .filter(t => t.predictions && t.predictions[0] === 1)
              .reduce((sum, t) => sum + (t.transactionAmount || 0), 0);
            
            financialImpact = {
              preventedLoss: parseFloat(fraudulentAmount.toFixed(2)),
              operationalSavings: parseFloat((fraudulentAmount * 0.4).toFixed(2)), // Estimate 40% savings
              roi: fraudulent > 0 ? Math.round((fraudulentAmount / fraudulent) * 100) : 0
            };
          }
          
          // Calculate risk score based on fraud rate
          const fraudRate = total > 0 ? (fraudulent / total) * 100 : 0;
          let riskScore = 50; // Base score
          if (fraudRate > 5) riskScore = 85; // High risk
          else if (fraudRate > 2) riskScore = 65; // Medium risk
          else if (fraudRate > 0.5) riskScore = 45; // Low-medium risk
          else riskScore = 25; // Low risk
          
          // Build report data
          const calculatedReportData = {
            period: reportPeriod,
            timeline: {
              labels: timelineLabels,
              transactions: timelineData
            },
            metrics: {
              total: total,
              legitimate: legitimate,
              fraudulent: fraudulent,
              suspicious: suspicious,
              detectionRate: parseFloat(detectionRate),
              avgResponseTime: avgResponseTime,
              avgTransactionValue: parseFloat(avgTransactionValue)
            },
            merchantCategories: categoryGroups,
            insights: {
              fraudPatterns: `Analysis of ${total} transactions shows ${fraudulent} fraudulent transactions detected (${((fraudulent/total)*100).toFixed(2)}% fraud rate). The system successfully identified and prevented potential losses.`,
              riskAssessment: `Current risk level is ${fraudRate > 5 ? 'HIGH' : fraudRate > 2 ? 'MODERATE' : 'LOW'}. Key factors include transaction volume and fraud detection patterns.`,
              recommendations: `Continue monitoring transaction patterns. ${fraudulent > 0 ? 'Review flagged transactions to improve detection accuracy.' : 'System is performing well with current detection rules.'}`,
              riskScore: riskScore
            },
            anomalies: [
              {
                id: 'A001',
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                description: `Total of ${fraudulent} fraudulent transactions detected in the selected period`,
                severity: fraudulent > 10 ? 'high' : fraudulent > 5 ? 'medium' : 'low'
              },
              {
                id: 'A002',
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                description: `${suspicious} transactions currently under review`,
                severity: suspicious > 5 ? 'medium' : 'low'
              }
            ],
            financialImpact: financialImpact
          };
          
          setReportData(calculatedReportData);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
        // Fallback to default data on error
        setReportData({
          period: reportPeriod,
          timeline: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            transactions: [0, 0, 0, 0, 0, 0, 0]
          },
          metrics: {
            total: 0,
            legitimate: 0,
            fraudulent: 0,
            suspicious: 0,
            detectionRate: 0,
            avgResponseTime: 0,
            avgTransactionValue: 0
          },
          merchantCategories: {},
          insights: {
            fraudPatterns: 'Unable to fetch transaction data. Please try again.',
            riskAssessment: 'Data unavailable',
            recommendations: 'Please refresh and try again.',
            riskScore: 50
          },
          anomalies: [],
          financialImpact: {
            preventedLoss: 0,
            operationalSavings: 0,
            roi: 0
          }
        });
      } finally {
        setReportLoading(false);
      }
    };

    fetchReportData();
  }, [reportPeriod, showReport]);

  // Default report data (used when report is not shown or loading)
  const defaultReportData = {
    period: reportPeriod,
    timeline: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      transactions: [0, 0, 0, 0, 0, 0, 0]
    },
    metrics: {
      total: 0,
      legitimate: 0,
      fraudulent: 0,
      suspicious: 0,
      detectionRate: 0,
      avgResponseTime: 0,
      avgTransactionValue: 0
    },
    merchantCategories: {},
    insights: {
      fraudPatterns: 'Loading report data...',
      riskAssessment: 'Calculating...',
      recommendations: 'Please wait...',
      riskScore: 50
    },
    anomalies: [],
    financialImpact: {
      preventedLoss: 0,
      operationalSavings: 0,
      roi: 0
    }
  };

  // Use calculated report data or default
  const reportDataToUse = reportData || defaultReportData;

  const toggleReport = () => {
    setShowReport(!showReport);
  };

  const getPeriodLabel = (period) => {
    switch(period) {
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      default: return 'Custom Period';
    }
  };
  
  // Function to convert HTML report to PDF and get base64 data
  const getReportPdfData = async () => {
    if (!reportRef.current) return null;
    
    try {
      // Use html2canvas and jsPDF to convert the report to PDF
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      // Capture the entire report as a single image - using the same approach as the download function
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
        
        // Reduce quality further if needed
        // This is handled in the getReportPdfData function now
      }
      
      // Create a more professional email message
      const periodLabel = getPeriodLabel(reportPeriod);
      const emailSubject = `MCCS Fraud Detection Report - ${periodLabel}`;
      
      // Create a more professional message
      let emailMessage = `This report contains fraud detection metrics and insights for ${periodLabel}.`;
      
      // Use the current user's information automatically
      let userName = '';
      let userRole = '';
      
      if (user) {
        userName = user.name || '';
        userRole = user.role || '';
      }
      
      // Send email with PDF attachment including current user's information
      const response = await sendReportEmail(
        emailAddress,
        emailSubject,
        emailMessage,
        pdfData,
        `fraud-detection-report-${reportPeriod}.pdf`,
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
  
  // Function to toggle email modal
  const toggleEmailModal = () => {
    setShowEmailModal(!showEmailModal);
    setEmailError(null);
    setEmailSent(false);
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
        flagNotes || 'Manually flagged as fraudulent by developer'
      );

      if (response.data.success) {
        setShowFlagModal(false);
        setFlaggingTransaction(null);
        setFlagNotes('');

        // Refresh recent alerts
        const alertsResponse = await getRecentAlerts(5, 'All Transactions', {});
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
            fontWeight: activeTab === 'api' ? '600' : '500',
            color: activeTab === 'api' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'api' ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onClick={() => setActiveTab('api')}
          onMouseEnter={(e) => {
            if (activeTab !== 'api') {
              e.target.style.color = '#1e293b';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'api') {
              e.target.style.color = '#64748b';
            }
          }}
        >
          API Integration
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
            fontWeight: activeTab === 'models' ? '600' : '500',
            color: activeTab === 'models' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'models' ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onClick={() => setActiveTab('models')}
          onMouseEnter={(e) => {
            if (activeTab !== 'models') {
              e.target.style.color = '#1e293b';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'models') {
              e.target.style.color = '#64748b';
            }
          }}
        >
          Model Performance
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
            fontWeight: activeTab === 'transactions' ? '600' : '500',
            color: activeTab === 'transactions' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'transactions' ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onClick={() => setActiveTab('transactions')}
          onMouseEnter={(e) => {
            if (activeTab !== 'transactions') {
              e.target.style.color = '#1e293b';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'transactions') {
              e.target.style.color = '#64748b';
            }
          }}
        >
          Transaction Monitoring
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' ? (
        <>
          {/* Period Filter for Stats */}
          <div className="mb-4 flex justify-end">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={statsPeriod}
                onChange={(e) => setStatsPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                style={{ minWidth: '150px' }}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Total Transactions</h3>
            {statsLoading && <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
          </div>
          {statsError ? (
            <div className="text-red-500 text-sm">Error loading data</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.totalTransactions.value.toLocaleString()}
              </div>
              <div className={`text-sm font-medium ${stats.totalTransactions.change.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stats.totalTransactions.change}
              </div>
            </>
          )}
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Fraud Detection Rate</h3>
            {statsLoading && <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
          </div>
          {statsError ? (
            <div className="text-red-500 text-sm">Error loading data</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.fraudDetectionRate.value}
              </div>
              <div className={`text-sm font-medium ${stats.fraudDetectionRate.change.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stats.fraudDetectionRate.change}
              </div>
            </>
          )}
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">API Response Time</h3>
            {statsLoading && <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
          </div>
          {statsError ? (
            <div className="text-red-500 text-sm">Error loading data</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.apiResponseTime.value}
              </div>
              <div className={`text-sm font-medium ${stats.apiResponseTime.change.includes('-') ? 'text-green-600' : 'text-red-600'}`}>
                {stats.apiResponseTime.change}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">API Performance</h3>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeScale === '1H' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setTimeScale('1H')}
            >
              1H
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeScale === '24H' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setTimeScale('24H')}
            >
              24H
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeScale === '7D' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setTimeScale('7D')}
            >
              7D
            </button>
          </div>
        </div>
        <div className="h-80">
          {chartLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">Loading chart...</div>
          ) : chartError ? (
            <div className="flex items-center justify-center h-full text-red-500">Error: {chartError}</div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          
          {/* Filter controls */}
          <div className="flex flex-wrap gap-3">
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
            </select>
            
            <select 
              value={filters.productCategory}
              onChange={(e) => setFilters({...filters, productCategory: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                  {productCategoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
            </select>
            
            <select 
              value={filters.paymentMethod}
              onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                  {paymentMethodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">Loading transactions...</div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-500">Error: {error}</div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">No transactions found</div>
          ) : (
              <>
                {transactions.map((transaction, index) => (
                  <div key={transaction.id || index} className="transaction-item">
                    <div className="transaction-id">{transaction.id}</div>
                    <div className="transaction-merchant">{transaction.merchant}</div>
                    <div className="transaction-time">{transaction.time}</div>
                    <div className="transaction-amount">${transaction.amount}</div>
                    <div className={`transaction-status ${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </div>
                  </div>
                ))}
                
                {/* Pagination controls */}
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {transactions.length} of {totalTransactions} transactions
                  </div>
                  <div className="pagination-buttons">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="pagination-button"
                    >
                      Previous
                    </button>
                    <span className="page-indicator">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="pagination-button"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>

          {/* Remaining sections wrapper */}
          <div>
        {/* Recent Alerts Table */}
        <div className="bg-white rounded-lg p-6 shadow-md" style={{ marginTop: "24px" }}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Alerts</h3>
          {alertsLoading ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Loading alerts...</div>
            ) : recentAlerts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>No recent alerts found</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Time</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Transaction ID</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Type</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Amount</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Risk Score</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAlerts.map((alert, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#374151" }}>{alert.time}</td>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>{alert.transactionId}</td>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#374151" }}>{alert.type}</td>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#374151" }}>{alert.amount}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor: alert.riskScore.toLowerCase() === 'high' ? '#fee2e2' : alert.riskScore.toLowerCase() === 'medium' ? '#fef3c7' : '#d1fae5',
                            color: alert.riskScore.toLowerCase() === 'high' ? '#991b1b' : alert.riskScore.toLowerCase() === 'medium' ? '#92400e' : '#065f46'
                          }}>
                            {alert.riskScore}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#374151" }}>{alert.status}</td>
                        <td style={{ padding: "12px" }}>
                          {alert.status !== 'Flagged' && alert.status !== 'Under Review' ? (
                            <button
                              onClick={() => handleFlagTransaction(alert)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "500",
                                transition: "background-color 0.2s"
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = "#dc2626"}
                              onMouseLeave={(e) => e.target.style.backgroundColor = "#ef4444"}
                            >
                              Flag as Fraud
                            </button>
                          ) : (
                            <span style={{ color: "#6b7280", fontSize: "12px" }}>Already flagged</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        <FlaggedTransactionsPanel showStoreFilter pageSize={8} className="developer-flagged-panel" />

        {/* 🚨 Fraud Alerts Section */}
        <RealtimeAlertsPanel
          title="Real-Time Fraud Alerts"
          description="Live stream of high-risk transactions detected across the platform."
          alerts={fraudAlerts}
          isConnected={isConnected}
          onClearAlerts={clearAlerts}
          onRemoveAlert={removeAlert}
          scopeLabel="All stores"
        />

        {/* Recent Logs */}
        <div className="logs-section">
          <div className="section-header">
            <h3>Recent Logs</h3>
          </div>
          <div className="logs-list">
            {recentLogs.map((log, index) => (
              <div key={index} className={`log-item ${log.type.toLowerCase()}`}>
                <div className="log-icon">{log.icon}</div>
                <div className="log-content">
                  <div className="log-title">{log.title}</div>
                  <div className="log-subtitle">{log.subtitle}</div>
                </div>
                <div className="log-time">{log.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Generation */}
        <div className="bg-white rounded-lg p-6 shadow-md report-generation-section">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Reports</h3>
            <div className="report-controls">
              <div className="control-group">
                <label>Report Period:</label>
                <select 
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="select-input"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
              <div className="report-buttons">
                <button 
                  className="generate-report-button"
                  onClick={toggleReport}
                >
                  <FaChartPie className="button-icon" />
                  {showReport ? 'Hide Report' : 'Generate Report'}
                </button>
                {showReport && (
                  <button 
                    className="send-report-button"
                    onClick={toggleEmailModal}
                  >
                    <FaEnvelope className="button-icon" />
                    Send Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Report View */}
        {showReport && (
          <div className="report-view" style={{ 
            background: 'white', 
            padding: '32px', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            margin: '24px 0'
          }}>
            {reportLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ marginBottom: '16px' }}>Loading report data...</div>
                <div className="animate-spin" style={{ 
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%'
                }}></div>
              </div>
            ) : (
              <div ref={reportRef}>
                <Report 
                  data={reportDataToUse} 
                />
              </div>
            )}
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
                    
                    {user && (
                      <div className="user-info-notice">
                        <p>Report will be sent from: <strong>{user.name}</strong> ({user.role})</p>
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
          <div
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
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                minWidth: "400px",
                maxWidth: "500px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px"
                }}
              >
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>Flag Transaction as Fraudulent</h3>
                <button
                  onClick={handleCloseFlagModal}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#6b7280",
                    padding: 0
                  }}
                >
                  ✕
                </button>
              </div>
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ margin: "8px 0" }}><strong>Transaction:</strong> {flaggingTransaction.displayId}</p>
                  <p style={{ margin: "8px 0" }}><strong>Amount:</strong> {flaggingTransaction.amount}</p>
                  <p style={{ margin: "8px 0" }}><strong>Type:</strong> {flaggingTransaction.type}</p>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Notes (Optional):
                  </label>
                  <textarea
                    value={flagNotes}
                    onChange={(e) => setFlagNotes(e.target.value)}
                    placeholder="Enter reason for flagging this transaction..."
                    rows="4"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                {flagError && (
                  <p style={{ color: "#ef4444", marginBottom: "16px", fontSize: "14px" }}>
                    {flagError}
                  </p>
                )}

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={handleSubmitFlag}
                    style={{
                      flex: 1,
                      padding: "10px 20px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#dc2626"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#ef4444"}
                  >
                    Flag as Fraudulent
                  </button>
                  <button
                    onClick={handleCloseFlagModal}
                    style={{
                      flex: 1,
                      padding: "10px 20px",
                      backgroundColor: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#4b5563"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#6b7280"}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      ) : activeTab === 'api' ? (
        <APIIntegration embedded={true} />
      ) : activeTab === 'models' ? (
        <ModelPerformance embedded={true} />
      ) : activeTab === 'transactions' ? (
        <TransactionMonitoring embedded={true} />
      ) : null}
    </div>
  );
};

export default Developer;

