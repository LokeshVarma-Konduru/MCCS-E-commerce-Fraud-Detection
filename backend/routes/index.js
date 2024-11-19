import express from "express";

import { getAllTeamMembers} from "../controllers/team.js";
import { login, verifyLoginOTP, logout, updatePassword } from '../controllers/authController.js';
import { getUserInfo } from "../controllers/userController.js";
import { addUsers } from '../controllers/adminController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';

const router = express.Router();

router.get('/team-members', getAllTeamMembers);

router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/logout', authMiddleware, logout);
router.post('/update-password', authMiddleware, updatePassword);
router.get('/user/:userId', getUserInfo);

router.post('/addUsers',authMiddleware, adminMiddleware, addUsers);

export default router;