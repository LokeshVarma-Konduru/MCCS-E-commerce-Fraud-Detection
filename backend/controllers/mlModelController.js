import MLModel from "../models/MLModel.js";
import mongoose from "mongoose";

// Mapping from filename to model identifier (matches predict.py)
const FILENAME_TO_MODEL = {
    "logistic_regression.pkl": "logistic-regression",
    "bernoulli_nb.pkl": "bernoulli-nb",
    "decision_tree.pkl": "decision-tree",
    "xgb_pipeline.pkl": "xgboost",
    "xgboost_pipeline.pkl": "xgboost", // Alternative filename format
    "spinalnet_weights.pkl": "spinal-net",
    "gan_weights.pkl": "gan-weights"
};

// Reverse mapping from model identifier to display name
const MODEL_TO_DISPLAY = {
    "logistic-regression": "Logistic Regression",
    "bernoulli-nb": "Bernoulli Naive Bayes",
    "decision-tree": "Decision Tree",
    "xgboost": "XGBoost",
    "spinal-net": "Spinal Net",
    "gan-weights": "GAN Weights"
};

// Controller to get all models (from MLModel collection - for Dashboard/Model Performance)
export const getAllModels = async (req, res) => {
    try {
        const models = await MLModel.find();
        res.status(200).json({
            success: true,
            data: models,
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error('Error fetching models:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};

// Controller to get models with weight files (from modelFiles GridFS - for API Integration)
export const getModelsWithWeights = async (req, res) => {
    try {
        // Get MongoDB connection
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available',
            });
        }

        // Access modelFiles.files collection (GridFS files metadata)
        const filesCollection = db.collection('modelFiles.files');
        
        // Get all model files with their metadata
        const files = await filesCollection.find({}).toArray();
        
        // Create models array - one entry per file (each file is a unique version)
        // ONLY use data from modelFiles.files - NO MLModel collection enrichment
        const models = [];
        
        for (const file of files) {
            const filename = file.filename;
            const version = file.version || 'v1.0.0';
            const uploadDate = file.uploadDate || file.upload_time || new Date();
            // Extract accuracy directly from modelFiles.files
            const accuracy = file.accuracy !== undefined ? file.accuracy : null;
            
            // Map filename to model identifier
            const modelIdentifier = FILENAME_TO_MODEL[filename];
            if (!modelIdentifier) {
                // Skip unknown file types
                console.log(`⚠️  Skipping unknown file: ${filename}`);
                continue;
            }
            
            // Debug log for XGBoost
            if (modelIdentifier === 'xgboost') {
                console.log(`✅ Processing XGBoost file: ${filename}, version: ${version}, accuracy: ${accuracy}`);
            }
            
            // Get display name for the model
            const modelName = MODEL_TO_DISPLAY[modelIdentifier] || modelIdentifier;
            
            // Create model entry (each file is a unique model version)
            // ALL data comes from modelFiles.files only
            models.push({
                _id: file._id.toString(),
                modelName: modelName,
                modelType: modelIdentifier,
                version: version,
                createdAt: uploadDate,
                uploadDate: uploadDate,
                filename: filename,
                accuracy: accuracy, // Directly from modelFiles.files
                length: file.length,
                // Create metrics array with accuracy if available
                metrics: accuracy !== null ? [{ name: 'accuracy', value: accuracy }] : [],
                plots: [],
                additionalInfo: {
                    gridFsFileId: file._id,
                    hasWeightFile: true
                }
            });
        }
        
        // Sort by modelName, then by createdAt (oldest first)
        // Logistic Regression should be first
        models.sort((a, b) => {
            // Put Logistic Regression first
            if (a.modelName === "Logistic Regression" && b.modelName !== "Logistic Regression") {
                return -1;
            }
            if (a.modelName !== "Logistic Regression" && b.modelName === "Logistic Regression") {
                return 1;
            }
            
            // Then sort others alphabetically
            if (a.modelName !== b.modelName) {
                return a.modelName.localeCompare(b.modelName);
            }
            
            // For same model name, sort by createdAt (oldest first)
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        res.status(200).json({
            success: true,
            data: models,
        });
    } catch (error) {
        console.error('Error fetching models with weights:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};

// Controller to get a model by ID
export const getModelById = async (req, res) => {
    try {
        const model = await MLModel.findById(req.params.id);
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Model not found',
            });
        }
        res.status(200).json({
            success: true,
            data: model,
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error('Error fetching model:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};
