import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCode, FaChartLine, FaExchangeAlt } from 'react-icons/fa';
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
import '../styles/Developer.css';

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
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Transactions</h3>
            <div className="stat-value">
              {stats.totalTransactions.value.toLocaleString()}
            </div>
            <div className="stat-change positive">
              {stats.totalTransactions.change}
            </div>
          </div>
          <div className="stat-card">
            <h3>Fraud Detection Rate</h3>
            <div className="stat-value">
              {stats.fraudDetectionRate.value}
            </div>
            <div className="stat-change positive">
              {stats.fraudDetectionRate.change}
            </div>
          </div>
          <div className="stat-card">
            <h3>API Response Time</h3>
            <div className="stat-value">
              {stats.apiResponseTime.value}
            </div>
            <div className="stat-change negative">
              {stats.apiResponseTime.change}
            </div>
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
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="transactions-section">
          <div className="section-header">
            <h3>Recent Transactions</h3>
          </div>
          <div className="transactions-list">
            {transactions.map((transaction, index) => (
              <div key={index} className="transaction-item">
                <div className="transaction-id">#{transaction.id.replace('#', '')}</div>
                <div className="transaction-merchant">{transaction.merchant}</div>
                <div className="transaction-time">{transaction.time}</div>
                <div className="transaction-amount">${transaction.amount.replace('$', '')}</div>
                <div className={`transaction-status ${transaction.status.toLowerCase()}`}>
                  {transaction.status}
                </div>
              </div>
            ))}
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
      </div>
    </div>
  );
};

export default Developer;