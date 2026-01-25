// models/ApiLog.js
import mongoose from 'mongoose';

const apiLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE']
  },
  statusCode: {
    type: Number,
    required: true
  },
  requestBody: {
    type: Object,
    default: {}
  },
  responseBody: {
    type: Object,
    default: {}
  },
  requestTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  responseTime: {
    type: Number, // in milliseconds
    required: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  apiKey: {
    type: String,
    required: true
  },
  modelUsed: {
    type: String,
    default: ''
  }
});

// Index for faster queries
apiLogSchema.index({ userId: 1, requestTime: -1 });
apiLogSchema.index({ apiKey: 1 });
apiLogSchema.index({ endpoint: 1, requestTime: -1 });

const ApiLog = mongoose.model('ApiLog', apiLogSchema);
export default ApiLog;
