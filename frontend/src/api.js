/* eslint-disable no-useless-catch */
import axios from 'axios';

export const API_URL = 'http://localhost:9000/mccs';
// export const API_URL = 'http://35.164.210.165:9000/mccs';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

export const login = (email, password) => 
    axios.post(`${API_URL}/login`, { email, password });

export const testLogin = () => 
    axios.post(`${API_URL}/test-login`);

export const verifyLoginOTP = (userId, otp) => 
    axios.post(`${API_URL}/verify-login-otp`, { userId, otp });

export const logout = () => 
    axios.post(`${API_URL}/logout`);

export const getUserInfo = (userId) => 
    axios.get(`${API_URL}/user/${userId}`);

export const getTeamMembers = () => 
    axios.get(`${API_URL}/team-members`);

export const updatePassword = (userId, oldPassword, newPassword) =>
    axios.post(`${API_URL}/update-password`, { userId, oldPassword, newPassword });

// Admin specific endpoints
export const addUsers = (userData) => 
    axios.post(`${API_URL}/addUsers`, userData);

export const getUsers = (searchTerm = '', roleFilter = '') => {
    const params = new URLSearchParams();
    if (roleFilter) params.append('role', roleFilter);
    if (searchTerm?.trim()) params.append('search', searchTerm.trim());
    
    const queryString = params.toString();
    const url = queryString ? `${API_URL}/users?${queryString}` : `${API_URL}/users`;
    
    return axios.get(url);
};

// Delete a user
export const deleteUser = async (userId) => {
    const response = await axios.delete(`${API_URL}/admin/users/${userId}`);
    return response;
};

// Toggle user status (activate/deactivate)
export const toggleUserStatus = async (userId, status) => {
    const response = await axios.post(`${API_URL}/admin/users/${userId}/toggle-status`, { status });
    return response;
};

// ML Model endpoints
export const getMLModelMetrics = async () => {
    try {
        const response = await axios.get(`${API_URL}/models`);
        return response;
    } catch (error) {
        console.error('Error fetching ML model metrics:', error);
        throw {
            message: error.response?.data?.message || 'Failed to fetch model metrics',
            status: error.response?.status
        };
    }
};

export const getModelById = async (modelId) => {
    try {
        const response = await axios.get(`${API_URL}/model/${modelId}`);
        return response;
    } catch (error) {
        console.error('Error fetching specific model:', error);
        throw {
            message: error.response?.data?.message || 'Failed to fetch model',
            status: error.response?.status
        };
    }
};

// API Key management endpoints
export const getApiKey = async () => {
    try {
        const response = await axios.get(`${API_URL}/api-key`);
        return response;
    } catch (error) {
        console.error('Error fetching API key:', error);
        throw {
            message: error.response?.data?.message || 'Failed to fetch API key',
            status: error.response?.status
        };
    }
};

export const generateApiKey = async () => {
    try {
        const response = await axios.post(`${API_URL}/api-key/generate`);
        return response;
    } catch (error) {
        console.error('Error generating API key:', error);
        throw {
            message: error.response?.data?.message || 'Failed to generate API key',
            status: error.response?.status
        };
    }
};

export const regenerateApiKey = async () => {
    try {
        const response = await axios.post(`${API_URL}/api-key/regenerate`);
        return response;
    } catch (error) {
        console.error('Error regenerating API key:', error);
        throw {
            message: error.response?.data?.message || 'Failed to regenerate API key',
            status: error.response?.status
        };
    }
};

// Stores
export const getStores = async (params = {}) => {
    try {
        return axios.get(`${API_URL}/stores`, { params });
    } catch (error) {
        throw {
            message: error.response?.data?.message || 'Failed to fetch stores',
            status: error.response?.status
        };
    }
};

// Transaction prediction with API key
export const predictTransaction = async (data, apiKey, model) => {
    try {
        const response = await axios.post(`${API_URL}/predict?apikey=${apiKey}&model=${model}`, data);
        return response;
    } catch (error) {
        console.error('Error predicting transaction:', error);
        throw {
            message: error.response?.data?.message || 'Failed to predict transaction',
            status: error.response?.status
        };
    }
};

// API Logs and Usage Statistics
export const getApiLogs = (params = {}) => {
    return axios.get(`${API_URL}/api-logs`, { params });
};

export const getApiLogById = (id) => {
    return axios.get(`${API_URL}/api-logs/${id}`);
};

export const getApiUsageStats = (period = 'week') => {
    return axios.get(`${API_URL}/api-usage-stats`, {
        params: { period },
        withCredentials: true  // Explicitly ensure credentials are sent
    });
};

// Transaction data
export const getTransactions = (params = {}) => {
    // Add default pagination parameters if not provided
    const queryParams = {
        page: params.page || 1,
        limit: params.limit || 10,
        ...params
    };
    return axios.get(`${API_URL}/transactions`, { params: queryParams });
};

export const getTransactionById = (id) => {
    return axios.get(`${API_URL}/transaction/${id}`);
};

// Dashboard statistics
export const getDashboardStats = (period = 'month') => {
  try {
    return axios.get(`${API_URL}/dashboard-stats`, { 
      params: { period } 
    });
  } catch (error) {
    throw error;
  }
};

// Store Manager endpoints
export const getStoreManagerStats = (period = 'day', transactionType = 'All Transactions', storeCtx = {}) => {
  try {
    const { storeRef, storeID } = storeCtx || {};
    return axios.get(`${API_URL}/store-manager/stats`, { 
      params: { period, transactionType, storeRef, storeID } 
    });
  } catch (error) {
    throw error;
  }
};

export const getFraudTrends = (period = 'week', transactionType = 'All Transactions', storeCtx = {}) => {
  try {
    const { storeRef, storeID } = storeCtx || {};
    return axios.get(`${API_URL}/store-manager/fraud-trends`, { 
      params: { period, transactionType, storeRef, storeID } 
    });
  } catch (error) {
    throw error;
  }
};

export const getTransactionTypeDistribution = (period = 'day', typeFilter = null, storeCtx = {}) => {
  try {
    const { storeRef, storeID } = storeCtx || {};
    return axios.get(`${API_URL}/store-manager/transaction-types`, { 
      params: { period, transactionType: typeFilter, storeRef, storeID } 
    });
  } catch (error) {
    throw error;
  }
};

export const getRecentAlerts = (limit = 5, transactionType = 'All Transactions', storeCtx = {}) => {
  try {
    const { storeRef, storeID } = storeCtx || {};
    return axios.get(`${API_URL}/store-manager/alerts`, { 
      params: { limit, transactionType, storeRef, storeID } 
    });
  } catch (error) {
    throw error;
  }
};

// Transaction Monitoring specific endpoints
export const getTransactionFraudTrends = (period = 'week', transactionType = 'all') => {
  try {
    return axios.get(`${API_URL}/transaction-monitoring/fraud-trends`, {
      params: { period, transactionType }
    });
  } catch (error) {
    throw error;
  }
};

export const getHighRiskTransactions = (limit = 5, transactionType = 'all', minRiskScore = 0) => {
  try {
    return axios.get(`${API_URL}/transaction-monitoring/high-risk`, {
      params: { limit, transactionType, minRiskScore }
    });
  } catch (error) {
    throw error;
  }
};

export const updateTransactionStatus = (transactionId, status, notes = '') => {
  try {
    return axios.post(`${API_URL}/transaction/:id/status`.replace(':id', transactionId), {
      status,
      notes
    });
  } catch (error) {
    throw error;
  }
};

// Send report email with PDF attachment
export const sendReportEmail = async (email, subject, message, pdfData, filename, userName = '', userRole = '') => {
  try {
    return axios.post(`${API_URL}/send-report`, {
      email,
      subject,
      message,
      pdfData,
      filename,
      userName,
      userRole
    });
  } catch (error) {
    console.error('Error sending report email:', error);
    throw {
      message: error.response?.data?.message || 'Failed to send report email',
      status: error.response?.status
    };
  }
};

// Training Dataset endpoints
export const uploadTrainingDataset = async (file) => {
  try {
    const formData = new FormData();
    formData.append('dataset', file);
    
    // Use axios for file upload
    // axios automatically detects FormData and sets 'multipart/form-data' with boundary
    // We need to remove the default 'application/json' Content-Type for this request
    const response = await axios({
      method: 'post',
      url: `${API_URL}/datasets/upload`,
      data: formData,
      withCredentials: true,
      headers: {
        // Delete the default Content-Type - axios will set multipart/form-data automatically
      },
      transformRequest: [(data, headers) => {
        // Remove Content-Type to let axios handle FormData automatically
        delete headers['Content-Type'];
        return data;
      }]
    });
    
    return response;
  } catch (error) {
    console.error('Error uploading training dataset:', error);
    throw {
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to upload dataset',
      status: error.response?.status
    };
  }
};

export const getAllTrainingDatasets = async () => {
  try {
    const response = await axios.get(`${API_URL}/datasets`);
    return response;
  } catch (error) {
    console.error('Error fetching training datasets:', error);
    throw {
      message: error.response?.data?.message || 'Failed to fetch datasets',
      status: error.response?.status
    };
  }
};

export const getTrainingDatasetByVersion = async (version) => {
  try {
    const response = await axios.get(`${API_URL}/datasets/version/${version}`);
    return response;
  } catch (error) {
    console.error('Error fetching training dataset:', error);
    throw {
      message: error.response?.data?.message || 'Failed to fetch dataset',
      status: error.response?.status
    };
  }
};

export const getLatestTrainingDataset = async () => {
  try {
    const response = await axios.get(`${API_URL}/datasets/latest`);
    return response;
  } catch (error) {
    console.error('Error fetching latest training dataset:', error);
    throw {
      message: error.response?.data?.message || 'Failed to fetch latest dataset',
      status: error.response?.status
    };
  }
};