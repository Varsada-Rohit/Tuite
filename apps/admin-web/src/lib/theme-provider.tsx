'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { brandColorsCssVars, type BrandColors } from '@tuite/design-tokens';
import type { TenantProfile } from '@tuite/shared-types';
import { api } from './api';

interface ThemeContextValue {
  tenant: TenantProfile | null;
  isLoading: boolean;
  resolveTenant: (slug: string) => Promise<TenantProfile>;
  updateTenantTheme: (profile: TenantProfile) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

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

  // Apply theme whenever tenant changes
  useEffect(() => {
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
