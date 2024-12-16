import { useState } from 'react';
import { updatePassword } from '../api';
import '../styles/ChangePasswordModal.css';

// eslint-disable-next-line react/prop-types
const ChangePasswordModal = ({ isOpen, onClose, userId }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      criteria: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumber,
        hasSpecialChar
      }
    };
  };

  const handleNewPasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    // Always validate and update criteria, even if empty
    const validation = validatePassword(password);
    setPasswordCriteria(validation.criteria);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError('Password does not meet all requirements');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(userId, oldPassword, newPassword);
      setSuccess('Password updated successfully');
      // Reset form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Change Password</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="oldPassword">Current Password</label>
            <input
              type="password"
              id="oldPassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={handleNewPasswordChange}
              placeholder="Enter new password"
            />
            <div className="password-criteria" aria-live="polite">
              <p>Password must contain:</p>
              <ul>
                <li className={passwordCriteria.minLength ? 'met' : ''}>
                  At least 8 characters
                </li>
                <li className={passwordCriteria.hasUpperCase ? 'met' : ''}>
                  At least one uppercase letter
                </li>
                <li className={passwordCriteria.hasLowerCase ? 'met' : ''}>
                  At least one lowercase letter
                </li>
                <li className={passwordCriteria.hasNumber ? 'met' : ''}>
                  At least one number
                </li>
                <li className={passwordCriteria.hasSpecialChar ? 'met' : ''}>
                  At least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
