import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import MLModel from "../models/MLModel.js";
import User from "../models/User.js";
import { users } from "./testData.js";

let mongoServer;
let cookie;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.disconnect();
  await mongoose.connect(uri);

  // Seed users
  await User.insertMany(users);

  // Step 1: Log in to get the userId
  const loginResponse = await request(app)
    .post("/mccs/login")
    .send({ email: "loki1432varma@gmail.com", password: "Loki@1234" });

  expect(loginResponse.statusCode).toBe(200);
  const { userId } = loginResponse.body;
  expect(userId).toBeDefined();

  // Step 2: Retrieve the OTP
  const user = await User.findById(userId);
  const otp = user.otp;
  expect(otp).toBeDefined();

  // Step 3: Verify OTP and retrieve cookie
  const otpResponse = await request(app)
    .post("/mccs/verify-login-otp")
    .send({ userId, otp });

  expect(otpResponse.statusCode).toBe(200);
  cookie = otpResponse.headers["set-cookie"];
  expect(cookie).toBeDefined();

  // Seed ML models with the provided data
  await MLModel.create([
    {
      _id: "675fa472bca4086217f3b3a4",
      modelName: "Logistic Regression",
      modelType: "classification",
      createdAt: new Date("2024-12-15T22:54:26.346Z"),
      metrics: [
        { name: "accuracy", value: 0.9531607006854531 },
        {
          name: "confusion_matrix",
          value: [
            [22386, 26],
            [1081, 141],
          ],
        },
        {
          name: "classification_report",
          value: {
            "0": {
              precision: 0.9539353134188435,
              recall: 0.9988399071925754,
              "f1-score": 0.9758713136729222,
              support: 22412,
            },
            "1": {
              precision: 0.844311377245509,
              recall: 0.11538461538461539,
              "f1-score": 0.20302375809935205,
              support: 1222,
            },
            accuracy: 0.9531607006854531,
            "macro avg": {
              precision: 0.8991233453321763,
              recall: 0.5571122612885954,
              "f1-score": 0.5894475358861372,
              support: 23634,
            },
            "weighted avg": {
              precision: 0.9482671891062507,
              recall: 0.9531607006854531,
              "f1-score": 0.935911099028304,
              support: 23634,
            },
          },
        },
      ],
      additionalInfo: {},
    },
  ]);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("MLModel API Tests", () => {
  describe("GET /mccs/models", () => {
    it("should fetch all ML models successfully", async () => {
      const response = await request(app)
        .get("/mccs/models")
        .set("Cookie", cookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should fail without authentication", async () => {
      const response = await request(app).get("/mccs/models");

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
  });

  describe("GET /mccs/model/:id", () => {
    it("should fetch a specific ML model by ID", async () => {
      const modelId = "675fa472bca4086217f3b3a4";

      const response = await request(app)
        .get(`/mccs/model/${modelId}`)
        .set("Cookie", cookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("modelName", "Logistic Regression");
    });

    it("should return 404 for a non-existent model ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/mccs/model/${fakeId}`)
        .set("Cookie", cookie);

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty("message", "Model not found");
    });

    it("should fail with an invalid ID format", async () => {
      const response = await request(app)
        .get("/mccs/model/invalid-id")
        .set("Cookie", cookie);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail without authentication", async () => {
      const modelId = "675fa472bca4086217f3b3a4";

      const response = await request(app).get(`/mccs/model/${modelId}`);

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
  });
});
