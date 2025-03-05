// models/transactionModel.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  productCategory: { type: String, required: true },
  quantity: { type: Number, required: true },
  customerAge: { type: Number, required: true },
  deviceUsed: { type: String, required: true },
  accountAgeDays: { type: Number, required: true },
  transactionHour: { type: Number, required: true },
  transactionDay: { type: Number, required: true },
  transactionDOW: { type: Number, required: true },
  transactionMonth: { type: Number, required: true },
  isAddressMatch: { type: Number, required: true },
  modelUsed: { type: String, required: true },
  
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

  // Timestamps
  createdAt: { type: Date, default: Date.now, required: true }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
