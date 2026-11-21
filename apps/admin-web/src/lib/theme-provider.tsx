'use client';

import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { brandColorsCssVars, type BrandColors } from '@tuite/design-tokens';
import type { TenantProfile } from '@tuite/shared-types';
import { api } from './api';
import { useAuth } from './auth-context';

interface ThemeContextValue {
  tenant: TenantProfile | null;
  isLoading: boolean;
  resolveTenant: (slug: string) => Promise<TenantProfile>;
  updateTenantTheme: (profile: TenantProfile) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Cached tenant profile so the theme is available before the first paint. */
export const TENANT_CACHE_KEY = 'tuite_tenant_profile';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function readCachedTenant(): TenantProfile | null {
  try {
    const raw = localStorage.getItem(TENANT_CACHE_KEY);
    return raw ? (JSON.parse(raw) as TenantProfile) : null;
  } catch {
    return null;
  }
}

function writeCachedTenant(profile: TenantProfile | null) {
  try {
    if (profile) localStorage.setItem(TENANT_CACHE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(TENANT_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Injects tenant brand colors as CSS custom properties on the document root.
 * This enables all components using `var(--tuite-color-primary)` etc. to
 * dynamically reflect the tenant's branding.
 */
function applyThemeToDOM(profile: TenantProfile) {
  const brandOverrides: Partial<BrandColors> = {
    primary: profile.primaryColor,
    secondary: profile.secondaryColor,
  };

  const cssVars = brandColorsCssVars(brandOverrides);

  const root = document.documentElement;
  for (const [prop, value] of Object.entries(cssVars)) {
    root.style.setProperty(prop, value);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load the logged-in user's tenant (restores theme/details after reload or admin login)
  const { user, isLoading: authLoading } = useAuth();

  // Restore cached tenant before paint to avoid a default-theme flash
  useIsomorphicLayoutEffect(() => {
    const cached = readCachedTenant();
    if (cached) setTenant(cached);
  }, []);

  // Drop the cache once we know nobody is signed in
  useEffect(() => {
    if (!authLoading && !user) writeCachedTenant(null);
  }, [authLoading, user]);

  const userTenantId = user?.tenantId ?? null;
  useEffect(() => {
    if (!userTenantId) return;
    let cancelled = false;
    setIsLoading(true);
    api
      .get<TenantProfile>('/api/v1/tenants/profile')
      .then((profile) => {
        if (!cancelled) {
          setTenant(profile);
          writeCachedTenant(profile);
        }
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userTenantId]);

  // Apply theme whenever tenant changes
  useIsomorphicLayoutEffect(() => {
    if (tenant) {
      applyThemeToDOM(tenant);
    }
  }, [tenant]);

  const resolveTenant = useCallback(async (slug: string): Promise<TenantProfile> => {
    setIsLoading(true);
    try {
      const profile = await api.get<TenantProfile>(`/api/v1/tenants/resolve?slug=${encodeURIComponent(slug)}`);
      setTenant(profile);
      return profile;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTenantTheme = useCallback((profile: TenantProfile) => {
    setTenant(profile);
    writeCachedTenant(profile);
  }, []);

  return (
    <ThemeContext.Provider value={{ tenant, isLoading, resolveTenant, updateTenantTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
