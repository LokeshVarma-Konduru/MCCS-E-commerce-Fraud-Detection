import express from "express";

import { getAllTeamMembers} from "../controllers/team.js";
import { login, verifyLoginOTP, logout, updatePassword } from '../controllers/authController.js';
import { getUserInfo } from "../controllers/userController.js";
import { addUsers, getAllUsers, deleteUser, toggleUserStatus } from '../controllers/adminController.js';
import { predictTransaction, getTransactions, getTransactionById } from '../controllers/transactionController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import { getAllModels, getModelById } from '../controllers/mlModelController.js';

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

// Transaction routes
router.post('/predict', predictTransaction);
router.get('/transactions', getTransactions);
router.get('/transaction/:id', getTransactionById);
export default router;