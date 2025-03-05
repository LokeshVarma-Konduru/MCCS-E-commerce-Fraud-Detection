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
  
      // 2) Convert request body to JSON string for Python
      const dataToSend = JSON.stringify(req.body);
  
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
          return res.status(500).json({ error: 'Python script failed.' });
        }
        try {
          // 8) Parse JSON from Python
          const parsed = JSON.parse(resultData); // should be { "predictions": [...], "probabilities": [...] }
  
          // 9) Save the transaction + predictions in MongoDB
          const newTransaction = new Transaction({
            transactionAmount: req.body["Transaction Amount"]?.[0] || 0,
            paymentMethod: req.body["Payment Method"]?.[0] || "",
            productCategory: req.body["Product Category"]?.[0] || "",
            quantity: req.body["Quantity"]?.[0] || 0,
            customerAge: req.body["Customer Age"]?.[0] || 0,
            deviceUsed: req.body["Device Used"]?.[0] || "",
            accountAgeDays: req.body["Account Age Days"]?.[0] || 0,
            transactionHour: req.body["Transaction Hour"]?.[0] || 0,
            transactionDay: req.body["Transaction Day"]?.[0] || 0,
            transactionDOW: req.body["Transaction DOW"]?.[0] || 0,
            transactionMonth: req.body["Transaction Month"]?.[0] || 0,
            isAddressMatch: req.body["Is Address Match"]?.[0] || 0,
  
            modelUsed: modelName,
            predictions: parsed.predictions,
            probabilities: parsed.probabilities
          });
  
          const savedTransaction = await newTransaction.save();
  
          // 10) Return predictions + saved doc
          return res.json({
            predictions: parsed.predictions,
            probabilities: parsed.probabilities,
            savedTransaction
          });
        } catch (err) {
          console.error('Error parsing Python output:', err);
          return res.status(500).send('Invalid JSON from Python script.');
        }
      });
    } catch (err) {
      console.error('Error spawning Python script:', err);
      return res.status(500).send('Internal server error.');
    }
  };


  export const getTransactions = async (req, res) => {
    try {
      // Allow filtering by model and prediction value via query parameters.
      // For example: /api/transactions?model=lr&prediction=0
      const { model, prediction } = req.query;
      const filter = {};
  
      if (model) {
        filter.modelUsed = model;
      }
      if (prediction !== undefined) {
        // Filter transactions that have a prediction array containing the specified value.
        filter.predictions = { $in: [Number(prediction)] };
      }
      
      const transactions = await Transaction.find(filter);
      res.json({ transactions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  export const getTransactionById = async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ transaction });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  };