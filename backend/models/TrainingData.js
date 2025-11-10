import mongoose from 'mongoose';

const trainingDataSchema = new mongoose.Schema({
  // Reference to TrainingDataset version
  datasetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TrainingDataset', 
    required: true,
    index: true
  },
  datasetVersion: { type: String, required: true, index: true },
  
  // Split indicator (train or test)
  dataType: { 
    type: String, 
    enum: ['train', 'test'],
    required: true,
    index: true
  },
  
  // ALL CSV COLUMNS (exact match from your CSV)
  "Transaction ID": { type: String, required: true },
  "Customer ID": { type: String, required: true },
  "Transaction Amount": { type: Number, required: true },
  "Transaction Date": { type: String, required: true }, // Keep as string to preserve format
  "Payment Method": { type: String, required: true },
  "Product Category": { type: String, required: true },
  "Quantity": { type: Number, required: true },
  "Customer Age": { type: Number, required: true },
  "Customer Location": { type: String, required: true },
  "Device Used": { type: String, required: true },
  "IP Address": { type: String, required: true },
  "Shipping Address": { type: String, required: true }, // Handles multi-line
  "Billing Address": { type: String, required: true },   // Handles multi-line
  "Is Fraudulent": { type: Number, required: true }, // 0 or 1
  "Account Age Days": { type: Number, required: true },
  "Transaction Hour": { type: Number, required: true }
  
}, { 
  timestamps: false, // Don't add createdAt/updatedAt to transaction rows
  strict: false // Allow additional fields if CSV changes
});

// Compound indexes for efficient queries
trainingDataSchema.index({ datasetId: 1, dataType: 1 });
trainingDataSchema.index({ datasetVersion: 1, dataType: 1 });
trainingDataSchema.index({ "Transaction ID": 1 });

export default mongoose.model('TrainingData', trainingDataSchema);

