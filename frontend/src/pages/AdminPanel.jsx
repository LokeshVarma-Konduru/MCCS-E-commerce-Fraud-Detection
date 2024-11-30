// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminPanel.css';

const API_URL = 'http://localhost:9000/mccs';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'Developer'
  });
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/user/${userId}`);
      if (!response.data.user || response.data.user.role !== 'Admin') {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/login');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      if (response.data && response.data.users) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error fetching users');
      setMessageType('error');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    
    try {
      // Format the data exactly as the backend expects it
      const userData = {
        users: [{
          email: formData.email,
          name: formData.name,
          role: formData.role
        }]
      };

      // Make direct axios call to match the backend endpoint
      const response = await axios.post(
        `${API_URL}/addUsers`,
        userData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        // Check for failed users in response
        if (response.data.failedUsers && response.data.failedUsers.length > 0) {
          setMessage(`Failed to add user: ${response.data.failedUsers[0].message}`);
          setMessageType('error');
        } else {
          setMessage('User added successfully');
          setMessageType('success');
          setFormData({ email: '', name: '', role: 'Developer' });
          fetchUsers();
        }
      }
    } catch (error) {
      console.error('Error adding user:', error);
      const errorMsg = error.response?.data?.message || 'Error adding user';
      setMessage(errorMsg);
      setMessageType('error');
    }
  };

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      
      <div className="admin-container">
        <div className="admin-card">
          <h2>Add New User</h2>
          {message && <div className={`message ${messageType}`}>{message}</div>}
          
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="Developer">Developer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            
            <button type="submit" className="add-user-btn">
              Add User
            </button>
          </form>
        </div>

        <div className="admin-card">
          <h2>User List</h2>
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;