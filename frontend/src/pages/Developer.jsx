import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCode, FaChartLine, FaExchangeAlt, FaChartPie } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import Report from '../components/Report';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { getTransactions, getDashboardStats, getApiUsageStats } from '../api';
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
  const [timeScale, setTimeScale] = useState('24H');
  const [exportDateRange, setExportDateRange] = useState('last7days');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('7d');

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
  
  const [statsPeriod, setStatsPeriod] = useState('month');
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
        const response = await getDashboardStats(statsPeriod);
        
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

  const chartData = {
    labels: performanceData[timeScale].labels,
    datasets: [
      {
        label: 'Response Time (ms)',
        data: performanceData[timeScale].data,
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
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

  const reportData = {
    period: reportPeriod,
    timeline: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      transactions: [245, 312, 287, 342, 398, 456, 321]
    },
    metrics: {
      total: 2361,
      legitimate: 2298,
      fraudulent: 42,
      suspicious: 21,
      detectionRate: 97.5,
      avgResponseTime: 185,
      avgTransactionValue: 68.75
    },
    merchantCategories: {
      'Exchange': 1250,
      'Commissary': 580,
      'Food & Hospitality': 320,
      'Recreation': 150,
      'Marine Mart': 61
    },
    insights: {
      fraudPatterns: 'Recent analysis shows an increase in fraud attempts targeting PX/Exchange online purchases. Most attempts occur during deployment cycles and involve gift card purchases.',
      riskAssessment: 'Current risk level is LOW to MODERATE. Key factors include increased online transaction volume at Camp Lejeune and Camp Pendleton locations.',
      recommendations: 'Implement additional verification for gift card purchases over $100. Consider enhanced monitoring during PCS season when transaction patterns change significantly.',
      riskScore: 72
    },
    anomalies: [
      {
        id: 'A001',
        time: '08:45 AM',
        description: 'Unusual transaction pattern detected at Camp Pendleton Exchange',
        severity: 'medium'
      },
      {
        id: 'A002',
        time: '11:23 AM',
        description: 'Multiple failed authentication attempts at Commissary online store',
        severity: 'high'
      },
      {
        id: 'A003',
        time: '02:17 PM',
        description: 'Suspicious gift card purchases at Marine Mart',
        severity: 'medium'
      }
    ],
    financialImpact: {
      preventedLoss: 2887.50,
      operationalSavings: 1250.00,
      roi: 327
    }
  };

  const toggleReport = () => {
    setShowReport(!showReport);
  };

  const getPeriodLabel = (period) => {
    const labels = {
      'last24h': 'Last 24 Hours',
      'last7days': 'Last 7 Days',
      'last30days': 'Last 30 Days'
    };
    return labels[period] || period;
  };

  return (
    <div className="developer-container">
      <div className="top-navigation">
        <nav className="nav-menu">
          <Link to="/developer" className="nav-item">
            <FaHome className="nav-icon" />
            <span>Dashboard</span>
          </Link>
          <Link to="/api-integration" className="nav-item">
            <FaCode className="nav-icon" />
            <span>API Integration</span>
          </Link>
          <Link to="/model-performance" className="nav-item">
            <FaChartLine className="nav-icon" />
            <span>Model Performance</span>
          </Link>
          <Link to="/transaction-monitoring" className="nav-item">
            <FaExchangeAlt className="nav-icon" />
            <span>Transaction Monitoring</span>
          </Link>
        </nav>
      </div>
      
      <div className="main-content">
        <PageHeader title="Developer Dashboard" />
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <h3>Total Transactions</h3>
              {statsLoading && <div className="stat-loading-indicator"></div>}
            </div>
            {statsError ? (
              <div className="stat-error">Error loading data</div>
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
            <div className="stat-header">
              <h3>Fraud Detection Rate</h3>
              {statsLoading && <div className="stat-loading-indicator"></div>}
            </div>
            {statsError ? (
              <div className="stat-error">Error loading data</div>
            ) : (
              <>
                <div className="stat-value">
                  {stats.fraudDetectionRate.value}
                </div>
                <div className={`stat-change ${stats.fraudDetectionRate.change.includes('+') ? 'positive' : 'negative'}`}>
                  {stats.fraudDetectionRate.change}
                </div>
              </>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <h3>API Response Time</h3>
              {statsLoading && <div className="stat-loading-indicator"></div>}
            </div>
            {statsError ? (
              <div className="stat-error">Error loading data</div>
            ) : (
              <>
                <div className="stat-value">
                  {stats.apiResponseTime.value}
                </div>
                <div className={`stat-change ${stats.apiResponseTime.change.includes('-') ? 'positive' : 'negative'}`}>
                  {stats.apiResponseTime.change}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart Section */}
        <div className="chart-section">
          <div className="chart-header">
            <h3>API Performance</h3>
            <div className="time-scale-buttons">
              <button
                className={timeScale === '1H' ? 'active' : ''}
                onClick={() => setTimeScale('1H')}
              >
                1H
              </button>
              <button
                className={timeScale === '24H' ? 'active' : ''}
                onClick={() => setTimeScale('24H')}
              >
                24H
              </button>
              <button
                className={timeScale === '7D' ? 'active' : ''}
                onClick={() => setTimeScale('7D')}
              >
                7D
              </button>
            </div>
          </div>
          <div className="chart-container">
            {chartLoading ? (
              <div className="loading-indicator">Loading chart...</div>
            ) : chartError ? (
              <div className="error-message">Error: {chartError}</div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="transactions-section">
          <div className="section-header">
            <h3>Recent Transactions</h3>
            
            {/* Filter controls */}
            <div className="transaction-filters">
              <div className="filter-group">
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="filter-select"
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
                  className="filter-select"
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
                  className="filter-select"
                >
                  {paymentMethodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="transactions-list">
            {isLoading ? (
              <div className="loading-indicator">Loading transactions...</div>
            ) : error ? (
              <div className="error-message">Error: {error}</div>
            ) : transactions.length === 0 ? (
              <div className="no-data-message">No transactions found</div>
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
        <div className="card report-generation-section">
          <div className="card-header">
            <h3>Generate Reports</h3>
          </div>
          <div className="card-body">
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
              <button 
                className="generate-report-button"
                onClick={toggleReport}
              >
                <FaChartPie className="button-icon" />
                {showReport ? 'Hide Report' : 'Generate Report'}
              </button>
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
            <Report 
              data={reportData} 
            />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Developer;