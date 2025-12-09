import React, { useState } from 'react';
import '../styles/Help.css';
import { Link } from 'react-router-dom';
import { FaLightbulb, FaChartLine, FaChartPie, FaUserShield, 
  FaCode, FaStore, FaKey, FaExclamationTriangle, FaLock, FaDatabase, 
  FaClipboardCheck, FaChartBar, FaList, FaTools, FaPlus, FaMinus, FaBook, FaExternalLinkAlt, 
  FaRobot, FaFileAlt, FaBrain, FaEye, FaComments, FaTachometerAlt, FaPlug, FaCopy } from 'react-icons/fa';

const Help = () => {
  const [activeTab, setActiveTab] = useState('admin');
  const [expandedFaqs, setExpandedFaqs] = useState({});

  const toggleFaq = (id) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Documentation data
  const documentationData = {
    admin: [
      {
        title: 'Admin Dashboard Overview',
        icon: <FaChartLine />,
        content: (
          <>
            <p>The Admin Dashboard provides a comprehensive view of the MCCS Fraud Detection system, including key metrics, trends, and management tools.</p>
            <h4>Key Features</h4>
            <ul>
              <li>System-wide fraud metrics and KPIs</li>
              <li>User management for all system roles</li>
              <li>Configuration settings for detection algorithms</li>
            </ul>
          </>
        )
      },
      {
        title: 'Key Metrics Panel',
        icon: <FaChartPie />,
        content: (
          <>
            <p>The metrics panel displays critical fraud detection statistics that update based on the selected time period.</p>
            <h4>Available Metrics</h4>
            <ul>
              <li>Fraud Rate: Percentage of transactions flagged as fraudulent</li>
              <li>False Positive Rate: Percentage of legitimate transactions incorrectly flagged</li>
              <li>Total Savings: Estimated financial impact of prevented fraud</li>
            </ul>
          </>
        )
      },
      {
        title: 'User Management',
        icon: <FaUserShield />,
        content: (
          <>
            <p>Manage all system users, their roles, and permissions.</p>
            <h4>Capabilities</h4>
            <ul>
              <li>Create, edit, and deactivate user accounts</li>
              <li>Assign and modify user roles</li>
              <li>Reset passwords and manage access controls</li>
            </ul>
          </>
        )
      },
      {
        title: 'Reports Generation',
        icon: <FaFileAlt />,
        content: (
          <>
            <p>Generate comprehensive fraud detection reports for analysis and compliance.</p>
            <h4>Available Reports</h4>
            <ul>
              <li>Fraud detection summaries by time period (24h, 7d, 30d)</li>
              <li>Merchant category analysis and trends</li>
              <li>Financial impact and ROI metrics</li>
              <li>Export reports as PDF for sharing</li>
            </ul>
          </>
        )
      },
      {
        title: 'Manual Transaction Flagging',
        icon: <FaExclamationTriangle />,
        content: (
          <>
            <p>Manually flag suspicious transactions for review and investigation.</p>
            <h4>Key Features</h4>
            <ul>
              <li>Flag transactions as fraud from any dashboard</li>
              <li>Add detailed notes and evidence</li>
              <li>Track flagged transactions in Recent Alerts</li>
              <li>Review and update flagged transaction status</li>
            </ul>
          </>
        )
      }
    ],
    developer: [
      {
        title: 'Architecture & Data Flow',
        icon: <FaChartBar />,
        content: (
          <>
            <p>Two-tier app: React/Vite frontend (port 5173) consuming Express/Node backend (port 9000) that serves REST under <code>/mccs</code>. MongoDB persists users, transactions, models, and chat logs. Socket.io enables real-time alerts. Gemini API powers the chatbot responses. Frontend auth uses HTTP-only cookies issued by the backend.</p>
            <h4>Flow (happy-path)</h4>
            <ul>
              <li>User logs in → backend sets auth cookie → React routes are unlocked.</li>
              <li>Dashboards fetch KPIs and transaction data via <code>/mccs/*</code> APIs.</li>
              <li>Chatbot calls <code>/mccs/chatbot/ask</code>; backend stores messages in <code>ChatLog</code> and calls Gemini.</li>
              <li>Alerts stream over Socket.io rooms scoped by role/store.</li>
            </ul>
          </>
        )
      },
      {
        title: 'Repository Structure',
        icon: <FaList />,
        content: (
          <>
            <ul>
              <li><code>/backend</code>: Express entry <code>index.js</code>; routes under <code>routes/</code>; controllers (incl. chatbot) under <code>controllers/</code>; Mongoose models in <code>models/</code>; middleware for auth/admin; ML assets in <code>ml_models/</code>.</li>
              <li><code>/frontend</code>: Vite React app; pages in <code>src/pages</code>; shared components in <code>src/components</code>; hooks (e.g., <code>useChatbot</code>) in <code>src/hooks</code>; styles in <code>src/styles</code>; API helper in <code>src/api.js</code>.</li>
              <li><code>/ML-Models</code>: notebooks, preprocessing scripts, and model artifacts for offline training.</li>
            </ul>
          </>
        )
      },
      {
        title: 'Runbook (Dev)',
        icon: <FaTools />,
        content: (
          <>
            <h4>Env keys (backend)</h4>
            <ul>
              <li><code>PORT</code> (default 9000), <code>MONGO_URI</code>, <code>JWT_SECRET</code>, <code>FRONTEND_URL</code> (e.g., http://localhost:5173), <code>GEMINI_API_KEY</code>.</li>
            </ul>
            <h4>Commands</h4>
            <ul>
              <li>Backend: <code>cd backend && npm install && npm start</code></li>
              <li>Frontend: <code>cd frontend && npm install && npm run dev</code></li>
              <li>API base: <code>http://localhost:9000/mccs</code> (protected by auth cookie)</li>
            </ul>
          </>
        )
      },
      {
        title: 'Transaction Monitoring',
        icon: <FaEye />,
        content: (
          <>
            <p>Monitor and review all transactions in real-time with advanced filtering capabilities.</p>
            <h4>Key Features</h4>
            <ul>
              <li>Real-time transaction feed with fraud scores</li>
              <li>Advanced filters (date, amount, store, status)</li>
              <li>Transaction review modal with detailed information</li>
              <li>Manual status updates and flagging</li>
              <li>Fraud trend visualization and analytics</li>
            </ul>
          </>
        )
      },
      {
        title: 'Chatbot & History',
        icon: <FaLightbulb />,
        content: (
          <>
            <ul>
              <li>Endpoint: <code>POST /mccs/chatbot/ask</code> with optional <code>chatSessionId</code>; chat persisted in <code>ChatLog</code>.</li>
              <li>History: <code>GET /mccs/chatbot/history</code> supports <code>search</code>, <code>status</code>, <code>startDate</code>, <code>includeInactive</code>; frontend sidebar includes search + status/date filters.</li>
              <li>Deletes: <code>DELETE /mccs/chatbot/chat/:id</code> marks sessions inactive.</li>
              <li>Transactions: <code>PUT /mccs/chatbot/transaction/status</code> enforces role-based store scoping.</li>
            </ul>
          </>
        )
      },
      {
        title: 'Model Performance & Training',
        icon: <FaBrain />,
        content: (
          <>
            <p>Monitor ML model performance and train new models with custom datasets.</p>
            <h4>Key Features</h4>
            <ul>
              <li>View current model metrics (accuracy, precision, recall, F1-score)</li>
              <li>Upload custom training datasets (CSV, XLSX, JSON)</li>
              <li>Configure hyperparameters for model training</li>
              <li>Track model training progress and results</li>
              <li>Compare model performance over time</li>
            </ul>
          </>
        )
      },
      {
        title: 'Security & Testing',
        icon: <FaLock />,
        content: (
          <>
            <ul>
              <li>Auth: JWT in HTTP-only cookie; routes behind auth middleware; rate limiting on chatbot endpoints.</li>
              <li>RBAC: Admin/Developer/StoreManager enforced in controllers and Socket.io room joins.</li>
              <li>Tests: <code>npm test</code> in backend runs Jest with in-memory Mongo; add integration tests under <code>backend/tests</code>.</li>
            </ul>
            <div className="api-docs-link">
              <Link to="/api-docs">
                <FaBook /> View Complete API Documentation <FaExternalLinkAlt />
              </Link>
            </div>
          </>
        )
      },
      {
        title: 'AI Chatbot Assistant',
        icon: <FaRobot />,
        content: (
          <>
            <p>Get instant help and insights using the AI-powered chatbot assistant.</p>
            <h4>Key Features</h4>
            <ul>
              <li>Natural language queries about fraud detection</li>
              <li>Transaction lookup and analysis</li>
              <li>System guidance and troubleshooting</li>
              <li>Chat history and session management</li>
              <li>Export chat conversations</li>
            </ul>
          </>
        )
      }
    ],
    manager: [
      {
        title: 'Store Manager Dashboard',
        icon: <FaStore />,
        content: (
          <>
            <p>View store-specific fraud metrics and transaction data.</p>
            <h4>Key Features</h4>
            <ul>
              <li>Store-specific fraud rates and trends</li>
              <li>Transaction review and investigation tools</li>
              <li>Reporting capabilities for your location</li>
            </ul>
          </>
        )
      },
      {
        title: 'Transaction Review',
        icon: <FaClipboardCheck />,
        content: (
          <>
            <p>Review flagged transactions and take appropriate actions.</p>
            <h4>Available Actions</h4>
            <ul>
              <li>Approve or decline flagged transactions</li>
              <li>Add notes and evidence to case files</li>
              <li>Escalate complex cases to fraud specialists</li>
              <li>Manually flag suspicious transactions</li>
            </ul>
          </>
        )
      },
      {
        title: 'AI Chatbot Support',
        icon: <FaComments />,
        content: (
          <>
            <p>Access the AI chatbot for instant assistance with store operations.</p>
            <h4>Available Support</h4>
            <ul>
              <li>Ask questions about specific transactions</li>
              <li>Get fraud detection insights for your store</li>
              <li>Receive guidance on handling flagged transactions</li>
              <li>Access help documentation through chat</li>
            </ul>
          </>
        )
      }
    ],
    performance: [
      {
        title: 'Browser Optimization',
        icon: <FaTachometerAlt />,
        content: (
          <>
            <p>Optimize your browser for the best experience with the MCCS Fraud Detection System.</p>
            <h4>Recommended Settings</h4>
            <ul>
              <li>Use the latest version of Chrome, Firefox, Edge, or Safari</li>
              <li>Enable JavaScript and cookies</li>
              <li>Clear browser cache weekly for optimal performance</li>
              <li>Disable unnecessary browser extensions that may interfere</li>
              <li>Use hardware acceleration if available</li>
            </ul>
          </>
        )
      },
      {
        title: 'Dashboard Performance',
        icon: <FaChartBar />,
        content: (
          <>
            <p>Tips for faster dashboard loading and smoother interactions.</p>
            <h4>Best Practices</h4>
            <ul>
              <li>Use specific date ranges instead of "All Time" for faster queries</li>
              <li>Apply filters before loading large datasets</li>
              <li>Limit concurrent dashboard tabs to 2-3 for best performance</li>
              <li>Refresh data manually instead of auto-refresh for large datasets</li>
              <li>Close unused browser tabs to free up memory</li>
            </ul>
          </>
        )
      },
      {
        title: 'Data Handling',
        icon: <FaDatabase />,
        content: (
          <>
            <p>Efficiently work with large transaction datasets and reports.</p>
            <h4>Optimization Tips</h4>
            <ul>
              <li>Export large datasets in batches rather than all at once</li>
              <li>Use CSV format for datasets over 10,000 transactions</li>
              <li>Schedule large report generation during off-peak hours</li>
              <li>Compress files before uploading for model training</li>
              <li>Use pagination when viewing transaction lists</li>
            </ul>
          </>
        )
      },
      {
        title: 'Model Training Performance',
        icon: <FaBrain />,
        content: (
          <>
            <p>Maximize efficiency when training custom fraud detection models.</p>
            <h4>Performance Guidelines</h4>
            <ul>
              <li>Keep training datasets under 25MB for optimal processing</li>
              <li>Use CSV format for fastest upload and processing</li>
              <li>Reduce hyperparameter trials (30-50) for faster training</li>
              <li>Train models during low-traffic periods</li>
              <li>Monitor training progress and cancel if needed</li>
            </ul>
          </>
        )
      },
      {
        title: 'Network & Connectivity',
        icon: <FaKey />,
        content: (
          <>
            <p>Ensure stable connection and optimal data transfer speeds.</p>
            <h4>Connection Tips</h4>
            <ul>
              <li>Use wired Ethernet connection for large file uploads</li>
              <li>Minimum 5 Mbps download speed recommended</li>
              <li>Avoid VPNs unless required for security compliance</li>
              <li>Check firewall settings if experiencing connection issues</li>
              <li>Contact IT if persistent timeout errors occur</li>
            </ul>
          </>
        )
      },
      {
        title: 'Report Generation',
        icon: <FaFileAlt />,
        content: (
          <>
            <p>Generate and export reports efficiently without performance issues.</p>
            <h4>Best Practices</h4>
            <ul>
              <li>Generate PDFs for periods under 30 days for faster processing</li>
              <li>Use "Download" instead of "Print" for better quality</li>
              <li>Close other applications when generating large reports</li>
              <li>Wait for report to fully load before downloading</li>
              <li>Save reports locally to avoid regenerating</li>
            </ul>
          </>
        )
      }
    ],
    integration: [
      {
        title: 'API Overview',
        icon: <FaPlug />,
        content: (
          <>
            <p>The MCCS Fraud Detection API provides programmatic access to fraud detection capabilities.</p>
            <h4>Key Features</h4>
            <ul>
              <li>RESTful API with JSON request/response format</li>
              <li>JWT-based authentication for secure access</li>
              <li>Rate limiting: 1000 requests per hour per API key</li>
              <li>Comprehensive error handling and status codes</li>
              <li>Webhook support for real-time fraud alerts</li>
            </ul>
            <div className="api-docs-link">
              <Link to="/api-docs">
                <FaBook /> View Complete API Documentation <FaExternalLinkAlt />
              </Link>
            </div>
          </>
        )
      },
      {
        title: 'Authentication',
        icon: <FaLock />,
        content: (
          <>
            <p>Secure your API integration with proper authentication.</p>
            <h4>Authentication Flow</h4>
            <ul>
              <li>Obtain API key from Developer Dashboard</li>
              <li>Include key in Authorization header: <code>Bearer YOUR_API_KEY</code></li>
              <li>Keys expire after 90 days - rotate regularly</li>
              <li>Never expose API keys in client-side code</li>
              <li>Use environment variables to store keys securely</li>
            </ul>
            <h4>Example Request</h4>
            <pre className="code-block">
              <code>{`curl -X POST https://api.mccs-fraud.com/v1/predict \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 150.00, "payment_method": "credit_card"}'`}</code>
            </pre>
          </>
        )
      },
      {
        title: 'Fraud Prediction Endpoint',
        icon: <FaBrain />,
        content: (
          <>
            <p>Submit transactions for real-time fraud detection analysis.</p>
            <h4>Endpoint Details</h4>
            <ul>
              <li><strong>URL:</strong> <code>POST /api/v1/predict</code></li>
              <li><strong>Rate Limit:</strong> 100 requests per minute</li>
              <li><strong>Response Time:</strong> ~200ms average</li>
              <li><strong>Timeout:</strong> 5 seconds</li>
            </ul>
            <h4>Request Body</h4>
            <pre className="code-block">
              <code>{`{
  "transaction_amount": 150.00,
  "payment_method": "credit_card",
  "customer_age": 35,
  "product_category": "Electronics",
  "device_used": "Mobile"
}`}</code>
            </pre>
            <h4>Response</h4>
            <pre className="code-block">
              <code>{`{
  "fraud_probability": 0.23,
  "prediction": "legitimate",
  "risk_level": "low",
  "transaction_id": "txn_abc123"
}`}</code>
            </pre>
          </>
        )
      },
      {
        title: 'Webhooks',
        icon: <FaExclamationTriangle />,
        content: (
          <>
            <p>Receive real-time notifications when high-risk transactions are detected.</p>
            <h4>Setup Instructions</h4>
            <ul>
              <li>Configure webhook URL in Developer Dashboard</li>
              <li>Endpoint must accept POST requests with JSON payload</li>
              <li>Respond with 200 status code within 5 seconds</li>
              <li>Implement signature verification for security</li>
              <li>Handle retries for failed deliveries (3 attempts)</li>
            </ul>
            <h4>Webhook Payload</h4>
            <pre className="code-block">
              <code>{`{
  "event": "fraud.detected",
  "transaction_id": "txn_xyz789",
  "fraud_probability": 0.89,
  "risk_level": "critical",
  "timestamp": "2025-12-08T14:30:00Z"
}`}</code>
            </pre>
          </>
        )
      },
      {
        title: 'Error Handling',
        icon: <FaTools />,
        content: (
          <>
            <p>Properly handle API errors and implement retry logic.</p>
            <h4>HTTP Status Codes</h4>
            <ul>
              <li><strong>200:</strong> Success - Request processed successfully</li>
              <li><strong>400:</strong> Bad Request - Invalid input data</li>
              <li><strong>401:</strong> Unauthorized - Invalid or missing API key</li>
              <li><strong>429:</strong> Rate Limit Exceeded - Too many requests</li>
              <li><strong>500:</strong> Server Error - Internal system error</li>
            </ul>
            <h4>Best Practices</h4>
            <ul>
              <li>Implement exponential backoff for retries</li>
              <li>Log all API errors for debugging</li>
              <li>Validate input data before sending requests</li>
              <li>Monitor rate limit headers in responses</li>
              <li>Set appropriate timeout values (5-10 seconds)</li>
            </ul>
          </>
        )
      },
      {
        title: 'Code Examples',
        icon: <FaCopy />,
        content: (
          <>
            <p>Sample code snippets for common integration scenarios.</p>
            <h4>Python Example</h4>
            <pre className="code-block">
              <code>{`import requests

API_KEY = "your_api_key_here"
API_URL = "https://api.mccs-fraud.com/v1/predict"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

data = {
    "transaction_amount": 150.00,
    "payment_method": "credit_card",
    "customer_age": 35
}

response = requests.post(API_URL, json=data, headers=headers)
result = response.json()

if result["risk_level"] == "high":
    print("High risk transaction detected!")`}</code>
            </pre>
            <h4>JavaScript Example</h4>
            <pre className="code-block">
              <code>{`const API_KEY = 'your_api_key_here';
const API_URL = 'https://api.mccs-fraud.com/v1/predict';

const predictFraud = async (transactionData) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transactionData)
  });
  
  return await response.json();
};`}</code>
            </pre>
          </>
        )
      }
    ]
  };

  // FAQ data
  const faqData = {
    general: [
      {
        id: 'general-1',
        question: 'What is the MCCS Fraud Detection System?',
        answer: 'The MCCS Fraud Detection System is a specialized platform designed to identify and prevent fraudulent transactions across MCCS retail operations. It uses advanced algorithms to analyze transaction patterns and flag suspicious activities for review.'
      },
      {
        id: 'general-2',
        question: 'How do I navigate the dashboard?',
        answer: 'Use the sidebar menu to access different sections of the system. The hamburger icon in the top-left corner expands or collapses the sidebar. Your available options depend on your assigned role.'
      },
      {
        id: 'general-3',
        question: 'I forgot my password. What should I do?',
        answer: 'Click the "Forgot Password" link on the login page. You will receive an email with instructions to reset your password. If you don\'t receive the email, contact your system administrator.'
      }
    ],
    admin: [
      {
        id: 'admin-1',
        question: 'How do I add a new user to the system?',
        answer: 'Navigate to the User Management section, click "Add New User," and fill in the required information. Assign the appropriate role and permissions, then save the new user profile.'
      },
      {
        id: 'admin-2',
        question: 'Can I customize the dashboard metrics?',
        answer: 'Yes. Go to Dashboard Settings and select "Configure Metrics." You can choose which metrics to display, set custom date ranges, and adjust visualization preferences.'
      },
      {
        id: 'admin-3',
        question: 'How do I generate fraud detection reports?',
        answer: 'Navigate to the Reports page from the sidebar. Select your desired time period (24 hours, 7 days, or 30 days), review the generated report, and click "Download PDF" to export it for sharing or archival.'
      },
      {
        id: 'admin-4',
        question: 'How do I manually flag a transaction as fraud?',
        answer: 'You can flag transactions from any dashboard view. Click on a transaction, select "Flag as Fraud," add detailed notes about why you\'re flagging it, and submit. The transaction will appear in Recent Alerts for all administrators.'
      },
      {
        id: 'admin-5',
        question: 'What is the AI Chatbot and how do I use it?',
        answer: 'The AI Chatbot is an intelligent assistant that can answer questions about fraud detection, look up transaction details, and provide system guidance. Access it from the sidebar menu and type your questions in natural language. Your chat history is automatically saved.'
      }
    ],
    developer: [
      {
        id: 'dev-1',
        question: 'How do I modify fraud detection rules?',
        answer: 'Access the Algorithm Management section, select the rule you want to modify, and use the rule editor to make changes. Test your changes in the sandbox environment before deploying to production.'
      },
      {
        id: 'dev-2',
        question: 'Where can I find the API documentation?',
        answer: 'API documentation is available in the Developer Tools section under "API Reference." You\'ll find endpoint descriptions, request/response formats, and authentication requirements.'
      },
      {
        id: 'dev-3',
        question: 'How do I monitor transactions in real-time?',
        answer: 'Use the Transaction Monitoring page to view all transactions with real-time fraud scores. You can filter by date range, amount, store, fraud score, and review status. Click any transaction to see detailed information and take action.'
      },
      {
        id: 'dev-4',
        question: 'How do I train a new fraud detection model?',
        answer: 'Go to Model Performance page, upload your training dataset (CSV, XLSX, or JSON format), configure hyperparameters if needed, and click "Train Model." The system will process your data and display training results including accuracy, precision, recall, and F1-score.'
      },
      {
        id: 'dev-5',
        question: 'What file formats are supported for model training?',
        answer: 'The system supports CSV, XLSX, JSON, and TXT files up to 25MB. Your dataset should include transaction features and a fraud label column. The system will automatically detect and process the appropriate columns.'
      },
      {
        id: 'dev-6',
        question: 'How can I use the AI Chatbot for development tasks?',
        answer: 'The AI Chatbot can help with API queries, transaction analysis, system troubleshooting, and general fraud detection questions. It has access to transaction data and can provide insights based on your specific queries.'
      }
    ],
    manager: [
      {
        id: 'manager-1',
        question: 'How do I review flagged transactions?',
        answer: 'Go to the Transaction Review section to see all flagged transactions for your store. Click on any transaction to view details and take action (approve, decline, or escalate).'
      },
      {
        id: 'manager-2',
        question: 'How are fraud metrics calculated for my store?',
        answer: 'Store metrics are calculated based on transactions processed at your location. The system compares your current metrics to historical data and similar stores to identify unusual patterns.'
      },
      {
        id: 'manager-3',
        question: 'Can I use the AI Chatbot to check transaction details?',
        answer: 'Yes! The AI Chatbot can look up specific transactions by ID, analyze fraud patterns at your store, and provide recommendations for handling suspicious transactions. Just ask your question in natural language.'
      },
      {
        id: 'manager-4',
        question: 'How do I manually flag a suspicious transaction?',
        answer: 'Click on any transaction in your dashboard, select "Flag as Fraud," provide detailed notes about your concerns, and submit. The flagged transaction will be escalated to administrators and appear in the Recent Alerts section.'
      }
    ]
  };

  // Glossary terms
  const glossaryTerms = [
    {
      term: 'False Positive',
      definition: 'A legitimate transaction incorrectly identified as fraudulent.'
    },
    {
      term: 'Fraud Rate',
      definition: 'The percentage of transactions flagged as potentially fraudulent.'
    },
    {
      term: 'Rule-Based Detection',
      definition: 'Fraud detection method using predefined rules to identify suspicious transactions.'
    },
    {
      term: 'Machine Learning Model',
      definition: 'An algorithm that learns from historical data to predict fraudulent transactions.'
    },
    {
      term: 'Risk Score',
      definition: 'A numerical value indicating the likelihood that a transaction is fraudulent.'
    },
    {
      term: 'Chargeback',
      definition: 'A transaction reversal initiated by the customer\'s bank, often due to fraud.'
    },
    {
      term: 'AI Chatbot',
      definition: 'An intelligent assistant that uses natural language processing to answer questions, analyze transactions, and provide fraud detection guidance.'
    },
    {
      term: 'Transaction Monitoring',
      definition: 'Real-time surveillance of all transactions with filtering, analysis, and review capabilities.'
    },
    {
      term: 'Model Training',
      definition: 'The process of teaching the fraud detection algorithm using historical transaction data to improve accuracy.'
    },
    {
      term: 'Hyperparameters',
      definition: 'Configuration settings that control how the machine learning model learns from data (e.g., learning rate, number of estimators).'
    },
    {
      term: 'Precision',
      definition: 'The percentage of transactions flagged as fraud that are actually fraudulent. Higher precision means fewer false positives.'
    },
    {
      term: 'Recall',
      definition: 'The percentage of actual fraud cases that the system successfully detects. Higher recall means fewer missed fraud cases.'
    },
    {
      term: 'F1-Score',
      definition: 'A balanced metric combining precision and recall to evaluate overall model performance.'
    },
    {
      term: 'Manual Flagging',
      definition: 'The ability for users to manually mark transactions as suspicious or fraudulent based on their expertise and investigation.'
    }
  ];

  return (
    <div className="help-container">
      <div className="help-content">
        <div className="help-hero">
          <div className="hero-content">
            <h1>MCCS Fraud Detection Help Center</h1>
            <p className="help-hero__intro">Find documentation, guides, and answers to common questions</p>
          </div>
        </div>

        <div className="help-main">
          <div className="help-tabs">
            <button 
              className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <span className="tab-icon"><FaUserShield /></span>
              Admin Documentation
            </button>
            <button 
              className={`tab-button ${activeTab === 'developer' ? 'active' : ''}`}
              onClick={() => setActiveTab('developer')}
            >
              <span className="tab-icon"><FaCode /></span>
              Developer Documentation
            </button>
            <button 
              className={`tab-button ${activeTab === 'manager' ? 'active' : ''}`}
              onClick={() => setActiveTab('manager')}
            >
              <span className="tab-icon"><FaStore /></span>
              Store Manager Documentation
            </button>
            <button 
              className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              <span className="tab-icon"><FaTachometerAlt /></span>
              Performance Tips
            </button>
            <button 
              className={`tab-button ${activeTab === 'integration' ? 'active' : ''}`}
              onClick={() => setActiveTab('integration')}
            >
              <span className="tab-icon"><FaPlug /></span>
              Integration Guide
            </button>
            <button 
              className={`tab-button ${activeTab === 'glossary' ? 'active' : ''}`}
              onClick={() => setActiveTab('glossary')}
            >
              <span className="tab-icon"><FaList /></span>
              Glossary
            </button>
          </div>

          {activeTab === 'admin' && (
            <>
              <div className="documentation-section">
                <h2>Admin Documentation</h2>
                <div className="documentation-grid">
                  {documentationData.admin.map((item, index) => (
                    <div className="documentation-item" key={index}>
                      <div className="documentation-header">
                        <span className="doc-icon">{item.icon}</span>
                        <h3>{item.title}</h3>
                      </div>
                      <div className="documentation-content">
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="faq-section">
                <h2>Admin FAQs</h2>
                <div className="faq-list">
                  {[...faqData.general, ...faqData.admin].map((faq) => (
                    <div className="faq-item" key={faq.id}>
                      <div 
                        className={`faq-question ${expandedFaqs[faq.id] ? 'active' : ''}`}
                        onClick={() => toggleFaq(faq.id)}
                      >
                        <h3>{faq.question}</h3>
                        <span className="toggle-icon">
                          {expandedFaqs[faq.id] ? <FaMinus /> : <FaPlus />}
                        </span>
                      </div>
                      {expandedFaqs[faq.id] && (
                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'developer' && (
            <>
              <div className="api-banner">
                <div className="api-banner-content">
                  <div className="api-banner-icon"><FaKey /></div>
                  <div className="api-banner-text">
                    <h3>API Integration</h3>
                    <p>Access our comprehensive API documentation for integrating with the MCCS Fraud Detection System.</p>
                  </div>
                  <Link to="/api-docs" className="api-banner-button">
                    View API Docs <FaExternalLinkAlt />
                  </Link>
                </div>
              </div>
              <div className="documentation-section">
                <h2>Developer Documentation</h2>
                <div className="documentation-grid">
                  {documentationData.developer.map((item, index) => (
                    <div className="documentation-item" key={index}>
                      <div className="documentation-header">
                        <span className="doc-icon">{item.icon}</span>
                        <h3>{item.title}</h3>
                      </div>
                      <div className="documentation-content">
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="faq-section">
                <h2>Developer FAQs</h2>
                <div className="faq-list">
                  {[...faqData.general, ...faqData.developer].map((faq) => (
                    <div className="faq-item" key={faq.id}>
                      <div 
                        className={`faq-question ${expandedFaqs[faq.id] ? 'active' : ''}`}
                        onClick={() => toggleFaq(faq.id)}
                      >
                        <h3>{faq.question}</h3>
                        <span className="toggle-icon">
                          {expandedFaqs[faq.id] ? <FaMinus /> : <FaPlus />}
                        </span>
                      </div>
                      {expandedFaqs[faq.id] && (
                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'manager' && (
            <>
              <div className="documentation-section">
                <h2>Store Manager Documentation</h2>
                <div className="documentation-grid">
                  {documentationData.manager.map((item, index) => (
                    <div className="documentation-item" key={index}>
                      <div className="documentation-header">
                        <span className="doc-icon">{item.icon}</span>
                        <h3>{item.title}</h3>
                      </div>
                      <div className="documentation-content">
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="faq-section">
                <h2>Store Manager FAQs</h2>
                <div className="faq-list">
                  {[...faqData.general, ...faqData.manager].map((faq) => (
                    <div className="faq-item" key={faq.id}>
                      <div 
                        className={`faq-question ${expandedFaqs[faq.id] ? 'active' : ''}`}
                        onClick={() => toggleFaq(faq.id)}
                      >
                        <h3>{faq.question}</h3>
                        <span className="toggle-icon">
                          {expandedFaqs[faq.id] ? <FaMinus /> : <FaPlus />}
                        </span>
                      </div>
                      {expandedFaqs[faq.id] && (
                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'performance' && (
            <div className="documentation-section">
              <h2>Performance Tips</h2>
              <p className="section-intro">Optimize your experience with the MCCS Fraud Detection System for maximum efficiency and speed.</p>
              <div className="documentation-grid">
                {documentationData.performance.map((item, index) => (
                  <div className="documentation-item" key={index}>
                    <div className="documentation-header">
                      <span className="doc-icon">{item.icon}</span>
                      <h3>{item.title}</h3>
                    </div>
                    <div className="documentation-content">
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'integration' && (
            <div className="documentation-section">
              <h2>Integration Guide</h2>
              <p className="section-intro">Learn how to integrate the MCCS Fraud Detection API into your applications and systems.</p>
              <div className="documentation-grid">
                {documentationData.integration.map((item, index) => (
                  <div className="documentation-item" key={index}>
                    <div className="documentation-header">
                      <span className="doc-icon">{item.icon}</span>
                      <h3>{item.title}</h3>
                    </div>
                    <div className="documentation-content">
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'glossary' && (
            <div className="glossary-section">
              <h2>Fraud Detection Glossary</h2>
              <p className="glossary-intro">Common terms used in the MCCS Fraud Detection System</p>
              <div className="glossary-list">
                {glossaryTerms.map((item, index) => (
                  <div className="glossary-item" key={index}>
                    <h3 className="glossary-term">{item.term}</h3>
                    <p className="glossary-definition">{item.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Help;
