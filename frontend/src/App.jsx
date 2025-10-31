import PropTypes from "prop-types";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./Login.jsx";
import Navbar from "./components/Navbar.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import Contact from "./pages/Contact.jsx";
import Developer from "./pages/Developer.jsx";
import Footer from "./components/Footer.jsx";
import "./styles/GlobalFooter.css";
import APIIntegration from "./pages/APIIntegration";
import ModelPerformance from "./pages/ModelPerformance";
import TransactionMonitoring from "./pages/TransactionMonitoring";
import StoreManager from "./pages/StoreManager.jsx";
import Help from "./pages/Help.jsx";
import ApiDocs from "./pages/ApiDocs.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

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

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== "Admin") {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
};

const DeveloperRoute = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!["Developer", "Admin"].includes(user.role)) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
};

const StoreManagerRoute = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!["StoreManager", "Admin"].includes(user.role)) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
};

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

const DashboardContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "Developer") {
    return <Navigate to="/developer" replace />;
  }

  if (user.role === "StoreManager") {
    return <Navigate to="/store-manager" replace />;
  }

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
            path="/admin-dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
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
    </BrowserRouter>
  );
};

export default App;

