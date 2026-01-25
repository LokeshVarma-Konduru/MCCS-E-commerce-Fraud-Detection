import mongoose from 'mongoose';

const trainingDatasetSchema = new mongoose.Schema({
  // Basic Identification
  datasetName: { type: String, required: true },
  version: { type: String, required: true }, // e.g., "v1.0.0"
  
  // Upload Information
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  originalFilename: { type: String, required: true },
  
  // Dataset Statistics
  totalRows: { type: Number, required: true },
  trainRows: { type: Number, required: true }, // 80%
  testRows: { type: Number, required: true },   // 20%
  
  // Column Information (exact match from CSV)
  columns: {
    type: [String],
    required: true,
    default: [
      "Transaction ID",
      "Customer ID",
      "Transaction Amount",
      "Transaction Date",
      "Payment Method",
      "Product Category",
      "Quantity",
      "Customer Age",
      "Customer Location",
      "Device Used",
      "IP Address",
      "Shipping Address",
      "Billing Address",
      "Is Fraudulent",
      "Account Age Days",
      "Transaction Hour"
    ]
  },
  
  // Split Configuration
  splitRatio: {
    train: { type: Number, default: 0.8 },
    test: { type: Number, default: 0.2 }
  },
  
  // Dataset Statistics
  metadata: {
    dateRange: {
      start: Date,
      end: Date
    },
    fraudRate: { type: Number }, // Percentage
    totalAmount: { type: Number },
    minAmount: { type: Number },
    maxAmount: { type: Number }
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'split_completed', 'ready', 'failed'],
    default: 'uploaded'
  },
  
  // Version Tracking
  isActive: { type: Boolean, default: true },
  parentVersion: { type: String }, // Previous version if this is an update
  
  // Processing Info
  processedAt: Date,
  splitCompletedAt: Date,
  errorMessage: { type: String }
  
}, { timestamps: true });

// Indexes for efficient queries
trainingDatasetSchema.index({ version: 1 });
trainingDatasetSchema.index({ uploadedBy: 1, createdAt: -1 });
trainingDatasetSchema.index({ status: 1 });
trainingDatasetSchema.index({ isActive: 1 });

export default mongoose.model('TrainingDataset', trainingDatasetSchema);

