import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  // Store user role for easier filtering
  userRole: {
    type: String,
    enum: ['Admin', 'Developer', 'StoreManager'],
    required: true
  },
  // For StoreManagers, track which store the conversation is related to
  storeRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: false
  },
  storeID: {
    type: String,
    required: false
  },
  // Track if this is an active conversation
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatLogSchema.index({ userId: 1, lastMessageAt: -1 });
chatLogSchema.index({ userId: 1, isActive: 1, lastMessageAt: -1 });
chatLogSchema.index({ title: 'text', 'messages.text': 'text' });

const ChatLog = mongoose.model('ChatLog', chatLogSchema);
export default ChatLog;
