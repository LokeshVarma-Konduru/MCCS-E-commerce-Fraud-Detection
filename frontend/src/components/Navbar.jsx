// eslint-disable-next-line no-unused-vars
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getUserInfo, logout } from '../api';
import ChangePasswordModal from './ChangePasswordModal';
import '../styles/Navbar.css';
import { FaSearch, FaBars } from 'react-icons/fa';
import mccsLogo from '../assets/16_MCCSlogo_Comp_NoText.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          navigate('/login');
          return;
        }
        
        const response = await getUserInfo(userId);
        if (response && response.data && response.data.user) {
          setUser(response.data.user);
          
          // Role-based redirects for restricted pages
          const userRole = response.data.user.role;
          const currentPath = location.pathname;
          
          // Redirect from admin panel if not admin
          if (currentPath === '/admin' && userRole !== 'Admin') {
            navigate(userRole === 'Developer' ? '/developer' : '/store-manager');
          }
          
          // Redirect from developer pages if not developer or admin
          if (['Developer', 'Admin'].includes(userRole) === false && 
              ['/developer', '/api-integration', '/model-performance', '/transaction-monitoring'].includes(currentPath)) {
            navigate('/store-manager');
          }
          
          // Redirect from store manager if not store manager or admin
          if (['StoreManager', 'Admin'].includes(userRole) === false && currentPath === '/store-manager') {
            navigate('/developer');
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          navigate('/login');
        }
      }
    };

    fetchUserInfo();
  }, [navigate, location.pathname]);

  // Remove debug logs

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is on a navigation item
      const isNavigationItem = event.target.closest('.sidebar-menu li');
      if (isNavigationItem) {
        // Don't close the sidebar if clicking on a navigation item
        // The handleNavigation function will handle this
        return;
      }
      
      // Otherwise, close menus when clicking outside
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      navigate('/login');
    }
  };

  const handleNavigation = (path, event) => {
    // Prevent the default behavior and stop propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Close the sidebar
    setIsOpen(false);
    
    // Navigate to the selected path
    navigate(path);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isDeveloperDashboard = location.pathname === '/developer';
  const currentPath = location.pathname;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button className="menu-button" onClick={() => setIsOpen(!isOpen)} ref={menuRef}>
            <FaBars />
          </button>
          <Link to="/" className="navbar-brand">
            <img src={mccsLogo} alt="MCCS Logo" className="navbar-logo" />
            <span className="brand-text">MCCS Fraud Detection</span>
          </Link>
          <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <img src={mccsLogo} alt="MCCS Logo" className="sidebar-logo" />
              <h3>Menu</h3>
            </div>
            <ul className="sidebar-menu">
              {/* Dashboard - Only visible to Admin */}
              {user && user.role === 'Admin' && (
                <li 
                  className={currentPath === '/dashboard' ? 'active' : ''}
                  onClick={(e) => handleNavigation('/dashboard', e)}
                >
                  Dashboard
                </li>
              )}
              
              {/* Admin Panel - Only visible to Admin */}
              {user && user.role === 'Admin' && (
                <li 
                  className={currentPath === '/admin' ? 'active' : ''}
                  onClick={(e) => handleNavigation('/admin', e)}
                >
                  Admin Panel
                </li>
              )}
              
              {/* Developer Dashboard - Visible to Admin and Developer */}
              {user && ['Admin', 'Developer'].includes(user.role) && (
                <li 
                  className={currentPath === '/developer' ? 'active' : ''}
                  onClick={(e) => handleNavigation('/developer', e)}
                >
                  Developer Dashboard
                </li>
              )}
              
              {/* Developer sub-pages are accessed through the Developer Dashboard's top navigation */}
              
              {/* Store Manager - Visible to Admin and StoreManager */}
              {user && ['Admin', 'StoreManager'].includes(user.role) && (
                <li 
                  className={currentPath === '/store-manager' ? 'active' : ''}
                  onClick={(e) => handleNavigation('/store-manager', e)}
                >
                  Store Manager
                </li>
              )}

              <li 
                className={currentPath === '/help' ? 'active' : ''}
                onClick={(e) => handleNavigation('/help', e)}
              >
                Help & Documentation
              </li>
              
              {/* About Us - Visible to all roles */}
              <li 
                className={currentPath === '/about' ? 'active' : ''}
                onClick={(e) => handleNavigation('/about', e)}
              >
                About Us
              </li>
              
              {/* Contact - Visible to all roles */}
              <li 
                className={currentPath === '/contact' ? 'active' : ''}
                onClick={(e) => handleNavigation('/contact', e)}
              >
                Contact
              </li>
            </ul>
          </div>
        </div>

        {isDeveloperDashboard && (
          <div className="navbar-center">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search logs, transactions..." 
                className="search-input"
              />
            </div>
          </div>
        )}

        <div className="navbar-right">
          {isDeveloperDashboard && (
            <div className="api-status">
              <span className="status-dot"></span>
              <span className="status-text">API Connected</span>
            </div>
          )}
          <div className="profile-container" ref={profileRef} onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <span className="profile-text">{user ? getInitials(user.name) : 'U'}</span>
            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <div className="profile-info">
                    <h4>{user ? user.name : 'User'}</h4>
                    <p>{user ? user.email : ''}</p>
                  </div>
                </div>
                <div className="profile-body">
                  <div className="role-badge">{user ? (user.role || 'User') : 'User'}</div>
                </div>
                <div className="profile-footer">
                  <button 
                    className="change-password-button" 
                    onClick={() => {
                      setIsChangePasswordModalOpen(true);
                      setIsProfileOpen(false);
                    }}
                  >
                    Change Password
                  </button>
                  <button className="logout-button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        userId={user?._id}
      />
    </nav>
  );
};

export default Navbar;
