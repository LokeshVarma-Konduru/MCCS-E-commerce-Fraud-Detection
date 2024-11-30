import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminPanel.css';

const API_URL = 'http://localhost:9000/mccs';

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
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [messageVisible, setMessageVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);
  const messageTimeoutRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      let url = `${API_URL}/users`;
      const params = new URLSearchParams();
      
      // Only add role parameter if a specific role is selected
      if (roleFilter && roleFilter !== '') {
        params.append('role', roleFilter);
      }
      
      // Only add search parameter if there's a search term
      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const queryString = params.toString();
      url = queryString ? `${url}?${queryString}` : url;

      const response = await axios.get(url);
      if (response.data && response.data.data) {
        // Add a smooth transition by using setTimeout
        setTimeout(() => {
          setUsers(response.data.data);
          setFilteredUsers(response.data.data);
          setIsLoading(false);
        }, 300);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('Error fetching users', 'error');
      setIsLoading(false);
    }
  }, [roleFilter, searchTerm]);

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
  }, []);

  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    setIsSearching(true);

    searchTimeout.current = setTimeout(() => {
      fetchUsers();
      setIsSearching(false);
    }, 400);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [fetchUsers, searchTerm, roleFilter]);

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleFilterChange = (e) => {
    const newRole = e.target.value;
    setRoleFilter(newRole);
    setIsSearching(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const userData = {
        users: [{
          email: formData.email,
          name: formData.name,
          role: formData.role
        }]
      };

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
        if (response.data.failedUsers && response.data.failedUsers.length > 0) {
          showMessage(`Failed to add user: ${response.data.failedUsers[0].message}`, 'error');
        } else {
          showMessage('User added successfully', 'success');
          setFormData({ email: '', name: '', role: 'Developer' });
          fetchUsers();
        }
      }
    } catch (error) {
      console.error('Error adding user:', error);
      showMessage(error.response?.data?.message || 'Error adding user', 'error');
    }
  };

  const showMessage = (text, type) => {
    // Clear any existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    setMessage(text);
    setMessageType(type);
    setMessageVisible(true);

    // Set timeout to hide message
    messageTimeoutRef.current = setTimeout(() => {
      setMessageVisible(false);
      // Clear message after fade out animation
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 300); // Match this with CSS transition duration
    }, 3000); // Show message for 3 seconds
  };

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-card">
          <h2>Add New User</h2>
          {message && (
            <div className={`message ${messageType} ${messageVisible ? 'visible' : ''}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-fields">
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
                  required
                >
                  <option value="Developer">Developer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <button type="submit" className="add-user-btn">
              Add User
            </button>
          </form>
        </div>

        <div className="admin-card user-list-card">
          <h2>User List</h2>
          <div className="filter-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={`search-input ${isSearching ? 'searching' : ''}`}
              />
            </div>
            <div className="role-filter">
              <select
                value={roleFilter}
                onChange={handleRoleFilterChange}
                className={`role-select ${isSearching ? 'searching' : ''}`}
              >
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Developer">Developer</option>
              </select>
            </div>
          </div>

          <div className={`table-container ${isLoading || isSearching ? 'loading' : ''}`}>
            {isLoading || isSearching ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  {isSearching ? 'Searching...' : 'Loading users...'}
                </div>
              </div>
            ) : (
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id} className="user-row">
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-users">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;