// Login.jsx
// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, verifyLoginOTP } from './api';
import logo from './assets/logo.jpg';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!showOtp) {
        const response = await login(email, password);
        setUserId(response.data.userId);
        setShowOtp(true);
      } else {
        const response = await verifyLoginOTP(userId, otp);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', userId);  
        navigate('/');
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
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="Enter OTP"
                  maxLength="6"
                  autoComplete="one-time-code"
                />
                <p className="otp-message">Please check your email for OTP</p>
              </div>
            )}

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