import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import User from '../models/User.js';
import { sendMail, generateOTP } from '../utils/functions.js';

export const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.status) {
            return res.status(403).json({ message: 'Account is deactivated. Please contact administrator.' });
        }

        // Check if this is the test user (test@gmail.com)
        if (email === 'test@gmail.com') {
            // Use fixed OTP for test user
            const testOTP = '123456';
            user.otp = testOTP;
            user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
            await user.save();
            
            console.log(`Test user login with fixed OTP: ${testOTP}`);
            return res.status(200).json({ 
                message: 'Login OTP sent to email (test user)', 
                userId: user._id,
                isTestUser: true
            });
        }

        // For regular users, generate random OTP
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
        console.log(otp);
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
        const token = jwt.sign({ userId: user._id, role:user.role}, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('authonlycookie', token, { httpOnly: true, maxAge: 3600000 }); // 1 hour

        res.status(200).json({ 
            message: 'OTP verified, login successful',
            token: token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'OTP verification error', error: error.message });
    }
};


export const logout = async (req, res) => {
    try {
        res.clearCookie('authonlycookie', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            sameSite: 'Strict',
        });
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Logout failed', error: error.message });
    }
};

export const updatePassword = async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    if (!userId || !oldPassword || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Fetch the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify the old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Failed to update password', error: error.message });
    }
};

// Create Test User Controller: Creates a test user with fixed credentials for stakeholders
export const testLogin = async (req, res) => {
    try {
        // Fixed test credentials
        const testEmail = 'test@gmail.com';
        const testPassword = 'test@1234';
        const testOTP = '123456';
        
        // Find or create the test user
        let testUser = await User.findOne({ email: testEmail });
        
        if (!testUser) {
            // Create a new test user if it doesn't exist
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            testUser = new User({
                email: testEmail,
                password: hashedPassword,
                name: 'Test User',
                role: 'Admin',
                status: true
            });
            await testUser.save();
            res.status(201).json({ 
                message: 'Test user created successfully', 
                credentials: {
                    email: testEmail,
                    password: 'test@1234',
                    otp: testOTP,
                    role: 'Admin'
                }
            });
        } else {
            // Update the existing test user's password if needed
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            testUser.password = hashedPassword;
            testUser.role = 'Admin';
            testUser.status = true;
            await testUser.save();
            
            res.status(200).json({ 
                message: 'Test user already exists', 
                credentials: {
                    email: testEmail,
                    password: 'test@1234',
                    otp: testOTP,
                    role: 'Admin'
                }
            });
        }
    } catch (error) {
        console.error('Test user creation error:', error);
        res.status(500).json({ message: 'Test user creation error', error: error.message });
    }
};