// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Login from './Login.jsx';
import Navbar from './components/Navbar.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import { getUserInfo } from './api.js';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = React.useState(null);
  const location = useLocation();
  
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setIsAdmin(false);
          return;
        }
        
        const response = await getUserInfo(userId);
        setIsAdmin(response.data.user.role === 'Admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  if (isAdmin === null) {
    return <div>Loading...</div>;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

// Add PropTypes validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired
};

// Dashboard Content
const DashboardContent = () => {
  return (
    <div className="dashboard-content">
      <h1>Welcome to the Team Dashboard</h1>
      <Dashboard />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;