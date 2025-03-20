import React from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const TransactionReviewModal = ({ isOpen, onClose, transaction }) => {
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
                <span className="value score">{transaction?.score || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-group">
              <h3>Risk Factors</h3>
              <ul className="risk-factors">
                <li>Unusual transaction amount for customer profile</li>
                <li>Multiple transactions in short time period</li>
                <li>Shipping address differs from billing address</li>
              </ul>
            </div>

            <div className="detail-group">
              <h3>Decision</h3>
              <div className="decision-buttons">
                <button className="approve-button">
                  Approve Transaction
                </button>
                <button className="reject-button">
                  Flag as Fraudulent
                </button>
              </div>
              <div className="notes-field">
                <label>Notes:</label>
                <textarea 
                  placeholder="Add notes about your decision..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReviewModal;
