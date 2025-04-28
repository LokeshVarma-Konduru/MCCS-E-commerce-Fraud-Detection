// controllers/apiLogController.js
import ApiLog from '../models/ApiLog.js';
import mongoose from 'mongoose';

// Create a new API log entry
export const logApiCall = async (req, res, next) => {
  // Only log calls to the /predict endpoint
  if (!req.originalUrl.includes('/predict')) {
    return next();
  }

  // Store the start time to calculate response time
  const startTime = Date.now();
  
  // Store the original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  const originalStatus = res.status;
  
  // Variables to store response data
  let responseBody = {};
  let statusCode = 200;
  
  // Override status method
  res.status = function(code) {
    statusCode = code;
    return originalStatus.apply(res, arguments);
  };
  
  // Override send method
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    
    try {
      responseBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
      responseBody = { data: body };
    }
    
    // Create log entry after response is sent
    setTimeout(async () => {
      try {
        // Check if we're in a test environment
        const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                                 mongoose.connection.name?.includes('test') ||
                                 mongoose.connection.name?.includes('memory');
        
        // Skip logging in test environments
        if (isTestEnvironment) {
          return;
        }
        
        const apiKey = req.query.apikey || req.headers['x-api-key'] || 'none';
        const userId = req.apiKeyUserId || (req.user ? req.user._id : null);
        
        // Skip creating log entry if userId is not available
        if (!userId) {
          // Don't log warnings in test environment
          return;
        }
        
        // Create a log entry
        const logEntry = new ApiLog({
          userId, // userId is guaranteed to be non-null here
          endpoint: req.originalUrl || req.url,
          method: req.method,
          statusCode,
          requestBody: req.body || {},
          responseBody: responseBody || {},
          responseTime,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'] || '',
          apiKey,
          modelUsed: req.query.model || ''
        });
        
        await logEntry.save();
      } catch (error) {
        // Only log errors in non-test environments
        if (process.env.NODE_ENV !== 'test') {
          console.error('Error logging API call:', error);
        }
      }
    }, 0);
    
    return originalSend.apply(res, arguments);
  };
  
  // Override json method
  res.json = function(body) {
    responseBody = body;
    return originalJson.apply(res, arguments);
  };
  
  next();
};

// Get API logs for a user
export const getApiLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Only get logs for the /predict endpoint
    const filter = { 
      userId, 
      endpoint: { $regex: '/predict' }
    };
    
    const logs = await ApiLog.find(filter)
      .sort({ requestTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await ApiLog.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching API logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching API logs'
    });
  }
};

// Get API usage statistics
export const getApiUsageStats = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access API usage statistics'
      });
    }

    const userId = req.user._id;
    const { period = 'week' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    // Set date range based on period
    if (period === 'day') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { $gte: startOfDay };
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { $gte: startOfWeek };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { $gte: startOfMonth };
    } else if (period === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = { $gte: startOfYear };
    }
    
    // Only include logs for the /predict endpoint
    const endpointFilter = { endpoint: { $regex: '/predict' } };
    
    // Get total API calls
    const totalCalls = await ApiLog.countDocuments({ 
      userId,
      requestTime: dateFilter,
      ...endpointFilter
    });
    
    // Get calls by status code
    const callsByStatus = await ApiLog.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId), 
          requestTime: dateFilter,
          ...endpointFilter
        } 
      },
      { $group: { _id: '$statusCode', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get calls by model
    const callsByModel = await ApiLog.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId), 
          requestTime: dateFilter,
          modelUsed: { $ne: '' },
          ...endpointFilter
        } 
      },
      { $group: { _id: '$modelUsed', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get average response time
    const avgResponseTime = await ApiLog.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId), 
          requestTime: dateFilter,
          ...endpointFilter
        } 
      },
      { $group: { _id: null, average: { $avg: '$responseTime' } } }
    ]);
    
    // Get calls over time (daily)
    const callsOverTime = await ApiLog.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId), 
          requestTime: dateFilter,
          ...endpointFilter
        } 
      },
      { 
        $group: { 
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$requestTime' } 
          }, 
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' }
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        totalCalls,
        callsByStatus,
        callsByModel,
        averageResponseTime: avgResponseTime.length > 0 ? Math.round(avgResponseTime[0].average) : 0,
        callsOverTime: callsOverTime.map(item => ({
          date: item._id,
          count: item.count,
          avgResponseTime: Math.round(item.avgResponseTime || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching API usage stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching API usage statistics'
    });
  }
};

// Get a single API log by ID
export const getApiLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const log = await ApiLog.findOne({ _id: id, userId });
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'API log not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error fetching API log:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching API log'
    });
  }
};
