import express from "express";

import { getAllTeamMembers} from "../controllers/team.js";
import { login, verifyLoginOTP, logout, updatePassword, testLogin } from '../controllers/authController.js';
import { getUserInfo } from "../controllers/userController.js";
import { generateSampleTransactions } from '../controllers/sampleDataController.js';
import { addUsers, getAllUsers, deleteUser, toggleUserStatus } from '../controllers/adminController.js';
import { predictTransaction, getTransactions, getTransactionById, updateTransactionStatus, getFraudTrends as getTransactionFraudTrends, getHighRiskTransactions, migrateTransactions, getFlaggedTransactions } from '../controllers/transactionController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import developerAndAdminMiddleware from '../middleware/developerAndAdmin.js';
import storeManagerAndAdminMiddleware from '../middleware/storeManagerAndAdmin.js';
import { getAllModels, getModelById, getModelsWithWeights } from '../controllers/mlModelController.js';
import { getApiKey, generateApiKey, regenerateApiKey, validateApiKey } from '../controllers/apiKeyController.js';
import { logApiCall, getApiLogs, getApiUsageStats, getApiLogById } from '../controllers/apiLogController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getStoreManagerStats, getFraudTrends, getTransactionTypeDistribution, getRecentAlerts } from '../controllers/storeManagerController.js';
import { sendReportEmail } from '../controllers/reportController.js';
import { getAllStores, getStoreById, getStoreByStoreId, createStore, updateStore, deleteStore, getStoresByManager, getStoresNearby, getStoresWithFraudStats } from '../controllers/storeController.js';
import { seedStores, clearStores } from '../controllers/storeSeederController.js';
import { uploadDataset, getAllDatasets, getDatasetByVersion, getLatestDataset } from '../controllers/datasetController.js';
import chatbotRoutes from './chatbot.js';

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

// ML Model routes (Developer and Admin only)
router.get('/models', authMiddleware, developerAndAdminMiddleware, getAllModels);
router.get('/models-with-weights', authMiddleware, developerAndAdminMiddleware, getModelsWithWeights); // Models with actual weight files
router.get('/model/:id', authMiddleware, developerAndAdminMiddleware, getModelById);

// API Key routes (Developer and Admin only)
router.get('/api-key', authMiddleware, developerAndAdminMiddleware, getApiKey);
router.post('/api-key/generate', authMiddleware, developerAndAdminMiddleware, generateApiKey);
router.post('/api-key/regenerate', authMiddleware, developerAndAdminMiddleware, regenerateApiKey);

// API Logs routes (Developer and Admin only)
router.get('/api-logs', authMiddleware, developerAndAdminMiddleware, getApiLogs);
router.get('/api-logs/:id', authMiddleware, developerAndAdminMiddleware, getApiLogById);
router.get('/api-usage-stats', authMiddleware, developerAndAdminMiddleware, getApiUsageStats);

// Dashboard routes (Admin and Developer only)
// Used by: AdminDashboard (Admin) and Developer page (Developer)
router.get('/dashboard-stats', authMiddleware, developerAndAdminMiddleware, getDashboardStats);

// Store Manager routes (StoreManager and Admin only)
router.get('/store-manager/stats', authMiddleware, storeManagerAndAdminMiddleware, getStoreManagerStats);
router.get('/store-manager/fraud-trends', authMiddleware, storeManagerAndAdminMiddleware, getFraudTrends);
router.get('/store-manager/transaction-types', authMiddleware, storeManagerAndAdminMiddleware, getTransactionTypeDistribution);
router.get('/store-manager/alerts', authMiddleware, storeManagerAndAdminMiddleware, getRecentAlerts);

// Transaction routes
// POST /predict - Public API endpoint (validated by API key)
router.post('/predict', validateApiKey, logApiCall, predictTransaction);
// GET /transactions - Used by Developer and Admin (TransactionMonitoring, Developer pages)
router.get('/transactions', authMiddleware, developerAndAdminMiddleware, getTransactions);
// GET /transactions/flagged - Used by Admin, Developer, and StoreManager
// StoreManager sees only their store's transactions (filtered by storeRef/storeID in query params)
// Developer and Admin see all transactions (when no store filter is provided)
router.get('/transactions/flagged', authMiddleware, getFlaggedTransactions);
// GET /transaction/:id - Used by Developer and Admin (TransactionMonitoring)
router.get('/transaction/:id', authMiddleware, developerAndAdminMiddleware, getTransactionById);
// POST /transaction/:id/status - Used by StoreManager (their transactions) and Developer/Admin (all transactions)
// All authenticated users can update transaction status, controller should filter by role
router.post('/transaction/:id/status', authMiddleware, updateTransactionStatus);
// Transaction Monitoring routes (Developer and Admin only)
router.get('/transaction-monitoring/fraud-trends', authMiddleware, developerAndAdminMiddleware, getTransactionFraudTrends);
router.get('/transaction-monitoring/high-risk', authMiddleware, developerAndAdminMiddleware, getHighRiskTransactions);

// Migration endpoint - Admin and Developer only (for development/admin use)
router.post('/migrate-transactions', authMiddleware, developerAndAdminMiddleware, migrateTransactions);


// Report routes
router.post('/send-report', authMiddleware, sendReportEmail);

// Sample data generation route - Developer and Admin only (for development)
router.post('/generate-sample-transactions', authMiddleware, developerAndAdminMiddleware, generateSampleTransactions);

// Store routes
// GET /stores - Used by Admin (AdminPanel, AdminDashboard) and Developer (TransactionMonitoring, APIIntegration)
router.get('/stores', authMiddleware, developerAndAdminMiddleware, getAllStores);
// GET /stores/fraud-stats - Admin only (used in AdminDashboard)
router.get('/stores/fraud-stats', authMiddleware, adminMiddleware, getStoresWithFraudStats);
// GET /stores/nearby - Admin and Developer (for finding nearby stores)
router.get('/stores/nearby', authMiddleware, developerAndAdminMiddleware, getStoresNearby);
// GET /stores/manager/:managerId - StoreManager (their own stores) and Admin (all stores)
router.get('/stores/manager/:managerId', authMiddleware, storeManagerAndAdminMiddleware, getStoresByManager);
// GET /stores/store-id/:storeId - StoreManager (their own store) and Admin (all stores)
router.get('/stores/store-id/:storeId', authMiddleware, storeManagerAndAdminMiddleware, getStoreByStoreId);
// GET /stores/:id - StoreManager (their own store) and Admin (all stores)
router.get('/stores/:id', authMiddleware, storeManagerAndAdminMiddleware, getStoreById);
// POST/PUT/DELETE - Admin only (store management)
router.post('/stores', authMiddleware, adminMiddleware, createStore);
router.put('/stores/:id', authMiddleware, adminMiddleware, updateStore);
router.delete('/stores/:id', authMiddleware, adminMiddleware, deleteStore);

// Store seeder routes (for development/testing)
router.post('/seed-stores', authMiddleware, adminMiddleware, seedStores);
router.delete('/clear-stores', authMiddleware, adminMiddleware, clearStores);

// Dataset routes (Developer and Admin only)
router.post('/datasets/upload', authMiddleware, developerAndAdminMiddleware, uploadDataset);
router.get('/datasets', authMiddleware, developerAndAdminMiddleware, getAllDatasets);
router.get('/datasets/version/:version', authMiddleware, developerAndAdminMiddleware, getDatasetByVersion);
router.get('/datasets/latest', getLatestDataset); // Public endpoint for VT rack

// Chatbot routes
router.use('/chatbot', chatbotRoutes);

export default router;
