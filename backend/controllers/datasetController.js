import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import TrainingDataset from '../models/TrainingDataset.js';
import TrainingData from '../models/TrainingData.js';

// Configure multer for memory storage (we'll process CSV directly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.json', '.txt'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
}).single('dataset');

// Helper function to generate version number
const generateVersion = async () => {
  try {
    const latestDataset = await TrainingDataset.findOne({ isActive: true })
      .sort({ createdAt: -1 });
    
    if (!latestDataset) {
      return 'v1.0.0';
    }
    
    // Extract version numbers
    const versionMatch = latestDataset.version.match(/v(\d+)\.(\d+)\.(\d+)/);
    if (!versionMatch) {
      return 'v1.0.0';
    }
    
    const [, major, minor, patch] = versionMatch;
    // Increment patch version
    return `v${major}.${minor}.${parseInt(patch) + 1}`;
  } catch (error) {
    console.error('Error generating version:', error);
    return `v1.${Date.now().toString().slice(-6)}`;
  }
};

// Helper function to parse CSV data
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Helper function to shuffle array (for random train/test split)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to calculate dataset statistics
const calculateStats = (rows) => {
  if (!rows || rows.length === 0) {
    return {
      fraudRate: 0,
      totalAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      dateRange: { start: null, end: null }
    };
  }
  
  let totalAmount = 0;
  let fraudCount = 0;
  let minAmount = Infinity;
  let maxAmount = -Infinity;
  const dates = [];
  
  rows.forEach(row => {
    const amount = parseFloat(row['Transaction Amount'] || 0);
    if (!isNaN(amount)) {
      totalAmount += amount;
      minAmount = Math.min(minAmount, amount);
      maxAmount = Math.max(maxAmount, amount);
    }
    
    if (parseInt(row['Is Fraudulent'] || 0) === 1) {
      fraudCount++;
    }
    
    if (row['Transaction Date']) {
      dates.push(new Date(row['Transaction Date']));
    }
  });
  
  return {
    fraudRate: rows.length > 0 ? (fraudCount / rows.length) * 100 : 0,
    totalAmount,
    minAmount: minAmount === Infinity ? 0 : minAmount,
    maxAmount: maxAmount === -Infinity ? 0 : maxAmount,
    dateRange: {
      start: dates.length > 0 ? new Date(Math.min(...dates)) : null,
      end: dates.length > 0 ? new Date(Math.max(...dates)) : null
    }
  };
};

// Upload and process dataset
export const uploadDataset = async (req, res) => {
  // Use multer middleware
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    try {
      // Parse CSV file
      const rows = await parseCSV(req.file.buffer);
      
      if (!rows || rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is empty or invalid'
        });
      }
      
      // Get column names from first row
      const columns = Object.keys(rows[0]);
      
      // Validate required columns
      const requiredColumns = [
        'Transaction ID',
        'Customer ID',
        'Transaction Amount',
        'Transaction Date',
        'Payment Method',
        'Product Category',
        'Quantity',
        'Customer Age',
        'Customer Location',
        'Device Used',
        'IP Address',
        'Shipping Address',
        'Billing Address',
        'Is Fraudulent',
        'Account Age Days',
        'Transaction Hour'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      if (missingColumns.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required columns: ${missingColumns.join(', ')}`
        });
      }
      
      // Calculate statistics
      const stats = calculateStats(rows);
      
      // Generate version number
      const version = await generateVersion();
      
      // Deactivate previous active datasets
      await TrainingDataset.updateMany(
        { isActive: true },
        { isActive: false }
      );
      
      // Shuffle and split data FIRST (80% train, 20% test) - before creating dataset
      const shuffled = shuffleArray(rows);
      const splitIndex = Math.floor(shuffled.length * 0.8);
      const trainRows = shuffled.slice(0, splitIndex);
      const testRows = shuffled.slice(splitIndex);
      
      // Create training dataset metadata (with calculated train/test rows)
      let trainingDataset = new TrainingDataset({
        datasetName: req.file.originalname.replace(/\.[^/.]+$/, ''), // Remove extension
        version,
        uploadedBy: req.user._id,
        originalFilename: req.file.originalname,
        totalRows: rows.length,
        trainRows: trainRows.length,  // Set immediately
        testRows: testRows.length,     // Set immediately
        columns,
        splitRatio: {
          train: 0.8,
          test: 0.2
        },
        metadata: stats,
        status: 'processing'
      });
      
      await trainingDataset.save();
      const datasetId = trainingDataset._id; // Store for error cleanup
      
      try {
        
        // Store train data
        const trainDocuments = trainRows.map(row => ({
          datasetId: trainingDataset._id,
          datasetVersion: version,
          dataType: 'train',
          ...row
        }));
        
        // Store test data
        const testDocuments = testRows.map(row => ({
          datasetId: trainingDataset._id,
          datasetVersion: version,
          dataType: 'test',
          ...row
        }));
        
        // Bulk insert training data (in batches for large datasets)
        const batchSize = 5000;
        for (let i = 0; i < trainDocuments.length; i += batchSize) {
          await TrainingData.insertMany(trainDocuments.slice(i, i + batchSize));
        }
        for (let i = 0; i < testDocuments.length; i += batchSize) {
          await TrainingData.insertMany(testDocuments.slice(i, i + batchSize));
        }
        
        // Update training dataset status (rows already set)
        trainingDataset.status = 'ready';
        trainingDataset.splitCompletedAt = new Date();
        trainingDataset.processedAt = new Date();
        await trainingDataset.save();
        
      } catch (processingError) {
        // Cleanup on processing error
        console.error('Error during data processing:', processingError);
        await TrainingDataset.findByIdAndDelete(datasetId);
        await TrainingData.deleteMany({ datasetId });
        throw processingError;
      }
      
      res.status(200).json({
        success: true,
        message: 'Training dataset uploaded and processed successfully',
        data: {
          version: trainingDataset.version,
          totalRows: trainingDataset.totalRows,
          trainRows: trainingDataset.trainRows,
          testRows: trainingDataset.testRows,
          columns: trainingDataset.columns,
          metadata: trainingDataset.metadata
        }
      });
      
    } catch (error) {
      console.error('Error processing dataset:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error processing dataset',
        error: error.message
      });
    }
  });
};

// Get all training datasets
export const getAllDatasets = async (req, res) => {
  try {
    const datasets = await TrainingDataset.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .select('-metadata'); // Exclude large metadata for list view
    
    res.status(200).json({
      success: true,
      data: datasets
    });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching datasets',
      error: error.message
    });
  }
};

// Get training dataset by version
export const getDatasetByVersion = async (req, res) => {
  try {
    const { version } = req.params;
    
    const dataset = await TrainingDataset.findOne({ 
      version,
      uploadedBy: req.user._id 
    });
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: dataset
    });
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dataset',
      error: error.message
    });
  }
};

// Get latest active training dataset (for VT rack)
export const getLatestDataset = async (req, res) => {
  try {
    const dataset = await TrainingDataset.findOne({ isActive: true })
      .sort({ createdAt: -1 });
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'No active dataset found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        version: dataset.version,
        datasetId: dataset._id,
        totalRows: dataset.totalRows,
        trainRows: dataset.trainRows,
        testRows: dataset.testRows,
        columns: dataset.columns
      }
    });
  } catch (error) {
    console.error('Error fetching latest dataset:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest dataset',
      error: error.message
    });
  }
};

