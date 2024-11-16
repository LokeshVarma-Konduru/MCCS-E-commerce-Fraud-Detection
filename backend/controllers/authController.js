import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import User from '../models/User.js';
import { sendMail, generateOTP } from '../utils/functions.js';

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP via email
        const subject = 'Your Login OTP';
        const text = `Hello ${user.name},

Your OTP for logging into the dashboard is: ${otp}

It expires in 10 minutes.

If you did not request this, please contact support.

Best regards,
Your Company Name`;

        await sendMail(email, subject, text);

        res.status(200).json({ message: 'Login OTP sent to email', userId: user._id });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login error', error: error.message });
    }
};

// Verify OTP Controller: Validates OTP and grants access by setting JWT token
export const verifyLoginOTP = async (req, res) => {
    const { userId, otp } = req.body;

    try {
        // Validate input
        if (!userId || !otp) {
            return res.status(400).json({ message: 'User ID and OTP are required' });
        }

        const user = await User.findById(userId);

        if (!user || user.otp !== otp || user.otpExpiresAt < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP fields after successful verification
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        // Generate JWT token and set it as an HTTP-only cookie
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('authonlycookie', token, { httpOnly: true, maxAge: 3600000 }); // 1 hour

        res.status(200).json({ message: 'OTP verified, login successful' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'OTP verification error', error: error.message });
    }
};

