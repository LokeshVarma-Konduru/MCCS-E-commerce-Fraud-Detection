import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import Transaction from "../models/TransactionSchema.js";
import { users } from "./testData.js";

let mongoServer;
let authCookie;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Ensure no active connections
  await mongoose.disconnect();
  await mongoose.connect(uri);

  // Seed test data
  await User.insertMany(users);
  
  // Set up authentication for all tests
  // Step 1: Login to get userId
  const loginResponse = await request(app)
    .post("/mccs/login")
    .send({ email: "loki1432varma@gmail.com", password: "Loki@1234" });
  
  expect(loginResponse.statusCode).toBe(200);
  userId = loginResponse.body.userId;
  
  // Step 2: Get OTP from database
  const user = await User.findById(userId);
  const otp = user.otp;
  
  // Step 3: Verify OTP to get authentication cookie
  const otpResponse = await request(app)
    .post("/mccs/verify-login-otp")
    .send({ userId, otp });
  
  expect(otpResponse.statusCode).toBe(200);
  authCookie = otpResponse.headers["set-cookie"];
  
  // Seed test transactions with different dates for testing period filters
  const now = new Date();
  
  // Today's transactions
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  // Yesterday's transactions
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Last week's transactions
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  // Last month's transactions
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  await Transaction.create([
    // Today's transactions - online legitimate
    {
      transactionAmount: 100.00,
      paymentMethod: "credit card",
      productCategory: "electronics",
      quantity: 1,
      customerAge: 35,
      deviceUsed: "mobile",
      accountAgeDays: 365,
      transactionHour: 14,
      transactionDay: 15,
      transactionDOW: 2,
      transactionMonth: 4,
      isAddressMatch: 1,
      modelUsed: "logistic-regression",
      transactionType: "online",
      predictions: [0],
      probabilities: [[0.9, 0.1]],
      status: "pending",
      riskScore: 10,
      userId: userId,
      createdAt: new Date(today.getTime() + 2 * 60 * 60 * 1000) // 2 hours after midnight
    },
    // Today's transactions - online fraudulent
    {
      transactionAmount: 500.00,
      paymentMethod: "PayPal",
      productCategory: "clothing",
      quantity: 3,
      customerAge: 25,
      deviceUsed: "desktop",
      accountAgeDays: 30,
      transactionHour: 20,
      transactionDay: 1,
      transactionDOW: 5,
      transactionMonth: 3,
      isAddressMatch: 0,
      modelUsed: "xgboost",
      transactionType: "online",
      predictions: [1],
      probabilities: [[0.2, 0.8]],
      status: "pending",
      riskScore: 80,
      userId: userId,
      createdAt: new Date(today.getTime() + 4 * 60 * 60 * 1000) // 4 hours after midnight
    },
    // Today's transactions - in-store legitimate
    {
      transactionAmount: 250.00,
      paymentMethod: "debit card",
      productCategory: "home & garden",
      quantity: 2,
      customerAge: 45,
      deviceUsed: "tablet",
      accountAgeDays: 180,
      transactionHour: 10,
      transactionDay: 20,
      transactionDOW: 3,
      transactionMonth: 5,
      isAddressMatch: 1,
      modelUsed: "decision-tree",
      transactionType: "in-store",
      predictions: [0],
      probabilities: [[0.85, 0.15]],
      status: "pending",
      riskScore: 15,
      userId: userId,
      createdAt: new Date(today.getTime() + 6 * 60 * 60 * 1000) // 6 hours after midnight
    },
    // Yesterday's transactions - in-store fraudulent
    {
      transactionAmount: 750.00,
      paymentMethod: "credit card",
      productCategory: "electronics",
      quantity: 1,
      customerAge: 30,
      deviceUsed: "mobile",
      accountAgeDays: 90,
      transactionHour: 16,
      transactionDay: 10,
      transactionDOW: 1,
      transactionMonth: 4,
      isAddressMatch: 0,
      modelUsed: "xgboost",
      transactionType: "in-store",
      predictions: [1],
      probabilities: [[0.1, 0.9]],
      status: "pending",
      riskScore: 90,
      userId: userId,
      createdAt: yesterday
    },
    // Last week's transaction - online legitimate
    {
      transactionAmount: 50.00,
      paymentMethod: "PayPal",
      productCategory: "toys & games",
      quantity: 1,
      customerAge: 28,
      deviceUsed: "desktop",
      accountAgeDays: 120,
      transactionHour: 12,
      transactionDay: 5,
      transactionDOW: 4,
      transactionMonth: 3,
      isAddressMatch: 1,
      modelUsed: "logistic-regression",
      transactionType: "online",
      predictions: [0],
      probabilities: [[0.95, 0.05]],
      status: "pending",
      riskScore: 5,
      userId: userId,
      createdAt: lastWeek
    },
    // Last month's transaction - online fraudulent
    {
      transactionAmount: 1200.00,
      paymentMethod: "credit card",
      productCategory: "health & beauty",
      quantity: 5,
      customerAge: 22,
      deviceUsed: "mobile",
      accountAgeDays: 15,
      transactionHour: 22,
      transactionDay: 28,
      transactionDOW: 6,
      transactionMonth: 2,
      isAddressMatch: 0,
      modelUsed: "decision-tree",
      transactionType: "online",
      predictions: [1],
      probabilities: [[0.3, 0.7]],
      status: "pending",
      riskScore: 70,
      userId: userId,
      createdAt: lastMonth
    }
  ]);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Store Manager Controller Tests", () => {
  describe("GET /mccs/store-manager/stats", () => {
    it("should return statistics for the current day by default", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/stats")
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("totalTransactions");
      expect(response.body.data).toHaveProperty("fraudRate");
      expect(response.body.data).toHaveProperty("financialImpact");
      
      // Check that totalTransactions is correct for today (3 transactions)
      expect(response.body.data.totalTransactions.value).toBe(3);
    });
    
    it("should filter statistics by transaction type", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/stats")
        .query({ transactionType: "online" })
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.data.totalTransactions.value).toBe(2); // 2 online transactions today
    });
    
    it("should return statistics for different time periods", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/stats")
        .query({ period: "week" })
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      // Should include today's 3 transactions and yesterday's 1 transaction
      expect(response.body.data.totalTransactions.value).toBeGreaterThanOrEqual(4);
    });
    
    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/mccs/store-manager/stats");
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
  });
  
  describe("GET /mccs/store-manager/fraud-trends", () => {
    it("should return fraud trend data for the chart", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/fraud-trends")
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Each data point should have date and fraudRate
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty("date");
        expect(response.body.data[0]).toHaveProperty("fraudRate");
      }
    });
    
    it("should filter fraud trends by transaction type", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/fraud-trends")
        .query({ transactionType: "online" })
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it("should return fraud trends for different time periods", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/fraud-trends")
        .query({ period: "month" })
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/mccs/store-manager/fraud-trends");
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
  });
  
  describe("GET /mccs/store-manager/transaction-types", () => {
    it("should return transaction type distribution data", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/transaction-types")
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("categories");
      expect(response.body.data).toHaveProperty("series");
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(Array.isArray(response.body.data.series)).toBe(true);
      expect(response.body.data.series.length).toBe(2); // Legitimate and Fraudulent
      
      // Should have both online and in-store categories
      expect(response.body.data.categories).toContain("Online");
      expect(response.body.data.categories).toContain("In-store");
    });
    
    it("should filter transaction type distribution by period", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/transaction-types")
        .query({ period: "day" })
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.data.categories).toContain("Online");
      expect(response.body.data.categories).toContain("In-store");
    });
    
    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/mccs/store-manager/transaction-types");
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
  });
  
  describe("GET /mccs/store-manager/alerts", () => {
    it("should return recent high-risk transactions", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/alerts")
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // We should have at least 3 fraudulent transactions in our test data
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      
      // Each alert should have these properties
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty("time");
        expect(response.body.data[0]).toHaveProperty("transactionId");
        expect(response.body.data[0]).toHaveProperty("type");
        expect(response.body.data[0]).toHaveProperty("amount");
        expect(response.body.data[0]).toHaveProperty("riskScore");
        expect(response.body.data[0]).toHaveProperty("status");
      }
    });
    
    it("should limit the number of alerts returned", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/alerts")
        .query({ limit: 2 })
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
    
    it("should filter alerts by transaction type", async () => {
      const response = await request(app)
        .get("/mccs/store-manager/alerts")
        .query({ transactionType: "online" })
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All alerts should be online transactions
      if (response.body.data.length > 0) {
        expect(response.body.data.every(alert => alert.type === "Online")).toBe(true);
      }
    });
    
    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/mccs/store-manager/alerts");
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
  });
});
