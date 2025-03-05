import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import '../styles/StoreManager.css';

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
  const [timeRange, setTimeRange] = useState('Last 24 h.');
  const [transactionType, setTransactionType] = useState('All Transactions');

  // Mock data for statistics
  const stats = {
    totalTransactions: {
      value: 24589,
      change: '+2,100 from yesterday'
    },
    fraudRate: {
      value: '2.4%',
      change: '+0.3% from yesterday'
    },
    financialImpact: {
      value: '$12,450',
      change: '+$1,890 from yesterday'
    }
  };

  // Mock data for recent alerts
  const recentAlerts = [
    {
      time: '2 mins ago',
      transactionId: '#TRX-89045',
      type: 'Online',
      amount: '$1,250.00',
      riskScore: 'High',
      status: 'Under Review'
    },
    {
      time: '15 mins ago',
      transactionId: '#TRX-89044',
      type: 'In-store',
      amount: '$450.00',
      riskScore: 'Medium',
      status: 'Flagged'
    },
    {
      time: '45 mins ago',
      transactionId: '#TRX-89043',
      type: 'Online',
      amount: '$680.90',
      riskScore: 'Low',
      status: 'Cleared'
    }
  ];

  // Mock data for fraud detection trend
  const fraudTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Fraud Rate',
        data: [2.1, 2.3, 2.0, 2.4, 2.2, 2.5, 2.4],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
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
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value + '%'
        }
      }
    }
  };

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
          <button className="export-btn">
            Export Report
          </button>
        </div>

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
            <h3>Fraud Rate</h3>
            <div className="stat-value">
              {stats.fraudRate.value}
            </div>
            <div className="stat-change negative">
              {stats.fraudRate.change}
            </div>
          </div>
          <div className="stat-card">
            <h3>Financial Impact</h3>
            <div className="stat-value">
              {stats.financialImpact.value}
            </div>
            <div className="stat-change negative">
              {stats.financialImpact.change}
            </div>
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
              <Line data={fraudTrendData} options={chartOptions} height={300} />
            </div>
          </div>
          <div className="transaction-types">
            <div className="chart-header">
              <h3>Transaction Types</h3>
              <select className="type-select">
                <option>All Types</option>
                <option>Online</option>
                <option>In-store</option>
              </select>
            </div>
            <div className="chart-wrapper">
              {/* Add transaction types chart here */}
            </div>
          </div>
        </div>

        {/* Recent Alerts Table */}
        <div className="recent-alerts">
          <h3>Recent Alerts</h3>
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
        </div>
      </div>
    </div>
  );
};

export default StoreManager;
