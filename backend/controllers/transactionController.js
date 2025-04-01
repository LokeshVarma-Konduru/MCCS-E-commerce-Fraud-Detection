// controllers/transactionController.js
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import Transaction from '../models/TransactionSchema.js';

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

      // 2) Convert request body to JSON string for Python
      // Create a copy of the request body without the Transaction Type field
      const predictionData = { ...req.body };
      if (predictionData["Transaction Type"]) {
        delete predictionData["Transaction Type"]; // Remove transaction type as it's not used for prediction
      }
      
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
  
          // 9) Save transaction to database
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
            transactionType: req.body["Transaction Type"] ? 
              (req.body["Transaction Type"][0] === 'online' || req.body["Transaction Type"][0] === 'in-store' ? 
                req.body["Transaction Type"][0] : 'online') : 
              'online',
            predictions: parsed.predictions,
            probabilities: parsed.probabilities,
            userId: req.apiKeyUserId // This is set by the validateApiKey middleware
          });
  
          const savedTransaction = await newTransaction.save();
  
          // 10) Return predictions + saved doc
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

      // Allow filtering by model, prediction value, and other parameters
      const { model, prediction, userId, startDate, endDate, productCategory, paymentMethod, transactionType } = req.query;
      const filter = {};
  
      if (model) {
        filter.modelUsed = model;
      }
      if (prediction !== undefined) {
        // Filter transactions that have a prediction array containing the specified value.
        filter.predictions = { $in: [Number(prediction)] };
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