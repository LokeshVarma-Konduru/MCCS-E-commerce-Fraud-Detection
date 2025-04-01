import express from "express";

import { getAllTeamMembers} from "../controllers/team.js";
import { login, verifyLoginOTP, logout, updatePassword } from '../controllers/authController.js';
import { getUserInfo } from "../controllers/userController.js";
import { addUsers, getAllUsers, deleteUser, toggleUserStatus } from '../controllers/adminController.js';
import { predictTransaction, getTransactions, getTransactionById } from '../controllers/transactionController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import { getAllModels, getModelById } from '../controllers/mlModelController.js';
import { getApiKey, generateApiKey, regenerateApiKey, validateApiKey } from '../controllers/apiKeyController.js';
import { logApiCall, getApiLogs, getApiUsageStats, getApiLogById } from '../controllers/apiLogController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getStoreManagerStats, getFraudTrends, getTransactionTypeDistribution, getRecentAlerts } from '../controllers/storeManagerController.js';

const router = express.Router();

router.get('/team-members', getAllTeamMembers);

// Auth routes
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/logout', authMiddleware, logout);
router.post('/update-password', authMiddleware, updatePassword);
router.get('/user/:userId', authMiddleware, getUserInfo);

// Admin routes
router.post('/addUsers',authMiddleware, adminMiddleware, addUsers);
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.delete('/admin/users/:userId', authMiddleware, adminMiddleware, deleteUser);
router.post('/admin/users/:userId/toggle-status', authMiddleware, adminMiddleware, toggleUserStatus);

// ML Model routes
router.get('/models', authMiddleware,getAllModels);
router.get('/model/:id', authMiddleware,getModelById);

// API Key routes
router.get('/api-key', authMiddleware, getApiKey);
router.post('/api-key/generate', authMiddleware, generateApiKey);
router.post('/api-key/regenerate', authMiddleware, regenerateApiKey);

// API Logs routes
router.get('/api-logs', authMiddleware, getApiLogs);
router.get('/api-logs/:id', authMiddleware, getApiLogById);
router.get('/api-usage-stats', authMiddleware, getApiUsageStats);

// Dashboard routes
router.get('/dashboard-stats', authMiddleware, getDashboardStats);

// Store Manager routes
router.get('/store-manager/stats', authMiddleware, getStoreManagerStats);
router.get('/store-manager/fraud-trends', authMiddleware, getFraudTrends);
router.get('/store-manager/transaction-types', authMiddleware, getTransactionTypeDistribution);
router.get('/store-manager/alerts', authMiddleware, getRecentAlerts);

// Transaction routes
router.post('/predict', validateApiKey, logApiCall, predictTransaction);
router.get('/transactions', getTransactions);
router.get('/transaction/:id', getTransactionById);

export default router;