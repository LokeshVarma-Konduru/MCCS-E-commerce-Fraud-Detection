// controllers/dashboardController.js
import Transaction from '../models/TransactionSchema.js';
import ApiLog from '../models/ApiLog.js';
import mongoose from 'mongoose';

// Get dashboard statistics for the stats cards
export const getDashboardStats = async (req, res) => {
  try {
    // Make userId optional since we removed the auth middleware
    const userId = req.user?._id;
    const { period = 'month' } = req.query;
    
    // Set date ranges for current and previous periods
    const now = new Date();
    let currentPeriodStart, previousPeriodStart, previousPeriodEnd;
    
    if (period === 'day') {
      // Current day and previous day
      currentPeriodStart = new Date(now.setHours(0, 0, 0, 0));
      previousPeriodEnd = new Date(currentPeriodStart);
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
    } else if (period === 'week') {
      // Current week and previous week
      currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(now.getDate() - now.getDay());
      currentPeriodStart.setHours(0, 0, 0, 0);
      previousPeriodEnd = new Date(currentPeriodStart);
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
    } else if (period === 'month') {
      // Current month and previous month
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      previousPeriodEnd = new Date(currentPeriodStart);
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    } else if (period === 'year') {
      // Current year and previous year
      currentPeriodStart = new Date(now.getFullYear(), 0, 1);
      previousPeriodEnd = new Date(currentPeriodStart);
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
    }
    
    // 1. Total Transactions
    // Create a filter object that we'll use for all queries
    const filter = {};
    
    const currentPeriodTransactions = await Transaction.countDocuments({
      ...filter,
      createdAt: { $gte: currentPeriodStart }
    });
    
    const previousPeriodTransactions = await Transaction.countDocuments({
      ...filter,
      createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd }
    });
    
    // Calculate percentage change for total transactions
    const transactionChangePercent = previousPeriodTransactions > 0 
      ? ((currentPeriodTransactions - previousPeriodTransactions) / previousPeriodTransactions * 100).toFixed(1)
      : 0;
    
    // 2. Fraud Detection Rate
    // Get legitimate transactions count for current period
    const currentPeriodLegitimate = await Transaction.countDocuments({
      ...filter,
      createdAt: { $gte: currentPeriodStart },
      predictions: { $in: [0] }
    });
    
    // Get fraudulent transactions count for current period
    const currentPeriodFraudulent = await Transaction.countDocuments({
      ...filter,
      createdAt: { $gte: currentPeriodStart },
      predictions: { $in: [1] }
    });
    
    // Calculate fraud detection rate for current period
    const totalCurrentTransactions = currentPeriodLegitimate + currentPeriodFraudulent;
    const currentFraudDetectionRate = totalCurrentTransactions > 0 
      ? (currentPeriodLegitimate / totalCurrentTransactions * 100).toFixed(1)
      : 0;
    
    // Get legitimate transactions count for previous period
    const previousPeriodLegitimate = await Transaction.countDocuments({
      ...filter,
      createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
      predictions: { $in: [0] }
    });
    
    // Get fraudulent transactions count for previous period
    const previousPeriodFraudulent = await Transaction.countDocuments({
      ...filter,
      createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
      predictions: { $in: [1] }
    });
    
    // Calculate fraud detection rate for previous period
    const totalPreviousTransactions = previousPeriodLegitimate + previousPeriodFraudulent;
    const previousFraudDetectionRate = totalPreviousTransactions > 0 
      ? (previousPeriodLegitimate / totalPreviousTransactions * 100).toFixed(1)
      : 0;
    
    // Calculate percentage change for fraud detection rate
    const fraudRateChangePercent = previousFraudDetectionRate > 0 
      ? ((currentFraudDetectionRate - previousFraudDetectionRate) / previousFraudDetectionRate * 100).toFixed(1)
      : 0;
    
    // 3. API Response Time
    // Create a match object for API logs
    const apiLogMatch = { requestTime: { $gte: currentPeriodStart } };
    // Only filter by userId if it's provided
    if (userId) {
      try {
        apiLogMatch.userId = new mongoose.Types.ObjectId(userId);
      } catch (error) {
        console.error('Error converting userId to ObjectId:', error);
        // Continue without userId filter if conversion fails
      }
    }
    
    // Get average response time for current period
    const currentResponseTimeData = await ApiLog.aggregate([
      { $match: apiLogMatch },
      { $group: { _id: null, average: { $avg: '$responseTime' } } }
    ]);
    
    const currentResponseTime = currentResponseTimeData.length > 0 
      ? Math.round(currentResponseTimeData[0].average)
      : 0;
    
    // Create a match object for previous period API logs
    const prevApiLogMatch = { 
      requestTime: { $gte: previousPeriodStart, $lt: previousPeriodEnd }
    };
    if (userId) {
      try {
        prevApiLogMatch.userId = new mongoose.Types.ObjectId(userId);
      } catch (error) {
        console.error('Error converting userId to ObjectId:', error);
        // Continue without userId filter if conversion fails
      }
    }
    
    // Get average response time for previous period
    const previousResponseTimeData = await ApiLog.aggregate([
      { $match: prevApiLogMatch },
      { $group: { _id: null, average: { $avg: '$responseTime' } } }
    ]);
    
    const previousResponseTime = previousResponseTimeData.length > 0 
      ? Math.round(previousResponseTimeData[0].average)
      : 0;
    
    // Calculate change in response time (negative is better)
    const responseTimeChange = previousResponseTime > 0 
      ? currentResponseTime - previousResponseTime
      : 0;
    
    // Return all dashboard statistics
    return res.status(200).json({
      success: true,
      data: {
        totalTransactions: {
          value: currentPeriodTransactions,
          change: `${transactionChangePercent > 0 ? '+' : ''}${transactionChangePercent}% from last ${period}`
        },
        fraudDetectionRate: {
          value: `${currentFraudDetectionRate}%`,
          change: `${fraudRateChangePercent > 0 ? '+' : ''}${fraudRateChangePercent}% from last ${period}`
        },
        apiResponseTime: {
          value: `${currentResponseTime}ms`,
          change: `${responseTimeChange <= 0 ? '' : '+'}${responseTimeChange}ms from last ${period}`
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
};
