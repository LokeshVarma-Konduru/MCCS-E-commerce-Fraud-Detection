import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { FaKey, FaHistory, FaBook, FaCopy, FaSync, FaCode } from 'react-icons/fa';
import DeveloperNav from '../components/DeveloperNav';
import '../styles/Developer.css';
import { getApiKey, generateApiKey, regenerateApiKey, predictTransaction, getModelsWithWeights, API_URL, getStores } from '../api';

// Helper to map model type to backend identifier
const getModelIdentifier = (modelType) => {
  const modelTypeLower = modelType.toLowerCase();
  if (modelTypeLower.includes('logistic')) {
    return 'logistic-regression';
  } else if (modelTypeLower.includes('bernoulli') || modelTypeLower.includes('naive bayes')) {
    return 'bernoulli-nb';
  } else if (modelTypeLower.includes('decision') || modelTypeLower.includes('tree')) {
    return 'decision-tree';
  } else if (modelTypeLower.includes('xgboost') || modelTypeLower.includes('xgb')) {
    return 'xgboost';
  }
  return 'logistic-regression'; // Default fallback
};

// Group models by modelName for two-level dropdown
const groupModelsByName = (models) => {
  const grouped = {};
  
  models.forEach(model => {
    const key = model.modelName;
    
    if (!grouped[key]) {
      grouped[key] = {
        modelName: model.modelName,
        modelType: model.modelType,
        modelIdentifier: getModelIdentifier(model.modelType),
        versions: []
      };
    }
    
    // Extract version from root or additionalInfo
    const version = model.version || model.additionalInfo?.version || 'v1.0.0';
    
    // Get accuracy - prefer direct accuracy field from modelFiles.files, then check metrics
    let accuracy = null;
    if (model.accuracy !== undefined && model.accuracy !== null) {
      // Direct accuracy from modelFiles.files
      accuracy = model.accuracy;
    } else {
      // Fallback: find accuracy in metrics array
      const accuracyMetric = model.metrics?.find(m => 
        m.name && m.name.toLowerCase().includes('accuracy')
      );
      accuracy = accuracyMetric?.value || null;
    }
    
    grouped[key].versions.push({
      _id: model._id,
      version: version,
      createdAt: model.createdAt,
      accuracy: accuracy
    });
    
    // Sort versions by date (oldest first - v1.0.0 before v1.1.0)
    grouped[key].versions.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
  });
  
  // Sort grouped models - Logistic Regression first, then alphabetically
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "Logistic Regression" && b !== "Logistic Regression") {
      return -1;
    }
    if (a !== "Logistic Regression" && b === "Logistic Regression") {
      return 1;
    }
    return a.localeCompare(b);
  });
  
  // Rebuild grouped object with sorted keys
  const sortedGrouped = {};
  for (const key of sortedKeys) {
    sortedGrouped[key] = grouped[key];
  }
  
  return sortedGrouped;
};

const APIIntegration = ({ embedded = false }) => {
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
  const [stores, setStores] = useState([]);
  const [storeRef, setStoreRef] = useState('');
  const [response, setResponse] = useState('');
  const [recentCalls, setRecentCalls] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [groupedModels, setGroupedModels] = useState({});
  const [selectedModelName, setSelectedModelName] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null); // Store full version object
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

  // Fetch API key and models on component mount
  useEffect(() => {
    fetchApiKey();
    fetchModels();
    // Load stores for in-store testing
    (async () => {
      try {
        const res = await getStores();
        const list = res?.data || [];
        setStores(Array.isArray(list) ? list : (list.data || []));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Update API URL when API key, model, or version changes
  useEffect(() => {
    if (apiKey && selectedModelName && groupedModels[selectedModelName] && selectedVersion) {
      const modelIdentifier = groupedModels[selectedModelName].modelIdentifier;
      const version = selectedVersion.version;
      console.log("Updating API URL with model:", modelIdentifier, "version:", version);
      // Use the API_URL imported from api.js, include version parameter
      setApiUrl(`${API_URL}/predict?apikey=${apiKey}&model=${modelIdentifier}&version=${version}`);
    }
  }, [apiKey, selectedModelName, selectedVersion, groupedModels]);

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
      // Fetch models with weight files from modelFiles GridFS (not all MLModel entries)
      const response = await getModelsWithWeights();
      if (response.data.success) {
        console.log("Raw model data (with weights):", response.data.data);
        
        const models = response.data.data;
        setAllModels(models);
        
        // Group models by name
        const grouped = groupModelsByName(models);
        setGroupedModels(grouped);
        
        // Auto-select Logistic Regression first (if available), otherwise first model
        // Find Logistic Regression in grouped models
        let defaultModelName = null;
        if (grouped["Logistic Regression"]) {
          defaultModelName = "Logistic Regression";
        } else {
          // If Logistic Regression not available, use first model
          defaultModelName = Object.keys(grouped)[0];
        }
        
        if (defaultModelName && grouped[defaultModelName].versions.length > 0) {
          setSelectedModelName(defaultModelName);
          // Select last version (oldest - v1.0.0) since we sort oldest first
          const lastVersionIndex = grouped[defaultModelName].versions.length - 1;
          const oldestVersion = grouped[defaultModelName].versions[lastVersionIndex];
          setSelectedVersionId(oldestVersion._id);
          setSelectedVersion(oldestVersion);
        }
      }
    } catch (error) {
      console.error('Error fetching models with weights:', error);
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
    
    if (!amount || !selectedModelName || !selectedVersion) {
      setResponse(JSON.stringify({
        error: 'Please fill in all required fields and select a model version',
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

      if (transactionType === 'in-store' && storeRef) {
        transactionData.storeRef = storeRef; // pass storeRef for backend to attach store
      }

      // Get model identifier and version
      const modelIdentifier = groupedModels[selectedModelName]?.modelIdentifier;
      const version = selectedVersion.version;

      const result = await predictTransaction(transactionData, apiKey, modelIdentifier, version);
      
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
    <div className={embedded ? "" : "developer-container"}>
      {!embedded && <DeveloperNav activePath="/api-integration" />}

      <div className={embedded ? "" : "main-content"}>
        {!embedded && <PageHeader title="API Integration" />}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {copySuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {copySuccess}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* API Keys Section */}
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-4">API Keys</h3>
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-4 text-gray-500">Loading...</div>
              ) : hasApiKey ? (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={apiKey} 
                    readOnly 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <button 
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      onClick={handleCopyKey}
                    >
                      <FaCopy /> Copy
                    </button>
                    <button 
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      onClick={handleRegenerateKey}
                    >
                      <FaSync /> Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">You don't have an API key yet. Generate one to start using our API.</p>
                  <button 
                    className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    onClick={handleGenerateKey}
                  >
                    Generate API Key
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* API URL Generator */}
          {hasApiKey && (
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-4">API URL Generator</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Model</label>
                    <select 
                      value={selectedModelName || ''}
                      onChange={(e) => {
                        const modelName = e.target.value;
                        setSelectedModelName(modelName);
                        
                        // Auto-select oldest version (v1.0.0) of selected model
                        if (groupedModels[modelName]?.versions.length > 0) {
                          // Select last version (oldest - v1.0.0) since we sort oldest first
                          const lastVersionIndex = groupedModels[modelName].versions.length - 1;
                          const oldestVersion = groupedModels[modelName].versions[lastVersionIndex];
                          setSelectedVersionId(oldestVersion._id);
                          setSelectedVersion(oldestVersion);
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a model</option>
                      {Object.keys(groupedModels).map(modelName => (
                        <option key={modelName} value={modelName}>
                          {modelName} ({groupedModels[modelName].modelType})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedModelName && groupedModels[selectedModelName] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Version</label>
                      <select 
                        value={selectedVersionId || ''}
                        onChange={(e) => {
                          const versionId = e.target.value;
                          setSelectedVersionId(versionId);
                          const version = groupedModels[selectedModelName].versions.find(v => v._id === versionId);
                          setSelectedVersion(version || null);
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a version</option>
                        {groupedModels[selectedModelName].versions.map(version => (
                          <option key={version._id} value={version._id}>
                            {version.version}
                            {version.accuracy && ` (${(version.accuracy * 100).toFixed(2)}%)`}
                            {` - ${new Date(version.createdAt).toLocaleDateString()}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your API Endpoint URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={apiUrl} 
                      readOnly 
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md font-mono text-sm"
                    />
                    <button 
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      onClick={handleCopyUrl}
                    >
                      <FaCopy /> Copy
                    </button>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-2">How to use:</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Make a POST request to this URL with your transaction data in the request body.
                  </p>
                  <div className="bg-gray-50 rounded-md p-4 overflow-auto">
                    <pre className="text-xs font-mono text-gray-800 leading-relaxed">
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
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Test API Calls</h3>
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
                      onChange={(e) => { setTransactionType(e.target.value); if (e.target.value !== 'in-store') setStoreRef(''); }}
                      className="form-select"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                    >
                      <option value="online">Online</option>
                      <option value="in-store">In-store</option>
                    </select>
                  </div>
                  {transactionType === 'in-store' && (
                    <div className="form-group">
                      <label>Store</label>
                      <select
                        value={storeRef}
                        onChange={(e) => setStoreRef(e.target.value)}
                        className="form-select"
                        style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                      >
                        <option value="">Select store</option>
                        {stores.map(st => (
                          <option key={st._id} value={st._id}>{st.storeID} — {st.storeName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Model</label>
                    <select 
                      value={selectedModelName || ''}
                      onChange={(e) => {
                        const modelName = e.target.value;
                        setSelectedModelName(modelName);
                        
                        // Auto-select oldest version (v1.0.0) of selected model
                        if (groupedModels[modelName]?.versions.length > 0) {
                          // Select last version (oldest - v1.0.0) since we sort oldest first
                          const lastVersionIndex = groupedModels[modelName].versions.length - 1;
                          const oldestVersion = groupedModels[modelName].versions[lastVersionIndex];
                          setSelectedVersionId(oldestVersion._id);
                          setSelectedVersion(oldestVersion);
                        }
                      }}
                      className="form-select"
                      style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                      required
                    >
                      <option value="">Select a model</option>
                      {Object.keys(groupedModels).map(modelName => (
                        <option key={modelName} value={modelName}>
                          {modelName} ({groupedModels[modelName].modelType})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedModelName && groupedModels[selectedModelName] && (
                    <div className="form-group">
                      <label>Version</label>
                      <select 
                        value={selectedVersionId || ''}
                        onChange={(e) => {
                          const versionId = e.target.value;
                          setSelectedVersionId(versionId);
                          const version = groupedModels[selectedModelName].versions.find(v => v._id === versionId);
                          setSelectedVersion(version || null);
                        }}
                        className="form-select"
                        style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                        required
                      >
                        <option value="">Select a version</option>
                        {groupedModels[selectedModelName].versions.map(version => (
                          <option key={version._id} value={version._id}>
                            {version.version}
                            {version.accuracy && ` (${(version.accuracy * 100).toFixed(2)}%)`}
                            {` - ${new Date(version.createdAt).toLocaleDateString()}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent API Calls</h3>
            <div>
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

