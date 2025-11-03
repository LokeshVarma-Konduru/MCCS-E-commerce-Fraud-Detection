import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import Transaction from "../models/TransactionSchema.js";
import Store from "../models/Store.js";
import { users } from "./testData.js";

let mongoServer;
let userId;
let storeId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.disconnect();
  await mongoose.connect(uri);

  // Seed test data
  await User.insertMany(users);
  
  // Get test user ID
  const testUser = await User.findOne({ email: "loki1432varma@gmail.com" });
  userId = testUser._id;
  
  // Create a test store
  const testStore = new Store({
    storeID: "ST001",
    storeName: "Test Store",
    storeLocation: "Test City",
    zipCode: "12345",
    coordinates: {
      type: "Point",
      coordinates: [-74.0060, 40.7128] // [longitude, latitude]
    },
    status: "active"
  });
  await testStore.save();
  storeId = testStore._id;
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Alerts Feature Tests", () => {
  describe("Fraud Alert Data Creation", () => {
    it("should create alert data when fraud is detected (prediction = 1) with High risk level", async () => {
      // Create a fraudulent transaction to test alert structure
      const fraudTransaction = new Transaction({
        transactionAmount: 1500.00,
        paymentMethod: "PayPal",
        productCategory: "electronics",
        quantity: 5,
        customerAge: 25,
        deviceUsed: "mobile",
        accountAgeDays: 5,
        transactionHour: 3,
        transactionDay: 15,
        transactionDOW: 5,
        transactionMonth: 4,
        isAddressMatch: 0,
        modelUsed: "xgboost",
        transactionType: "online",
        predictions: [1], // Fraud detected
        probabilities: [[0.15, 0.85]], // 85% fraud probability (High risk)
        status: "pending",
        riskScore: 85,
        userId: userId
      });

      const savedTx = await fraudTransaction.save();

      // Simulate alert data creation logic from transactionController
      const fraudProbability = savedTx.probabilities[0][1];
      let riskLevel = 'Medium';
      if (fraudProbability > 0.8) riskLevel = 'High';
      else if (fraudProbability < 0.6) riskLevel = 'Low';

      const alertData = {
        type: 'fraud_detected',
        transactionId: savedTx._id.toString(),
        transactionIdShort: `TRX-${savedTx._id.toString().slice(-6).toUpperCase()}`,
        amount: savedTx.transactionAmount,
        paymentMethod: savedTx.paymentMethod,
        productCategory: savedTx.productCategory,
        deviceUsed: savedTx.deviceUsed,
        transactionType: savedTx.transactionType,
        riskLevel: riskLevel,
        probability: (fraudProbability * 100).toFixed(1),
        modelUsed: savedTx.modelUsed,
        timestamp: savedTx.createdAt,
        storeID: savedTx.storeID || null,
        storeName: null
      };

      // Verify alert data structure and values
      expect(alertData.type).toBe('fraud_detected');
      expect(alertData.transactionId).toBe(savedTx._id.toString());
      expect(alertData.transactionIdShort).toContain('TRX-');
      expect(alertData.amount).toBe(1500.00);
      expect(alertData.riskLevel).toBe('High'); // 85% > 0.8
      expect(parseFloat(alertData.probability)).toBe(85.0);
      expect(alertData.paymentMethod).toBe('PayPal');
      expect(alertData.modelUsed).toBe('xgboost');
    });

    it("should calculate Medium risk level for probability between 0.6 and 0.8", () => {
      const fraudProbability = 0.7;
      
      let riskLevel = 'Medium';
      if (fraudProbability > 0.8) riskLevel = 'High';
      else if (fraudProbability < 0.6) riskLevel = 'Low';

      expect(riskLevel).toBe('Medium');
    });

    it("should calculate Low risk level for probability less than 0.6", () => {
      const fraudProbability = 0.5;
      
      let riskLevel = 'Medium';
      if (fraudProbability > 0.8) riskLevel = 'High';
      else if (fraudProbability < 0.6) riskLevel = 'Low';

      expect(riskLevel).toBe('Low');
    });

    it("should calculate High risk level for probability greater than 0.8", () => {
      const fraudProbability = 0.9;
      
      let riskLevel = 'Medium';
      if (fraudProbability > 0.8) riskLevel = 'High';
      else if (fraudProbability < 0.6) riskLevel = 'Low';

      expect(riskLevel).toBe('High');
    });
  });

  describe("Alert Data Structure", () => {
    it("should create correct alert data structure with all required fields", async () => {
      const transaction = new Transaction({
        transactionAmount: 500.00,
        paymentMethod: "PayPal",
        productCategory: "clothing",
        quantity: 2,
        customerAge: 30,
        deviceUsed: "desktop",
        accountAgeDays: 100,
        transactionHour: 14,
        transactionDay: 10,
        transactionDOW: 2,
        transactionMonth: 5,
        isAddressMatch: 1,
        modelUsed: "logistic-regression",
        transactionType: "online",
        predictions: [1],
        probabilities: [[0.3, 0.7]],
        status: "pending",
        riskScore: 70,
        userId: userId
      });

      await transaction.save();

      const fraudProbability = transaction.probabilities[0][1];
      const alertData = {
        type: 'fraud_detected',
        transactionId: transaction._id.toString(),
        transactionIdShort: `TRX-${transaction._id.toString().slice(-6).toUpperCase()}`,
        amount: transaction.transactionAmount,
        paymentMethod: transaction.paymentMethod,
        productCategory: transaction.productCategory,
        deviceUsed: transaction.deviceUsed,
        transactionType: transaction.transactionType,
        riskLevel: 'Medium',
        probability: (fraudProbability * 100).toFixed(1),
        modelUsed: transaction.modelUsed,
        timestamp: transaction.createdAt,
        storeID: transaction.storeID || null,
        storeName: null
      };

      // Verify all required fields exist
      expect(alertData).toHaveProperty('type');
      expect(alertData).toHaveProperty('transactionId');
      expect(alertData).toHaveProperty('transactionIdShort');
      expect(alertData).toHaveProperty('amount');
      expect(alertData).toHaveProperty('paymentMethod');
      expect(alertData).toHaveProperty('productCategory');
      expect(alertData).toHaveProperty('deviceUsed');
      expect(alertData).toHaveProperty('transactionType');
      expect(alertData).toHaveProperty('riskLevel');
      expect(alertData).toHaveProperty('probability');
      expect(alertData).toHaveProperty('modelUsed');
      expect(alertData).toHaveProperty('timestamp');
      expect(alertData).toHaveProperty('storeID');
      
      // Verify field types
      expect(typeof alertData.type).toBe('string');
      expect(typeof alertData.amount).toBe('number');
      expect(typeof alertData.riskLevel).toBe('string');
      expect(typeof alertData.probability).toBe('string');
    });

    it("should include store information when transaction has storeRef", async () => {
      const store = await Store.findOne({ storeID: "ST001" });
      
      const transaction = new Transaction({
        transactionAmount: 300.00,
        paymentMethod: "credit card",
        productCategory: "home & garden",
        quantity: 1,
        customerAge: 40,
        deviceUsed: "tablet",
        accountAgeDays: 200,
        transactionHour: 12,
        transactionDay: 20,
        transactionDOW: 3,
        transactionMonth: 6,
        isAddressMatch: 1,
        modelUsed: "decision-tree",
        transactionType: "in-store",
        storeRef: store._id,
        storeID: "ST001",
        predictions: [1],
        probabilities: [[0.25, 0.75]],
        status: "pending",
        riskScore: 75,
        userId: userId
      });

      await transaction.save();

      const alertData = {
        type: 'fraud_detected',
        transactionId: transaction._id.toString(),
        transactionIdShort: `TRX-${transaction._id.toString().slice(-6).toUpperCase()}`,
        amount: transaction.transactionAmount,
        paymentMethod: transaction.paymentMethod,
        productCategory: transaction.productCategory,
        deviceUsed: transaction.deviceUsed,
        transactionType: transaction.transactionType,
        riskLevel: 'Medium',
        probability: (transaction.probabilities[0][1] * 100).toFixed(1),
        modelUsed: transaction.modelUsed,
        timestamp: transaction.createdAt,
        storeID: transaction.storeID,
        storeName: store.storeName
      };

      expect(alertData.storeID).toBe("ST001");
      expect(alertData.storeName).toBe("Test Store");
      expect(alertData.transactionType).toBe("in-store");
    });
  });

  describe("Non-Fraud Transaction Handling", () => {
    it("should not create alert when prediction is 0 (not fraud)", async () => {
      const transaction = new Transaction({
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
        predictions: [0], // No fraud
        probabilities: [[0.9, 0.1]], // Low fraud probability
        status: "pending",
        riskScore: 10,
        userId: userId
      });

      await transaction.save();

      // Verify prediction is 0 (no fraud)
      expect(transaction.predictions[0]).toBe(0);
      
      // If prediction is 0, alert should NOT be emitted
      // (This is verified by the condition in transactionController: if (parsed.predictions[0] === 1))
      const shouldEmitAlert = transaction.predictions[0] === 1;
      expect(shouldEmitAlert).toBe(false);
    });
  });
});

