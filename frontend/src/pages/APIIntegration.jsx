import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCode, FaChartLine, FaExchangeAlt, FaCopy, FaSync } from 'react-icons/fa';
import PageHeader from '../components/PageHeader';
import '../styles/Developer.css';

const APIIntegration = () => {
  // Hard-coded data for testing
  const testData = {
    sampleApiKey: 'sk_live_4eC39HqLyjWDarjtT1zdp7dc',
    recentCalls: [
      {
        requestId: 'req_5f23e59b8c4213',
        timestamp: '2025-02-27 10:51:12',
        inputData: 'user_789, $1,234.56, Visa',
        status: 'Success',
        details: {
          fraudScore: 0.12,
          riskLevel: 'low',
          transactionId: 'txn_1234567890',
          merchantName: 'Amazon',
          cardLast4: '4242'
        }
      },
      {
        requestId: 'req_5f23e58a7b3214',
        timestamp: '2025-02-27 10:50:45',
        inputData: 'user_456, $789.99, Mastercard',
        status: 'Failed',
        details: {
          fraudScore: 0.89,
          riskLevel: 'high',
          transactionId: 'txn_0987654321',
          merchantName: 'Best Buy',
          cardLast4: '5555'
        }
      }
    ],
    cardTypes: [
      { value: 'Visa', label: 'Visa' },
      { value: 'Mastercard', label: 'Mastercard' },
      { value: 'Amex', label: 'American Express' }
    ]
  };

  const [apiKey] = useState(testData.sampleApiKey);
  const [testUserId, setTestUserId] = useState('');
  const [testAmount, setTestAmount] = useState('');
  const [testCardType, setTestCardType] = useState('visa');
  const [testResponse, setTestResponse] = useState('Response will appear here...');
  const [recentCalls, setRecentCalls] = useState(testData.recentCalls);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
  };

  const handleRegenerateKey = () => {
    alert('API key regeneration would be implemented in production');
  };

  const handleTestRequest = (e) => {
    e.preventDefault();
    
    if (!testUserId || !testAmount) {
      setTestResponse(JSON.stringify({
        error: 'Please fill in all required fields',
        status: 'error'
      }, null, 2));
      return;
    }

    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const newRequestId = `req_${timestamp}${random}`;

    const newCall = {
      requestId: newRequestId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      inputData: `${testUserId}, $${Number(testAmount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}, ${testCardType}`,
      status: Math.random() > 0.5 ? 'Success' : 'Failed',
      details: {
        fraudScore: Math.random().toFixed(2),
        riskLevel: Math.random() > 0.7 ? 'high' : 'low',
        transactionId: `txn_${Date.now().toString(36)}`,
        merchantName: testUserId.includes('_') ? testUserId.split('_')[1] : 'Unknown',
        cardLast4: Math.floor(1000 + Math.random() * 9000).toString()
      }
    };

    setRecentCalls([newCall, ...recentCalls]);

    const responseData = {
      success: newCall.status === 'Success',
      requestId: newCall.requestId,
      message: newCall.status === 'Success' ? 'Transaction processed successfully' : 'Transaction failed',
      details: {
        timestamp: new Date().toISOString(),
        ...newCall.details
      }
    };

    setTestResponse(JSON.stringify(responseData, null, 2));
  };

  return (
    <div className="developer-container">
      <div className="side-panel">
        <nav className="nav-menu">
          <Link to="/developer" className="nav-item">
            <FaHome className="nav-icon" />
            <span>Dashboard</span>
          </Link>
          <Link to="/api-integration" className="nav-item active">
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
        <PageHeader title="API Integration" />
        <div className="api-content">
          {/* API Keys Section */}
          <div className="card">
            <div className="card-header">
              <h2>API Keys</h2>
            </div>
            <div className="api-keys">
              <div className="api-key-input">
                <input 
                  type="text" 
                  value={apiKey} 
                  readOnly 
                  className="key-field"
                />
                <div className="api-key-buttons">
                  <button className="api-button" onClick={handleCopyKey}>
                    <FaCopy /> Copy
                  </button>
                  <button className="api-button" onClick={handleRegenerateKey}>
                    <FaSync /> Regenerate
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Steps Section */}
          <div className="card">
            <div className="card-header">
              <h2>Integration Steps</h2>
            </div>
            <div className="integration-steps">
              <form className="test-form" onSubmit={handleTestRequest}>
                <div className="form-group">
                  <label>User ID</label>
                  <input 
                    type="text"
                    placeholder="Enter user ID"
                    value={testUserId}
                    onChange={(e) => setTestUserId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Amount</label>
                  <input 
                    type="number"
                    placeholder="Enter amount"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Card Type</label>
                  <select 
                    value={testCardType}
                    onChange={(e) => setTestCardType(e.target.value)}
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                  </select>
                </div>

                <button type="submit" className="send-test-button">
                  Send Test Request
                </button>

                <div className="response-area">
                  <label>Response</label>
                  <div className="response-content">
                    {testResponse || 'Response will appear here...'}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Code Examples Section */}
          <div className="card">
            <div className="card-header">
              <h2>Code Examples</h2>
            </div>
            <div className="code-examples">
              <table className="api-calls-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Timestamp</th>
                    <th>Input Data</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls && recentCalls.length > 0 ? (
                    recentCalls.map((call) => (
                      <tr key={call.requestId}>
                        <td>{call.requestId}</td>
                        <td>{call.timestamp}</td>
                        <td>{call.inputData}</td>
                        <td>
                          <span className={`status-badge ${call.status.toLowerCase()}`}>
                            {call.status}
                          </span>
                        </td>
                        <td>
                          <a 
                            href="#" 
                            className="view-details-link"
                            onClick={(e) => {
                              e.preventDefault();
                              setTestResponse(JSON.stringify(call.details, null, 2));
                            }}
                          >
                            View Details
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>
                        No recent API calls
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIIntegration;
