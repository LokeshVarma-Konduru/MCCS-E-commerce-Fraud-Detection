import express from "express";

import { getAllTeamMembers} from "../controllers/team.js";
import { login, verifyLoginOTP, logout, updatePassword } from '../controllers/authController.js';
import { getUserInfo } from "../controllers/userController.js";
import { addUsers, getAllUsers, deleteUser, toggleUserStatus } from '../controllers/adminController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import { getAllModels, getModelById } from '../controllers/mlModelController.js';

const router = express.Router();

router.get('/team-members', getAllTeamMembers);

router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/logout', authMiddleware, logout);
router.post('/update-password', updatePassword);
router.get('/user/:userId', getUserInfo);

router.post('/addUsers',authMiddleware, adminMiddleware, addUsers);
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.delete('/admin/users/:userId', authMiddleware, adminMiddleware, deleteUser);
router.post('/admin/users/:userId/toggle-status', authMiddleware, adminMiddleware, toggleUserStatus);

router.get('/models', getAllModels);
router.get('/model/:id', getModelById);

export default router;