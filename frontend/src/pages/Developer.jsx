import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCode, FaChartLine, FaExchangeAlt, FaSearch } from 'react-icons/fa';
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
  // Sample data for API Performance chart
  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      label: 'Response Time (ms)',
      data: [235, 240, 238, 242, 245, 250, 248, 245, 240, 235, 230, 235],
      borderColor: 'rgb(255, 99, 71)',
      tension: 0.4,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  return (
    <div className="developer-container">
      <div className="side-panel">
        <div className="logo-container">
          <img src="/mccs-logo.png" alt="MCCS Logo" className="mccs-logo" />
        </div>
        
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
        {/* Header with Search and Profile */}
        <div className="header">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search logs, transactions..." />
          </div>
          <div className="header-right">
            <div className="api-status">
              <span className="status-dot"></span>
              API Connected
            </div>
            <img src="/profile-pic.jpg" alt="Profile" className="profile-pic" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Transactions</h3>
            <div className="stat-value">24,562</div>
            <div className="stat-change positive">+12.5% from last month</div>
          </div>
          <div className="stat-card">
            <h3>Fraud Detection Rate</h3>
            <div className="stat-value">98.7%</div>
            <div className="stat-change positive">+2.1% from last month</div>
          </div>
          <div className="stat-card">
            <h3>API Response Time</h3>
            <div className="stat-value">245ms</div>
            <div className="stat-change negative">-18ms from last month</div>
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
              <div className="transaction-item">
                <div className="transaction-icon">📋</div>
                <div className="transaction-details">
                  <div className="transaction-id">Transaction #45678</div>
                  <div className="transaction-time">2 minutes ago</div>
                </div>
                <div className="transaction-status legitimate">Legitimate</div>
              </div>
              <div className="transaction-item">
                <div className="transaction-icon">📋</div>
                <div className="transaction-details">
                  <div className="transaction-id">Transaction #45677</div>
                  <div className="transaction-time">5 minutes ago</div>
                </div>
                <div className="transaction-status fraudulent">Fraudulent</div>
              </div>
            </div>
          </div>

          <div className="card api-performance">
            <div className="card-header">
              <h3>API Performance</h3>
              <div className="time-filters">
                <button className="time-filter">1H</button>
                <button className="time-filter active">24H</button>
                <button className="time-filter">7D</button>
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
            <button className="export-btn">Export Logs</button>
          </div>
          <div className="logs-list">
            <div className="log-item">
              <div className="log-icon success">✓</div>
              <div className="log-details">
                <div className="log-title">API Request Successful</div>
                <div className="log-subtitle">Response time: 235ms</div>
                <div className="log-time">1 minute ago</div>
              </div>
            </div>
            <div className="log-item">
              <div className="log-icon info">ℹ</div>
              <div className="log-details">
                <div className="log-title">Model Retraining Complete</div>
                <div className="log-subtitle">Accuracy improved by 1.2%</div>
                <div className="log-time">1 hour ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;