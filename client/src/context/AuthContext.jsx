import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, loginCustomer, logoutCustomer } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check authentication status on app start by calling /customers/me
  const checkAuth = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setUser(data);
      setAuthError(null);
    } catch (err) {
      setUser(null);
      // 401 means unauthenticated, which is expected when not logged in
      if (err.response?.status !== 401) {
        setAuthError(err.response?.data?.message || 'Authentication check failed');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Login action
  const login = async (credentials) => {
    setAuthError(null);
    try {
      const res = await loginCustomer(credentials);
      if (res.success) {
        // Re-fetch profile to set user state after cookie is placed
        await checkAuth();
        return { success: true };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setAuthError(message);
      return { success: false, message };
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await logoutCustomer();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
