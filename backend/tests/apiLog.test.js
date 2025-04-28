// tests/apiLog.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../index.js';
import User from '../models/User.js';
import ApiLog from '../models/ApiLog.js';
import { createTestUser, loginTestUser } from './testUtils.js';

let mongoServer;
let authCookie;
let testUser;
let testApiLogs = [];

beforeAll(async () => {
  // Set up MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create a test user and get auth cookie
  testUser = await createTestUser();
  const loginResult = await loginTestUser();
  authCookie = loginResult.authCookie;

  // Create test API logs
  await createTestApiLogs();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Helper function to create test API logs
const createTestApiLogs = async () => {
  const logs = [
    {
      userId: testUser._id,
      endpoint: '/mccs/predict?model=logistic-regression',
      method: 'POST',
      statusCode: 200,
      requestBody: { 'Transaction Amount': [100], 'Payment Method': ['credit card'] },
      responseBody: { success: true, predictions: [0] },
      responseTime: 150,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      apiKey: 'test-api-key-1',
      modelUsed: 'logistic-regression'
    },
    {
      userId: testUser._id,
      endpoint: '/mccs/predict?model=xgboost',
      method: 'POST',
      statusCode: 200,
      requestBody: { 'Transaction Amount': [200], 'Payment Method': ['debit card'] },
      responseBody: { success: true, predictions: [1] },
      responseTime: 200,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      apiKey: 'test-api-key-1',
      modelUsed: 'xgboost'
    },
    {
      userId: testUser._id,
      endpoint: '/mccs/predict?model=bernoulli-nb',
      method: 'POST',
      statusCode: 400,
      requestBody: { 'Transaction Amount': [300] },
      responseBody: { success: false, error: 'Missing required fields' },
      responseTime: 50,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      apiKey: 'test-api-key-1',
      modelUsed: 'bernoulli-nb'
    }
  ];

  for (const log of logs) {
    const apiLog = new ApiLog(log);
    const savedLog = await apiLog.save();
    testApiLogs.push(savedLog);
  }
};

describe('API Log Controller Tests', () => {
  describe('GET /mccs/api-logs', () => {
    it('should return a list of API logs for the user', async () => {
      const response = await request(app)
        .get('/mccs/api-logs')
        .set('Cookie', authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('logs');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.logs.length).toBeGreaterThanOrEqual(3);
    });

    it('should paginate API logs correctly', async () => {
      const response = await request(app)
        .get('/mccs/api-logs?page=1&limit=2')
        .set('Cookie', authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.data.logs.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(3);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/mccs/api-logs');
      
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /mccs/api-logs/:id', () => {
    it('should return a single API log by ID', async () => {
      const logId = testApiLogs[0]._id;
      
      const response = await request(app)
        .get(`/mccs/api-logs/${logId}`)
        .set('Cookie', authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id', logId.toString());
      expect(response.body.data).toHaveProperty('endpoint');
      expect(response.body.data).toHaveProperty('method');
      expect(response.body.data).toHaveProperty('statusCode');
    });

    it('should return 404 for non-existent log ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/mccs/api-logs/${nonExistentId}`)
        .set('Cookie', authCookie);
      
      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const logId = testApiLogs[0]._id;
      
      const response = await request(app)
        .get(`/mccs/api-logs/${logId}`);
      
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /mccs/api-usage-stats', () => {
    it('should return API usage statistics', async () => {
      const response = await request(app)
        .get('/mccs/api-usage-stats')
        .set('Cookie', authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCalls');
      expect(response.body.data).toHaveProperty('callsByStatus');
      expect(response.body.data).toHaveProperty('callsByModel');
      expect(response.body.data).toHaveProperty('averageResponseTime');
      expect(response.body.data).toHaveProperty('callsOverTime');
    });

    it('should filter statistics by period', async () => {
      const response = await request(app)
        .get('/mccs/api-usage-stats?period=day')
        .set('Cookie', authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCalls');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/mccs/api-usage-stats');
      
      expect(response.statusCode).toBe(401);
    });
  });
});
