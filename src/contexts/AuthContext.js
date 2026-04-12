'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
    } catch {
      // Access token expired or missing, try refresh
      try {
        await authAPI.refresh();
        const userData = await authAPI.getMe();
        setUser(userData);
      } catch {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Auto-refresh token every 13 minutes
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        await authAPI.refresh();
      } catch {
        setUser(null);
      }
    }, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout errors
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
