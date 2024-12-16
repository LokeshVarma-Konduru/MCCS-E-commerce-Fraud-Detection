import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import { users } from "./testData.js";
import jwt from 'jsonwebtoken';

let mongoServer;
let adminToken;
let developerToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.disconnect();
  await mongoose.connect(uri);

  // Seed test data
  await User.insertMany(users);

  // Create tokens for testing
  adminToken = jwt.sign(
    { userId: "675fa2fd58089aa77e9408d0" },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  developerToken = jwt.sign(
    { userId: "675fa5bbb727d03a130a9af6" },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Admin Controller Tests", () => {
  describe("POST /mccs/addUsers", () => {
    it("should allow admin to add new users", async () => {
      const newUsers = [
        {
          email: "newuser1@test.com",
          name: "New User 1",
          role: "Developer"
        }
      ];

      const response = await request(app)
        .post("/mccs/addUsers")
        .set('Cookie', [`authonlycookie=${adminToken}`])
        .send({ users: newUsers });

      expect(response.statusCode).toBe(200);
      expect(response.body.addedUsers).toHaveLength(1);
      expect(response.body.addedUsers[0].email).toBe("newuser1@test.com");
      expect(response.body.failedUsers).toHaveLength(0);
    });

    it("should reject invalid user data", async () => {
      const invalidUsers = [
        {
          email: "invalid@test.com",
          // missing name and role
        }
      ];

      const response = await request(app)
        .post("/mccs/addUsers")
        .set('Cookie', [`authonlycookie=${adminToken}`])
        .send({ users: invalidUsers });

      expect(response.statusCode).toBe(200);
      expect(response.body.failedUsers).toHaveLength(1);
      expect(response.body.failedUsers[0].message).toBe('Missing required fields (email, name, role)');
    });

    it("should reject non-admin users", async () => {
      const response = await request(app)
        .post("/mccs/addUsers")
        .set('Cookie', [`authonlycookie=${developerToken}`])
        .send({ users: [] });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("GET /mccs/users", () => {
    it("should allow admin to get all users", async () => {
      const response = await request(app)
        .get("/mccs/users")
        .set('Cookie', [`authonlycookie=${adminToken}`]);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should support search by email", async () => {
      const response = await request(app)
        .get("/mccs/users?search=loki1432varma")
        .set('Cookie', [`authonlycookie=${adminToken}`]);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].email).toContain("loki1432varma");
    });

    it("should support role filtering", async () => {
      const response = await request(app)
        .get("/mccs/users?role=Developer")
        .set('Cookie', [`authonlycookie=${adminToken}`]);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.every(user => user.role === "Developer")).toBe(true);
    });
  });

  describe("DELETE /mccs/admin/users/:userId", () => {
    it("should allow admin to delete a user", async () => {
      // First create a user to delete
      const newUser = new User({
        email: "todelete@test.com",
        password: "hashedpassword",
        name: "To Delete",
        role: "Developer",
        status: true
      });
      const savedUser = await newUser.save();

      const response = await request(app)
        .delete(`/mccs/admin/users/${savedUser._id}`)
        .set('Cookie', [`authonlycookie=${adminToken}`]);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("User deleted successfully");

      // Verify user is deleted
      const deletedUser = await User.findById(savedUser._id);
      expect(deletedUser).toBeNull();
    });

    it("should handle invalid ObjectId format", async () => {
      const response = await request(app)
        .delete("/mccs/admin/users/invalidObjectId")
        .set('Cookie', [`authonlycookie=${adminToken}`]);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Invalid user ID format");
    });
  });

  describe("POST /mccs/admin/users/:userId/toggle-status", () => {
    it("should allow admin to toggle user status", async () => {
      // Create a test user
      const newUser = new User({
        email: "totoggle@test.com",
        password: "hashedpassword",
        name: "To Toggle",
        role: "Developer",
        status: true
      });
      const savedUser = await newUser.save();

      const response = await request(app)
        .post(`/mccs/admin/users/${savedUser._id}/toggle-status`)
        .set('Cookie', [`authonlycookie=${adminToken}`])
        .send({ status: false });  // Add status in request body

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("User deactivated successfully");
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('status', false);

      // Verify status is toggled
      const updatedUser = await User.findById(savedUser._id);
      expect(updatedUser.status).toBe(false);
    });

    it("should not allow deactivating last admin", async () => {
      // First make sure there's only one admin
      await User.updateMany({ role: 'Admin' }, { status: false });
      const lastAdmin = await User.findOne({ email: "loki1432varma@gmail.com" });
      await User.findByIdAndUpdate(lastAdmin._id, { status: true });

      const response = await request(app)
        .post(`/mccs/admin/users/${lastAdmin._id}/toggle-status`)
        .set('Cookie', [`authonlycookie=${adminToken}`])
        .send({ status: false });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Cannot deactivate the last active admin");
    });

    it("should handle invalid ObjectId format", async () => {
      const response = await request(app)
        .post("/mccs/admin/users/invalidObjectId/toggle-status")
        .set('Cookie', [`authonlycookie=${adminToken}`])
        .send({ status: false });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Invalid user ID format");
    });

    it("should handle missing status in request body", async () => {
      const newUser = new User({
        email: "statustest@test.com",
        password: "hashedpassword",
        name: "Status Test",
        role: "Developer",
        status: true
      });
      const savedUser = await newUser.save();

      const response = await request(app)
        .post(`/mccs/admin/users/${savedUser._id}/toggle-status`)
        .set('Cookie', [`authonlycookie=${adminToken}`])
        .send({});  // No status in body

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Status must be a boolean value");
    });

    it("should not allow non-admin users to toggle status", async () => {
      const response = await request(app)
        .post(`/mccs/admin/users/${users[0]._id}/toggle-status`)
        .set('Cookie', [`authonlycookie=${developerToken}`])
        .send({ status: false });

      expect(response.statusCode).toBe(403);
    });
  });
});
