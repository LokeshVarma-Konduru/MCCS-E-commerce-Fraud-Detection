import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { getUserInfo, logout as apiLogout } from '../api';

const AuthContext = createContext(null);

const readSession = () => ({
  token: localStorage.getItem('token'),
  userId: localStorage.getItem('userId')
});

const clearSessionStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const clearSession = useCallback(() => {
    clearSessionStorage();
    setUser(null);
  }, []);

  const fetchUser = useCallback(async () => {
    const { token, userId } = readSession();
    if (!token || !userId) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await getUserInfo(userId);
      const fetchedUser = response?.data?.user || null;
      setUser(fetchedUser);
      return fetchedUser;
    } catch (error) {
      console.error('Failed to load user session:', error);
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refreshUser = useCallback(async () => {
    const { token, userId } = readSession();
    if (!token || !userId) {
      clearSession();
      return null;
    }

    setRefreshing(true);
    try {
      const response = await getUserInfo(userId);
      const fetchedUser = response?.data?.user || null;
      setUser(fetchedUser);
      return fetchedUser;
    } catch (error) {
      console.error('Failed to refresh user session:', error);
      clearSession();
      throw error;
    } finally {
      setRefreshing(false);
    }
  }, [clearSession]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Error while logging out:', error);
    } finally {
      clearSession();
      setLoading(false);
    }
  }, [clearSession]);

  const value = useMemo(() => ({
    user,
    loading,
    refreshing,
    isAuthenticated: Boolean(user),
    refreshUser,
    logout,
    clearSession
  }), [user, loading, refreshing, refreshUser, logout, clearSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

