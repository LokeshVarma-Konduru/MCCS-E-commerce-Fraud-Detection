// Synthetic data for API Integration page
export const apiData = {
  // Sample API key
  sampleApiKey: 'sk_live_4eC39HqLyjWDarjtT1zdp7dc',

  // Recent API calls
  recentCalls: [
    {
      requestId: 'req_5f23e59b',
      timestamp: '2025-02-27 10:44:12',
      inputData: 'user_789, $1,234.56, Visa',
      status: 'Success',
      details: {
        fraudScore: 0.12,
        riskLevel: 'low'
      }
    },
    {
      requestId: 'req_5f23e58a',
      timestamp: '2025-02-27 10:43:45',
      inputData: 'user_456, $789.99, Mastercard',
      status: 'Failed',
      details: {
        fraudScore: 0.89,
        riskLevel: 'high'
      }
    }
  ],

  // Card types available for testing
  cardTypes: [
    { value: 'Visa', label: 'Visa' },
    { value: 'Mastercard', label: 'Mastercard' },
    { value: 'Amex', label: 'American Express' }
  ],

  // Sample response format
  sampleResponse: {
    success: true,
    requestId: 'req_5f23e59b',
    message: 'Transaction processed successfully',
    details: {
      timestamp: '2025-02-27T10:44:12-05:00',
      fraudScore: 0.12,
      riskLevel: 'low'
    }
  }
};
