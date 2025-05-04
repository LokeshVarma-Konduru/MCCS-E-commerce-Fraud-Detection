// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Login from './Login.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import './styles/GlobalFooter.css';
import AdminPanel from './pages/AdminPanel.jsx';
import AboutUs from './pages/AboutUs.jsx';
import Contact from './pages/Contact.jsx';
import Developer from './pages/Developer.jsx';
import APIIntegration from './pages/APIIntegration';
import ModelPerformance from './pages/ModelPerformance';
import TransactionMonitoring from './pages/TransactionMonitoring';
import StoreManager from './pages/StoreManager.jsx';
import Help from './pages/Help.jsx';
import ApiDocs from './pages/ApiDocs.jsx';
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
      <Footer />
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
          setIsDeveloper(false);
          return;
        }
        
        const response = await getUserInfo(userId);
        // Only Developer and Admin roles can access developer pages
        setIsDeveloper(['Developer', 'Admin'].includes(response.data.user.role));
      } catch (error) {
        console.error('Error checking developer status:', error);
        setIsDeveloper(false);
      }
    };
    
    checkDeveloperStatus();
  }, []);
  
  if (isDeveloper === null) {
    return <div>Loading...</div>;
  }
  
  if (!isDeveloper) {
    // If user is not a developer or admin, redirect based on their role
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

// Store Manager Route Component
const StoreManagerRoute = ({ children }) => {
  const [isStoreManager, setIsStoreManager] = React.useState(null);
  const location = useLocation();

  React.useEffect(() => {
    const checkStoreManagerStatus = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setIsStoreManager(false);
          return;
        }
        
        const response = await getUserInfo(userId);
        const userRole = response.data.user.role;
        // Only Store Manager and Admin roles can access store manager pages
        setIsStoreManager(['StoreManager', 'Admin'].includes(userRole));
      } catch (error) {
        console.error('Error checking store manager status:', error);
        setIsStoreManager(false);
      }
    };
    
    checkStoreManagerStatus();
  }, []);
  
  if (isStoreManager === null) {
    return <div>Loading...</div>;
  }
  
  if (!isStoreManager) {
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

DeveloperRoute.propTypes = {
  children: PropTypes.node.isRequired
};

StoreManagerRoute.propTypes = {
  children: PropTypes.node.isRequired
};

// Dashboard Content with role-based redirect
const DashboardContent = () => {
  const [loading, setLoading] = React.useState(true);
  const [redirect, setRedirect] = React.useState(null);
  
  React.useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setLoading(false);
          return;
        }
        
        const response = await getUserInfo(userId);
        const userRole = response.data.user.role;
        
        // Redirect based on role
        if (userRole === 'Developer') {
          setRedirect('/developer');
        } else if (userRole === 'StoreManager') {
          setRedirect('/store-manager');
        } else {
          // Admin or any other role stays on dashboard
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setLoading(false);
      }
    };
    
    checkUserRole();
  }, []);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (redirect) {
    return <Navigate to={redirect} replace />;
  }
  
  return (
    <div className="dashboard-content">
      <Dashboard />
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
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
            path="/developer"
            element={
              <DeveloperRoute>
                <Developer />
              </DeveloperRoute>
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
              <DeveloperRoute>
                <APIIntegration />
              </DeveloperRoute>
            }
          />
          <Route
            path="/store-manager"
            element={
              <StoreManagerRoute>
                <StoreManager />
              </StoreManagerRoute>
            }
          />
          <Route
            path="/model-performance"
            element={
              <DeveloperRoute>
                <ModelPerformance />
              </DeveloperRoute>
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
              <DeveloperRoute>
                <TransactionMonitoring />
              </DeveloperRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-docs"
            element={
              <ProtectedRoute>
                <ApiDocs />
              </ProtectedRoute>
          }
        />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;