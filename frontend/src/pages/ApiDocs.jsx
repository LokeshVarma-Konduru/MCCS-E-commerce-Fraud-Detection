import React, { useState } from 'react';
import { FaKey, FaCode, FaExclamationTriangle, FaLock, FaServer, FaExchangeAlt, FaShieldAlt } from 'react-icons/fa';
import '../styles/ApiDocs.css';
import mccsLogo from '../assets/logo.jpg';

const ApiDocs = () => {
  const [activeEndpoint, setActiveEndpoint] = useState('authenticate');

  const endpoints = [
    {
      id: 'authenticate',
      name: 'Authentication',
      method: 'POST',
      path: '/api/v1/auth',
      description: 'Authenticate and obtain an access token',
      requestExample: `{
  "username": "your_username",
  "password": "your_password"
}`,
      responseExample: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}`,
      parameters: [
        { name: 'username', type: 'string', required: true, description: 'Your MCCS system username' },
        { name: 'password', type: 'string', required: true, description: 'Your MCCS system password' }
      ],
      responses: [
        { code: '200', description: 'Successful authentication' },
        { code: '401', description: 'Invalid credentials' },
        { code: '429', description: 'Too many failed attempts' }
      ]
    },
    {
      id: 'verify-transaction',
      name: 'Verify Transaction',
      method: 'POST',
      path: '/api/v1/transactions/verify',
      description: 'Submit a transaction for fraud verification',
      requestExample: `{
  "transaction_id": "tx_12345",
  "amount": 125.50,
  "currency": "USD",
  "customer_id": "cust_7890",
  "payment_method": "credit_card",
  "card_last4": "1234",
  "billing_zip": "92055",
  "ip_address": "192.168.1.1",
  "timestamp": "2025-04-15T10:30:00Z"
}`,
      responseExample: `{
  "transaction_id": "tx_12345",
  "risk_score": 15,
  "risk_level": "low",
  "recommendation": "approve",
  "rules_triggered": []
}`,
      parameters: [
        { name: 'transaction_id', type: 'string', required: true, description: 'Unique identifier for the transaction' },
        { name: 'amount', type: 'number', required: true, description: 'Transaction amount' },
        { name: 'currency', type: 'string', required: true, description: 'Transaction currency code (USD)' },
        { name: 'customer_id', type: 'string', required: true, description: 'Customer identifier' },
        { name: 'payment_method', type: 'string', required: true, description: 'Payment method used' },
        { name: 'card_last4', type: 'string', required: false, description: 'Last 4 digits of card (if applicable)' },
        { name: 'billing_zip', type: 'string', required: false, description: 'Billing ZIP/postal code' },
        { name: 'ip_address', type: 'string', required: false, description: 'Customer IP address' },
        { name: 'timestamp', type: 'string', required: true, description: 'Transaction timestamp (ISO 8601)' }
      ],
      responses: [
        { code: '200', description: 'Successful verification' },
        { code: '400', description: 'Invalid request parameters' },
        { code: '401', description: 'Unauthorized - invalid or missing token' }
      ]
    },
    {
      id: 'transaction-feedback',
      name: 'Transaction Feedback',
      method: 'POST',
      path: '/api/v1/transactions/feedback',
      description: 'Submit feedback on a previously verified transaction',
      requestExample: `{
  "transaction_id": "tx_12345",
  "actual_outcome": "legitimate",
  "notes": "Customer confirmed this was a valid purchase"
}`,
      responseExample: `{
  "success": true,
  "message": "Feedback recorded successfully"
}`,
      parameters: [
        { name: 'transaction_id', type: 'string', required: true, description: 'Transaction identifier' },
        { name: 'actual_outcome', type: 'string', required: true, description: 'Actual outcome: "legitimate" or "fraudulent"' },
        { name: 'notes', type: 'string', required: false, description: 'Additional context or notes' }
      ],
      responses: [
        { code: '200', description: 'Feedback recorded successfully' },
        { code: '400', description: 'Invalid request parameters' },
        { code: '404', description: 'Transaction not found' }
      ]
    },
    {
      id: 'batch-verify',
      name: 'Batch Verification',
      method: 'POST',
      path: '/api/v1/transactions/batch-verify',
      description: 'Submit multiple transactions for verification in a single request',
      requestExample: `{
  "transactions": [
    {
      "transaction_id": "tx_12345",
      "amount": 125.50,
      "currency": "USD",
      "customer_id": "cust_7890",
      "payment_method": "credit_card",
      "timestamp": "2025-04-15T10:30:00Z"
    },
    {
      "transaction_id": "tx_12346",
      "amount": 75.25,
      "currency": "USD",
      "customer_id": "cust_7891",
      "payment_method": "gift_card",
      "timestamp": "2025-04-15T10:35:00Z"
    }
  ]
}`,
      responseExample: `{
  "results": [
    {
      "transaction_id": "tx_12345",
      "risk_score": 15,
      "risk_level": "low",
      "recommendation": "approve"
    },
    {
      "transaction_id": "tx_12346",
      "risk_score": 85,
      "risk_level": "high",
      "recommendation": "review"
    }
  ]
}`,
      parameters: [
        { name: 'transactions', type: 'array', required: true, description: 'Array of transaction objects to verify' }
      ],
      responses: [
        { code: '200', description: 'Batch processed successfully' },
        { code: '400', description: 'Invalid request format' },
        { code: '401', description: 'Unauthorized - invalid or missing token' }
      ]
    },
    {
      id: 'metrics',
      name: 'Fraud Metrics',
      method: 'GET',
      path: '/api/v1/metrics',
      description: 'Retrieve fraud detection metrics for a specific time period',
      requestExample: `GET /api/v1/metrics?start_date=2025-04-01&end_date=2025-04-15&store_id=store_123`,
      responseExample: `{
  "period": {
    "start": "2025-04-01T00:00:00Z",
    "end": "2025-04-15T23:59:59Z"
  },
  "metrics": {
    "total_transactions": 5280,
    "flagged_transactions": 127,
    "confirmed_fraud": 42,
    "false_positives": 85,
    "fraud_rate": 0.80,
    "average_risk_score": 18.5
  }
}`,
      parameters: [
        { name: 'start_date', type: 'string', required: true, description: 'Start date (YYYY-MM-DD)' },
        { name: 'end_date', type: 'string', required: true, description: 'End date (YYYY-MM-DD)' },
        { name: 'store_id', type: 'string', required: false, description: 'Filter by specific store ID' }
      ],
      responses: [
        { code: '200', description: 'Metrics retrieved successfully' },
        { code: '400', description: 'Invalid date format or range' },
        { code: '403', description: 'Insufficient permissions to access metrics' }
      ]
    }
  ];

  const securityGuidelines = [
    {
      title: 'Authentication',
      icon: <FaLock />,
      content: 'All API requests must include a valid Bearer token in the Authorization header. Tokens expire after 1 hour and must be refreshed.'
    },
    {
      title: 'Rate Limiting',
      icon: <FaServer />,
      content: 'API requests are limited to 100 requests per minute per API key. Exceeding this limit will result in 429 Too Many Requests responses.'
    },
    {
      title: 'Data Encryption',
      icon: <FaShieldAlt />,
      content: 'All API communication must use HTTPS. Unencrypted HTTP requests will be rejected. We recommend TLS 1.2 or higher.'
    },
    {
      title: 'Error Handling',
      icon: <FaExclamationTriangle />,
      content: 'Implement proper error handling in your integration. All error responses include a message field with details about the error.'
    }
  ];

  return (
    <div className="api-docs-container">
      <div className="api-docs-content">
        <div className="api-docs-header">
          <div className="header-content">
            <div className="header-wrapper">
              <div className="header-logo">
                <img src={mccsLogo} alt="MCCS Logo" className="mccs-logo" />
              </div>
              <div className="header-title">
                <h1>MCCS Fraud Detection API</h1>
                <p>Integration documentation for developers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="api-docs-main">
          <div className="api-sidebar">
            <h3>Endpoints</h3>
            <ul className="endpoint-list">
              {endpoints.map(endpoint => (
                <li key={endpoint.id}>
                  <button 
                    className={`endpoint-button ${activeEndpoint === endpoint.id ? 'active' : ''}`}
                    onClick={() => setActiveEndpoint(endpoint.id)}
                  >
                    <span className="method-badge">{endpoint.method}</span>
                    {endpoint.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="api-content">
            {endpoints.map(endpoint => (
              endpoint.id === activeEndpoint && (
                <div key={endpoint.id} className="endpoint-details">
                  <div className="endpoint-header">
                    <h2>{endpoint.name}</h2>
                    <div className="endpoint-path">
                      <span className="method">{endpoint.method}</span>
                      <code>{endpoint.path}</code>
                    </div>
                  </div>
                  
                  <div className="endpoint-description">
                    <p>{endpoint.description}</p>
                  </div>
                  
                  <div className="endpoint-section">
                    <h3>Request Parameters</h3>
                    <table className="params-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Type</th>
                          <th>Required</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {endpoint.parameters.map((param, index) => (
                          <tr key={index}>
                            <td><code>{param.name}</code></td>
                            <td>{param.type}</td>
                            <td>{param.required ? 'Yes' : 'No'}</td>
                            <td>{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="endpoint-section">
                    <h3>Example Request</h3>
                    <pre className="code-block">{endpoint.requestExample}</pre>
                  </div>
                  
                  <div className="endpoint-section">
                    <h3>Example Response</h3>
                    <pre className="code-block">{endpoint.responseExample}</pre>
                  </div>
                  
                  <div className="endpoint-section">
                    <h3>Response Codes</h3>
                    <table className="params-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {endpoint.responses.map((response, index) => (
                          <tr key={index}>
                            <td><code>{response.code}</code></td>
                            <td>{response.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="security-section">
          <h2>Security Guidelines</h2>
          <div className="security-grid">
            {securityGuidelines.map((guideline, index) => (
              <div key={index} className="security-item">
                <div className="security-icon">
                  {guideline.icon}
                </div>
                <div className="security-content">
                  <h3>{guideline.title}</h3>
                  <p>{guideline.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="api-getting-started">
          <h2>Getting Started</h2>
          <div className="getting-started-content">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Request API Access</h3>
                <p>Contact the MCCS system administrator to request API access credentials for your application.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Authenticate</h3>
                <p>Use your credentials to obtain an access token via the authentication endpoint.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Make API Calls</h3>
                <p>Include your access token in the Authorization header for all subsequent API requests.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Implement Error Handling</h3>
                <p>Ensure your application properly handles API errors and rate limiting responses.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="api-footer">
          <p>For additional support, contact the MCCS Developer Support Team at <a href="mailto:mccs-dev-support@usmc.mil">mccs-dev-support@usmc.mil</a></p>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
