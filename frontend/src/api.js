/* eslint-disable no-useless-catch */
import axios from 'axios';

const API_URL = 'http://localhost:9000/mccs';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

export const login = (email, password) => 
    axios.post(`${API_URL}/login`, { email, password });

export const verifyLoginOTP = (userId, otp) => 
    axios.post(`${API_URL}/verify-login-otp`, { userId, otp });

export const logout = () => 
    axios.post(`${API_URL}/logout`);

export const getUserInfo = (userId) => 
    axios.get(`${API_URL}/user/${userId}`);

export const getTeamMembers = () => 
    axios.get(`${API_URL}/team-members`);

export const updatePassword = (userId, oldPassword, newPassword) =>
    axios.post(`${API_URL}/update-password`, { userId, oldPassword, newPassword });

// Admin specific endpoints
export const addUsers = (userData) => 
    axios.post(`${API_URL}/addUsers`, userData);

export const getUsers = (searchTerm = '', roleFilter = '') => {
    const params = new URLSearchParams();
    if (roleFilter) params.append('role', roleFilter);
    if (searchTerm?.trim()) params.append('search', searchTerm.trim());
    
    const queryString = params.toString();
    const url = queryString ? `${API_URL}/users?${queryString}` : `${API_URL}/users`;
    
    return axios.get(url);
};

// Delete a user
export const deleteUser = async (userId) => {
    const response = await axios.delete(`${API_URL}/admin/users/${userId}`);
    return response;
};

// Toggle user status (activate/deactivate)
export const toggleUserStatus = async (userId, status) => {
    const response = await axios.post(`${API_URL}/admin/users/${userId}/toggle-status`, { status });
    return response;
};