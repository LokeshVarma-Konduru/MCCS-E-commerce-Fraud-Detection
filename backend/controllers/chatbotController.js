// controllers/chatbotController.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import Transaction from '../models/TransactionSchema.js';
import Store from '../models/Store.js';
import User from '../models/User.js';
import MLModel from '../models/MLModel.js';
import ApiLog from '../models/ApiLog.js';
import ChatLog from '../models/ChatLog.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PREVIOUS_REFERENCE_REGEX = /\b(these|those|them|both|all|this|that)\b/i;

function extractTransactionIds(text) {
  if (!text) return [];
  return [...text.matchAll(/[0-9a-fA-F]{24}/g)].map(match => match[0]);
}

function detectRequestedStatus(message) {
  if (!message) return null;
  const normalized = message.toLowerCase();
  const actionVerbPresent = /(mark|set|change|update|move|put|flag|send|make)/.test(normalized);

  if (/approve|approval/.test(normalized)) {
    return 'approved';
  }

  if (/reject|decline|deny|block/.test(normalized)) {
    return 'rejected';
  }

  if (actionVerbPresent && (/under\s*review/.test(normalized) || /for review/.test(normalized))) {
    return 'under_review';
  }

  if (actionVerbPresent && /pending/.test(normalized)) {
    return 'pending';
  }

  return null;
}

async function handleTransactionActions(message, user, previousMessages = []) {
  const status = detectRequestedStatus(message);
  if (!status) return [];

  let transactionIds = extractTransactionIds(message);
  const referencesPreviousMessage = PREVIOUS_REFERENCE_REGEX.test(message);

  if (transactionIds.length === 0 && !referencesPreviousMessage) {
    return [];
  }

  if (transactionIds.length === 0 && referencesPreviousMessage) {
    const lastAssistantMessage = [...previousMessages].reverse().find(msg => msg.sender === 'bot');
    if (lastAssistantMessage) {
      transactionIds = extractTransactionIds(lastAssistantMessage.text);
    }
  }

  transactionIds = [...new Set(transactionIds)].slice(0, 5);
  if (transactionIds.length === 0) {
    return [{
      success: false,
      message: 'No transaction IDs found to update.'
    }];
  }

  const allowedRoles = ['Admin', 'Developer', 'StoreManager'];
  if (!allowedRoles.includes(user.role)) {
    return [{
      success: false,
      message: 'User role not permitted to update transactions.'
    }];
  }

  const results = [];

  for (const id of transactionIds) {
    try {
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        results.push({
          transactionId: id,
          success: false,
          message: `Transaction ${id} not found`
        });
        continue;
      }

      if (user.role === 'StoreManager') {
        const matchesStore =
          (user.storeRef && transaction.storeRef && transaction.storeRef.equals(user.storeRef)) ||
          (user.storeID && transaction.storeID && transaction.storeID === user.storeID);

        if (!matchesStore) {
          results.push({
            transactionId: id,
            success: false,
            message: 'Not authorized to modify this transaction'
          });
          continue;
        }
      }

      transaction.status = status;
      transaction.reviewedBy = user._id;
      transaction.reviewedAt = new Date();
      await transaction.save();

      results.push({
        transactionId: id,
        success: true,
        newStatus: status,
        message: `Transaction ${id} updated to ${status}`
      });
    } catch (error) {
      results.push({
        transactionId: id,
        success: false,
        message: `Failed to update transaction ${id}: ${error.message}`
      });
    }
  }

  return results;
}

/**
 * Main chatbot function - handles user queries and provides AI-powered responses
 * Supports fraud analysis, transaction queries, model performance, and system insights
 */
export const askChatbot = async (req, res) => {
  try {
    const { message, chatSessionId } = req.body;
    const user = req.user; // From auth middleware

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    // Sanitize and limit message length
    const sanitizedMessage = message.trim().substring(0, 1000);

    // Find or create chat session
    let chatSession;
    if (chatSessionId) {
      chatSession = await ChatLog.findOne({
        _id: chatSessionId,
        userId: user._id,
        isActive: true
      });

      if (!chatSession) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found or inactive'
        });
      }
    } else {
      // Create new chat session
      chatSession = new ChatLog({
        userId: user._id,
        userRole: user.role,
        title: sanitizedMessage.substring(0, 50), // Use first 50 chars as title
        storeRef: user.storeRef || null,
        storeID: user.storeID || null,
        messages: []
      });
    }

    // Add user message to session
    chatSession.messages.push({
      text: sanitizedMessage,
      sender: 'user',
      timestamp: new Date()
    });

    // Build conversation history (previous messages only, keep last 6 exchanges)
    const HISTORY_LIMIT = 6;
    const previousMessages = chatSession.messages
      .slice(0, -1) // exclude current user message for the "User Query" section
      .slice(-HISTORY_LIMIT);

    const actionResults = await handleTransactionActions(sanitizedMessage, user, previousMessages);

    const formattedHistory = previousMessages.map(message => {
      const speaker = message.sender === 'bot' ? 'Assistant' : 'User';
      return `${speaker}: ${message.text}`;
    }).join('\n');

    // Build context from MongoDB based on user role
    const context = await buildUserContext(user);

    // Check if user wants to update transaction status
    let updateResult = null;
    const updateIntent = detectUpdateIntent(sanitizedMessage, context);
    if (updateIntent) {
      try {
        let transaction = null;
        
        // If we have a transaction ID, use it directly
        if (updateIntent.transactionId) {
          transaction = await Transaction.findById(updateIntent.transactionId);
        } 
        // Otherwise, search by criteria from context
        else if (updateIntent.searchCriteria) {
          const searchFilter = {
            transactionAmount: updateIntent.searchCriteria.amount,
            status: updateIntent.searchCriteria.status || 'pending'
          };
          
          // Add time filter if available (within 1 hour window)
          if (updateIntent.searchCriteria.time) {
            const searchTime = new Date(updateIntent.searchCriteria.time);
            const oneHourBefore = new Date(searchTime.getTime() - 60 * 60 * 1000);
            const oneHourAfter = new Date(searchTime.getTime() + 60 * 60 * 1000);
            searchFilter.createdAt = { $gte: oneHourBefore, $lte: oneHourAfter };
          }
          
          // Apply role-based filter
          if (user.role === 'StoreManager') {
            if (user.storeID) searchFilter.storeID = user.storeID;
            if (user.storeRef) searchFilter.storeRef = user.storeRef;
          }
          
          transaction = await Transaction.findOne(searchFilter).sort({ createdAt: -1 });
        }
        
        if (transaction) {
          // Check role-based access
          let hasAccess = true;
          if (user.role === 'StoreManager') {
            hasAccess = 
              (user.storeID && transaction.storeID === user.storeID) ||
              (user.storeRef && transaction.storeRef && transaction.storeRef.toString() === user.storeRef.toString());
          }

          if (hasAccess) {
            transaction.status = updateIntent.status;
            if (updateIntent.notes !== undefined) {
              transaction.notes = updateIntent.notes || '';
            }
            transaction.reviewedBy = user._id;
            transaction.reviewedAt = new Date();
            await transaction.save();

            updateResult = {
              success: true,
              transactionId: transaction._id.toString(),
              status: transaction.status,
              amount: transaction.transactionAmount,
              message: `Transaction (Amount: $${transaction.transactionAmount.toFixed(2)}) has been marked as ${updateIntent.status}`
            };
          } else {
            updateResult = {
              success: false,
              message: 'You do not have permission to update this transaction'
            };
          }
        } else {
          updateResult = {
            success: false,
            message: 'Transaction not found'
          };
        }
      } catch (error) {
        console.error('Error updating transaction:', error);
        updateResult = {
          success: false,
          message: 'Failed to update transaction status'
        };
      }
    }

    // Create system prompt with role-based instructions
    const actionSummarySection = actionResults.length > 0
      ? `Recent System Actions:\n${actionResults.map(result => {
          if (result.transactionId) {
            return `- ${result.transactionId}: ${result.message}`;
          }
          return `- ${result.message}`;
        }).join('\n')}\n\n`
      : '';

    const conversationSection = formattedHistory
      ? `Conversation History:\n${formattedHistory}\n\n`
      : '';

    const updateResultSection = updateResult
      ? `\n\nIMPORTANT - Transaction Update Result:\n${JSON.stringify(updateResult, null, 2)}\n\nPlease inform the user about this update result in your response.\n`
      : '';

    const systemPrompt = `You are an AI assistant for the MCCS E-commerce Fraud Detection System. You help users analyze fraud patterns, review transactions, monitor model performance, and provide insights.

Current User Information:
- Name: ${user.name}
- Role: ${user.role}
- Email: ${user.email}
${user.role === 'StoreManager' ? `- Store ID: ${user.storeID}` : ''}

System Context:
${JSON.stringify(context, null, 2)}

${actionSummarySection}${conversationSection}Your Capabilities:
1. **Fraud Analysis**: Explain fraud alerts, analyze patterns, identify risk factors
2. **Transaction Queries**: Search and summarize transaction data
3. **Model Performance**: Report on ML model metrics (precision, recall, F1 score, AUC)
4. **API Monitoring**: Check API response times and usage statistics
5. **Data Drift Detection**: Identify unusual patterns in transaction data
6. **Actionable Recommendations**: Suggest actions like marking transactions for review or triggering model retraining
7. **Transaction Status Management**: You can update transaction status to mark them for review

IMPORTANT - Transaction Status Updates:
- You have LIMITED write access to update transaction review status
- You can ONLY update these fields: status, notes, reviewedBy, reviewedAt
- Valid status values: 'pending', 'under_review', 'approved', 'rejected'
- When a user asks to "mark for review" or "mark as under review", update the transaction status to 'under_review'
- When updating, you must use the transaction ID from the context
- StoreManagers can only update transactions from their own store
- Always confirm the action after updating

Guidelines:
- Be concise and helpful
- Use data from the System Context provided above
- For StoreManager role, only reference their specific store data
- Provide specific numbers and percentages when available
- If you detect high-risk patterns, highlight them clearly
- Always maintain data privacy and security
- When suggesting actions, use clear call-to-action language
- When updating transaction status, inform the user of the action taken

${updateResultSection}User Query: ${sanitizedMessage}`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const responseText = response.text();

    // Add bot response to session
    chatSession.messages.push({
      text: responseText,
      sender: 'bot',
      timestamp: new Date()
    });

    // Update last message timestamp
    chatSession.lastMessageAt = new Date();

    // Save the chat session
    await chatSession.save();

    return res.json({
      success: true,
      response: responseText,
      timestamp: new Date(),
      chatSessionId: chatSession._id,
      actions: actionResults
    });

  } catch (error) {
    console.error('Chatbot error:', error);

    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return res.status(500).json({
        success: false,
        error: 'AI service configuration error. Please contact administrator.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to process your request. Please try again.'
    });
  }
};

/**
 * Detect if user wants to update a transaction status
 * Returns update intent object or null
 */
function detectUpdateIntent(message, context) {
  const lowerMessage = message.toLowerCase();
  
  // Keywords that indicate update intent
  const reviewKeywords = ['mark for review', 'mark as review', 'mark under review', 'set to review', 'flag for review'];
  const approveKeywords = ['approve', 'approve transaction', 'mark as approved'];
  const rejectKeywords = ['reject', 'reject transaction', 'mark as rejected', 'decline'];
  const pendingKeywords = ['mark as pending', 'set to pending'];
  
  // Check for update intent
  let desiredStatus = null;
  if (reviewKeywords.some(keyword => lowerMessage.includes(keyword))) {
    desiredStatus = 'under_review';
  } else if (approveKeywords.some(keyword => lowerMessage.includes(keyword))) {
    desiredStatus = 'approved';
  } else if (rejectKeywords.some(keyword => lowerMessage.includes(keyword))) {
    desiredStatus = 'rejected';
  } else if (pendingKeywords.some(keyword => lowerMessage.includes(keyword))) {
    desiredStatus = 'pending';
  }
  
  if (!desiredStatus) {
    return null;
  }
  
  // Try to extract transaction ID from message (MongoDB ObjectId format)
  const objectIdPattern = /[0-9a-fA-F]{24}/g;
  const matches = message.match(objectIdPattern);
  if (matches && matches.length > 0) {
    return {
      transactionId: matches[0],
      status: desiredStatus,
      notes: null
    };
  }
  
  // If no explicit ID, try to find from recent high-risk transactions in context
  if (context.recentActivity && context.recentActivity.highRiskTransactions && context.recentActivity.highRiskTransactions.length > 0) {
    // Try to match by amount mentioned in message
    const amountPattern = /\$?([\d,]+\.?\d*)/g;
    const amountMatches = message.match(amountPattern);
    if (amountMatches) {
      // Find transaction with matching amount
      for (const tx of context.recentActivity.highRiskTransactions) {
        const txAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount);
        for (const match of amountMatches) {
          const matchAmount = parseFloat(match.replace(/[$,]/g, ''));
          if (Math.abs(txAmount - matchAmount) < 0.01) {
            // Use transaction ID if available, otherwise search by criteria
            if (tx.id) {
              return {
                transactionId: tx.id,
                status: desiredStatus,
                notes: null
              };
            }
            return {
              transactionId: null,
              searchCriteria: { amount: txAmount, time: tx.time, status: tx.status },
              status: desiredStatus,
              notes: null
            };
          }
        }
      }
    }
    
    // Default to most recent high-risk transaction (use ID if available)
    const tx = context.recentActivity.highRiskTransactions[0];
    if (tx.id) {
      return {
        transactionId: tx.id,
        status: desiredStatus,
        notes: null
      };
    }
    
    return {
      transactionId: null,
      searchCriteria: { 
        amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount),
        time: tx.time,
        status: tx.status
      },
      status: desiredStatus,
      notes: null
    };
  }
  
  return null;
}

/**
 * Build context from MongoDB based on user role and permissions
 * READ-ONLY queries with role-based filtering
 */
async function buildUserContext(user) {
  const context = {
    role: user.role,
    statistics: {},
    recentActivity: {}
  };

  try {
    // Base filter for role-based access
    const transactionFilter = {};

    // StoreManagers can only see their store's data
    if (user.role === 'StoreManager') {
      const storeFilters = [];

      if (user.storeID) {
        storeFilters.push({ storeID: user.storeID });
      }

      if (user.storeRef) {
        storeFilters.push({ storeRef: user.storeRef });
      }

      if (storeFilters.length > 0) {
        transactionFilter.$or = storeFilters;
      }
    }

    // Get overall transaction statistics
    const totalTransactions = await Transaction.countDocuments(transactionFilter);
    const fraudulentTransactions = await Transaction.countDocuments({
      ...transactionFilter,
      predictions: { $in: [1] }
    });
    const pendingReview = await Transaction.countDocuments({
      ...transactionFilter,
      status: 'under_review'
    });

    context.statistics = {
      totalTransactions,
      fraudulentTransactions,
      legitimateTransactions: totalTransactions - fraudulentTransactions,
      fraudRate: totalTransactions > 0 ? ((fraudulentTransactions / totalTransactions) * 100).toFixed(2) + '%' : '0%',
      pendingReview
    };

    // Get recent high-risk transactions (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentHighRisk = await Transaction.find({
      ...transactionFilter,
      predictions: { $in: [1] },
      createdAt: { $gte: yesterday }
    })
      .sort({ riskScore: -1, createdAt: -1 })
      .limit(5)
      .select('_id transactionAmount paymentMethod productCategory riskScore createdAt status')
      .lean();

    context.recentActivity.highRiskTransactions = recentHighRisk.map(t => ({
      id: t._id.toString(),
      amount: t.transactionAmount,
      payment: t.paymentMethod,
      category: t.productCategory,
      riskScore: t.riskScore,
      status: t.status,
      time: t.createdAt
    }));

    // Get fraud trends (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const trendData = await Transaction.aggregate([
      {
        $match: {
          ...transactionFilter,
          createdAt: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          total: { $sum: 1 },
          fraudulent: {
            $sum: {
              $cond: [{ $eq: [{ $arrayElemAt: ["$predictions", 0] }, 1] }, 1, 0]
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    context.recentActivity.weeklyTrends = trendData.map(d => ({
      date: `${d._id.year}-${d._id.month}-${d._id.day}`,
      total: d.total,
      fraudulent: d.fraudulent,
      fraudRate: ((d.fraudulent / d.total) * 100).toFixed(1) + '%'
    }));

    // Get model performance metrics (for Admin and Developer)
    if (user.role === 'Admin' || user.role === 'Developer') {
      const latestModel = await MLModel.findOne()
        .sort({ createdAt: -1 })
        .select('modelName metrics createdAt')
        .lean();

      if (latestModel && latestModel.metrics) {
        // Parse metrics from nested array structure
        const metricsMap = {};
        latestModel.metrics.forEach(metric => {
          const normalizedName = metric.name
            ? metric.name.toLowerCase().replace(/\s+/g, '_')
            : '';
          if (normalizedName) {
            metricsMap[normalizedName] = metric.value;
          }
          metricsMap[metric.name] = metric.value;
        });

        // Extract precision, recall, f1-score from classification_report if available
        let precision, recall, f1Score;
        const classificationReport = metricsMap.classification_report || metricsMap['Classification Report'];
        if (classificationReport) {
          const report = classificationReport;
          // Get weighted average metrics (most representative for imbalanced datasets)
          if (report['weighted avg']) {
            precision = report['weighted avg'].precision;
            recall = report['weighted avg'].recall;
            f1Score = report['weighted avg']['f1-score'];
          } else if (report['macro avg']) {
            precision = report['macro avg'].precision;
            recall = report['macro avg'].recall;
            f1Score = report['macro avg']['f1-score'];
          }
        }

        context.statistics.modelPerformance = {
          name: latestModel.modelName,
          accuracy: metricsMap.accuracy ? (metricsMap.accuracy * 100).toFixed(2) + '%' : 'N/A',
          precision: precision ? (precision * 100).toFixed(2) + '%' : 'N/A',
          recall: recall ? (recall * 100).toFixed(2) + '%' : 'N/A',
          f1Score: f1Score ? (f1Score * 100).toFixed(2) + '%' : 'N/A',
          lastUpdated: latestModel.createdAt,
          confusionMatrix: metricsMap.confusion_matrix || metricsMap['Confusion Matrix'] || null
        };
      }

      // Get API usage statistics (last 24 hours)
      const apiLogs = await ApiLog.aggregate([
        { $match: { requestTime: { $gte: yesterday } } },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            avgResponseTime: { $avg: "$responseTime" },
            errors: {
              $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] }
            }
          }
        }
      ]);

      if (apiLogs.length > 0) {
        context.statistics.apiPerformance = {
          totalRequests24h: apiLogs[0].totalRequests,
          avgResponseTime: Math.round(apiLogs[0].avgResponseTime) + 'ms',
          errorRate: ((apiLogs[0].errors / apiLogs[0].totalRequests) * 100).toFixed(2) + '%'
        };
      }
    }

    // Get store-specific information for StoreManagers
    if (user.role === 'StoreManager' && user.storeRef) {
      const store = await Store.findById(user.storeRef)
        .select('storeID storeName storeLocation zipCode coordinates status')
        .lean();

      if (store) {
        context.storeInfo = {
          id: store.storeID,
          name: store.storeName,
          location: store.storeLocation,
          zipCode: store.zipCode,
          coordinates: store.coordinates,
          status: store.status
        };
      }
    }

    // Get all stores count (for Admin)
    if (user.role === 'Admin') {
      const totalStores = await Store.countDocuments();
      context.statistics.totalStores = totalStores;
    }

  } catch (error) {
    console.error('Error building context:', error);
    // Return partial context even if some queries fail
  }

  return context;
}

/**
 * Get chat history for the current user
 * Returns list of chat sessions with basic info
 */
export const getChatHistory = async (req, res) => {
  try {
    const user = req.user;
    const { limit = 10, includeInactive = false } = req.query;

    // Build filter based on user role
    const filter = { userId: user._id };

    // Only show active chats by default
    if (!includeInactive) {
      filter.isActive = true;
    }

    // Fetch chat sessions
    const chatSessions = await ChatLog.find(filter)
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .select('title lastMessageAt isActive messages createdAt')
      .lean();

    // Format response
    const history = chatSessions.map(session => ({
      id: session._id,
      title: session.title,
      lastMessageAt: session.lastMessageAt,
      createdAt: session.createdAt,
      messageCount: session.messages.length,
      isActive: session.isActive,
      preview: session.messages.length > 0
        ? session.messages[session.messages.length - 1].text.substring(0, 100)
        : ''
    }));

    return res.json({
      success: true,
      history,
      total: history.length
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
};

/**
 * Get a specific chat session by ID
 */
export const getChatById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const chatSession = await ChatLog.findOne({
      _id: id,
      userId: user._id
    }).lean();

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    return res.json({
      success: true,
      chat: chatSession
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch chat session'
    });
  }
};

/**
 * Create a new chat session
 */
export const createNewChat = async (req, res) => {
  try {
    const user = req.user;
    const { title = 'New Conversation' } = req.body;

    const newChat = new ChatLog({
      userId: user._id,
      userRole: user.role,
      title,
      storeRef: user.storeRef || null,
      storeID: user.storeID || null,
      messages: []
    });

    await newChat.save();

    return res.json({
      success: true,
      chatSessionId: newChat._id,
      chat: newChat
    });
  } catch (error) {
    console.error('Error creating new chat:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create new chat session'
    });
  }
};

/**
 * Delete a chat session (mark as inactive)
 */
export const deleteChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const chatSession = await ChatLog.findOne({
      _id: id,
      userId: user._id
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    chatSession.isActive = false;
    await chatSession.save();

    return res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete chat session'
    });
  }
};

/**
 * Update transaction status - RESTRICTED to review-related fields only
 * This function allows the chatbot to mark transactions for review
 * Only updates: status, notes, reviewedBy, reviewedAt
 */
export const updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId, status, notes } = req.body;
    const user = req.user;

    // Validate required fields
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    // Validate status
    if (!status || !['approved', 'rejected', 'under_review', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required. Must be one of: approved, rejected, under_review, pending'
      });
    }

    // Find transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Role-based access control: StoreManagers can only update their store's transactions
    if (user.role === 'StoreManager') {
      const hasAccess = 
        (user.storeID && transaction.storeID === user.storeID) ||
        (user.storeRef && transaction.storeRef && transaction.storeRef.toString() === user.storeRef.toString());

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this transaction'
        });
      }
    }

    // Update ONLY review-related fields (restricted access)
    transaction.status = status;
    if (notes !== undefined) {
      transaction.notes = notes || '';
    }
    transaction.reviewedBy = user._id;
    transaction.reviewedAt = new Date();

    await transaction.save();

    return res.json({
      success: true,
      message: `Transaction status updated to ${status}`,
      transaction: {
        id: transaction._id,
        status: transaction.status,
        notes: transaction.notes,
        reviewedBy: transaction.reviewedBy,
        reviewedAt: transaction.reviewedAt
      }
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update transaction status'
    });
  }
};
