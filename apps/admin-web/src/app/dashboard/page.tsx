'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-lg)' }}>
      {/* Welcome Card */}
      <div
        style={{
          padding: 'var(--tuite-space-xl)',
          background: 'linear-gradient(135deg, var(--tuite-color-primary) 0%, var(--tuite-color-primary-dark) 100%)',
          borderRadius: 'var(--tuite-radius-xl)',
          color: 'var(--tuite-white)',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 700,
            fontFamily: 'var(--tuite-font-display)',
            marginBottom: '8px',
          }}
        >
          Welcome back, {user?.fullName || 'Admin'}! 👋
        </h2>
        <p style={{ fontSize: '14px', opacity: 0.85 }}>
          Manage your institute, batches, and staff from this dashboard.
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--tuite-space-md)' }}>
        {[
          { label: 'Active Batches', value: '—', icon: '📚' },
          { label: 'Teachers', value: '—', icon: '👩‍🏫' },
          { label: 'Students', value: '—', icon: '🎓' },
          { label: 'Active Features', value: user?.features.length ?? '—', icon: '⚡' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: 'var(--tuite-space-lg)',
              backgroundColor: 'var(--tuite-white)',
              borderRadius: 'var(--tuite-radius-lg)',
              border: '1px solid var(--tuite-gray-200)',
              boxShadow: 'var(--tuite-shadow-sm)',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                fontFamily: 'var(--tuite-font-display)',
                color: 'var(--tuite-gray-900)',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--tuite-gray-500)', marginTop: '4px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
