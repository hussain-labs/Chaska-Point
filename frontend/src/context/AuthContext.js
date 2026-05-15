import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on app start
  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedUser = await SecureStore.getItemAsync('userData');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.log('Failed to load stored session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const storeSession = async (userData, authToken) => {
    await SecureStore.setItemAsync('authToken', authToken);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    setUser(userData);
    setToken(authToken);
  };

  const clearSession = async () => {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userData');
    setUser(null);
    setToken(null);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user: userData, token: authToken } = response.data.data;
        await storeSession(userData, authToken);
        return { success: true };
      }
    } catch (err) {
      const message = err.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password, fullName) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await api.post('/auth/register', { username, email, password, fullName });

      if (response.data.success) {
        const { user: userData, token: authToken } = response.data.data;
        await storeSession(userData, authToken);
        return { success: true };
      }
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await clearSession();
  };

  const value = {
    user,
    token,
    isLoading,
    error,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
