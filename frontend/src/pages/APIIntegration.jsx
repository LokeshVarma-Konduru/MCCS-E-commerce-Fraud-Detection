import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { FaHome, FaKey, FaHistory, FaBook, FaCopy, FaSync, FaChartLine, FaExchangeAlt, FaCode } from 'react-icons/fa';
import '../styles/Developer.css';
import { getApiKey, generateApiKey, regenerateApiKey, predictTransaction, getMLModelMetrics } from '../api';

const APIIntegration = () => {
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit card');
  const [productCategory, setProductCategory] = useState('electronics');
  const [quantity, setQuantity] = useState(1);
  const [customerAge, setCustomerAge] = useState(30);
  const [deviceUsed, setDeviceUsed] = useState('mobile');
  const [accountAgeDays, setAccountAgeDays] = useState(365);
  const [isAddressMatch, setIsAddressMatch] = useState(1);
  const [transactionType, setTransactionType] = useState('online');
  const [response, setResponse] = useState('');
  const [recentCalls, setRecentCalls] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('logistic-regression');
  const [apiUrl, setApiUrl] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  // Payment method options for the dropdown
  const paymentMethods = [
    { value: 'credit card', label: 'Credit Card' },
    { value: 'debit card', label: 'Debit Card' },
    { value: 'bank transfer', label: 'Bank Transfer' },
    { value: 'PayPal', label: 'PayPal' }
  ];

  // Product category options for the dropdown
  const productCategories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'home & garden', label: 'Home & Garden' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'toys & games', label: 'Toys & Games' },
    { value: 'health & beauty', label: 'Health & Beauty' }
  ];

  // Device options for the dropdown
  const deviceOptions = [
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'desktop', label: 'Desktop' }
  ];

  // Available model types that match backend expectations
  const availableModels = [
    { value: 'logistic-regression', label: 'Logistic Regression' },
    { value: 'bernoulli-nb', label: 'Bernoulli Naive Bayes' },
    { value: 'decision-tree', label: 'Decision Tree' },
    { value: 'xgboost', label: 'XGBoost' }
  ];

  // Fetch API key on component mount
  useEffect(() => {
    fetchApiKey();
    // Still fetch models for other data, but we'll use our hardcoded list for the dropdown
    fetchModels();
    
    // Initialize with the first model in our list
    setSelectedModel(availableModels[0].value);
  }, []);

  // Update API URL when API key or model changes
  useEffect(() => {
    if (apiKey && selectedModel) {
      console.log("Updating API URL with model:", selectedModel);
      setApiUrl(`http://35.164.210.165:9000/mccs/predict?apikey=${apiKey}&model=${selectedModel}`);
    }
  }, [apiKey, selectedModel]);

  const fetchApiKey = async () => {
    setIsLoading(true);
    try {
      const response = await getApiKey();
      if (response.data.success) {
        setApiKey(response.data.data.key);
        setHasApiKey(true);
      } else {
        setHasApiKey(false);
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
      setHasApiKey(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await getMLModelMetrics();
      if (response.data.success) {
        console.log("Raw model data:", response.data.data);
        
        const modelList = response.data.data.map(model => {
          // Map model types to the expected backend model identifiers
          let modelIdentifier;
          const modelTypeLower = model.modelType.toLowerCase();
          
          if (modelTypeLower.includes('logistic')) {
            modelIdentifier = 'logistic-regression';
          } else if (modelTypeLower.includes('bernoulli') || modelTypeLower.includes('naive bayes')) {
            modelIdentifier = 'bernoulli-nb';
          } else if (modelTypeLower.includes('decision') || modelTypeLower.includes('tree')) {
            modelIdentifier = 'decision-tree';
          } else if (modelTypeLower.includes('xgboost') || modelTypeLower.includes('xgb')) {
            modelIdentifier = 'xgboost';
          } else {
            // Default fallback
            modelIdentifier = 'logistic-regression';
          }
          
          return {
            id: model._id,
            name: model.modelName,
            type: model.modelType,
            identifier: modelIdentifier
          };
        });
        
        console.log("Processed model list:", modelList);
        setModels(modelList);
        
        if (modelList.length > 0) {
          console.log("Setting initial selected model to:", modelList[0].identifier);
          setSelectedModel(modelList[0].identifier);
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setError('Failed to load models. Please try again later.');
    }
  };

  const handleGenerateKey = async () => {
    setIsLoading(true);
    try {
      const response = await generateApiKey();
      if (response.data.success) {
        setApiKey(response.data.data.key);
        setHasApiKey(true);
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      setError('Failed to generate API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [testUserId, setTestUserId] = useState('');
  const [testAmount, setTestAmount] = useState('');
  const [testCardType, setTestCardType] = useState('visa');
  const [testResponse, setTestResponse] = useState('Response will appear here...');

  const handleRegenerateKey = async () => {
    if (window.confirm('Are you sure you want to regenerate your API key? This will invalidate your current key.')) {
      setIsLoading(true);
      try {
        const response = await regenerateApiKey();
        if (response.data.success) {
          setApiKey(response.data.data.key);
          setHasApiKey(true);
        }
      } catch (error) {
        console.error('Error regenerating API key:', error);
        setError('Failed to regenerate API key. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopySuccess('API key copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(apiUrl);
    setCopySuccess('API URL copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleTestRequest = async (e) => {
    e.preventDefault();
    
    if (!amount || !selectedModel) {
      setResponse(JSON.stringify({
        error: 'Please fill in all required fields',
        status: 'error'
      }, null, 2));
      return;
    }

    setIsLoading(true);
    try {
      // Prepare transaction data
      const transactionData = {
        "Transaction Amount": [parseFloat(amount)],
        "Payment Method": [paymentMethod],
        "Product Category": [productCategory],
        "Quantity": [quantity],
        "Customer Age": [customerAge],
        "Device Used": [deviceUsed],
        "Account Age Days": [accountAgeDays],
        "Transaction Hour": [new Date().getHours()],
        "Transaction Day": [new Date().getDate()],
        "Transaction DOW": [new Date().getDay()],
        "Transaction Month": [new Date().getMonth() + 1],
        "Is Address Match": [isAddressMatch],
        "Transaction Type": [transactionType]
      };

      const result = await predictTransaction(transactionData, apiKey, selectedModel);
      
      // Format the response for display
      setResponse(JSON.stringify(result.data, null, 2));
      
      // Add to recent calls
      const newCall = {
        requestId: result.data.savedTransaction._id || `req_${Date.now().toString(36)}`,
        timestamp: new Date().toLocaleString(),
        inputData: `${amount}, ${paymentMethod}, ${productCategory}`,
        status: result.data.predictions[0] === 0 ? 'Legitimate' : 'Fraudulent',
        details: result.data
      };

      setRecentCalls(prevCalls => [newCall, ...prevCalls.slice(0, 4)]);
    } catch (error) {
      console.error('Error making test request:', error);
      setResponse(JSON.stringify({
        error: error.message || 'An error occurred while processing your request',
        status: 'error'
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="developer-container">
      <div className="top-navigation">
        <nav className="nav-menu">
          <Link to="/developer" className="nav-item">
            <FaHome className="nav-icon" />
            <span>Dashboard</span>
          </Link>
          <Link to="/api-integration" className="nav-item active">
            <FaKey className="nav-icon" />
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

        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffeeee', borderRadius: '4px', border: '1px solid #ffcccc' }}>
            {error}
          </div>
        )}

        {copySuccess && (
          <div className="success-message" style={{ color: 'green', marginBottom: '15px', padding: '10px', backgroundColor: '#eeffee', borderRadius: '4px', border: '1px solid #ccffcc' }}>
            {copySuccess}
          </div>
        )}

        <div className="api-integration-grid">
          {/* API Keys Section */}
          <div className="card">
            <div className="card-header">
              <h3>API Keys</h3>
            </div>
            <div className="api-key-content">
              {isLoading ? (
                <p>Loading...</p>
              ) : hasApiKey ? (
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
              ) : (
                <div className="generate-key-section">
                  <p>You don't have an API key yet. Generate one to start using our API.</p>
                  <button className="primary-button" onClick={handleGenerateKey}>
                    Generate API Key
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* API URL Generator */}
          {hasApiKey && (
            <div className="card">
              <div className="card-header">
                <h3><FaCode className="header-icon" /> API URL Generator</h3>
              </div>
              <div className="api-url-content" style={{ padding: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Select Model</label>
                  <select 
                    value={selectedModel}
                    onChange={(e) => {
                      console.log("Model selected:", e.target.value);
                      setSelectedModel(e.target.value);
                    }}
                    className="form-select"
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      borderRadius: '4px', 
                      border: '1px solid #ddd',
                      backgroundColor: '#f8f9fa',
                      color: '#333',
                      fontSize: '14px'
                    }}
                  >
                    {availableModels.map(model => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="api-url-display" style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  backgroundColor: '#f0f4f8', 
                  borderRadius: '4px',
                  border: '1px solid #d0d7de'
                }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500', 
                    color: '#333' 
                  }}>
                    Your API Endpoint URL
                  </label>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <input 
                      type="text" 
                      value={apiUrl} 
                      readOnly 
                      className="url-field"
                      style={{ 
                        flex: '1',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        color: '#333',
                        fontSize: '14px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <button 
                      className="api-button" 
                      onClick={handleCopyUrl}
                      style={{ 
                        padding: '10px 15px',
                        backgroundColor: '#4a6cf7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '14px'
                      }}
                    >
                      <FaCopy /> Copy
                    </button>
                  </div>
                </div>
                
                <div className="api-usage-instructions" style={{ 
                  marginTop: '20px',
                  backgroundColor: '#fff',
                  border: '1px solid #e1e4e8',
                  borderRadius: '4px',
                  padding: '15px'
                }}>
                  <h4 style={{ 
                    color: '#333', 
                    marginTop: '0',
                    marginBottom: '10px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>How to use:</h4>
                  <p style={{ 
                    color: '#555', 
                    marginBottom: '15px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    Make a POST request to this URL with your transaction data in the request body.
                  </p>
                  <div style={{ 
                    backgroundColor: '#f6f8fa',
                    borderRadius: '4px',
                    padding: '15px',
                    overflow: 'auto'
                  }}>
                    <pre style={{ 
                      margin: '0',
                      color: '#333',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      lineHeight: '1.5'
                    }}>
{`// Example request body:
{
  "Transaction Amount": [100.50],
  "Payment Method": ["credit_card"],
  "Product Category": ["Electronics"],
  "Quantity": [1],
  "Customer Age": [30],
  "Device Used": ["Mobile"],
  "Account Age Days": [365],
  "Transaction Hour": [14],
  "Transaction Day": [15],
  "Transaction DOW": [2],
  "Transaction Month": [3],
  "Is Address Match": [1],
  "Transaction Type": ["online"] // Optional: 'online' or 'in-store'
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test API Calls Section */}
          {hasApiKey && (
            <div className="card">
              <div className="card-header">
                <h3>Test API Calls</h3>
              </div>
              <div className="test-api-content">
                <form className="test-form" onSubmit={handleTestRequest}>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="text"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="form-input"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="form-select"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                    >
                      {paymentMethods.map(payment => (
                        <option key={payment.value} value={payment.value}>
                          {payment.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Product Category</label>
                    <select 
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="form-select"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                    >
                      {productCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="form-input"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Customer Age</label>
                    <input
                      type="number"
                      placeholder="Enter customer age"
                      value={customerAge}
                      onChange={(e) => setCustomerAge(e.target.value)}
                      className="form-input"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Device Used</label>
                    <select 
                      value={deviceUsed}
                      onChange={(e) => setDeviceUsed(e.target.value)}
                      className="form-select"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                    >
                      {deviceOptions.map(device => (
                        <option key={device.value} value={device.value}>
                          {device.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Account Age Days</label>
                    <input
                      type="number"
                      placeholder="Enter account age days"
                      value={accountAgeDays}
                      onChange={(e) => setAccountAgeDays(e.target.value)}
                      className="form-input"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Is Address Match</label>
                    <input
                      type="number"
                      placeholder="Enter is address match"
                      value={isAddressMatch}
                      onChange={(e) => setIsAddressMatch(e.target.value)}
                      className="form-input"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Transaction Type</label>
                    <select 
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="form-select"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                    >
                      <option value="online">Online</option>
                      <option value="in-store">In-store</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Model</label>
                    <select 
                      value={selectedModel}
                      onChange={(e) => {
                        console.log("Test form model selected:", e.target.value);
                        setSelectedModel(e.target.value);
                      }}
                      className="form-select"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                      required
                    >
                      {availableModels.map(model => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="primary-button" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Send Test Request'}
                  </button>
                </form>
                <div className="response-section">
                  <label>Response</label>
                  <textarea 
                    className="response-field"
                    value={response || "Response will appear here..."}
                    readOnly
                    style={{ 
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      backgroundColor: '#f8f9fa',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '10px',
                      height: '200px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recent API Calls Section */}
          <div className="card">
            <div className="card-header">
              <h3>Recent API Calls</h3>
            </div>
            <div className="card-content">
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
                              setResponse(JSON.stringify(call.details, null, 2));
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
