import { createContext, useContext, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

const SOCKET_URL = "http://localhost:9000";

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const socketRef = useRef(null);

  const userId = user?._id || user?.id || null;
  const userRole = user?.role || null;
  const userStoreID = user?.storeID || null;
  const hasUser = Boolean(isAuthenticated && userId);

  const connectionKey = hasUser
    ? `${userId}-${userRole || "unknown"}-${userStoreID || "none"}`
    : "guest";

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!hasUser) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setFraudAlerts([]);
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true
    });

    socketRef.current = socketInstance;

    const handleConnect = () => {
      console.log("✅ Socket.io connected:", socketInstance.id);
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("❌ Socket.io disconnected");
      setIsConnected(false);
    };

    const handleConnectError = (error) => {
      console.error("Socket.io connection error:", error);
      setIsConnected(false);
    };

    const handleFraudAlert = (alert) => {
      console.log("🚨 Fraud alert received:", alert);

      setFraudAlerts((prev) => [alert, ...prev]);

      toast.error(
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
            🚨 Fraud Detected!
          </div>
          <div style={{ fontSize: "13px" }}>
            {alert.transactionIdShort} - ${alert.amount}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Risk: {alert.riskLevel} ({alert.probability}%)
          </div>
        </div>,
        {
          duration: 6000,
          position: "top-right",
          style: {
            background: "#fee2e2",
            border: "1px solid #dc2626",
            color: "#991b1b",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          },
          icon: "⚠️"
        }
      );

      try {
        const audio = new Audio("/alert-sound.mp3");
        audio.volume = 0.3;
        audio.play().catch((err) => console.log("Could not play alert sound:", err));
      } catch (err) {
        console.log("Alert sound not available");
      }
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);
    socketInstance.on("fraud_alert", handleFraudAlert);

    setSocket(socketInstance);

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("connect_error", handleConnectError);
      socketInstance.off("fraud_alert", handleFraudAlert);
      socketInstance.disconnect();

      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }
    };
  }, [connectionKey, hasUser, loading]);

  const clearAlerts = () => {
    setFraudAlerts([]);
  };

  const removeAlert = (transactionId) => {
    setFraudAlerts((prev) => prev.filter((alert) => alert.transactionId !== transactionId));
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
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
