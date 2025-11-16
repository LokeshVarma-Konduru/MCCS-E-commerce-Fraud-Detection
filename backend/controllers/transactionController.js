// controllers/transactionController.js
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Transaction from '../models/TransactionSchema.js';
import Store from '../models/Store.js';
import { io } from '../index.js';

// We need these for ES module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const predictTransaction = async (req, res) => {
    try {
      // 1) Which model do we want? E.g. ?model=lr
      const modelName = req.query.model;
      if (!modelName) {
        return res.status(400).json({ error: "Please specify ?model=logistic-regression, bernoulli-nb, xgboost, or decision-tree" });
      }
  
      // Validate that we have data to predict
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "No transaction data provided in request body" });
      }

      // Check if we have the expected fields
      const requiredFields = [
        "Transaction Amount", "Payment Method", "Product Category", 
        "Quantity", "Customer Age", "Device Used", "Account Age Days",
        "Transaction Hour", "Transaction Day", "Transaction DOW", 
        "Transaction Month", "Is Address Match"
      ];

      // Optional fields that we'll check if provided
      const optionalFields = ["Transaction Type"];

      for (const field of requiredFields) {
        if (!req.body[field] || !Array.isArray(req.body[field]) || req.body[field].length === 0) {
          return res.status(400).json({ 
            error: `Missing or invalid field: ${field}. All fields must be arrays with at least one value.` 
          });
        }
      }
      
      // Validate optional fields if they are provided
      for (const field of optionalFields) {
        if (req.body[field] && (!Array.isArray(req.body[field]) || req.body[field].length === 0)) {
          return res.status(400).json({ 
            error: `Invalid optional field: ${field}. If provided, it must be an array with at least one value.` 
          });
        }
      }

      // Gather optional store info (for in-store transactions)
      const providedStoreRef = req.body.storeRef; // ObjectId string
      const providedStoreID = req.body.storeID;   // human-readable ID

      // 2) Convert request body to JSON string for Python
      // Create a copy of the request body without non-feature fields
      const predictionData = { ...req.body };
      if (predictionData["Transaction Type"]) delete predictionData["Transaction Type"]; // not used by model
      if (predictionData.storeRef) delete predictionData.storeRef; // avoid sending to python
      if (predictionData.storeID) delete predictionData.storeID;   // avoid sending to python
      
      const dataToSend = JSON.stringify(predictionData);
  
      // 3) Build absolute path to predict.py
      const pythonScriptPath = path.join(__dirname, '../ml_models', 'predict.py');
  
      // 4) Spawn Python with the model name as an argument
      const pythonProcess = spawn('python', [pythonScriptPath, modelName]);
  
      let resultData = '';
      let errorData = '';
  
      // 5) Write the data to Python's stdin
      pythonProcess.stdin.write(dataToSend);
      pythonProcess.stdin.end();
  
      // 6) Collect Python's stdout
      pythonProcess.stdout.on('data', (chunk) => {
        resultData += chunk.toString();
      });
  
      // Collect Python's stderr
      pythonProcess.stderr.on('data', (chunk) => {
        errorData += chunk.toString();
      });
  
      // 7) On script close...
      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          console.error('Python script failed, exit code:', code);
          console.error('Error Data:', errorData);
          return res.status(500).json({ error: 'Python script failed.', details: errorData });
        }
        try {
          // 8) Parse JSON from Python
          console.log("Raw result from Python:", resultData);
          const parsed = JSON.parse(resultData); // should be { "predictions": [...], "probabilities": [...] }
          
          if (!parsed.predictions || !Array.isArray(parsed.predictions)) {
            return res.status(500).json({ 
              error: 'Invalid predictions format from Python script.',
              rawOutput: resultData
            });
          }
  
          // 9) Resolve store for in-store transactions if provided
          let resolvedStore = null;
          const requestedTxnType = req.body["Transaction Type"] ? 
            (req.body["Transaction Type"][0] === 'online' || req.body["Transaction Type"][0] === 'in-store' ? req.body["Transaction Type"][0] : 'online') : 'online';
          if (requestedTxnType === 'in-store' && (providedStoreRef || providedStoreID)) {
            try {
              if (providedStoreRef) {
                resolvedStore = await Store.findById(providedStoreRef);
              } else if (providedStoreID) {
                resolvedStore = await Store.findOne({ storeID: providedStoreID });
              }
            } catch (_e) { /* ignore */ }
          }

          // 10) Save transaction to database
          const newTransaction = new Transaction({
            transactionAmount: req.body["Transaction Amount"][0],
            paymentMethod: req.body["Payment Method"][0],
            productCategory: req.body["Product Category"][0],
            quantity: req.body["Quantity"][0],
            customerAge: req.body["Customer Age"][0],
            deviceUsed: req.body["Device Used"][0],
            accountAgeDays: req.body["Account Age Days"][0],
            transactionHour: req.body["Transaction Hour"][0],
            transactionDay: req.body["Transaction Day"][0],
            transactionDOW: req.body["Transaction DOW"][0],
            transactionMonth: req.body["Transaction Month"][0],
            isAddressMatch: req.body["Is Address Match"][0],
            modelUsed: modelName,
            // Get transaction type if provided, ensure it's one of the valid values
            transactionType: requestedTxnType,
            predictions: parsed.predictions,
            probabilities: parsed.probabilities,
            userId: req.apiKeyUserId, // This is set by the validateApiKey middleware
            ...(resolvedStore ? { storeRef: resolvedStore._id, storeID: resolvedStore.storeID } : {})
          });
  
          const savedTransaction = await newTransaction.save();
  
          // 🚨 EMIT REAL-TIME FRAUD ALERT if fraud is detected
          if (parsed.predictions[0] === 1) {
            // Calculate risk score based on probability
            const fraudProbability = parsed.probabilities && parsed.probabilities[0] && parsed.probabilities[0][1] 
              ? parsed.probabilities[0][1] 
              : 0.5;
            
            let riskLevel = 'Medium';
            if (fraudProbability > 0.8) riskLevel = 'High';
            else if (fraudProbability < 0.6) riskLevel = 'Low';
            
            const alertData = {
              type: 'fraud_detected',
              transactionId: savedTransaction._id.toString(),
              transactionIdShort: `TRX-${savedTransaction._id.toString().slice(-6).toUpperCase()}`,
              amount: savedTransaction.transactionAmount,
              paymentMethod: savedTransaction.paymentMethod,
              productCategory: savedTransaction.productCategory,
              deviceUsed: savedTransaction.deviceUsed,
              transactionType: savedTransaction.transactionType,
              riskLevel: riskLevel,
              probability: (fraudProbability * 100).toFixed(1),
              modelUsed: modelName,
              timestamp: savedTransaction.createdAt || new Date(),
              storeID: savedTransaction.storeID || null,
              storeName: resolvedStore?.storeName || null
            };
            
            console.log('🚨 FRAUD DETECTED! Emitting alert:', alertData.transactionIdShort);
            io.to("alerts:all").emit("fraud_alert", alertData);
            if (alertData.storeID) {
              io.to(`store:${alertData.storeID}`).emit("fraud_alert", alertData);
            }
          }
  
          // 11) Return predictions + saved doc
          return res.json({
            success: true,
            predictions: parsed.predictions,
            probabilities: parsed.probabilities,
            savedTransaction
          });
        } catch (err) {
          console.error('Error parsing Python output:', err);
          return res.status(500).json({
            success: false,
            error: 'Invalid JSON from Python script.'
          });
        }
      });
    } catch (err) {
      console.error('Error spawning Python script:', err);
      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  };


  export const getTransactions = async (req, res) => {
  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Allow filtering by model, prediction value, status, and other parameters
    const { model, prediction, status, userId, startDate, endDate, productCategory, paymentMethod, transactionType, minRiskScore, maxRiskScore, minAmount, maxAmount, search, storeRef, storeID } = req.query;
    const filter = {};
    
    // Add search functionality for transaction ID, amount, or status
    if (search) {
      try {
        const searchTerm = search.trim();
        
        // Check if search term is a number (for amount)
        const isNumber = !isNaN(parseFloat(searchTerm)) && isFinite(searchTerm);
        
        // Build the base filter for non-search related filters
        const baseFilter = {};
        
        if (model) baseFilter.modelUsed = model;
        if (prediction !== undefined) baseFilter.predictions = { $in: [Number(prediction)] };
        if (status) baseFilter.status = status;
        if (userId) baseFilter.userId = userId;
        if (productCategory) baseFilter.productCategory = productCategory;
        if (paymentMethod) baseFilter.paymentMethod = paymentMethod;
        if (transactionType) baseFilter.transactionType = transactionType;
        // Store filters
        if (storeRef) {
          try { baseFilter.storeRef = new mongoose.Types.ObjectId(storeRef); } catch (_e) { baseFilter.storeRef = storeRef; }
        } else if (storeID) {
          baseFilter.storeID = storeID;
        }
        
        // Date range filter
        if (startDate || endDate) {
          baseFilter.createdAt = {};
          if (startDate) baseFilter.createdAt.$gte = new Date(startDate);
          if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            baseFilter.createdAt.$lte = endOfDay;
          }
        }
        
        // Risk score range filter
        if (minRiskScore !== undefined || maxRiskScore !== undefined) {
          baseFilter.riskScore = {};
          if (minRiskScore !== undefined) baseFilter.riskScore.$gte = Number(minRiskScore);
          if (maxRiskScore !== undefined) baseFilter.riskScore.$lte = Number(maxRiskScore);
        }
        
        // Amount range filter
        if (minAmount !== undefined || maxAmount !== undefined) {
          baseFilter.transactionAmount = {};
          if (minAmount !== undefined) baseFilter.transactionAmount.$gte = Number(minAmount);
          if (maxAmount !== undefined) baseFilter.transactionAmount.$lte = Number(maxAmount);
        }
        
        // Create the aggregation pipeline
        const pipeline = [
          // First add string versions of fields we want to search
          { $addFields: { 
            idString: { $toString: "$_id" },
            amountString: { $toString: "$transactionAmount" }
          }}
        ];
        
        // Build search conditions
        const searchConditions = [];
        
        // 1. Search by transaction ID (if it looks like a hex string)
        if (/^[0-9a-fA-F]{3,}$/.test(searchTerm)) {
          searchConditions.push({ idString: { $regex: searchTerm, $options: 'i' } });
        }
        
        // 2. Search by amount (if it's a number)
        if (isNumber) {
          const numericValue = parseFloat(searchTerm);
          // Exact match
          searchConditions.push({ transactionAmount: numericValue });
          // Partial match
          searchConditions.push({ amountString: { $regex: searchTerm, $options: 'i' } });
        }
        
        // 3. Search by status
        searchConditions.push({ status: { $regex: searchTerm, $options: 'i' } });
        
        // 4. Search by transaction type
        searchConditions.push({ transactionType: { $regex: searchTerm, $options: 'i' } });
        
        // 5. Search by payment method
        searchConditions.push({ paymentMethod: { $regex: searchTerm, $options: 'i' } });
        
        // Add the search conditions to the pipeline
        pipeline.push({ $match: { $or: searchConditions } });
        
        // Add the base filter if it's not empty
        if (Object.keys(baseFilter).length > 0) {
          pipeline.push({ $match: baseFilter });
        }
        
        // Add sorting, pagination, and counting
        pipeline.push(
          { $sort: { createdAt: -1 } },
          { $facet: {
            // Get paginated transactions
            paginatedResults: [{ $skip: skip }, { $limit: limit }],
            // Count total matching documents
            totalCount: [{ $count: 'count' }]
          }}
        );
        
        // Execute the aggregation
        const result = await Transaction.aggregate(pipeline);
        
        // Extract results
        const transactions = result[0].paginatedResults || [];
        const totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;
        
        return res.json({ 
          success: true,
          transactions,
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
          }
        });
      } catch (err) {
        console.error('Search error:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Server error during search' 
        });
      }
    }

    if (model) {
      filter.modelUsed = model;
    }
    if (prediction !== undefined) {
      // Filter transactions that have a prediction array containing the specified value
      filter.predictions = { $in: [Number(prediction)] };
    }
    if (status) {
      // Filter by review status (pending, approved, rejected, under_review)
      filter.status = status;
    }
    if (userId) {
      filter.userId = userId;
    }
    if (productCategory) {
      filter.productCategory = productCategory;
    }
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    if (transactionType) {
      filter.transactionType = transactionType;
    }
    // Store filters
    if (storeRef) {
      try { filter.storeRef = new mongoose.Types.ObjectId(storeRef); } catch (_e) { filter.storeRef = storeRef; }
    } else if (storeID) {
      filter.storeID = storeID;
    }
    
    // Risk score range filter
    if (minRiskScore !== undefined || maxRiskScore !== undefined) {
      filter.riskScore = {};
      if (minRiskScore !== undefined) {
        filter.riskScore.$gte = Number(minRiskScore);
      }
      if (maxRiskScore !== undefined) {
        filter.riskScore.$lte = Number(maxRiskScore);
      }
    }
    
    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.transactionAmount = {};
      if (minAmount !== undefined) {
        filter.transactionAmount.$gte = Number(minAmount);
      }
      if (maxAmount !== undefined) {
        filter.transactionAmount.$lte = Number(maxAmount);
      }
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }  
      
      // Get transactions with pagination
      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // Get total count for pagination
      const totalCount = await Transaction.countDocuments(filter);
      
      res.json({ 
        success: true,
        transactions,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        success: false,
        error: 'Server error' 
      });
    }
  };
  
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is a valid MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID format'
      });
    }
    
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        error: 'Transaction not found' 
      });
    }
    res.json({ 
      success: true,
      transaction 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Update transaction status (approve/reject/under_review)
export const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate status
    if (!['approved', 'rejected', 'under_review', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: approved, rejected, under_review, pending'
      });
    }
    
    // Get user ID from authenticated user
    const userId = req.user._id;
    
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Update transaction
    transaction.status = status;
    if (notes) transaction.notes = notes;
    transaction.reviewedBy = userId;
    transaction.reviewedAt = new Date();
    
    await transaction.save();
    
    // Populate store information for socket emission
    const populatedTransaction = await Transaction.findById(id).populate('storeRef');
    
    // Emit socket event to notify clients of transaction status update
    if (io) {
      const updateData = {
        type: 'transaction_status_updated',
        transactionId: transaction._id.toString(),
        status: transaction.status,
        reviewedBy: userId.toString(),
        reviewedAt: transaction.reviewedAt,
        storeID: populatedTransaction?.storeID || null,
        storeRef: populatedTransaction?.storeRef?._id?.toString() || null
      };
      
      // Emit to all clients
      io.to("alerts:all").emit("transaction_updated", updateData);
      
      // Emit to specific store room if transaction has a store
      if (populatedTransaction?.storeID) {
        io.to(`store:${populatedTransaction.storeID}`).emit("transaction_updated", updateData);
      }
    }
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get fraud trends data for the monitoring dashboard
export const getFraudTrends = async (req, res) => {
  try {
    const { period = 'week', transactionType = 'all' } = req.query;
    
    // Determine date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to week
    }
    
    // Build filter
    const filter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    // Add transaction type filter if not 'all'
    if (transactionType !== 'all') {
      filter.transactionType = transactionType;
    }
    
    // Group by date and calculate fraud rate
    const aggregationPipeline = [
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          totalTransactions: { $sum: 1 },
          fraudulentTransactions: {
            $sum: {
              $cond: [{ $eq: [{ $arrayElemAt: ["$predictions", 0] }, 1] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day"
            }
          },
          totalTransactions: 1,
          fraudulentTransactions: 1,
          fraudRate: {
            $multiply: [
              { $divide: ["$fraudulentTransactions", "$totalTransactions"] },
              100
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ];
    
    const trendData = await Transaction.aggregate(aggregationPipeline);
    
    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Migration endpoint to update existing transactions with new fields
export const migrateTransactions = async (req, res) => {
  try {
    // Find all transactions that don't have the status field set
    const transactions = await Transaction.find({
      $or: [
        { status: { $exists: false } },
        { riskScore: { $exists: false } }
      ]
    });
    
    console.log(`Found ${transactions.length} transactions to migrate`);
    
    // Update each transaction
    const updatePromises = transactions.map(async (transaction) => {
      // Calculate risk score from probabilities if available
      let riskScore = 0;
      if (transaction.probabilities && 
          transaction.probabilities[0] && 
          transaction.probabilities[0][1]) {
        riskScore = Math.round(transaction.probabilities[0][1] * 100);
      }
      
      // Set default status based on prediction
      let status = 'pending';
      if (transaction.predictions && 
          transaction.predictions[0] !== undefined) {
        // If prediction is 1 (fraud), set to under_review
        status = transaction.predictions[0] === 1 ? 'under_review' : 'pending';
      }
      
      // Update the transaction
      transaction.status = status;
      transaction.riskScore = riskScore;
      transaction.notes = '';
      
      return transaction.save();
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: `Successfully migrated ${transactions.length} transactions`,
      migratedCount: transactions.length
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during migration',
      message: error.message
    });
  }
};

// Get high-risk transactions for alerts
export const getHighRiskTransactions = async (req, res) => {
  try {
    const { limit = 5, transactionType = 'all', minRiskScore = 70 } = req.query;
    
    // Build filter
    const filter = {
      // Filter for transactions predicted as fraud (prediction = 1)
      predictions: { $in: [1] }
    };
    
    // Add transaction type filter if not 'all'
    if (transactionType !== 'all') {
      filter.transactionType = transactionType;
    }
    
    // Add risk score filter if specified
    if (minRiskScore) {
      // Either use the riskScore field if it exists
      // or calculate it from probabilities
      filter.$or = [
        { riskScore: { $gte: parseInt(minRiskScore) } },
        { 'probabilities.0.1': { $gte: parseInt(minRiskScore) / 100 } }
      ];
    }
    
    // Get transactions with high fraud probability
    const transactions = await Transaction.find(filter)
      .sort({ riskScore: -1, createdAt: -1 }) // Sort by risk score first, then by date
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance
    
    // Calculate risk score and format response
    const alerts = transactions.map(transaction => {
      // Get fraud probability (second value in first array of probabilities)
      const fraudProbability = transaction.probabilities[0] ? 
        transaction.probabilities[0][1] || 0 : 0;
      
      // Calculate risk score (0-100)
      const riskScore = Math.round(fraudProbability * 100);
      
      return {
        id: transaction._id,
        amount: transaction.transactionAmount,
        time: transaction.createdAt,
        type: transaction.transactionType,
        paymentMethod: transaction.paymentMethod,
        productCategory: transaction.productCategory,
        status: transaction.status,
        riskScore,
        fraudProbability
      };
    });
    
    // Sort by risk score (highest first)
    alerts.sort((a, b) => b.riskScore - a.riskScore);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
