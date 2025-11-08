import express from "express";

import { getAllTeamMembers} from "../controllers/team.js";
import { login, verifyLoginOTP, logout, updatePassword, testLogin } from '../controllers/authController.js';
import { getUserInfo } from "../controllers/userController.js";
import { generateSampleTransactions } from '../controllers/sampleDataController.js';
import { addUsers, getAllUsers, deleteUser, toggleUserStatus } from '../controllers/adminController.js';
import { predictTransaction, getTransactions, getTransactionById, updateTransactionStatus, getFraudTrends as getTransactionFraudTrends, getHighRiskTransactions, migrateTransactions, getFlaggedTransactions } from '../controllers/transactionController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import { getAllModels, getModelById } from '../controllers/mlModelController.js';
import { getApiKey, generateApiKey, regenerateApiKey, validateApiKey } from '../controllers/apiKeyController.js';
import { logApiCall, getApiLogs, getApiUsageStats, getApiLogById } from '../controllers/apiLogController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getStoreManagerStats, getFraudTrends, getTransactionTypeDistribution, getRecentAlerts } from '../controllers/storeManagerController.js';
import { sendReportEmail } from '../controllers/reportController.js';
import { getAllStores, getStoreById, getStoreByStoreId, createStore, updateStore, deleteStore, getStoresByManager, getStoresNearby, getStoresWithFraudStats } from '../controllers/storeController.js';
import { seedStores, clearStores } from '../controllers/storeSeederController.js';
import { uploadDataset, getAllDatasets, getDatasetByVersion, getLatestDataset } from '../controllers/datasetController.js';

const router = express.Router();

router.get('/team-members', getAllTeamMembers);

// Auth routes
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/logout', authMiddleware, logout);
router.post('/update-password', authMiddleware, updatePassword);
router.post('/test-login', testLogin);
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
router.get('/transactions/flagged', authMiddleware, getFlaggedTransactions);
router.get('/transaction/:id', getTransactionById);
router.post('/transaction/:id/status', authMiddleware, updateTransactionStatus);
router.get('/transaction-monitoring/fraud-trends', authMiddleware, getTransactionFraudTrends);
router.get('/transaction-monitoring/high-risk', authMiddleware, getHighRiskTransactions);

// Migration endpoint - only for development/admin use
router.post('/migrate-transactions', migrateTransactions);


// Report routes
router.post('/send-report', authMiddleware, sendReportEmail);

// Sample data generation route - only for development
router.post('/generate-sample-transactions', generateSampleTransactions);

// Store routes
router.get('/stores', authMiddleware, getAllStores);
router.get('/stores/fraud-stats', authMiddleware, getStoresWithFraudStats);
router.get('/stores/nearby', authMiddleware, getStoresNearby);
router.get('/stores/manager/:managerId', authMiddleware, getStoresByManager);
router.get('/stores/store-id/:storeId', authMiddleware, getStoreByStoreId);
router.get('/stores/:id', authMiddleware, getStoreById);
router.post('/stores', authMiddleware, adminMiddleware, createStore);
router.put('/stores/:id', authMiddleware, adminMiddleware, updateStore);
router.delete('/stores/:id', authMiddleware, adminMiddleware, deleteStore);

// Store seeder routes (for development/testing)
router.post('/seed-stores', authMiddleware, adminMiddleware, seedStores);
router.delete('/clear-stores', authMiddleware, adminMiddleware, clearStores);

// Dataset routes
router.post('/datasets/upload', authMiddleware, uploadDataset);
router.get('/datasets', authMiddleware, getAllDatasets);
router.get('/datasets/version/:version', authMiddleware, getDatasetByVersion);
router.get('/datasets/latest', getLatestDataset); // Public endpoint for VT rack

export default router;
