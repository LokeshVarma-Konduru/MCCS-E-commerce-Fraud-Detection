import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCode, FaChartLine, FaExchangeAlt, FaChartPie } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import Report from '../components/Report';
import '../styles/Developer.css';
import '../styles/Report.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Developer = () => {
  const [timeScale, setTimeScale] = useState('24H');
  const [exportDateRange, setExportDateRange] = useState('last7days');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('7d');

  // Hardcoded data
  const stats = {
    totalTransactions: {
      value: 24562,
      change: '+12.5% from last month'
    },
    fraudDetectionRate: {
      value: '98.7%',
      change: '+2.1% from last month'
    },
    apiResponseTime: {
      value: '245ms',
      change: '-18ms from last month'
    }
  };

  const transactions = [
    {
      id: '#45678',
      amount: '$1,234.56',
      merchant: 'Amazon',
      time: '2 minutes ago',
      status: 'Legitimate'
    },
    {
      id: '#45677',
      amount: '$789.99',
      merchant: 'Unknown Vendor',
      time: '5 minutes ago',
      status: 'Fraudulent'
    }
  ];

  // Mock data for different time scales
  const performanceData = {
    '1H': {
      labels: Array.from({length: 60}, (_, i) => `${59-i}m`),
      data: Array.from({length: 60}, () => Math.floor(Math.random() * (250 - 230) + 230))
    },
    '24H': {
      labels: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
      data: [235, 238, 240, 238, 242, 240, 245, 248, 242, 240, 238, 235, 233, 232, 235, 238, 240, 242, 240, 238, 235, 234, 233, 235]
    },
    '7D': {
      labels: Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6-i));
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      }),
      data: Array.from({length: 7}, () => Math.floor(Math.random() * (250 - 230) + 230))
    }
  };

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
      <div className="side-panel">
        <nav className="nav-menu">
          <Link to="/dashboard" className="nav-item">
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
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <h3>Total Transactions</h3>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              {stats.totalTransactions.value.toLocaleString()}
            </div>
            <div className="stat-change positive" style={{ color: '#10b981', fontSize: '14px' }}>
              {stats.totalTransactions.change}
            </div>
          </div>
          <div className="stat-card" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <h3>Fraud Detection Rate</h3>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              {stats.fraudDetectionRate.value}
            </div>
            <div className="stat-change positive" style={{ color: '#10b981', fontSize: '14px' }}>
              {stats.fraudDetectionRate.change}
            </div>
          </div>
          <div className="stat-card" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <h3>API Response Time</h3>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              {stats.apiResponseTime.value}
            </div>
            <div className="stat-change negative" style={{ color: '#ef4444', fontSize: '14px' }}>
              {stats.apiResponseTime.change}
            </div>
          </div>
        </div>

        {/* Transaction History and API Performance */}
        <div className="dashboard-grid">
          <div className="card transaction-history">
            <div className="card-header">
              <h3>Transaction History</h3>
              <Link to="/transactions" className="view-all">View All</Link>
            </div>
            <div className="transaction-list">
              {transactions.map((transaction, index) => (
                <div key={index} className="transaction-item">
                  <div className="transaction-icon">
                    {transaction.status === 'Legitimate' ? '✅' : '⚠️'}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-id">
                      Transaction {transaction.id} - {transaction.amount}
                    </div>
                    <div className="transaction-time">
                      {transaction.merchant} • {transaction.time}
                    </div>
                  </div>
                  <div className={`transaction-status ${transaction.status.toLowerCase()}`}>
                    {transaction.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card api-performance">
            <div className="card-header">
              <h3>API Performance</h3>
              <div className="time-scale-buttons">
                <button 
                  className={`scale-btn ${timeScale === '1H' ? 'active' : ''}`}
                  onClick={() => setTimeScale('1H')}
                >
                  1H
                </button>
                <button 
                  className={`scale-btn ${timeScale === '24H' ? 'active' : ''}`}
                  onClick={() => setTimeScale('24H')}
                >
                  24H
                </button>
                <button 
                  className={`scale-btn ${timeScale === '7D' ? 'active' : ''}`}
                  onClick={() => setTimeScale('7D')}
                >
                  7D
                </button>
              </div>
            </div>
            <div className="chart-container">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="card recent-logs">
          <div className="card-header">
            <h3>Recent Logs</h3>
          </div>
          <div className="logs-list">
            {recentLogs.map((log, index) => (
              <div key={index} className="log-item">
                <div className={`log-icon ${log.type}`}>
                  {log.icon}
                </div>
                <div className="log-details">
                  <div className="log-title">{log.title}</div>
                  <div className="log-subtitle">{log.subtitle}</div>
                  <div className="log-time">{log.time}</div>
                </div>
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
    </div>
  );
};

export default Developer;