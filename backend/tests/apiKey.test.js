import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import ApiKey from "../models/ApiKey.js";
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
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("API Key Controller Tests", () => {
  describe("GET /mccs/api-key", () => {
    it("should return 404 when user has no API key", async () => {
      const response = await request(app)
        .get("/mccs/api-key")
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "No API key found for this user");
    });
    
    it("should return API key details when user has an API key", async () => {
      // First create an API key
      const createResponse = await request(app)
        .post("/mccs/api-key/generate")
        .set("Cookie", authCookie);
      
      expect(createResponse.statusCode).toBe(201);
      
      // Then get the API key
      const response = await request(app)
        .get("/mccs/api-key")
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("key");
      expect(response.body.data).toHaveProperty("createdAt");
      expect(response.body.data).toHaveProperty("isActive", true);
    });
    
    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/mccs/api-key");
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
  });
  
  describe("POST /mccs/api-key/generate", () => {
    // Clear any existing API keys before this test suite
    beforeEach(async () => {
      await ApiKey.deleteMany({});
    });
    
    it("should generate a new API key for a user", async () => {
      const response = await request(app)
        .post("/mccs/api-key/generate")
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "API key generated successfully");
      expect(response.body.data).toHaveProperty("key");
      expect(response.body.data).toHaveProperty("createdAt");
      expect(response.body.data).toHaveProperty("isActive", true);
      
      // Verify key was saved in the database
      const apiKey = await ApiKey.findOne({ userId });
      expect(apiKey).not.toBeNull();
      expect(apiKey.key).toBe(response.body.data.key);
    });
    
    it("should return 400 if user already has an API key", async () => {
      // First create an API key
      await request(app)
        .post("/mccs/api-key/generate")
        .set("Cookie", authCookie);
      
      // Try to create another one
      const response = await request(app)
        .post("/mccs/api-key/generate")
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "User already has an API key. Use regenerate endpoint to create a new one.");
    });
    
    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/mccs/api-key/generate");
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
  });
  
  describe("POST /mccs/api-key/regenerate", () => {
    it("should return 404 if user has no API key", async () => {
      // Clear any existing API keys
      await ApiKey.deleteMany({});
      
      const response = await request(app)
        .post("/mccs/api-key/regenerate")
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "No API key found for this user. Use generate endpoint to create one.");
    });
    
    it("should regenerate an existing API key", async () => {
      // First create an API key
      await request(app)
        .post("/mccs/api-key/generate")
        .set("Cookie", authCookie);
      
      // Get the original key
      const getResponse = await request(app)
        .get("/mccs/api-key")
        .set("Cookie", authCookie);
      
      const originalKey = getResponse.body.data.key;
      
      // Regenerate the key
      const response = await request(app)
        .post("/mccs/api-key/regenerate")
        .set("Cookie", authCookie);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "API key regenerated successfully");
      expect(response.body.data).toHaveProperty("key");
      expect(response.body.data.key).not.toBe(originalKey);
      
      // Verify key was updated in the database
      const apiKey = await ApiKey.findOne({ userId });
      expect(apiKey).not.toBeNull();
      expect(apiKey.key).toBe(response.body.data.key);
    });
    
    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/mccs/api-key/regenerate");
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
  });
  
  describe("validateApiKey middleware", () => {
    let apiKey;
    
    beforeAll(async () => {
      // Create an API key for testing
      await ApiKey.deleteMany({});
      
      const createResponse = await request(app)
        .post("/mccs/api-key/generate")
        .set("Cookie", authCookie);
      
      apiKey = createResponse.body.data.key;
    });
    
    it("should allow access with a valid API key in query parameter", async () => {
      const response = await request(app)
        .post("/mccs/predict")
        .query({ apikey: apiKey })
        .send({
          transactionAmount: 100,
          transactionType: "online"
        });
      
      // We don't expect a 401 error here, but the actual response might vary
      // based on other requirements of the predict endpoint
      expect(response.statusCode).not.toBe(401);
    });
    
    it("should allow access with a valid API key in header", async () => {
      const response = await request(app)
        .post("/mccs/predict")
        .set("x-api-key", apiKey)
        .send({
          transactionAmount: 100,
          transactionType: "online"
        });
      
      // We don't expect a 401 error here
      expect(response.statusCode).not.toBe(401);
    });
    
    it("should reject access with an invalid API key", async () => {
      const response = await request(app)
        .post("/mccs/predict")
        .query({ apikey: "invalid-key" })
        .send({
          transactionAmount: 100,
          transactionType: "online"
        });
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid or inactive API key");
    });
    
    it("should reject access when no API key is provided", async () => {
      const response = await request(app)
        .post("/mccs/predict")
        .send({
          transactionAmount: 100,
          transactionType: "online"
        });
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "API key is required");
    });
  });
});
