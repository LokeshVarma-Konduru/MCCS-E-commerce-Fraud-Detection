// controllers/sampleDataController.js
import Transaction from '../models/TransactionSchema.js';
import mongoose from 'mongoose';

/**
 * Generate sample transactions for demonstration purposes
 * Creates approximately 100 transactions with dates from the past two weeks
 * Mix of legitimate (prediction 0) and fraudulent (prediction 1) transactions
 * Covers all transaction types, statuses, and other schema fields
 */
export const generateSampleTransactions = async (req, res) => {
  try {
    const transactions = [];
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    // Payment methods
    const paymentMethods = ['credit card', 'debit card', 'bank transfer', 'PayPal'];
    
    // Product categories
    const productCategories = ['electronics', 'home & garden', 'clothing', 'toys & games', 'health & beauty'];
    
    // Devices
    const devices = ['mobile', 'desktop', 'tablet'];
    
    // Transaction types
    const transactionTypes = ['online', 'in-store'];
    
    // Transaction statuses
    const statuses = ['pending', 'approved', 'rejected', 'under_review'];
    
    // Models
    const models = ['logistic-regression', 'bernoulli-nb', 'xgboost', 'decision-tree'];
    
    // Sample review notes
    const reviewNotes = [
      'Suspicious transaction pattern',
      'Customer verified by phone',
      'Unusual purchase amount',
      'New device used',
      'Shipping address doesn\'t match billing address',
      'Multiple failed payment attempts before success',
      'Customer has history of legitimate transactions',
      'Verified with customer via email',
      'High-risk location',
      'Transaction matches known fraud pattern'
    ];
    
    // Generate 100 transactions
    for (let i = 0; i < 100; i++) {
      // Determine if this will be a fraudulent transaction (about 15% fraud rate)
      const isFraud = Math.random() < 0.15;
      
      // Determine transaction type - make online slightly more common for fraudulent transactions
      const transactionType = isFraud && Math.random() < 0.7 ? 'online' : transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      
      // Determine status - distribute across all possible statuses
      // For fraudulent transactions, make them more likely to be under review or rejected
      let status;
      if (isFraud) {
        const statusRoll = Math.random();
        if (statusRoll < 0.4) status = 'under_review';
        else if (statusRoll < 0.7) status = 'rejected';
        else if (statusRoll < 0.9) status = 'pending';
        else status = 'approved'; // Small chance of approved fraud (missed detection)
      } else {
        const statusRoll = Math.random();
        if (statusRoll < 0.5) status = 'approved';
        else if (statusRoll < 0.8) status = 'pending';
        else if (statusRoll < 0.95) status = 'under_review'; // Some legitimate transactions get flagged
        else status = 'rejected'; // Small chance of false positive
      }
      
      // Create base transaction data
      let transactionData;
      
      if (isFraud) {
        // Fraudulent transaction pattern (based on the example that gives prediction 1)
        transactionData = {
          transactionAmount: Math.floor(Math.random() * 2000) + 1000, // High amount (1000-3000)
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          productCategory: Math.random() < 0.7 ? 'health & beauty' : productCategories[Math.floor(Math.random() * productCategories.length)],
          quantity: Math.floor(Math.random() * 2) + 1, // 1-2 items
          customerAge: Math.floor(Math.random() * 20) + 20, // 20-40 years
          deviceUsed: Math.random() < 0.8 ? 'mobile' : devices[Math.floor(Math.random() * devices.length)],
          accountAgeDays: Math.floor(Math.random() * 5) + 1, // Very new account (1-5 days)
          transactionHour: Math.floor(Math.random() * 6), // Late night hours (0-5)
          transactionDay: Math.floor(Math.random() * 28) + 1, // Any day of month
          transactionDOW: Math.floor(Math.random() * 7), // Any day of week
          transactionMonth: Math.floor(Math.random() * 12) + 1, // Any month
          isAddressMatch: Math.random() < 0.3 ? 0 : 1, // 30% chance of address mismatch
          predictions: [1], // Fraudulent
          probabilities: [[Math.random() * 0.3, 0.7 + Math.random() * 0.3]], // 70-100% confidence in fraud
          riskScore: Math.floor(Math.random() * 20) + 80, // High risk (80-100)
          status,
          notes: status !== 'pending' ? reviewNotes[Math.floor(Math.random() * reviewNotes.length)] : '',
          transactionType
        };
      } else {
        // Legitimate transaction pattern (based on the example that gives prediction 0)
        transactionData = {
          transactionAmount: Math.floor(Math.random() * 500) + 50, // Lower amount (50-550)
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          productCategory: productCategories[Math.floor(Math.random() * productCategories.length)],
          quantity: Math.floor(Math.random() * 5) + 1, // 1-5 items
          customerAge: Math.floor(Math.random() * 50) + 20, // 20-70 years
          deviceUsed: devices[Math.floor(Math.random() * devices.length)],
          accountAgeDays: Math.floor(Math.random() * 1000) + 7, // Older account (7-1007 days)
          transactionHour: Math.floor(Math.random() * 24), // Any hour
          transactionDay: Math.floor(Math.random() * 28) + 1, // Any day of month
          transactionDOW: Math.floor(Math.random() * 7), // Any day of week
          transactionMonth: Math.floor(Math.random() * 12) + 1, // Any month
          isAddressMatch: Math.random() < 0.05 ? 0 : 1, // 5% chance of address mismatch
          predictions: [0], // Legitimate
          probabilities: [[0.7 + Math.random() * 0.3, Math.random() * 0.3]], // 70-100% confidence in legitimate
          riskScore: Math.floor(Math.random() * 30) + 10, // Low risk (10-40)
          status,
          notes: status !== 'pending' ? reviewNotes[Math.floor(Math.random() * reviewNotes.length)] : '',
          transactionType
        };
      }
      
      // Add model used
      transactionData.modelUsed = models[Math.floor(Math.random() * models.length)];
      
      // Add review timestamp for reviewed transactions
      if (status === 'approved' || status === 'rejected') {
        // Create a review date that's after the transaction date but before now
        const createdAt = new Date(twoWeeksAgo.getTime() + Math.random() * (Date.now() - twoWeeksAgo.getTime()));
        transactionData.createdAt = createdAt;
        
        // Add a review date 1 minute to 2 days after creation
        const reviewDelay = (1000 * 60) + Math.random() * (1000 * 60 * 60 * 48); // 1 minute to 48 hours
        const reviewDate = new Date(createdAt.getTime() + reviewDelay);
        
        // Make sure review date isn't in the future
        if (reviewDate <= new Date()) {
          transactionData.reviewedAt = reviewDate;
        }
      } else {
        // For pending or under_review, just set created date
        const randomDate = new Date(twoWeeksAgo.getTime() + Math.random() * (Date.now() - twoWeeksAgo.getTime()));
        transactionData.createdAt = randomDate;
      }
      
      // Create the transaction
      const transaction = new Transaction(transactionData);
      transactions.push(transaction);
    }
    
    // Save all transactions to the database
    await Transaction.insertMany(transactions);
    
    // Return success response with detailed breakdown
    return res.status(200).json({
      success: true,
      message: `${transactions.length} sample transactions generated successfully.`,
      breakdown: {
        total: transactions.length,
        byPrediction: {
          fraudulent: transactions.filter(t => t.predictions[0] === 1).length,
          legitimate: transactions.filter(t => t.predictions[0] === 0).length
        },
        byStatus: {
          pending: transactions.filter(t => t.status === 'pending').length,
          approved: transactions.filter(t => t.status === 'approved').length,
          rejected: transactions.filter(t => t.status === 'rejected').length,
          under_review: transactions.filter(t => t.status === 'under_review').length
        },
        byType: {
          online: transactions.filter(t => t.transactionType === 'online').length,
          in_store: transactions.filter(t => t.transactionType === 'in-store').length
        }
      }
    });
  } catch (error) {
    console.error('Error generating sample transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating sample transactions',
      error: error.message
    });
  }
};
