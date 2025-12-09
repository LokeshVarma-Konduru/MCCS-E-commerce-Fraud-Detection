import React, { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import FraudScoreIndicator from './FraudScoreIndicator';

const TransactionReviewModal = ({ isOpen, onClose, transaction, onUpdateStatus }) => {
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Review Transaction</h2>
          <button 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Alert Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">High Risk Transaction Detected</h3>
              <p className="text-sm text-red-700">This transaction has been flagged for review due to suspicious activity.</p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Transaction ID:</span>
                <p className="text-sm text-gray-900 font-mono mt-1">{transaction?.id || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Amount:</span>
                <p className="text-sm text-gray-900 font-semibold mt-1">{transaction?.amount || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Timestamp:</span>
                <p className="text-sm text-gray-900 mt-1">{transaction?.timestamp || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Fraud Score:</span>
                <div className="mt-1">
                  {transaction?.score ? <FraudScoreIndicator score={transaction.score} /> : 'N/A'}
                </div>
              </div>
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

          {/* Decision Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Decision</h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                className={`px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  decision === 'approved' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setDecision('approved')}
              >
                Approve Transaction
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  decision === 'rejected' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setDecision('rejected')}
              >
                Flag as Fraudulent
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  decision === 'under_review' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setDecision('under_review')}
              >
                Mark for Review
              </button>
            </div>

            {/* Notes Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Notes:</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add notes about your decision..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button 
              className="w-full px-6 py-3 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              onClick={() => {
                if (!decision) {
                  alert('Please select a decision first');
                  return;
                }
                onUpdateStatus(transaction.id, decision, notes);
              }}
            >
              SUBMIT DECISION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReviewModal;
