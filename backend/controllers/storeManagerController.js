// controllers/storeManagerController.js
import Transaction from '../models/TransactionSchema.js';
import mongoose from 'mongoose';

// Get store manager dashboard statistics
export const getStoreManagerStats = async (req, res) => {
  try {
    const { period = 'day', transactionType } = req.query;
    
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
      // Last 7 days and previous 7 days
      currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(now.getDate() - 7);
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
    
    // Create a filter object that we'll use for all queries
    const filter = {};
    
    // Add transaction type filter if provided
    if (transactionType && transactionType !== 'All Transactions') {
      filter.transactionType = transactionType.toLowerCase();
    }
    
    // 1. Total Transactions
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
    
    // 2. Fraud Rate
    // Get fraudulent transactions count for current period
    const currentPeriodFraudulent = await Transaction.countDocuments({
      ...filter,
      createdAt: { $gte: currentPeriodStart },
      predictions: { $in: [1] }
    });
    
    // Calculate fraud rate for current period
    const currentFraudRate = currentPeriodTransactions > 0 
      ? (currentPeriodFraudulent / currentPeriodTransactions * 100).toFixed(1)
      : 0;
    
    // Get fraudulent transactions count for previous period
    const previousPeriodFraudulent = await Transaction.countDocuments({
      ...filter,
      createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
      predictions: { $in: [1] }
    });
    
    // Calculate fraud rate for previous period
    const previousFraudRate = previousPeriodTransactions > 0 
      ? (previousPeriodFraudulent / previousPeriodTransactions * 100).toFixed(1)
      : 0;
    
    // Calculate percentage change for fraud rate
    const fraudRateChangePercent = previousFraudRate > 0 
      ? ((currentFraudRate - previousFraudRate) / previousFraudRate * 100).toFixed(1)
      : 0;
    
    // 3. Financial Impact
    // Get sum of transaction amounts for fraudulent transactions in current period
    const currentFinancialImpactData = await Transaction.aggregate([
      { 
        $match: { 
          ...filter,
          createdAt: { $gte: currentPeriodStart },
          predictions: { $in: [1] }
        } 
      },
      { $group: { _id: null, total: { $sum: '$transactionAmount' } } }
    ]);
    
    const currentFinancialImpact = currentFinancialImpactData.length > 0 
      ? currentFinancialImpactData[0].total
      : 0;
    
    // Get sum of transaction amounts for fraudulent transactions in previous period
    const previousFinancialImpactData = await Transaction.aggregate([
      { 
        $match: { 
          ...filter,
          createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
          predictions: { $in: [1] }
        } 
      },
      { $group: { _id: null, total: { $sum: '$transactionAmount' } } }
    ]);
    
    const previousFinancialImpact = previousFinancialImpactData.length > 0 
      ? previousFinancialImpactData[0].total
      : 0;
    
    // Calculate change in financial impact
    const financialImpactChange = previousFinancialImpact > 0 
      ? ((currentFinancialImpact - previousFinancialImpact) / previousFinancialImpact * 100).toFixed(1)
      : 0;
    
    // Return all store manager statistics
    return res.status(200).json({
      success: true,
      data: {
        totalTransactions: {
          value: currentPeriodTransactions,
          change: `${transactionChangePercent > 0 ? '+' : ''}${transactionChangePercent}% from ${getPeriodLabel(period)}`
        },
        fraudRate: {
          value: `${currentFraudRate}%`,
          change: `${fraudRateChangePercent > 0 ? '+' : ''}${fraudRateChangePercent}% from ${getPeriodLabel(period)}`
        },
        financialImpact: {
          value: `$${currentFinancialImpact.toFixed(2)}`,
          change: `${financialImpactChange > 0 ? '+' : ''}${financialImpactChange}% from ${getPeriodLabel(period)}`
        }
      }
    });
  } catch (error) {
    console.error('Error fetching store manager stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching store manager statistics'
    });
  }
};

// Get fraud trends data for chart
export const getFraudTrends = async (req, res) => {
  try {
    const { period = 'week', transactionType } = req.query;
    
    // Set date range based on period
    const now = new Date();
    let startDate, groupFormat, dateFormat;
    
    if (period === 'day') {
      // Last 24 hours with hourly data points
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
      groupFormat = '%Y-%m-%d %H:00';
      dateFormat = { hour: { $hour: '$createdAt' }, day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
    } else if (period === 'week') {
      // Last 7 days with daily data points
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      groupFormat = '%Y-%m-%d';
      dateFormat = { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
    } else if (period === 'month') {
      // Last 30 days with daily data points
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      groupFormat = '%Y-%m-%d';
      dateFormat = { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
    } else if (period === 'year') {
      // Last 12 months with monthly data points
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      groupFormat = '%Y-%m';
      dateFormat = { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
    }
    
    // Create a filter object
    const filter = {
      createdAt: { $gte: startDate }
    };
    
    // Add transaction type filter if provided
    if (transactionType && transactionType !== 'All Transactions') {
      filter.transactionType = transactionType.toLowerCase();
    }
    
    // Get fraud rate trend data
    const trendData = await Transaction.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: { 
            date: dateFormat
          }, 
          totalTransactions: { $sum: 1 },
          fraudulentTransactions: { 
            $sum: { 
              $cond: [{ $in: [1, '$predictions'] }, 1, 0] 
            } 
          }
        } 
      },
      { 
        $project: { 
          _id: 0,
          date: '$_id.date',
          totalTransactions: 1,
          fraudulentTransactions: 1,
          fraudRate: { 
            $cond: [
              { $eq: ['$totalTransactions', 0] },
              0,
              { $multiply: [{ $divide: ['$fraudulentTransactions', '$totalTransactions'] }, 100] }
            ]
          }
        } 
      },
      { $sort: { 'date.year': 1, 'date.month': 1, 'date.day': 1, 'date.hour': 1 } }
    ]);
    
    // Format the dates for the response
    const formattedData = trendData.map(item => {
      let dateStr;
      
      if (period === 'day') {
        // Format: "Hour AM/PM"
        const hour = item.date.hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        dateStr = `${hour12} ${ampm}`;
      } else if (period === 'week' || period === 'month') {
        // Format: "Mon DD"
        const date = new Date(item.date.year, item.date.month - 1, item.date.day);
        dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (period === 'year') {
        // Format: "Mon YYYY"
        const date = new Date(item.date.year, item.date.month - 1, 1);
        dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      return {
        date: dateStr,
        fraudRate: parseFloat(item.fraudRate.toFixed(1))
      };
    });
    
    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching fraud trends:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching fraud trends'
    });
  }
};

// Get transaction type distribution
export const getTransactionTypeDistribution = async (req, res) => {
  try {
    const { period = 'month', transactionType } = req.query;
    
    // Set date range based on period
    const now = new Date();
    let startDate;
    
    if (period === 'day') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
    } else if (period === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    // Create filter for date range
    const filter = { createdAt: { $gte: startDate } };
    
    // Add transaction type filter if provided
    if (transactionType && transactionType !== 'All Transactions') {
      filter.transactionType = transactionType.toLowerCase();
    }
    
    // Get transaction type distribution with fraud/legitimate breakdown
    const distribution = await Transaction.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: {
            type: '$transactionType',
            fraud: { $in: [1, '$predictions'] } // Group by transaction type and fraud status
          }, 
          count: { $sum: 1 } 
        } 
      },
      {
        $project: {
          _id: 0,
          type: { $ifNull: ['$_id.type', 'unknown'] },
          fraudStatus: '$_id.fraud',
          count: 1
        }
      },
      { $sort: { type: 1, fraudStatus: 1 } }
    ]);
    
    // Format the data for the frontend chart
    // We need to transform it into a structure with categories and series
    const types = [...new Set(distribution.map(item => item.type))];
    
    const formattedData = {
      categories: types.map(type => type.charAt(0).toUpperCase() + type.slice(1)), // Capitalize first letter
      series: [
        {
          name: 'Legitimate',
          data: types.map(type => {
            const item = distribution.find(d => d.type === type && d.fraudStatus === false);
            return item ? item.count : 0;
          })
        },
        {
          name: 'Fraudulent',
          data: types.map(type => {
            const item = distribution.find(d => d.type === type && d.fraudStatus === true);
            return item ? item.count : 0;
          })
        }
      ]
    };
    
    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching transaction type distribution:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction type distribution'
    });
  }
};

// Get recent alerts (high-risk transactions)
export const getRecentAlerts = async (req, res) => {
  try {
    const { limit = 5, transactionType } = req.query;
    
    // Create filter for high-risk transactions
    const filter = {
      predictions: { $in: [1] } // Transactions predicted as fraudulent
    };
    
    // Add transaction type filter if provided
    if (transactionType && transactionType !== 'All Transactions') {
      filter.transactionType = transactionType.toLowerCase();
    }
    
    // Get recent high-risk transactions
    const recentAlerts = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Format the transactions for the response
    const formattedAlerts = recentAlerts.map(transaction => {
      // Calculate time difference for "X mins ago" format
      const createdAt = new Date(transaction.createdAt);
      const now = new Date();
      const diffMs = now - createdAt;
      const diffMins = Math.round(diffMs / 60000);
      
      let timeAgo;
      if (diffMins < 60) {
        timeAgo = `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60);
        timeAgo = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diffMins / 1440);
        timeAgo = `${days} day${days !== 1 ? 's' : ''} ago`;
      }
      
      // Determine risk score based on probability
      let riskScore = 'Medium';
      if (transaction.probabilities && transaction.probabilities.length > 0 && transaction.probabilities[0].length > 0) {
        const probability = transaction.probabilities[0][0];
        if (probability > 0.8) {
          riskScore = 'High';
        } else if (probability < 0.6) {
          riskScore = 'Low';
        }
      }
      
      // Determine status - prioritize actual transaction status if manually reviewed
      let status = 'Flagged';
      
      // If transaction has been manually reviewed, use that status
      if (transaction.status && transaction.status !== 'pending') {
        // Map database status to display status
        const statusMap = {
          'approved': 'Cleared',
          'rejected': 'Flagged',
          'under_review': 'Under Review'
        };
        status = statusMap[transaction.status] || 'Flagged';
      } else {
        // Otherwise, determine from risk score
        if (riskScore === 'High') {
          status = 'Under Review';
        } else if (riskScore === 'Low') {
          status = 'Cleared';
        }
      }
      
      return {
        time: timeAgo,
        transactionId: `#TRX-${transaction._id.toString().slice(-5).toUpperCase()}`,
        fullTransactionId: transaction._id.toString(),
        type: transaction.transactionType === 'online' ? 'Online' : 'In-store',
        amount: `$${transaction.transactionAmount.toFixed(2)}`,
        riskScore,
        status,
        actualStatus: transaction.status // Include actual DB status for debugging
      };
    });
    
    return res.status(200).json({
      success: true,
      data: formattedAlerts
    });
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching recent alerts'
    });
  }
};

// Helper function to get period label for stats
function getPeriodLabel(period) {
  switch (period) {
    case 'day':
      return 'yesterday';
    case 'week':
      return 'last week';
    case 'month':
      return 'last month';
    case 'year':
      return 'last year';
    default:
      return 'previous period';
  }
}
