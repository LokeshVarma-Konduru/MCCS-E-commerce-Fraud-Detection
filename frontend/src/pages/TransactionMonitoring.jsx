import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCode, FaChartLine, FaExchangeAlt, FaSearch, FaCalendar, FaExclamationTriangle } from 'react-icons/fa';
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
import TransactionReviewModal from '../components/TransactionReviewModal';
import PageHeader from '../components/PageHeader';
import '../styles/Developer.css';
import '../styles/TransactionMonitoring.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TransactionMonitoring = () => {
  // Filter states
  const [dateRange, setDateRange] = useState('');
  const [amountRange, setAmountRange] = useState('All Amounts');
  const [fraudScore, setFraudScore] = useState('All Scores');
  const [status, setStatus] = useState('All Status');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Sample transaction data
  const transactions = [
    {
      id: '#TRX-2025-001',
      amount: '$1,299.00',
      fraudScore: 85,
      status: 'Fraud',
      timestamp: '2025-03-15 14:30:00'
    },
    {
      id: '#TRX-2025-002',
      amount: '$49.99',
      fraudScore: 15,
      status: 'Legit',
      timestamp: '2025-03-15 14:29:45'
    }
  ];

  // Sample alerts data
  const alerts = [
    {
      type: 'High-value Transaction',
      amount: '$5,999.00',
      score: 92
    },
    {
      type: 'Unusual Location',
      amount: '$899.00',
      score: 88
    }
  ];

  // Sample chart data
  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Fraud Attempts',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#718096'
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#718096'
        }
      }
    }
  };

  const renderFraudScore = (score) => {
    const color = score > 70 ? '#ef4444' : score > 30 ? '#f59e0b' : '#10b981';
    const width = `${score}%`;
    
    return (
      <div className="fraud-score">
        <div className="score-bar-container">
          <div 
            className="score-bar" 
            style={{ 
              width,
              backgroundColor: color
            }}
          />
        </div>
        <span className="score-value" style={{ color }}>{score}</span>
      </div>
    );
  };

  const handleReviewClick = (alert) => {
    setSelectedTransaction({
      id: '#TRX-2025-003',
      amount: alert.amount,
      timestamp: '2025-03-20 11:27:24',
      score: alert.score
    });
    setIsReviewModalOpen(true);
  };

  return (
    <div className="developer-container transaction-monitoring">
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
          <Link to="/transaction-monitoring" className="nav-item active">
            <FaExchangeAlt className="nav-icon" />
            <span>Transaction Monitoring</span>
          </Link>
        </nav>
      </div>

      <div className="main-content">
        <PageHeader title="Transaction Monitoring" />
        <div className="monitoring-filters">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by transaction ID, amount, or status..." 
              className="search-input"
              style={{ 
                color: '#2d3748', 
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e0',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            />
          </div>

          <div className="filters">
            <div className="filter-group">
              <label>Date Range</label>
              <div className="date-input">
                <input 
                  type="text" 
                  placeholder="mm/dd/yyyy" 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                />
                <FaCalendar className="calendar-icon" />
              </div>
            </div>

            <div className="filter-group">
              <label>Amount Range</label>
              <select 
                value={amountRange}
                onChange={(e) => setAmountRange(e.target.value)}
              >
                <option>All Amounts</option>
                <option>$0 - $100</option>
                <option>$100 - $500</option>
                <option>$500 - $1000</option>
                <option>$1000+</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Fraud Score</label>
              <select 
                value={fraudScore}
                onChange={(e) => setFraudScore(e.target.value)}
              >
                <option>All Scores</option>
                <option>High Risk (70+)</option>
                <option>Medium Risk (30-70)</option>
                <option>Low Risk (0-30)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>All Status</option>
                <option>Fraud</option>
                <option>Legit</option>
                <option>Under Review</option>
              </select>
            </div>
          </div>
        </div>

        <div className="transaction-stream">
          <h3>Live Transaction Stream</h3>
          <div className="transaction-table">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Fraud Score</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.id}</td>
                    <td>{tx.amount}</td>
                    <td>{renderFraudScore(tx.fraudScore)}</td>
                    <td>
                      <span className={`status-badge ${tx.status.toLowerCase()}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{tx.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="monitoring-grid">
          <div className="fraud-trends">
            <h3>Fraud Detection Trends</h3>
            <div style={{ height: '300px', position: 'relative' }}>
              <Line data={trendData} options={trendOptions} />
            </div>
          </div>

          <div className="high-risk-alerts">
            <div className="alerts-header">
              <h3>High-Risk Alerts</h3>
              <span className="new-alerts">5 New</span>
            </div>
            <div className="alerts-list">
              {alerts.map((alert, index) => (
                <div key={index} className="alert-item">
                  <div className="alert-icon">
                    <FaExclamationTriangle />
                  </div>
                  <div className="alert-content">
                    <div className="alert-type">{alert.type}</div>
                    <div className="alert-details">
                      {alert.amount} - Score: {alert.score}
                    </div>
                  </div>
                  <button 
                    className="review-button"
                    onClick={() => handleReviewClick(alert)}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <TransactionReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default TransactionMonitoring;
