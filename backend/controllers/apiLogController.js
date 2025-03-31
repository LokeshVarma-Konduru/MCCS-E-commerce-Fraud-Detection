// controllers/apiLogController.js
import ApiLog from '../models/ApiLog.js';
import mongoose from 'mongoose';

// Create a new API log entry
export const logApiCall = async (req, res, next) => {
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
        const apiKey = req.query.apikey || req.headers['x-api-key'] || 'none';
        const userId = req.apiKeyUserId || (req.user ? req.user._id : null);
        
        // Create a log entry even if userId is not available
        const logEntry = new ApiLog({
          userId: userId || null, // Allow null userId
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
        
        // Only log a warning if we're expecting a userId (for authenticated routes)
        if (!userId && req.originalUrl.includes('/predict')) {
          console.warn('API call logged without userId');
        }
      } catch (error) {
        console.error('Error logging API call:', error);
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
    const { limit = 50, page = 1, startDate, endDate, endpoint, statusCode } = req.query;
    
    const query = { userId };
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.requestTime = {};
      if (startDate) {
        query.requestTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.requestTime.$lte = new Date(endDate);
      }
    }
    
    // Add endpoint filter if provided
    if (endpoint) {
      query.endpoint = { $regex: endpoint, $options: 'i' };
    }
    
    // Add status code filter if provided
    if (statusCode) {
      query.statusCode = parseInt(statusCode);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get logs with pagination
    const logs = await ApiLog.find(query)
      .sort({ requestTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalCount = await ApiLog.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching API logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching API logs'
    });
  }
};

// Get API usage statistics
export const getApiUsageStats = async (req, res) => {
  try {
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
    
    // Get total API calls
    const totalCalls = await ApiLog.countDocuments({ 
      userId,
      requestTime: dateFilter
    });
    
    // Get calls by endpoint
    const callsByEndpoint = await ApiLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), requestTime: dateFilter } },
      { $group: { _id: '$endpoint', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get calls by status code
    const callsByStatus = await ApiLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), requestTime: dateFilter } },
      { $group: { _id: '$statusCode', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get calls by model
    const callsByModel = await ApiLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), requestTime: dateFilter, modelUsed: { $ne: '' } } },
      { $group: { _id: '$modelUsed', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get average response time
    const avgResponseTime = await ApiLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), requestTime: dateFilter } },
      { $group: { _id: null, average: { $avg: '$responseTime' } } }
    ]);
    
    // Get calls over time (daily)
    const callsOverTime = await ApiLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), requestTime: dateFilter } },
      { 
        $group: { 
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$requestTime' } 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        totalCalls,
        callsByEndpoint,
        callsByStatus,
        callsByModel,
        averageResponseTime: avgResponseTime.length > 0 ? avgResponseTime[0].average : 0,
        callsOverTime
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
