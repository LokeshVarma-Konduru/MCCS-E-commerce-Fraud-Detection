// Static data for the developer dashboard
const dashboardData = {
  stats: {
    totalTransactions: {
      value: 24562,
      change: '+12.5% from last month'
    },
    fraudDetectionRate: {
      value: '98.7%',
      change: '+2.1% from last month'
    },
    apiResponseTime: {
      value: '245ms',
      change: '-18ms from last month'
    }
  },
  
  transactions: [
    {
      id: '#45678',
      time: '2 minutes ago',
      status: 'Legitimate'
    },
    {
      id: '#45677',
      time: '5 minutes ago',
      status: 'Fraudulent'
    }
  ],
  
  apiPerformance: {
    labels: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
             '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
    data: [235, 238, 240, 238, 242, 240, 245, 250, 248, 245, 242, 240, 238, 235, 233, 235, 238, 240, 242, 240, 238, 235, 233, 235]
  },
  
  recentLogs: [
    {
      type: 'success',
      title: 'API Request Successful',
      subtitle: 'Response time: 235ms',
      time: '1 minute ago'
    },
    {
      type: 'info',
      title: 'Model Retraining Complete',
      subtitle: 'Accuracy improved by 1.2%',
      time: '1 hour ago'
    }
  ]
};

export default dashboardData;
