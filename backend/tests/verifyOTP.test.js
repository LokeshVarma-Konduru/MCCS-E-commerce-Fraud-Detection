import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import { users } from "./testData.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.disconnect();
  await mongoose.connect(uri);

  await User.insertMany(users);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("POST /verify-login-otp", () => {
  it("should verify OTP successfully with valid OTP and userId", async () => {
    const response = await request(app)
      .post("/mccs/verify-login-otp")
      .send({
        userId: "675fa2fd58089aa77e9408d0",
        otp: "123456",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "OTP verified, login successful");
  });

  it("should fail with invalid OTP", async () => {
    const response = await request(app)
      .post("/mccs/verify-login-otp")
      .send({
        userId: "675fa2fd58089aa77e9408d0",
        otp: "654321", // Invalid OTP
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid or expired OTP");
  });

  it("should fail with expired OTP", async () => {
    // Update user with expired OTP
    await User.findByIdAndUpdate("675fa2fd58089aa77e9408d0", {
      otpExpiresAt: new Date(Date.now() - 10 * 60 * 1000), // Expired OTP
    });

    const response = await request(app)
      .post("/mccs/verify-login-otp")
      .send({
        userId: "675fa2fd58089aa77e9408d0",
        otp: "123456", // Correct OTP but expired
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid or expired OTP");
  });

  it("should fail with missing userId", async () => {
    const response = await request(app)
      .post("/mccs/verify-login-otp")
      .send({
        otp: "123456",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "User ID and OTP are required");
  });

  it("should fail with missing OTP", async () => {
    const response = await request(app)
      .post("/mccs/verify-login-otp")
      .send({
        userId: "675fa2fd58089aa77e9408d0",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "User ID and OTP are required");
  });
});
