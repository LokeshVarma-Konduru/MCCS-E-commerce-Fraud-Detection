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

describe("GET /mccs/user/:userId", () => {
  it("should fetch user information successfully", async () => {
    const validUserId = users[0]._id; // Assuming the first user in testData.js is valid
    const response = await request(app).get(`/mccs/user/${validUserId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("name", users[0].name);
    expect(response.body.user).toHaveProperty("email", users[0].email);
    expect(response.body.user).toHaveProperty("role", users[0].role);
  });

  it("should return 404 for a non-existent user ID", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/mccs/user/${nonExistentUserId}`);

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "User not found");
  });

  it("should return 500 for an invalid user ID format", async () => {
    const invalidUserId = "invalid-id";
    const response = await request(app).get(`/mccs/user/${invalidUserId}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message", "Error fetching user info");
    expect(response.body).toHaveProperty("error");
  });
});
