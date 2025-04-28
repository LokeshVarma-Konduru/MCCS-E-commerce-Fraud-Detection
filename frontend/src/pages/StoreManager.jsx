import React, { useState, useMemo, useEffect } from 'react';
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
import '../styles/StoreManager.css';
import '../styles/Report.css';
import { getStoreManagerStats, getFraudTrends, getTransactionTypeDistribution, getRecentAlerts } from '../api';
import StoreManagerReport from '../components/StoreManagerReport';
import Footer from '../components/Footer';

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('Last 30 days');
  const [transactionType, setTransactionType] = useState('All Transactions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReport, setShowReport] = useState(false);
  
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

  // Fetch stats data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const period = getPeriodFromTimeRange(timeRange);
        const response = await getStoreManagerStats(period, transactionType);
        
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
  }, [timeRange, transactionType]);

  // Fetch fraud trend data
  useEffect(() => {
    const fetchFraudTrends = async () => {
      try {
        const period = getPeriodFromTimeRange(timeRange);
        const response = await getFraudTrends(period, transactionType);
        
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
  }, [timeRange, transactionType]);

  // Fetch transaction type distribution data
  useEffect(() => {
    const fetchTransactionTypes = async () => {
      try {
        const period = getPeriodFromTimeRange(timeRange);
        const typeFilter = transactionTypeFilter !== 'All Types' ? transactionTypeFilter : null;
        const response = await getTransactionTypeDistribution(period, typeFilter);
        
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
  }, [timeRange, transactionTypeFilter]);

  // Fetch recent alerts
  useEffect(() => {
    const fetchRecentAlerts = async () => {
      try {
        setAlertsLoading(true);
        const response = await getRecentAlerts(5, transactionType);
        
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
  }, [transactionType]);

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
        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="filter-select"
            >
              <option>Last 24 h.</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="filter-group">
            <select 
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="filter-select"
            >
              <option>All Transactions</option>
              <option>Online</option>
              <option>In-store</option>
            </select>
          </div>
          <button className="export-btn" onClick={() => setShowReport(!showReport)}>
            {showReport ? 'Hide Report' : 'Generate Report'}
          </button>
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
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <div className="coming-soon-container">
          <div className="coming-soon-card">
            <h2>Reports Feature Coming Soon</h2>
            <p>In the future, you'll be able to view all past reports here, including:</p>
            <ul>
              <li>Monthly fraud detection summaries</li>
              <li>Transaction type analysis</li>
              <li>Risk assessment reports</li>
              <li>Custom date range reports</li>
            </ul>
            <p>Stay tuned for these exciting features!</p>
          </div>
        </div>
      )}

      {/* Alerts Tab Content */}
      {activeTab === 'alerts' && (
        <div className="coming-soon-container">
          <div className="coming-soon-card">
            <h2>Alerts Feature Coming Soon</h2>
            <p>Soon you'll be able to:</p>
            <ul>
              <li>Set up custom alert thresholds</li>
              <li>Receive notifications for high-risk transactions</li>
              <li>Configure alert delivery methods (email, SMS, in-app)</li>
              <li>Create alert rules based on transaction patterns</li>
            </ul>
            <p>We're working hard to bring you these capabilities!</p>
          </div>
        </div>
      )}

      {/* Report View */}
      {showReport && activeTab === 'dashboard' && (
        <div className="report-view" style={{ 
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
              recentAlerts
            }} 
          />
        </div>
      )}
      <Footer />
    </div>
  );
};

export default StoreManager;
