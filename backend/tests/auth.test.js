import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js"; // Ensure this exports only the app
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import { users } from "./testData.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Ensure no active connections
  await mongoose.disconnect();
  await mongoose.connect(uri);

  // Seed test data
  await User.insertMany(users);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("POST /login", () => {
  it("should log in successfully with valid Admin credentials", async () => {
    const response = await request(app)
      .post("/mccs/login") // Update to include /mccs
      .send({ email: "loki1432varma@gmail.com", password: "Loki@1234" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Login OTP sent to email");
    expect(response.body).toHaveProperty("userId");
  });

  it("should log in successfully with valid Developer credentials", async () => {
    const response = await request(app)
      .post("/mccs/login") // Update to include /mccs
      .send({ email: "lokeshvarmakonduru2001@gmail.com", password: "941d1349" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Login OTP sent to email");
    expect(response.body).toHaveProperty("userId");
  });

  it("should fail with invalid password", async () => {
    const response = await request(app)
      .post("/mccs/login") // Update to include /mccs
      .send({ email: "loki1432varma@gmail.com", password: "wrongpassword" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid credentials");
  });

  it("should fail with non-existent user", async () => {
    const response = await request(app)
      .post("/mccs/login") // Update to include /mccs
      .send({ email: "nonexistent@gmail.com", password: "somepassword" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid credentials");
  });

  it("should fail if email is missing", async () => {
    const response = await request(app)
      .post("/mccs/login") // Update to include /mccs
      .send({ password: "Loki@1234" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Email and password are required");
  });
});

describe("Password Update and Logout", () => {
  let authCookie;
  let userId;

  beforeAll(async () => {
    // Login to get userId
    const loginResponse = await request(app)
      .post("/mccs/login")
      .send({ email: "loki1432varma@gmail.com", password: "Loki@1234" });
    
    expect(loginResponse.statusCode).toBe(200);
    userId = loginResponse.body.userId;
    
    // Get OTP from database
    const user = await User.findById(userId);
    const otp = user.otp;
    
    // Verify OTP to get authentication cookie
    const otpResponse = await request(app)
      .post("/mccs/verify-login-otp")
      .send({ userId, otp });
    
    expect(otpResponse.statusCode).toBe(200);
    authCookie = otpResponse.headers["set-cookie"];
  });

  it("should update the password successfully", async () => {
    const response = await request(app)
      .post("/mccs/update-password")
      .set("Cookie", authCookie)
      .send({
        userId,
        oldPassword: "Loki@1234",
        newPassword: "NewPassword123",
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Password updated successfully");
  });

  it("should log out successfully and clear the auth cookie", async () => {
    const logoutResponse = await request(app)
      .post("/mccs/logout")
      .set("Cookie", authCookie);
    
    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.body).toHaveProperty("message", "Logout successful");
  });
});