import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createTestUser, loginTestUser } from "../testUtils.js";

let app; // defer import until after DB is ready

describe("Admin Dashboard API", () => {
  let authCookie;
  let mongo;

  beforeAll(async () => {
    // Start in-memory MongoDB and connect
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { dbName: "mccs" });

    // Defer importing app until after we set up the DB connection
    const mod = await import("../../index.js");
    app = mod.default;

    // Seed a test user and login to obtain cookie
    await createTestUser();
    const auth = await loginTestUser();
    authCookie = auth.authCookie;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  test("GET /mccs/stores/fraud-stats returns stores with fraudStats for map", async () => {
    const res = await request(app)
      .get("/mccs/stores/fraud-stats")
      .set("Cookie", authCookie)
      .query({ period: "30d" })
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      const store = res.body.data[0];
      expect(store.coordinates).toBeDefined();
      expect(store.coordinates.type).toBe("Point");
      expect(Array.isArray(store.coordinates.coordinates)).toBe(true);
      expect(store.coordinates.coordinates.length).toBe(2);

      expect(store.fraudStats).toBeDefined();
      expect(typeof store.fraudStats.fraudRate).toBe("number");
      expect(typeof store.fraudStats.totalTransactions).toBe("number");
      expect(typeof store.fraudStats.fraudulentTransactions).toBe("number");
    }
  });

  test("GET /mccs/stores returns list of stores for marker rendering", async () => {
    const res = await request(app)
      .get("/mccs/stores")
      .set("Cookie", authCookie)
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});


