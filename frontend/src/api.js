import axios from 'axios';

const API_URL = 'http://localhost:9000/mccs';

export const login = (email, password) => 
    axios.post(`${API_URL}/login`, { email, password });

export const verifyLoginOTP = (userId, otp) => 
    axios.post(`${API_URL}/verify-login-otp`, { userId, otp });

export const getUserInfo = (userId) => 
    axios.get(`${API_URL}/user/${userId}`);

export const getTeamMembers = () => 
    axios.get(`${API_URL}/team-members`);

export const addUsers = () => 
    axios.get(`${API_URL}/addUsers`);