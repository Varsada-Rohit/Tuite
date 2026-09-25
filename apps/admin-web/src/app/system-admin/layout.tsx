'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/system-admin/login') {
        router.push('/system-admin/login');
      } else if (isAuthenticated) {
        if (user?.role !== 'SUPER_ADMIN') {
          // If a non-super-admin tries to access this route, kick them out
          router.push('/login');
        } else if (pathname === '/system-admin/login') {
          router.push('/system-admin');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--tuite-gray-500)' }}>Loading system admin...</p>
      </div>
    );
  }

  // Prevent rendering children until redirect completes
  if (!isAuthenticated && pathname !== '/system-admin/login') return null;
  if (isAuthenticated && user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tuite-gray-50)' }}>
      {/* Top Navbar for Super Admin */}
      {isAuthenticated && user?.role === 'SUPER_ADMIN' && (
        <header
          style={{
            height: '64px',
            backgroundColor: 'var(--tuite-gray-900)',
            color: 'var(--tuite-white)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--tuite-space-xl)',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '18px', letterSpacing: '-0.02em' }}>
            Tuite <span style={{ color: 'var(--tuite-gray-400)', fontWeight: 400 }}>System Admin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tuite-space-md)' }}>
            <span style={{ fontSize: '14px', color: 'var(--tuite-gray-300)' }}>{user.phone}</span>
            <button
              onClick={() => logout()}
              style={{
                background: 'transparent',
                border: '1px solid var(--tuite-gray-600)',
                color: 'var(--tuite-white)',
                padding: '6px 12px',
                borderRadius: 'var(--tuite-radius-md)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
              id="admin-logout-btn"
            >
              Sign out
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main style={{ padding: pathname === '/system-admin/login' ? '0' : 'var(--tuite-space-xl)' }}>
        {children}
      </main>
    </div>
  );
}
