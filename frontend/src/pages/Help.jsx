import React, { useState } from 'react';
import '../styles/Help.css';
import { Link } from 'react-router-dom';
import { FaQuestionCircle, FaLightbulb, FaChartLine, FaChartPie, FaUserShield, 
  FaCode, FaStore, FaKey, FaExclamationTriangle, FaLock, FaDatabase, 
  FaClipboardCheck, FaChartBar, FaList, FaTools, FaPlus, FaMinus, FaBook, FaExternalLinkAlt } from 'react-icons/fa';
import Footer from '../components/Footer';

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
      }
    ],
    developer: [
      {
        title: 'Developer Tools',
        icon: <FaCode />,
        content: (
          <>
            <p>Access to the system's technical components and development tools.</p>
            <h4>Available Tools</h4>
            <ul>
              <li>API documentation and endpoints</li>
              <li>Algorithm configuration interface</li>
              <li>Testing environment for rule modifications</li>
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
        title: 'Algorithm Management',
        icon: <FaDatabase />,
        content: (
          <>
            <p>Configure and fine-tune the fraud detection algorithms.</p>
            <h4>Key Features</h4>
            <ul>
              <li>Rule creation and modification</li>
              <li>Threshold adjustments</li>
              <li>Model performance monitoring</li>
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
            </ul>
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
    }
  ];

  return (
    <div className="help-container">
      <div className="help-content">
        <div className="help-hero">
          <div className="hero-content">
            <div className="hero-icon">
              <FaQuestionCircle />
            </div>
            <h1>MCCS Fraud Detection Help Center</h1>
            <p>Find documentation, guides, and answers to common questions</p>
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
      <Footer />
    </div>
  );
};

export default Help;
