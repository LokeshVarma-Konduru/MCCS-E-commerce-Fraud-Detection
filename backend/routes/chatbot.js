// routes/chatbot.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  askChatbot,
  getChatHistory,
  getChatById,
  createNewChat,
  deleteChatSession,
  updateTransactionStatus
} from '../controllers/chatbotController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Rate limiter: 20 requests per minute per user
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after a minute.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Chatbot routes - all require authentication
router.post('/ask', authMiddleware, chatbotLimiter, askChatbot);
router.get('/history', authMiddleware, getChatHistory);
router.get('/chat/:id', authMiddleware, getChatById);
router.post('/new', authMiddleware, createNewChat);
router.delete('/chat/:id', authMiddleware, deleteChatSession);
router.put('/transaction/status', authMiddleware, chatbotLimiter, updateTransactionStatus);

export default router;
