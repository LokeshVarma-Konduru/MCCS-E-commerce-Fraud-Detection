// controllers/adminController.js

import bcrypt from 'bcrypt';
import User from '../models/User.js';
import sendMail from '../utils/functions.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

// Function to generate a random temporary password
const generateTempPassword = () => {
    return uuidv4().slice(0, 8); // Generates an 8-character password
};

// Controller to add multiple users
export const addUsers = async (req, res) => {
    const { users } = req.body; // Expecting an array of user objects

    if (!users || !Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ message: 'Invalid users data' });
    }

    const addedUsers = [];
    const failedUsers = [];

    for (const userData of users) {
        const { email, name, role } = userData;

        // Basic validation
        if (!email || !name || !role) {
            failedUsers.push({ email, message: 'Missing required fields (email, name, role)' });
            continue;
        }

        if (!['Admin', 'Developer'].includes(role)) {
            failedUsers.push({ email, message: 'Invalid role specified (must be Admin or Developer)' });
            continue;
        }

        try {
            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                failedUsers.push({ email, message: 'Email already exists' });
                continue;
            }

            // Generate temporary password
            const tempPassword = generateTempPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            // Create new user
            const newUser = new User({
                email,
                name,
                role,
                password: hashedPassword,
                status: true
            });

            await newUser.save();
            addedUsers.push({ email, userId: newUser._id });

            // Send email to the new user
            const subject = 'Access Granted to Dashboard';
            const text = `Hello ${name},

You have been granted access to the dashboard as a ${role}.

Your temporary password is: ${tempPassword}

Please log in and change your password immediately.

Best regards,
Your Company Name`;

            await sendMail(email, subject, text);
        } catch (error) {
            console.error(`Error adding user ${email}:`, error);
            failedUsers.push({ email, message: 'Server error while adding user' });
        }
    }

    const response = {
        addedUsers,
        failedUsers,
    };

    res.status(200).json(response);
};

// Controller to get all users with filters and search
export const getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        // Build query
        let query = {};
        
        // Add role filter if provided
        if (role) {
            query.role = role;
        }
        
        // Add search filter if provided
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { name: searchRegex },
                { email: searchRegex }
            ];
        }
        
        // Fetch users with selected fields only
        const users = await User.find(query)
            .select('name email role status')
            .sort({ name: 1 }); // Sort by name ascending
        
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Delete user by ID
export const deleteUser = async (req, res) => {
    const { userId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid user ID format'
        });
    }

    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found'
            });
        }

        // Prevent deleting the last admin
        if (user.role === 'Admin') {
            const activeAdmins = await User.countDocuments({ role: 'Admin' });
            if (activeAdmins <= 1) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete the last admin user'
                });
            }
        }

        await User.findByIdAndDelete(userId);
        
        res.status(200).json({ 
            success: true, 
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting user',
            error: error.message 
        });
    }
};

// Toggle user status (activate/deactivate)
export const toggleUserStatus = async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    if (typeof status !== 'boolean') {
        return res.status(400).json({ message: 'Status must be a boolean value' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deactivating the last active admin
        if (!status && user.role === 'Admin') {
            const activeAdmins = await User.countDocuments({ role: 'Admin', status: true });
            if (activeAdmins <= 1) {
                return res.status(400).json({ message: 'Cannot deactivate the last active admin' });
            }
        }

        user.status = status;
        await user.save();

        // Send email notification
        const subject = status ? 'Account Activated' : 'Account Deactivated';
        const message = status
            ? `Hello ${user.name},\n\nYour account has been activated. You can now log in and use your account.\n\nBest regards,\nMCCS Team`
            : `Hello ${user.name},\n\nYour account has been deactivated. You will not be able to access your account until it is reactivated by an administrator.\n\nBest regards,\nMCCS Team`;

        try {
            await sendMail(user.email, subject, message);
        } catch (emailError) {
            console.error('Error sending status change email:', emailError);
            // Continue with the response even if email fails
        }

        res.status(200).json({ 
            message: `User ${status ? 'activated' : 'deactivated'} successfully`,
            userId: user._id,
            status: user.status
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user status', error: error.message });
    }
};
