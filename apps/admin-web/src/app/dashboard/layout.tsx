'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-provider';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import type { FeatureName } from '@tuite/shared-types';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Institute', href: '/dashboard/institute', icon: '🏫' },
  { label: 'Batches', href: '/dashboard/batches', icon: '📚' },
  { label: 'Staff', href: '/dashboard/staff', icon: '👩‍🏫' },
  { label: 'Notes', href: '/dashboard/notes', icon: '📝', feature: 'NOTES' as FeatureName },
  { label: 'Videos', href: '/dashboard/videos', icon: '🎥', feature: 'VIDEO_LECTURES' as FeatureName },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { tenant } = useTheme();
  const { hasFeature } = useFeatureFlags();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--tuite-gray-200)',
            borderTopColor: 'var(--tuite-color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.feature || hasFeature(item.feature),
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--tuite-gray-900)',
          color: 'var(--tuite-white)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: 'var(--tuite-space-lg)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              style={{ maxHeight: '36px', marginBottom: '8px' }}
            />
          ) : (
            <div
              style={{
                fontFamily: 'var(--tuite-font-display)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--tuite-color-primary-light)',
              }}
            >
              {tenant?.name || 'Tuite'}
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--tuite-gray-400)', marginTop: '4px' }}>
            Admin Dashboard
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: 'var(--tuite-space-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--tuite-radius-md)',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--tuite-white)' : 'var(--tuite-gray-400)',
                  backgroundColor: isActive ? 'var(--tuite-color-primary)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all var(--tuite-transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'var(--tuite-white)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--tuite-gray-400)';
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User Footer */}
        <div
          style={{
            padding: 'var(--tuite-space-md) var(--tuite-space-lg)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--tuite-gray-300)', marginBottom: '4px' }}>
            {user?.fullName || 'User'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--tuite-gray-500)', marginBottom: '12px' }}>
            {user?.role}
          </div>
          <button
            onClick={() => { logout(); router.replace('/login'); }}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--tuite-gray-400)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--tuite-radius-md)',
              cursor: 'pointer',
              transition: 'all var(--tuite-transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'var(--tuite-white)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'var(--tuite-gray-400)';
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Top Bar */}
        <header
          style={{
            padding: 'var(--tuite-space-md) var(--tuite-space-xl)',
            backgroundColor: 'var(--tuite-white)',
            borderBottom: '1px solid var(--tuite-gray-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--tuite-font-display)',
              color: 'var(--tuite-gray-900)',
              margin: 0,
            }}
          >
            {visibleNavItems.find((i) => i.href === pathname)?.label || 'Dashboard'}
          </h1>
        </header>

        {/* Page Content */}
        <div
          style={{
            padding: 'var(--tuite-space-xl)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
