import React, { useState, useEffect } from 'react';
import { FaSearch, FaCalendar, FaExclamationTriangle } from 'react-icons/fa';
import DeveloperNav from '../components/DeveloperNav';
import DatePicker from 'react-datepicker';
import { Line } from 'react-chartjs-2';
import FraudScoreIndicator from '../components/FraudScoreIndicator';
import { getTransactions, getTransactionFraudTrends, getHighRiskTransactions, updateTransactionStatus, getStores } from '../api';
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
import 'react-datepicker/dist/react-datepicker.css';
// Import any other necessary styles

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TransactionMonitoring = ({ embedded = false }) => {
  // Filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [amountRange, setAmountRange] = useState('All Amounts');
  const [fraudScore, setFraudScore] = useState('All Scores');
  const [prediction, setPrediction] = useState('All Predictions');
  const [txnType, setTxnType] = useState('All'); // All | Online | In-store
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [reviewStatus, setReviewStatus] = useState('All Status');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Data states
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trendData, setTrendData] = useState({
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
  
  // Loading states
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Error states
  const [error, setError] = useState(null);
  
  // Handle search term debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load stores once for in-store filter
  useEffect(() => {
    const loadStores = async () => {
      try {
        const res = await getStores();
        const list = res?.data || [];
        setStores(Array.isArray(list) ? list : (list.data || []));
      } catch (e) {
        // ignore
      }
    };
    loadStores();
  }, []);

  // Define fetchTransactions function
  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    setError(null);
    
    try {
      // Prepare filter parameters
      const params = {
        page,
        limit
      };
      
      // Add search term if provided
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }
        
        // Add prediction filter if selected
        if (prediction !== 'All Predictions') {
          // Convert UI prediction to value (0 = legitimate, 1 = fraud)
          if (prediction === 'Fraud') {
            params.prediction = 1;
          } else if (prediction === 'Legit') {
            params.prediction = 0;
          }
        }
        
        // Add review status filter if selected
        if (reviewStatus !== 'All Status') {
          params.status = reviewStatus.toLowerCase();
        }
        
        // Add date range filter if dates are selected
        if (startDate) {
          params.startDate = startDate.toISOString();
        }
        if (endDate) {
          // Set end date to end of day for inclusive filtering
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          params.endDate = endOfDay.toISOString();
        }
        
        if (fraudScore !== 'All Scores') {
          // Extract numeric values from the fraud score filter
          if (fraudScore === 'High Risk (70+)') {
            params.minRiskScore = 70;
          } else if (fraudScore === 'Medium Risk (30-70)') {
            params.minRiskScore = 30;
            params.maxRiskScore = 70;
          } else if (fraudScore === 'Low Risk (0-30)') {
            params.maxRiskScore = 30;
          }
        }
        
        if (amountRange !== 'All Amounts') {
          // Extract numeric values from the amount range filter
          if (amountRange === '$0 - $100') {
            params.minAmount = 0;
            params.maxAmount = 100;
          } else if (amountRange === '$100 - $500') {
            params.minAmount = 100;
            params.maxAmount = 500;
          } else if (amountRange === '$500 - $1000') {
            params.minAmount = 500;
            params.maxAmount = 1000;
          } else if (amountRange === '$1000+') {
            params.minAmount = 1000;
          }
        }
        
        // Transaction type and store filter
        if (txnType === 'Online') {
          params.transactionType = 'online';
        } else if (txnType === 'In-store') {
          params.transactionType = 'in-store';
          if (selectedStoreId) {
            params.storeRef = selectedStoreId; // send storeRef (ObjectId)
          }
        }

        // Fetch transactions with filters
        const response = await getTransactions(params);
        
        // Format transactions for display
        if (response.data.success && response.data.transactions) {
          const formattedTransactions = response.data.transactions.map(tx => ({
            id: tx._id,
            amount: `$${tx.transactionAmount ? tx.transactionAmount.toFixed(2) : 0}`,
            fraudScore: Math.round(tx.riskScore || (tx.probabilities && tx.probabilities[0] ? tx.probabilities[0][1] * 100 : 0)),
            status: tx.predictions && tx.predictions[0] === 1 ? 'Fraud' : 'Legit',
            reviewStatus: tx.status,
            timestamp: new Date(tx.createdAt).toLocaleString()
          }));
          
          setTransactions(formattedTransactions);
          setTotalTransactions(response.data.pagination?.total || 0);
          setTotalPages(response.data.pagination?.pages || 1);
        } else {
          setError('Invalid response format from server');
          setTransactions([]);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions. Please try again.');
      } finally {
        setLoadingTransactions(false);
    }
  };
  
  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [page, limit, prediction, reviewStatus, fraudScore, amountRange, startDate, endDate, debouncedSearchTerm, txnType, selectedStoreId]);
  
  // Fetch fraud trends
  useEffect(() => {
    const fetchFraudTrends = async () => {
      setLoadingTrends(true);
      
      try {
        const response = await getTransactionFraudTrends('month');
        
        // Format trend data for the chart
        if (response.data.success && response.data.data) {
          const labels = response.data.data.map(item => item.date);
          const data = response.data.data.map(item => item.fraudRate);
          
          setTrendData({
          labels,
          datasets: [
            {
              label: 'Fraud Rate (%)',
              data,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        });
        } else {
          console.error('Invalid fraud trends response format');
          // Set empty trend data
          setTrendData({
            labels: [],
            datasets: [
              {
                label: 'Fraud Rate (%)',
                data: [],
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
      } finally {
        setLoadingTrends(false);
      }
    };
    
    fetchFraudTrends();
  }, []);
  
  // Fetch high-risk transactions for alerts
  useEffect(() => {
    const fetchHighRiskTransactions = async () => {
      setLoadingAlerts(true);
      
      try {
        // Get fraudulent transactions with high risk scores (minimum 70)
        const response = await getHighRiskTransactions(10, 'all', 70);
        
        // Format alerts for display
        if (response.data.success && response.data.data) {
          const formattedAlerts = response.data.data.map(tx => {
            // Determine alert type based on transaction characteristics
            let alertType = 'Unusual Activity';
            if (tx.amount > 1000) {
              alertType = 'High-value Transaction';
            } else if (tx.riskScore > 85) {
              alertType = 'Very High Risk Score';
            } else if (tx.paymentMethod === 'gift card' || tx.paymentMethod === 'prepaid card') {
              alertType = 'Suspicious Payment Method';
            }
            
            return {
              id: tx.id,
              type: alertType,
              amount: `$${tx.amount.toFixed(2)}`,
              score: Math.round(tx.riskScore || 0),
              timestamp: new Date(tx.time).toLocaleString(),
              paymentMethod: tx.paymentMethod || 'Unknown',
              productCategory: tx.productCategory || 'Unknown',
              transactionType: tx.type || 'online'
            };
          });
          
          // Sort by risk score (highest first)
          formattedAlerts.sort((a, b) => b.score - a.score);
          
          setAlerts(formattedAlerts);
        } else {
          console.error('Invalid high risk transactions response format');
          setAlerts([]);
        }
      } catch (err) {
        console.error('Error fetching high-risk transactions:', err);
      } finally {
        setLoadingAlerts(false);
      }
    };
    
    fetchHighRiskTransactions();
  }, []);

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

  // Fraud score is now handled by the FraudScoreIndicator component

  const handleReviewClick = (alert) => {
    // Find the full transaction details if it's from the transactions list
    const transaction = transactions.find(tx => tx.id === alert.id) || alert;
    
    setSelectedTransaction({
      id: alert.id,
      amount: alert.amount,
      timestamp: alert.timestamp,
      score: alert.score
    });
    setIsReviewModalOpen(true);
  };
  
  const handleTransactionStatusUpdate = async (transactionId, newStatus, notes) => {
    try {
      await updateTransactionStatus(transactionId, newStatus, notes);
      
      // Update the local state to reflect the change
      setTransactions(prevTransactions => 
        prevTransactions.map(tx => 
          tx.id === transactionId ? { ...tx, reviewStatus: newStatus } : tx
        )
      );
      
      // Close the modal
      setIsReviewModalOpen(false);
      
      // Refresh the transactions list
      const params = { page, limit };
      const response = await getTransactions(params);
      
      if (response.data.success && response.data.transactions) {
        const formattedTransactions = response.data.transactions.map(tx => ({
          id: tx._id,
          amount: `$${tx.transactionAmount ? tx.transactionAmount.toFixed(2) : 0}`,
          fraudScore: Math.round(tx.riskScore || (tx.probabilities && tx.probabilities[0] ? tx.probabilities[0][1] * 100 : 0)),
          status: tx.predictions && tx.predictions[0] === 1 ? 'Fraud' : 'Legit',
          reviewStatus: tx.status,
          timestamp: new Date(tx.createdAt).toLocaleString()
        }));
        
        setTransactions(formattedTransactions);
      }
    } catch (err) {
      console.error('Error updating transaction status:', err);
      setError('Failed to update transaction status');
    }
  };

  return (
    <div className={embedded ? "" : "developer-container transaction-monitoring"}>
      {!embedded && <DeveloperNav activePath="/transaction-monitoring" />}

      <div className={embedded ? "" : "main-content"}>
        {!embedded && <PageHeader title="Transaction Monitoring" />}
        
        {/* Filters Card */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          {/* Search Box */}
          <div className="relative mb-6">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by transaction ID, amount, or status..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
              <select 
                value={txnType}
                onChange={(e) => { setTxnType(e.target.value); if (e.target.value !== 'In-store') setSelectedStoreId(''); }}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All</option>
                <option>Online</option>
                <option>In-store</option>
              </select>
            </div>
            {txnType === 'In-store' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store</label>
                <select 
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Stores</option>
                  {stores.map(st => (
                    <option key={st._id} value={st._id}>{st.storeID} — {st.storeName}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <DatePicker
                    selected={startDate}
                    onChange={date => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    maxDate={new Date()} // Prevent future dates
                    placeholderText="Start Date"
                    dateFormat="MM/dd/yyyy"
                    className="date-picker"
                    wrapperClassName="date-picker-wrapper"
                    customInput={
                      <input
                        style={{ 
                          color: '#2d3748', 
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e0',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          width: '100%'
                        }}
                      />
                    }
                  />
                  <FaCalendar className="calendar-icon" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
                </div>
                <span style={{ color: '#718096' }}>to</span>
                <div style={{ position: 'relative', flex: 1 }}>
                  <DatePicker
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate} // Prevent end date before start date
                    maxDate={new Date()} // Prevent future dates
                    placeholderText="End Date"
                    dateFormat="MM/dd/yyyy"
                    className="date-picker"
                    wrapperClassName="date-picker-wrapper"
                    customInput={
                      <input
                        style={{ 
                          color: '#2d3748', 
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e0',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          width: '100%'
                        }}
                      />
                    }
                  />
                  <FaCalendar className="calendar-icon" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
              <select 
                value={amountRange}
                onChange={(e) => setAmountRange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Amounts</option>
                <option>$0 - $100</option>
                <option>$100 - $500</option>
                <option>$500 - $1000</option>
                <option>$1000+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fraud Score</label>
              <select 
                value={fraudScore}
                onChange={(e) => setFraudScore(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Scores</option>
                <option>High Risk (70+)</option>
                <option>Medium Risk (30-70)</option>
                <option>Low Risk (0-30)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prediction</label>
              <select 
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Predictions</option>
                <option>Fraud</option>
                <option>Legit</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Review Status</label>
              <select 
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Status</option>
                <option>pending</option>
                <option>approved</option>
                <option>rejected</option>
                <option>under_review</option>
              </select>
            </div>
          </div>
        </div>

        <div className="transaction-stream" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '700', color: '#2c3e50' }}>Live Transaction Stream</h3>
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
                {loadingTransactions ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading transactions...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>{error}</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No transactions found</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>{tx.amount}</td>
                      <td><FraudScoreIndicator score={tx.fraudScore} /></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={`status-badge ${tx.status.toLowerCase()}`}>
                            {tx.status}
                          </span>
                          {tx.reviewStatus && (
                            <span className={`status-badge ${tx.reviewStatus.toLowerCase().replace('_', '-')}`} style={{ fontSize: '0.7rem' }}>
                              {tx.reviewStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{tx.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination controls */}
            <div className="pagination-controls" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="pagination-info" style={{ fontSize: '14px', color: '#4a5568' }}>
                Showing {transactions.length} of {totalTransactions} transactions
              </div>
              <div className="pagination-buttons" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: page === 1 ? '#e2e8f0' : '#3b82f6',
                    color: page === 1 ? '#a0aec0' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>
                  Page {page} of {totalPages}
                </span>
                <button 
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: page === totalPages ? '#e2e8f0' : '#3b82f6',
                    color: page === totalPages ? '#a0aec0' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="monitoring-grid">
          <div className="fraud-trends" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '700', color: '#2c3e50' }}>Fraud Detection Trends</h3>
            <div style={{ height: '300px', position: 'relative' }}>
              {loadingTrends ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  Loading trend data...
                </div>
              ) : (
                <Line data={trendData} options={trendOptions} />
              )}
            </div>
          </div>

          <div className="high-risk-alerts" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <div className="alerts-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>
                <span style={{ color: '#ef4444', marginRight: '8px' }}>⚠️</span> 
                Fraudulent Transaction Alerts
              </h3>
              <span className="new-alerts" style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                {alerts.length} High Risk
              </span>
            </div>
            <div className="alerts-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loadingAlerts ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading alerts...</div>
              ) : alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>No high-risk transactions found</div>
              ) : (
                alerts.map((alert, index) => (
                  <div key={index} className="alert-item" style={{
                    display: 'flex',
                    padding: '16px',
                    borderBottom: index < alerts.length - 1 ? '1px solid #e2e8f0' : 'none',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white'
                  }}>
                    <div className="alert-icon" style={{
                      backgroundColor: alert.score > 80 ? '#fee2e2' : alert.score > 60 ? '#fef3c7' : '#e0f2fe',
                      color: alert.score > 80 ? '#ef4444' : alert.score > 60 ? '#f59e0b' : '#3b82f6',
                      padding: '10px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaExclamationTriangle />
                    </div>
                    <div className="alert-content" style={{ flex: 1 }}>
                      <div className="alert-type" style={{ fontWeight: '600', color: '#ef4444', marginBottom: '4px' }}>
                        {alert.type} <span style={{ backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>FRAUD</span>
                      </div>
                      <div className="alert-details" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          <strong>Amount:</strong> {alert.amount} | <strong>Risk Score:</strong> <span style={{
                            color: alert.score > 80 ? '#ef4444' : alert.score > 60 ? '#f59e0b' : '#3b82f6',
                            fontWeight: '600'
                          }}>{alert.score}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          <strong>Type:</strong> {alert.transactionType} | <strong>Payment:</strong> {alert.paymentMethod}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {alert.timestamp}
                        </div>
                      </div>
                    </div>
                    <button 
                      className="review-button"
                      onClick={() => handleReviewClick(alert)}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                    >
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <TransactionReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        transaction={selectedTransaction}
        onUpdateStatus={handleTransactionStatusUpdate}
      />
    </div>
  );
};

export default TransactionMonitoring;

