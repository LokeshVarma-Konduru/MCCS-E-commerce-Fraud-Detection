// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TeamMembers from './TeamMembers.jsx';
import Login from './Login.jsx';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Add PropTypes validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

// Dashboard Content
const DashboardContent = () => {
  return (
    <div>
      <h1>Welcome to the Team Dashboard</h1>
      <TeamMembers />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
