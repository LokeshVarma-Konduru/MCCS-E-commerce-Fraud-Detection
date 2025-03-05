// eslint-disable-next-line no-unused-vars
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getUserInfo, logout } from '../api';
import ChangePasswordModal from './ChangePasswordModal';
import '../styles/Navbar.css';
import { FaSearch, FaBars } from 'react-icons/fa';

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
        console.log('User Info Response:', response.data); // Debug log
        if (response && response.data && response.data.user) {
          setUser(response.data.user);
          // Redirect developer to developer dashboard if they're on admin page
          if (response.data.user.role === 'Developer' && location.pathname === '/admin') {
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

  console.log('User:', user); 

  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isDeveloperDashboard = location.pathname === '/developer';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button className="menu-button" onClick={() => setIsOpen(!isOpen)} ref={menuRef}>
            <FaBars />
          </button>
          <Link to="/" className="navbar-brand">
            MCCS Fraud Detection
          </Link>
          <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3>Menu</h3>
            </div>
            <ul className="sidebar-menu">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/transactions">Transactions</Link></li>
              {user && user.role === 'Admin' && (
                <li><Link to="/admin">Admin Panel</Link></li>
              )}
              {user && user.role === 'Developer' && (
                <li><Link to="/developer">Developer Dashboard</Link></li>
              )}
              {user && ['StoreManager', 'Admin', 'Developer'].includes(user.role) && (
                <li><Link to="/store-manager">Store Manager</Link></li>
              )}
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
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
