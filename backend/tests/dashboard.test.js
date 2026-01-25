// tests/dashboard.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../index.js';
import User from '../models/User.js';
import Transaction from '../models/TransactionSchema.js';
import ApiLog from '../models/ApiLog.js';
import { createTestUser, loginTestUser } from './testUtils.js';

let mongoServer;
let authCookie;
let testUser;

beforeAll(async () => {
  // Set up MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create a test user and get auth cookie
  testUser = await createTestUser();
  const loginResult = await loginTestUser();
  authCookie = loginResult.authCookie;

  // Create test transactions and API logs
  await createTestData();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Helper function to create test data
const createTestData = async () => {
  // Create test transactions
  const currentDate = new Date();
  const lastWeekDate = new Date(currentDate);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  
  // Current period transactions (3 legitimate, 1 fraudulent)
  const currentPeriodTransactions = [
    {
      userId: testUser._id,
      transactionAmount: 100,
      paymentMethod: 'credit card',
      productCategory: 'electronics',
      quantity: 1,
      customerAge: 30,
      deviceUsed: 'mobile',
      accountAgeDays: 100,
      transactionHour: 12,
      transactionDay: 15,
      transactionDOW: 2,
      transactionMonth: 4,
      isAddressMatch: 1,
      transactionType: 'online',
      modelUsed: 'logistic-regression',
      predictions: [0],
      probabilities: [[0.8, 0.2]],
      riskScore: 20,
      status: 'approved',
      createdAt: new Date()
    },
    {
      userId: testUser._id,
      transactionAmount: 200,
      paymentMethod: 'debit card',
      productCategory: 'clothing',
      quantity: 2,
      customerAge: 25,
      deviceUsed: 'desktop',
      accountAgeDays: 50,
      transactionHour: 14,
      transactionDay: 16,
      transactionDOW: 3,
      transactionMonth: 4,
      isAddressMatch: 1,
      transactionType: 'online',
      modelUsed: 'xgboost',
      predictions: [0],
      probabilities: [[0.9, 0.1]],
      riskScore: 10,
      status: 'approved',
      createdAt: new Date()
    },
    {
      userId: testUser._id,
      transactionAmount: 300,
      paymentMethod: 'credit card',
      productCategory: 'health & beauty',
      quantity: 3,
      customerAge: 40,
      deviceUsed: 'tablet',
      accountAgeDays: 200,
      transactionHour: 16,
      transactionDay: 17,
      transactionDOW: 4,
      transactionMonth: 4,
      isAddressMatch: 1,
      transactionType: 'in-store',
      modelUsed: 'bernoulli-nb',
      predictions: [0],
      probabilities: [[0.95, 0.05]],
      riskScore: 5,
      status: 'approved',
      createdAt: new Date()
    },
    {
      userId: testUser._id,
      transactionAmount: 500,
      paymentMethod: 'credit card',
      productCategory: 'electronics',
      quantity: 1,
      customerAge: 35,
      deviceUsed: 'mobile',
      accountAgeDays: 30,
      transactionHour: 20,
      transactionDay: 18,
      transactionDOW: 5,
      transactionMonth: 4,
      isAddressMatch: 0,
      transactionType: 'online',
      modelUsed: 'decision-tree',
      predictions: [1],
      probabilities: [[0.3, 0.7]],
      riskScore: 70,
      status: 'under_review',
      createdAt: new Date()
    }
  ];

  // Previous period transactions (2 legitimate, 1 fraudulent)
  const previousPeriodTransactions = [
    {
      userId: testUser._id,
      transactionAmount: 150,
      paymentMethod: 'credit card',
      productCategory: 'toys & games',
      quantity: 2,
      customerAge: 28,
      deviceUsed: 'desktop',
      accountAgeDays: 90,
      transactionHour: 10,
      transactionDay: 8,
      transactionDOW: 2,
      transactionMonth: 4,
      isAddressMatch: 1,
      transactionType: 'online',
      modelUsed: 'logistic-regression',
      predictions: [0],
      probabilities: [[0.85, 0.15]],
      riskScore: 15,
      status: 'approved',
      createdAt: lastWeekDate
    },
    {
      userId: testUser._id,
      transactionAmount: 250,
      paymentMethod: 'debit card',
      productCategory: 'home & garden',
      quantity: 1,
      customerAge: 45,
      deviceUsed: 'mobile',
      accountAgeDays: 150,
      transactionHour: 15,
      transactionDay: 9,
      transactionDOW: 3,
      transactionMonth: 4,
      isAddressMatch: 1,
      transactionType: 'in-store',
      modelUsed: 'xgboost',
      predictions: [0],
      probabilities: [[0.9, 0.1]],
      riskScore: 10,
      status: 'approved',
      createdAt: lastWeekDate
    },
    {
      userId: testUser._id,
      transactionAmount: 450,
      paymentMethod: 'PayPal',
      productCategory: 'electronics',
      quantity: 1,
      customerAge: 22,
      deviceUsed: 'mobile',
      accountAgeDays: 20,
      transactionHour: 22,
      transactionDay: 10,
      transactionDOW: 4,
      transactionMonth: 4,
      isAddressMatch: 0,
      transactionType: 'online',
      modelUsed: 'decision-tree',
      predictions: [1],
      probabilities: [[0.25, 0.75]],
      riskScore: 75,
      status: 'rejected',
      createdAt: lastWeekDate
    }
  ];

  // Create API logs
  const currentPeriodApiLogs = [
    {
      userId: testUser._id,
      endpoint: '/mccs/predict?model=logistic-regression',
      method: 'POST',
      statusCode: 200,
      requestBody: { 'Transaction Amount': [100], 'Payment Method': ['credit card'] },
      responseBody: { success: true, predictions: [0] },
      responseTime: 120,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      apiKey: 'test-api-key-1',
      modelUsed: 'logistic-regression',
      requestTime: new Date()
    },
    {
      userId: testUser._id,
      endpoint: '/mccs/predict?model=xgboost',
      method: 'POST',
      statusCode: 200,
      requestBody: { 'Transaction Amount': [200], 'Payment Method': ['debit card'] },
      responseBody: { success: true, predictions: [0] },
      responseTime: 150,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      apiKey: 'test-api-key-1',
      modelUsed: 'xgboost',
      requestTime: new Date()
    }
  ];

  const previousPeriodApiLogs = [
    {
      userId: testUser._id,
      endpoint: '/mccs/predict?model=bernoulli-nb',
      method: 'POST',
      statusCode: 200,
      requestBody: { 'Transaction Amount': [300], 'Payment Method': ['credit card'] },
      responseBody: { success: true, predictions: [0] },
      responseTime: 200,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      apiKey: 'test-api-key-1',
      modelUsed: 'bernoulli-nb',
      requestTime: lastWeekDate
    }
  ];

  // Save all test data
  for (const transaction of [...currentPeriodTransactions, ...previousPeriodTransactions]) {
    await new Transaction(transaction).save();
  }

  for (const apiLog of [...currentPeriodApiLogs, ...previousPeriodApiLogs]) {
    await new ApiLog(apiLog).save();
  }
};

describe('Dashboard Controller Tests', () => {
  describe('GET /mccs/dashboard-stats', () => {
    it('should return dashboard statistics with default period (month)', async () => {
      const response = await request(app)
        .get('/mccs/dashboard-stats')
        .set('Cookie', authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTransactions');
      expect(response.body.data).toHaveProperty('fraudDetectionRate');
      expect(response.body.data).toHaveProperty('apiResponseTime');
      
      // Verify the values
      expect(response.body.data.totalTransactions).toHaveProperty('value');
      expect(response.body.data.totalTransactions).toHaveProperty('change');
      expect(response.body.data.fraudDetectionRate).toHaveProperty('value');
      expect(response.body.data.fraudDetectionRate).toHaveProperty('change');
      expect(response.body.data.apiResponseTime).toHaveProperty('value');
      expect(response.body.data.apiResponseTime).toHaveProperty('change');
    });

    it('should return dashboard statistics for different periods', async () => {
      const periods = ['day', 'week', 'month', 'year'];
      
      for (const period of periods) {
        const response = await request(app)
          .get(`/mccs/dashboard-stats?period=${period}`)
          .set('Cookie', authCookie);
        
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalTransactions');
        expect(response.body.data).toHaveProperty('fraudDetectionRate');
        expect(response.body.data).toHaveProperty('apiResponseTime');
      }
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/mccs/dashboard-stats');
      
      expect(response.statusCode).toBe(401);
    });
  });
});
