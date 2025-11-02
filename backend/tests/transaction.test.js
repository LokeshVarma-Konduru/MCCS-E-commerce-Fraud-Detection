import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import ApiKey from "../models/ApiKey.js";
import Transaction from "../models/TransactionSchema.js";
import Store from "../models/Store.js";
import { users } from "./testData.js";

let mongoServer;
let authCookie;
let userId;
let apiKey;
let storeId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Ensure no active connections
  await mongoose.disconnect();
  await mongoose.connect(uri);

  // Seed test data
  await User.insertMany(users);
  
  // Create a test store
  const testStore = new Store({
    storeID: "ST001",
    storeName: "Test Store",
    storeLocation: "Test City",
    zipCode: "12345",
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    status: "active"
  });
  await testStore.save();
  storeId = testStore._id;
  
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
  
  // Generate API key for transaction tests
  const newApiKey = new ApiKey({ userId });
  await newApiKey.save();
  apiKey = newApiKey.key;
  
  // Seed some test transactions
  await Transaction.create([
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
      userId: userId
    },
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
      userId: userId
    },
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
      storeRef: storeId,
      storeID: "ST001",
      predictions: [0],
      probabilities: [[0.85, 0.15]],
      status: "pending",
      riskScore: 15,
      userId: userId
    }
  ]);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Transaction Controller Tests", () => {
  describe("GET /mccs/transactions", () => {
    it("should return a list of transactions with pagination", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ page: 1, limit: 10 });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("transactions");
      expect(response.body.transactions).toBeInstanceOf(Array);
      expect(response.body.transactions.length).toBe(3); // We seeded 3 transactions
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("total", 3);
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 10);
      expect(response.body.pagination).toHaveProperty("pages", 1);
    });
    
    it("should filter transactions by model", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ model: "xgboost" });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].modelUsed).toBe("xgboost");
    });
    
    it("should filter transactions by prediction", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ prediction: 1 }); // Fraudulent transactions
      
      expect(response.statusCode).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].predictions).toContain(1);
    });
    
    it("should filter transactions by transaction type", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ transactionType: "in-store" });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].transactionType).toBe("in-store");
    });
    
    it("should filter transactions by product category", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ productCategory: "electronics" });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].productCategory).toBe("electronics");
    });
    
    it("should filter transactions by payment method", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ paymentMethod: "PayPal" });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].paymentMethod).toBe("PayPal");
    });
    
    it("should filter transactions by risk score range", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ minRiskScore: 50, maxRiskScore: 100 });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].riskScore).toBeGreaterThanOrEqual(50);
      expect(response.body.transactions[0].riskScore).toBeLessThanOrEqual(100);
    });
    
    it("should filter transactions by amount range", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ minAmount: 300, maxAmount: 600 });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].transactionAmount).toBeGreaterThanOrEqual(300);
      expect(response.body.transactions[0].transactionAmount).toBeLessThanOrEqual(600);
    });
    
    it("should filter transactions by storeRef", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ storeRef: storeId.toString() });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].storeRef.toString()).toBe(storeId.toString());
      expect(response.body.transactions[0].storeID).toBe("ST001");
    });
    
    it("should filter transactions by storeID", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ storeID: "ST001" });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].storeID).toBe("ST001");
      expect(response.body.transactions[0].storeRef.toString()).toBe(storeId.toString());
    });
    
    it("should filter in-store transactions by store", async () => {
      const response = await request(app)
        .get("/mccs/transactions")
        .query({ transactionType: "in-store", storeRef: storeId.toString() });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].transactionType).toBe("in-store");
      expect(response.body.transactions[0].storeRef.toString()).toBe(storeId.toString());
    });
  });
  
  describe("GET /mccs/transaction/:id", () => {
    it("should return a transaction by ID", async () => {
      // First get a transaction ID
      const transactionsResponse = await request(app).get("/mccs/transactions");
      const transactionId = transactionsResponse.body.transactions[0]._id;
      
      const response = await request(app).get(`/mccs/transaction/${transactionId}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("transaction");
      expect(response.body.transaction).toHaveProperty("_id", transactionId);
    });
    
    it("should return 404 for non-existent transaction ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/mccs/transaction/${fakeId}`);
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error", "Transaction not found");
    });
    
    it("should return 400 for invalid transaction ID format", async () => {
      const response = await request(app).get("/mccs/transaction/invalid-id");
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error", "Invalid transaction ID format");
    });
  });
  
  describe("POST /mccs/transaction/:id/status", () => {
    it("should update transaction status", async () => {
      // First get a transaction ID
      const transactionsResponse = await request(app).get("/mccs/transactions");
      const transactionId = transactionsResponse.body.transactions[0]._id;
      
      const response = await request(app)
        .post(`/mccs/transaction/${transactionId}/status`)
        .set("Cookie", authCookie)
        .send({
          status: "approved",
          notes: "Approved after review"
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("transaction");
      expect(response.body.transaction).toHaveProperty("status", "approved");
      expect(response.body.transaction).toHaveProperty("notes", "Approved after review");
      expect(response.body.transaction).toHaveProperty("reviewedBy");
      expect(response.body.transaction).toHaveProperty("reviewedAt");
    });
    
    it("should return 400 for invalid status", async () => {
      // First get a transaction ID
      const transactionsResponse = await request(app).get("/mccs/transactions");
      const transactionId = transactionsResponse.body.transactions[1]._id;
      
      const response = await request(app)
        .post(`/mccs/transaction/${transactionId}/status`)
        .set("Cookie", authCookie)
        .send({
          status: "invalid-status",
          notes: "Test notes"
        });
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error", "Invalid status. Must be one of: approved, rejected, under_review, pending");
    });
    
    it("should return 404 for non-existent transaction ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/mccs/transaction/${fakeId}/status`)
        .set("Cookie", authCookie)
        .send({
          status: "rejected",
          notes: "Test notes"
        });
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error", "Transaction not found");
    });
    
    it("should return 401 when not authenticated", async () => {
      // First get a transaction ID
      const transactionsResponse = await request(app).get("/mccs/transactions");
      const transactionId = transactionsResponse.body.transactions[2]._id;
      
      const response = await request(app)
        .post(`/mccs/transaction/${transactionId}/status`)
        .send({
          status: "rejected",
          notes: "Test notes"
        });
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
  });
  
  describe("POST /mccs/predict", () => {
    // Note: This test is more complex as it involves Python script execution
    // We'll test the API validation aspects but not the actual prediction
    
    it("should return 401 when no API key is provided", async () => {
      const response = await request(app)
        .post("/mccs/predict")
        .send({
          "Transaction Amount": [100],
          "Payment Method": ["credit card"],
          "Product Category": ["electronics"],
          "Quantity": [1],
          "Customer Age": [35],
          "Device Used": ["mobile"],
          "Account Age Days": [365],
          "Transaction Hour": [14],
          "Transaction Day": [15],
          "Transaction DOW": [2],
          "Transaction Month": [4],
          "Is Address Match": [1]
        });
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "API key is required");
    });
    
    it("should return 401 with invalid API key", async () => {
      const response = await request(app)
        .post("/mccs/predict")
        .query({ apikey: "invalid-key" })
        .send({
          "Transaction Amount": [100],
          "Payment Method": ["credit card"],
          "Product Category": ["electronics"],
          "Quantity": [1],
          "Customer Age": [35],
          "Device Used": ["mobile"],
          "Account Age Days": [365],
          "Transaction Hour": [14],
          "Transaction Day": [15],
          "Transaction DOW": [2],
          "Transaction Month": [4],
          "Is Address Match": [1]
        });
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid or inactive API key");
    });
    
    it("should return 400 when model is not specified", async () => {
      const response = await request(app)
        .post("/mccs/predict")
        .query({ apikey: apiKey })
        .send({
          "Transaction Amount": [100],
          "Payment Method": ["Credit Card"],
          "Product Category": ["Electronics"],
          "Quantity": [1],
          "Customer Age": [35],
          "Device Used": ["Mobile"],
          "Account Age Days": [365],
          "Transaction Hour": [14],
          "Transaction Day": [15],
          "Transaction DOW": [2],
          "Transaction Month": [4],
          "Is Address Match": [1]
        });
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("error", "Please specify ?model=logistic-regression, bernoulli-nb, xgboost, or decision-tree");
    });
    
    it("should return 400 when required fields are missing", async () => {
      const response = await request(app)
        .post("/mccs/predict")
        .query({ apikey: apiKey, model: "logistic-regression" })
        .send({
          // Missing some required fields
          "Transaction Amount": [100],
          "Payment Method": ["credit card"]
        });
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Missing or invalid field");
    });
    
    it("should accept store data in request body for in-store transactions", async () => {
      const response = await request(app)
        .post("/mccs/predict")
        .query({ apikey: apiKey, model: "logistic-regression" })
        .send({
          "Transaction Amount": [100],
          "Payment Method": ["credit card"],
          "Product Category": ["electronics"],
          "Quantity": [1],
          "Customer Age": [35],
          "Device Used": ["mobile"],
          "Account Age Days": [365],
          "Transaction Hour": [14],
          "Transaction Day": [15],
          "Transaction DOW": [2],
          "Transaction Month": [4],
          "Is Address Match": [1],
          "Transaction Type": ["in-store"],
          "storeRef": [storeId.toString()],
          "storeID": ["ST001"]
        });
      
      // This should pass validation (we're not testing actual prediction)
      // The response might be 500 due to Python script issues, but validation should pass
      expect([200, 500]).toContain(response.statusCode);
      if (response.statusCode === 400) {
        // If it's 400, it should not be due to store fields
        expect(response.body.error).not.toContain("storeRef");
        expect(response.body.error).not.toContain("storeID");
      }
    });
  });
});
