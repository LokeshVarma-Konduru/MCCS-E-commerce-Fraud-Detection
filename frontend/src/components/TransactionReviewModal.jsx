import React, { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import FraudScoreIndicator from './FraudScoreIndicator';

const TransactionReviewModal = ({ isOpen, onClose, transaction, onUpdateStatus }) => {
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('');
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Review Transaction</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="alert-box">
            <FaExclamationTriangle className="alert-icon" />
            <div className="alert-message">
              <strong>High Risk Transaction Detected</strong>
              <p>This transaction has been flagged for review due to suspicious activity.</p>
            </div>
          </div>

          <div className="transaction-details">
            <div className="detail-group">
              <h3>Transaction Details</h3>
              <div className="detail-row">
                <span className="label">Transaction ID:</span>
                <span className="value">{transaction?.id || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span className="value">{transaction?.amount || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Timestamp:</span>
                <span className="value">{transaction?.timestamp || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Fraud Score:</span>
                <span className="value score">
                  {transaction?.score ? <FraudScoreIndicator score={transaction.score} /> : 'N/A'}
                </span>
              </div>
            </div>
{/* 
            <div className="detail-group">
              <h3>Risk Factors</h3>
              <ul className="risk-factors">
                <li>Unusual transaction amount for customer profile</li>
                <li>Multiple transactions in short time period</li>
                <li>Shipping address differs from billing address</li>
              </ul>
            </div> */}

            <div className="detail-group">
              <h3>Decision</h3>
              <div className="decision-buttons">
                <button 
                  className="approve-button" 
                  onClick={() => setDecision('approved')}
                  style={{ backgroundColor: decision === 'approved' ? '#10b981' : '' }}
                >
                  Approve Transaction
                </button>
                <button 
                  className="reject-button"
                  onClick={() => setDecision('rejected')}
                  style={{ backgroundColor: decision === 'rejected' ? '#ef4444' : '' }}
                >
                  Flag as Fraudulent
                </button>
                <button 
                  className="review-button"
                  onClick={() => setDecision('under_review')}
                  style={{ 
                    backgroundColor: decision === 'under_review' ? '#f59e0b' : '',
                    marginTop: '10px'
                  }}
                >
                  Mark for Review
                </button>
              </div>
              <div className="notes-field">
                <label>Notes:</label>
                <textarea 
                  placeholder="Add notes about your decision..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <button 
                  className="submit-button"
                  onClick={() => {
                    if (!decision) {
                      alert('Please select a decision first');
                      return;
                    }
                    onUpdateStatus(transaction.id, decision, notes);
                  }}
                  style={{
                    marginTop: '15px',
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Submit Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReviewModal;
