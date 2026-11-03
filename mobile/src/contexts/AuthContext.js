import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [token, userData] = await AsyncStorage.multiGet(['access_token', 'user']);
      
      if (token[1] && userData[1]) {
        setUser(JSON.parse(userData[1]));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, twoFactorCode = null) => {
    try {
      const payload = { email, password };
      if (twoFactorCode) {
        payload.twoFactorCode = twoFactorCode;
      }

      const { data } = await api.post('/auth/login', payload);

      // Check if 2FA is required
      if (data.data.requiresTwoFactor) {
        return { requiresTwoFactor: true };
      }

      // Store tokens and user data
      await AsyncStorage.multiSet([
        ['access_token', data.data.accessToken],
        ['refresh_token', data.data.refreshToken],
        ['user', JSON.stringify(data.data.user)],
      ]);

      setUser(data.data.user);
      setIsAuthenticated(true);

      return { success: true, user: data.data.user };
    } catch (error) {
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await api.post('/auth/register', formData);

      // Store tokens and user data
      await AsyncStorage.multiSet([
        ['access_token', data.data.accessToken],
        ['refresh_token', data.data.refreshToken],
        ['user', JSON.stringify(data.data.user)],
      ]);

      setUser(data.data.user);
      setIsAuthenticated(true);

      return { success: true, user: data.data.user };
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
