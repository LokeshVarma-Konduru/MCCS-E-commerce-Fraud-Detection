import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

const SocketContext = createContext(null);

const SOCKET_URL = 'http://localhost:9000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fraudAlerts, setFraudAlerts] = useState([]);

  useEffect(() => {
    // Initialize Socket.io connection
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket.io connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      setIsConnected(false);
    });

    // Listen for fraud alerts
    socketInstance.on('fraud_alert', (alert) => {
      console.log('🚨 Fraud alert received:', alert);
      
      // Add to alerts list
      setFraudAlerts(prev => [alert, ...prev]);

      // Show toast notification
      toast.error(
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            🚨 Fraud Detected!
          </div>
          <div style={{ fontSize: '13px' }}>
            {alert.transactionIdShort} - ${alert.amount}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Risk: {alert.riskLevel} ({alert.probability}%)
          </div>
        </div>,
        {
          duration: 6000,
          position: 'top-right',
          style: {
            background: '#fee2e2',
            border: '1px solid #dc2626',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
          icon: '⚠️',
        }
      );

      // Play alert sound (optional)
      try {
        const audio = new Audio('/alert-sound.mp3');
        audio.volume = 0.3;
        audio.play().catch(err => console.log('Could not play alert sound:', err));
      } catch (err) {
        console.log('Alert sound not available');
      }
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearAlerts = () => {
    setFraudAlerts([]);
  };

  const removeAlert = (transactionId) => {
    setFraudAlerts(prev => prev.filter(alert => alert.transactionId !== transactionId));
  };

  const value = {
    socket,
    isConnected,
    fraudAlerts,
    clearAlerts,
    removeAlert
  };

  return (
    <SocketContext.Provider value={value}>
      <Toaster />
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
