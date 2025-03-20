// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Login from './Login.jsx';
import Navbar from './components/Navbar.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import AboutUs from './pages/AboutUs.jsx';
import Contact from './pages/Contact.jsx';
import Developer from './pages/Developer.jsx';
import APIIntegration from './pages/APIIntegration';
import ModelPerformance from './pages/ModelPerformance';
import TransactionMonitoring from './pages/TransactionMonitoring';
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

// Developer Route Component
const DeveloperRoute = ({ children }) => {
  const [isDeveloper, setIsDeveloper] = React.useState(null);
  const location = useLocation();

  React.useEffect(() => {
    const checkDeveloperStatus = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.log('No userId found in localStorage');
          setIsDeveloper(false);
          return;
        }
        
        console.log('Checking developer status for userId:', userId);
        const response = await getUserInfo(userId);
        console.log('Developer check response:', response.data);
        setIsDeveloper(response.data.user.role === 'Developer');
      } catch (error) {
        console.error('Error checking developer status:', error);
        setIsDeveloper(false);
      }
    };
    
    checkDeveloperStatus();
  }, []);
  
  if (isDeveloper === null) {
    console.log('Developer status is still loading...');
    return <div>Loading...</div>;
  }
  
  if (!isDeveloper) {
    console.log('User is not a developer, redirecting to dashboard...');
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  console.log('User is a developer, rendering developer dashboard...');
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

// Add PropTypes validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired
};

DeveloperRoute.propTypes = {
  children: PropTypes.node.isRequired
};

// Dashboard Content
const DashboardContent = () => {
  return (
    <div className="dashboard-content">
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
          <Route path="/" element={<Navigate to="/developer" replace />} />
          <Route path="/dashboard" element={<Navigate to="/developer" replace />} />
          <Route
            path="/developer"
            element={
              <ProtectedRoute>
                <Developer />
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
          <Route
            path="/api-integration"
            element={
              <ProtectedRoute>
                <APIIntegration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/model-performance"
            element={
              <ProtectedRoute>
                <ModelPerformance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <AboutUs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <Contact />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transaction-monitoring"
            element={
              <ProtectedRoute>
                <TransactionMonitoring />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;