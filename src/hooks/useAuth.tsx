import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  needsInitialSetup: boolean;
  designatedEmail: string;
  refreshAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  setupInitialAdmin: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [designatedEmail, setDesignatedEmail] = useState('shaheed@gmail.com');

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    try {
      const setupRes = await api.get('/auth/setup-status');
      setNeedsInitialSetup(Boolean(setupRes.data?.needsInitialSetup));
      if (setupRes.data?.designatedEmail) {
        setDesignatedEmail(setupRes.data.designatedEmail);
      }

      const token = getStoredToken();
      if (!token) {
        try {
          const meRes = await api.get('/auth/me');
          setUser(meRes.data?.user || null);
        } catch {
          setUser(null);
        }
      } else {
        try {
          const meRes = await api.get('/auth/me');
          setUser(meRes.data?.user || null);
        } catch {
          setStoredToken(null);
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: loggedInUser } = res.data;
    setStoredToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const setupInitialAdmin = async (name: string, email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/setup-initial-admin', { name, email, password });
    const { token, user: createdUser } = res.data;
    setStoredToken(token);
    setUser(createdUser);
    setNeedsInitialSetup(false);
    return createdUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed with local cleanup even if network call fails
    }
    setStoredToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsInitialSetup,
        designatedEmail,
        refreshAuth,
        login,
        setupInitialAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
