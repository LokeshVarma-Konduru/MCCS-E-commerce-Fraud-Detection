// controllers/adminController.js

import bcrypt from 'bcrypt';
import User from '../models/User.js';
import sendMail from '../utils/functions.js';
import { v4 as uuidv4 } from 'uuid';

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
