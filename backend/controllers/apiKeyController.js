import ApiKey from '../models/ApiKey.js';

// Get API key for a user
export const getApiKey = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    
    // Find existing API key for this user
    const existingKey = await ApiKey.findOne({ userId });
    
    if (existingKey) {
      return res.status(200).json({
        success: true,
        data: {
          key: existingKey.key,
          createdAt: existingKey.createdAt,
          lastUsed: existingKey.lastUsed,
          isActive: existingKey.isActive
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'No API key found for this user'
      });
    }
  } catch (error) {
    console.error('Error fetching API key:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching API key'
    });
  }
};

// Generate a new API key for a user
export const generateApiKey = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    
    // Check if user already has an API key
    const existingKey = await ApiKey.findOne({ userId });
    
    if (existingKey) {
      return res.status(400).json({
        success: false,
        message: 'User already has an API key. Use regenerate endpoint to create a new one.'
      });
    }
    
    // Create new API key
    const newApiKey = new ApiKey({
      userId
    });
    
    await newApiKey.save();
    
    return res.status(201).json({
      success: true,
      data: {
        key: newApiKey.key,
        createdAt: newApiKey.createdAt,
        isActive: newApiKey.isActive
      },
      message: 'API key generated successfully'
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating API key'
    });
  }
};

// Regenerate API key for a user
export const regenerateApiKey = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    
    // Find and update existing key
    const existingKey = await ApiKey.findOne({ userId });
    
    if (!existingKey) {
      return res.status(404).json({
        success: false,
        message: 'No API key found for this user. Use generate endpoint to create one.'
      });
    }
    
    // Generate new key
    existingKey.key = undefined; // Let the default function generate a new key
    existingKey.createdAt = Date.now();
    
    await existingKey.save();
    
    return res.status(200).json({
      success: true,
      data: {
        key: existingKey.key,
        createdAt: existingKey.createdAt,
        isActive: existingKey.isActive
      },
      message: 'API key regenerated successfully'
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while regenerating API key'
    });
  }
};

// Validate API key middleware
export const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.query.apikey || req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    const keyRecord = await ApiKey.findOne({ key: apiKey, isActive: true });
    
    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive API key'
      });
    }
    
    // Update last used timestamp
    keyRecord.lastUsed = Date.now();
    await keyRecord.save();
    
    // Add userId to request for potential use in downstream middleware/controllers
    req.apiKeyUserId = keyRecord.userId;
    
    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while validating API key'
    });
  }
};
