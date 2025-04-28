import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js"; // Ensure this exports only the app
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import { users } from "./testData.js";

let mongoServer;
let authCookie;

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
  const userId = loginResponse.body.userId;
  
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

describe("GET /mccs/user/:userId", () => {
  it("should fetch user information successfully", async () => {
    const validUserId = users[0]._id; // Assuming the first user in testData.js is valid
    const response = await request(app)
      .get(`/mccs/user/${validUserId}`)
      .set("Cookie", authCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("name", users[0].name);
    expect(response.body.user).toHaveProperty("email", users[0].email);
    expect(response.body.user).toHaveProperty("role", users[0].role);
  });

  it("should return 404 for a non-existent user ID", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/mccs/user/${nonExistentUserId}`)
      .set("Cookie", authCookie);

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "User not found");
  });

  it("should return 500 for an invalid user ID format", async () => {
    const invalidUserId = "invalid-id";
    const response = await request(app)
      .get(`/mccs/user/${invalidUserId}`)
      .set("Cookie", authCookie);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message", "Error fetching user info");
    expect(response.body).toHaveProperty("error");
  });
  
  it("should return 401 when no authentication is provided", async () => {
    const validUserId = users[0]._id;
    const response = await request(app).get(`/mccs/user/${validUserId}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Authentication token missing");
  });
});
