import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const apiKeySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  key: { 
    type: String, 
    required: true,
    default: () => uuidv4().replace(/-/g, '')
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastUsed: { 
    type: Date 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
});

// Create a unique index on userId to ensure one user has only one API key
apiKeySchema.index({ userId: 1 }, { unique: true });

export default mongoose.model('ApiKey', apiKeySchema);
