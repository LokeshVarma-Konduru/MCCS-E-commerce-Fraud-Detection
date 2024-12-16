import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addUsers, getUsers, getUserInfo, deleteUser, toggleUserStatus } from '../api';
import Footer from '../components/Footer';
import '../styles/AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [userEntries, setUserEntries] = useState([
    { email: '', name: '', role: 'Developer' }
  ]);
  const [users, setUsers] = useState([]);
  
  // Separate messages for Add User and Users List
  const [addUserMessage, setAddUserMessage] = useState('');
  const [addUserMessageType, setAddUserMessageType] = useState('');
  const [addUserMessageVisible, setAddUserMessageVisible] = useState(false);
  
  const [usersListMessage, setUsersListMessage] = useState('');
  const [usersListMessageType, setUsersListMessageType] = useState('');
  const [usersListMessageVisible, setUsersListMessageVisible] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const searchTimeout = useRef(null);
  const addUserMessageTimeoutRef = useRef(null);
  const usersListMessageTimeoutRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getUsers(searchTerm, roleFilter);
      if (response.data && response.data.data) {
        // Add a smooth transition by using setTimeout
        setTimeout(() => {
          setUsers(response.data.data);
          setIsLoading(false);
        }, 300);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showUsersListMessage('Error fetching users', 'error');
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

      const response = await getUserInfo(userId);
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

  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    const newUserEntries = [...userEntries];
    newUserEntries[index] = {
      ...newUserEntries[index],
      [name]: value
    };
    setUserEntries(newUserEntries);
  };

  const addUserEntry = () => {
    setUserEntries([...userEntries, { email: '', name: '', role: 'Developer' }]);
  };

  const removeUserEntry = (index) => {
    if (userEntries.length > 1) {
      const newUserEntries = userEntries.filter((_, i) => i !== index);
      setUserEntries(newUserEntries);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all entries
    const invalidEntries = userEntries.filter(entry => 
      !entry.email || !entry.name || !entry.role
    );

    if (invalidEntries.length > 0) {
      showAddUserMessage('Please fill in all fields for all users', 'error');
      return;
    }

    try {
      const response = await addUsers({ users: userEntries });

      if (response.data) {
        const { addedUsers, failedUsers } = response.data;
        
        if (failedUsers.length > 0) {
          // Create a detailed message for failed users
          const failureMessages = failedUsers.map(user => 
            `${user.email}: ${user.message}`
          ).join('\n');
          
          if (addedUsers.length > 0) {
            // Some users were added successfully
            showAddUserMessage(
              `Added ${addedUsers.length} user(s) successfully.\nFailed to add:\n${failureMessages}`,
              'warning'
            );
            // Only remove the successfully added users
            const failedEmails = failedUsers.map(user => user.email);
            setUserEntries(prevEntries => 
              prevEntries.filter(entry => failedEmails.includes(entry.email))
            );
          } else {
            // All users failed
            showAddUserMessage(
              `Failed to add users:\n${failureMessages}`,
              'error'
            );
          }
        } else {
          // All users added successfully
          showAddUserMessage(
            `Successfully added ${addedUsers.length} user(s). Temporary passwords have been sent to their email addresses.`,
            'success'
          );
          // Reset form to a single empty entry
          setUserEntries([{ email: '', name: '', role: 'Developer' }]);
        }
        
        // Refresh user list
        fetchUsers();
      }
    } catch (error) {
      console.error('Error adding users:', error);
      showAddUserMessage(error.response?.data?.message || 'Error adding users', 'error');
    }
  };

  const showAddUserMessage = (text, type) => {
    // Clear any existing timeout
    if (addUserMessageTimeoutRef.current) {
      clearTimeout(addUserMessageTimeoutRef.current);
    }

    setAddUserMessage(text);
    setAddUserMessageType(type);
    setAddUserMessageVisible(true);

    // Set timeout to hide message - increased to 6 seconds
    addUserMessageTimeoutRef.current = setTimeout(() => {
      setAddUserMessageVisible(false);
      // Clear message after fade out animation
      setTimeout(() => {
        setAddUserMessage('');
        setAddUserMessageType('');
      }, 300); // Match this with CSS transition duration
    }, 6000); // Show message for 6 seconds
  };

  const showUsersListMessage = (text, type) => {
    // Clear any existing timeout
    if (usersListMessageTimeoutRef.current) {
      clearTimeout(usersListMessageTimeoutRef.current);
    }

    setUsersListMessage(text);
    setUsersListMessageType(type);
    setUsersListMessageVisible(true);

    // Set timeout to hide message - increased to 6 seconds
    usersListMessageTimeoutRef.current = setTimeout(() => {
      setUsersListMessageVisible(false);
      // Clear message after fade out animation
      setTimeout(() => {
        setUsersListMessage('');
        setUsersListMessageType('');
      }, 300); // Match this with CSS transition duration
    }, 6000); // Show message for 6 seconds
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDeleteUser = async () => {
    try {
      const response = await deleteUser(userToDelete._id);
      if (response.data.success) {
        showUsersListMessage('User deleted successfully', 'success');
        // Refresh the users list
        fetchUsers();
      }
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting user:', error);
      showUsersListMessage(
        error.response?.data?.message || 'Error deleting user',
        'error'
      );
      closeDeleteModal();
    }
  };

  const handleToggleStatus = async (user) => {
    setUserToToggle(user);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggle) return;

    try {
      await toggleUserStatus(userToToggle._id, !userToToggle.status);
      showUsersListMessage(`User ${!userToToggle.status ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchUsers();
    } catch (error) {
      showUsersListMessage(error.response?.data?.message || 'Error toggling user status', 'error');
    } finally {
      setStatusModalOpen(false);
      setUserToToggle(null);
    }
  };

  // Clean up timeouts on component unmount
  useEffect(() => {
    return () => {
      if (addUserMessageTimeoutRef.current) {
        clearTimeout(addUserMessageTimeoutRef.current);
      }
      if (usersListMessageTimeoutRef.current) {
        clearTimeout(usersListMessageTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="admin-container">
      <div className="admin-content">
        <div className="admin-panel-container min-h-screen bg-black">
          <div className="admin-container">
            <h1>Admin Panel</h1>
            <div className="admin-card">
              <h2>Add New Users</h2>
              {addUserMessage && (
                <div className={`message ${addUserMessageType} ${addUserMessageVisible ? 'visible' : ''}`}
                     style={{ whiteSpace: 'pre-line' }}>
                  {addUserMessage}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                {userEntries.map((entry, index) => (
                  <div key={index} className="user-entry">
                    {index > 0 && <hr className="entry-divider" />}
                    <div className="user-entry-content">
                      <div className="user-entry-fields">
                        <div className="form-group">
                          <label htmlFor={`email-${index}`}>Email:</label>
                          <input
                            type="email"
                            id={`email-${index}`}
                            name="email"
                            value={entry.email}
                            onChange={(e) => handleInputChange(index, e)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`name-${index}`}>Name:</label>
                          <input
                            type="text"
                            id={`name-${index}`}
                            name="name"
                            value={entry.name}
                            onChange={(e) => handleInputChange(index, e)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`role-${index}`}>Role:</label>
                          <select
                            id={`role-${index}`}
                            name="role"
                            value={entry.role}
                            onChange={(e) => handleInputChange(index, e)}
                            required
                          >
                            <option value="Developer">Developer</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      {userEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUserEntry(index)}
                          className="remove-user-btn"
                          aria-label="Remove user"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="form-actions">
                  <button type="button" onClick={addUserEntry} className="add-user-btn">
                    Add Another User
                  </button>
                  <button type="submit" className="submit-btn">
                    Submit
                  </button>
                </div>
              </form>
            </div>

            <div className="admin-card users-list">
              <h2>User List</h2>
              {usersListMessageVisible && (
                <div className={`message ${usersListMessageType} visible`}>
                  {usersListMessage}
                </div>
              )}
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
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length > 0 ? (
                        users.map((user) => (
                          <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>
                              <span className={`status-badge ${user.status ? 'active' : 'inactive'}`}>
                                {user.status ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className={`toggle-button ${user.status ? 'deactivate' : 'activate'}`}
                              >
                                {user.status ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => openDeleteModal(user)}
                                className="delete-btn"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="no-users">No users found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteModalOpen && userToDelete && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <span className="warning-icon">⚠️</span>
                  <h3>Confirm Delete User</h3>
                </div>
                <div className="modal-content">
                  <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                  <div className="user-info">
                    <strong>Name:</strong> {userToDelete.name}<br />
                    <strong>Email:</strong> {userToDelete.email}<br />
                    <strong>Role:</strong> {userToDelete.role}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={closeDeleteModal}>
                    Cancel
                  </button>
                  <button className="modal-btn delete" onClick={handleDeleteUser}>
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Status Toggle Modal */}
          {statusModalOpen && userToToggle && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <span className="warning-icon">⚠️</span>
                  <h3>Confirm {userToToggle.status ? 'Deactivate' : 'Activate'} User</h3>
                </div>
                <div className="modal-content">
                  <p>Are you sure you want to {userToToggle.status ? 'deactivate' : 'activate'} this user?</p>
                  <div className="user-info">
                    <strong>Name:</strong> {userToToggle.name}<br />
                    <strong>Email:</strong> {userToToggle.email}<br />
                    <strong>Role:</strong> {userToToggle.role}<br />
                    <strong>Current Status:</strong> {userToToggle.status ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="modal-actions">
                  <button 
                    className="modal-btn cancel" 
                    onClick={() => {
                      setStatusModalOpen(false);
                      setUserToToggle(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`modal-btn ${userToToggle.status ? 'delete' : 'activate'}`}
                    onClick={confirmToggleStatus}
                  >
                    {userToToggle.status ? 'Deactivate' : 'Activate'} User
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPanel;