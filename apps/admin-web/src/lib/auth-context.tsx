'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { MeResponse, AuthResponse } from '@tuite/shared-types';
import { api } from './api';

interface AuthContextValue {
  user: MeResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (firebaseIdToken: string, tenantSlug: string) => Promise<void>;
  adminLogin: (firebaseIdToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'tuite_access_token';
const REFRESH_KEY = 'tuite_refresh_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  // Restore session from stored token on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      api.setAccessToken(storedToken);
      fetchMe().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const me = await api.get<MeResponse>('/api/v1/users/me');
      setUser(me);
    } catch {
      // Token invalid — clear session
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      api.setAccessToken(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (firebaseIdToken: string, tenantSlug: string) => {
    const response = await api.post<AuthResponse>('/api/v1/auth/verify-phone', {
      firebaseIdToken,
      tenantSlug,
    });

    api.setAccessToken(response.accessToken);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);

    // Fetch the full user profile with feature flags
    await fetchMe();
  }, [fetchMe]);

  const adminLogin = useCallback(async (firebaseIdToken: string) => {
    const response = await api.post<AuthResponse>('/api/v1/auth/admin-login', {
      firebaseIdToken,
    });

    api.setAccessToken(response.accessToken);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);

    await fetchMe();
  }, [fetchMe]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    api.setAccessToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        adminLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
