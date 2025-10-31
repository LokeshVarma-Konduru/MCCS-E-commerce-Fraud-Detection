// Login.jsx
// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, verifyLoginOTP } from './api';
import logo from './assets/logo.jpg';
import { useAuth } from './context/AuthContext.jsx';

const Login = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestUser, setIsTestUser] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!showOtp) {
        const response = await login(email, password);
        setUserId(response.data.userId);
        setIsTestUser(response.data.isTestUser || false);
        setShowOtp(true);
      } else {
        const response = await verifyLoginOTP(userId, otp);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', userId);

        let userRole = null;
        try {
          const refreshedUser = await refreshUser();
          userRole = refreshedUser?.role || null;
        } catch (refreshError) {
          console.error('Failed to refresh user after login:', refreshError);
          setError(refreshError.response?.data?.message || 'Unable to load user profile');
          return;
        }

        if (!userRole) {
          setError('Unable to determine user role. Please try again.');
          return;
        }

        if (userRole === 'Developer') {
          navigate('/developer');
        } else if (userRole === 'StoreManager') {
          navigate('/store-manager');
        } else {
          // Admin or any other role
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="login-container">
      <div className="logo-section">
        <div className="logo-wrapper">
          <img src={logo} alt="Company Logo" className="logo" />
        </div>
      </div>

      <div className="form-section">
        <div className="login-form-container">
          <h2 className="login-title">Welcome Back</h2>
          
          <form onSubmit={handleSubmit}>
            {!showOtp ? (
              <>
                <div className="form-group">
                  <label htmlFor="email" style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '0.7rem' }}>Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    autoComplete="email"
                    style={{ width: '100%', padding: '1rem', backgroundColor: 'rgba(51, 51, 51, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem' }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password" style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '0.7rem' }}>Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{ width: '100%', padding: '1rem', backgroundColor: 'rgba(51, 51, 51, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem' }}
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="otp" style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '0.7rem' }}>Enter OTP</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="Enter OTP"
                  maxLength="6"
                  autoComplete="one-time-code"
                  style={{ width: '100%', padding: '1rem', backgroundColor: 'rgba(51, 51, 51, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem' }}
                />
                {isTestUser ? (
                  <div>
                    <p className="otp-message" style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.8rem', textAlign: 'center' }}>Test User OTP: <strong>123456</strong></p>
                    <p className="otp-message" style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.4rem', textAlign: 'center' }}>This is a test account with fixed OTP</p>
                  </div>
                ) : (
                  <p className="otp-message" style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.8rem', textAlign: 'center' }}>Please check your email for OTP</p>
                )}
              </div>
            )}
            <br></br>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : (showOtp ? 'Verify OTP' : 'Login')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;



