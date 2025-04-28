// models/transactionModel.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['credit card', 'debit card', 'bank transfer', 'PayPal'], required: true },
  productCategory: { type: String, enum: ['electronics', 'home & garden', 'clothing', 'toys & games', 'health & beauty'], required: true },
  quantity: { type: Number, required: true },
  customerAge: { type: Number, required: true },
  deviceUsed: { type: String, enum: ['mobile', 'desktop', 'tablet'], required: true },
  accountAgeDays: { type: Number, required: true },
  transactionHour: { type: Number, required: true },
  transactionDay: { type: Number, required: true },
  transactionDOW: { type: Number, required: true },
  transactionMonth: { type: Number, required: true },
  isAddressMatch: { type: Number, required: true },
  modelUsed: { type: String, enum: ['logistic-regression', 'bernoulli-nb', 'xgboost', 'decision-tree'], required: true },
  
  // Add transaction type (online or in-store)
  transactionType: { 
    type: String, 
    enum: ['online', 'in-store'],
    default: 'online' // Default to online if not specified
  },
  
  // Reference to the user who made the API call
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false // Not required because some transactions might be from the test system
  },
  
  // The model's prediction (XGBoost output). Default is an empty array, but it is still "required."
  predictions: {
    type: [Number],
    default: [],
    required: true
  },
  
  // The model's probability/confidence scores
  probabilities: {
    type: [[Number]],
    default: [],
    required: true
  },
  
  // Transaction status for manual review
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  
  // Review notes
  notes: {
    type: String,
    default: ''
  },
  
  // Risk score (calculated from probability)
  riskScore: {
    type: Number,
    default: 0
  },
  
  // Reviewer information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // Review timestamp
  reviewedAt: {
    type: Date,
    required: false
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now, required: true }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
