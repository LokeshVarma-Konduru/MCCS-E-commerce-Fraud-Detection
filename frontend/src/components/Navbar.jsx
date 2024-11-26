// eslint-disable-next-line no-unused-vars
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserInfo, logout } from '../api';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

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
  }, [navigate]);

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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="left-section">
          <div className="hamburger-menu" onClick={() => setIsOpen(!isOpen)} ref={menuRef}>
            <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
              <div className="sidebar-header">
                <h3>Menu</h3>
              </div>
              <ul className="sidebar-menu">
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/transactions">Transactions</Link></li>
                <li><Link to="/analytics">Analytics</Link></li>
              </ul>
            </div>
          </div>
          <div className="brand">
            <span className="brand-name">MCCS Fraud Detection</span>
          </div>
        </div>

        <div className="center-section">
          <div className="nav-links">
            <Link to="/dashboard" className="nav-link">Home</Link>
            <Link to="/contact" className="nav-link">Contact Us</Link>
            <Link to="/about" className="nav-link">About Us</Link>
          </div>
        </div>

        <div className="right-section" ref={profileRef}>
          <div className="profile-menu" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="profile-icon">
              <span>{user ? getInitials(user.name) : 'U'}</span>
            </div>
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
                  <button className="logout-button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
