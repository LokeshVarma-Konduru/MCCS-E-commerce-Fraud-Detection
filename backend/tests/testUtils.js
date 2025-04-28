// tests/testUtils.js
import request from 'supertest';
import User from '../models/User.js';
import app from '../index.js';
import { users } from './testData.js';

// Test user data
export const testUserData = {
  email: 'loki1432varma@gmail.com',
  password: 'Loki@1234',
  name: 'Lokesh',
  role: 'Admin',
  status: true,
  otp: '123456', // Fixed OTP for testing
  otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
};

// Create a test user in the database
export const createTestUser = async () => {
  try {
    // Insert test users from testData.js
    await User.insertMany(users);
    
    // Check if our specific test user exists
    let user = await User.findOne({ email: testUserData.email });
    
    if (!user) {
      // Create new user if it doesn't exist
      user = new User(testUserData);
      await user.save();
    } else {
      // Update existing user with test data
      user.otp = testUserData.otp;
      user.otpExpiresAt = testUserData.otpExpiresAt;
      await user.save();
    }
    
    return user;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

// Login the test user and return the authentication cookie
export const loginTestUser = async () => {
  try {
    // Step 1: Login to get userId
    const loginResponse = await request(app)
      .post('/mccs/login')
      .send({ email: testUserData.email, password: testUserData.password });
      
    console.log('Login response status:', loginResponse.statusCode);
    
    if (loginResponse.statusCode !== 200) {
      console.error('Login failed:', loginResponse.body);
      throw new Error('Login failed: ' + JSON.stringify(loginResponse.body));
    }
    
    const userId = loginResponse.body.userId;
    
    // Step 2: Get OTP from database
    const user = await User.findById(userId);
    const otp = user.otp;
    
    // Step 3: Verify OTP to get authentication cookie
    const otpResponse = await request(app)
      .post('/mccs/verify-login-otp')
      .send({ userId, otp });
    
    console.log('OTP verification response status:', otpResponse.statusCode);
    
    if (otpResponse.statusCode !== 200) {
      console.error('OTP verification failed:', otpResponse.body);
      throw new Error('OTP verification failed: ' + JSON.stringify(otpResponse.body));
    }
    
    const authCookie = otpResponse.headers['set-cookie'];
    
    if (!authCookie) {
      console.error('No authentication cookie received');
      throw new Error('No authentication cookie received');
    }
    
    return { authCookie, userId };
  } catch (error) {
    console.error('Error in loginTestUser:', error);
    throw error;
  }
};
