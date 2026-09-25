'use client';

import React, { useState, useEffect } from 'react';
import type { TenantProfile, UpdateTenantProfileRequest } from '@tuite/shared-types';
import { useTheme } from '@/lib/theme-provider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function InstitutePage() {
  const { tenant, updateTenantTheme } = useTheme();
  const [form, setForm] = useState<UpdateTenantProfileRequest>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (tenant) {
      setForm({
        contactEmail: tenant.contactEmail ?? '',
        contactPhone: tenant.contactPhone ?? '',
        address: tenant.address ?? '',
        logoUrl: tenant.logoUrl ?? '',
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
      });
    }
  }, [tenant]);

  const handleChange = (field: keyof UpdateTenantProfileRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const updated = await api.patch<TenantProfile>('/api/v1/tenants/profile', form);
      updateTenantTheme(updated);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      <p style={{ color: 'var(--tuite-gray-500)', fontSize: '14px', marginBottom: 'var(--tuite-space-xl)' }}>
        Update your institute&apos;s contact information and branding. Changes to colors will immediately update the dashboard theme.
      </p>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--tuite-radius-md)',
            fontSize: '13px',
            marginBottom: 'var(--tuite-space-lg)',
            backgroundColor: message.type === 'success' ? 'var(--tuite-success-light)' : 'var(--tuite-error-light)',
            color: message.type === 'success' ? 'var(--tuite-success)' : 'var(--tuite-error)',
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-lg)' }}>
        {/* Contact Info Section */}
        <fieldset
          style={{
            border: '1px solid var(--tuite-gray-200)',
            borderRadius: 'var(--tuite-radius-lg)',
            padding: 'var(--tuite-space-lg)',
            backgroundColor: 'var(--tuite-white)',
          }}
        >
          <legend
            style={{
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--tuite-gray-800)',
              padding: '0 8px',
            }}
          >
            Contact Information
          </legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)', marginTop: 'var(--tuite-space-md)' }}>
            <Input
              label="Contact Email"
              type="email"
              placeholder="contact@myacademy.com"
              value={form.contactEmail || ''}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              id="institute-email"
            />
            <Input
              label="Contact Phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.contactPhone || ''}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              id="institute-phone"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="institute-address"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--tuite-gray-700)',
                }}
              >
                Address
              </label>
              <textarea
                id="institute-address"
                placeholder="123 Main St, Mumbai, Maharashtra 400001"
                value={form.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  fontFamily: 'var(--tuite-font-sans)',
                  border: '1.5px solid var(--tuite-gray-300)',
                  borderRadius: 'var(--tuite-radius-md)',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </fieldset>

        {/* Branding Section */}
        <fieldset
          style={{
            border: '1px solid var(--tuite-gray-200)',
            borderRadius: 'var(--tuite-radius-lg)',
            padding: 'var(--tuite-space-lg)',
            backgroundColor: 'var(--tuite-white)',
          }}
        >
          <legend
            style={{
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--tuite-gray-800)',
              padding: '0 8px',
            }}
          >
            Branding
          </legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)', marginTop: 'var(--tuite-space-md)' }}>
            <Input
              label="Logo URL"
              type="url"
              placeholder="https://cdn.example.com/logo.png"
              value={form.logoUrl || ''}
              onChange={(e) => handleChange('logoUrl', e.target.value)}
              id="institute-logo"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--tuite-space-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="institute-primary-color" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--tuite-gray-700)' }}>
                  Primary Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    id="institute-primary-color"
                    value={form.primaryColor || '#4F46E5'}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: 'var(--tuite-radius-sm)' }}
                  />
                  <Input
                    value={form.primaryColor || ''}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    placeholder="#4F46E5"
                    style={{ flex: 1 }}
                    id="institute-primary-hex"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="institute-secondary-color" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--tuite-gray-700)' }}>
                  Secondary Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    id="institute-secondary-color"
                    value={form.secondaryColor || '#0D9488'}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: 'var(--tuite-radius-sm)' }}
                  />
                  <Input
                    value={form.secondaryColor || ''}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    placeholder="#0D9488"
                    style={{ flex: 1 }}
                    id="institute-secondary-hex"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'var(--tuite-gray-50)',
                borderRadius: 'var(--tuite-radius-md)',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--tuite-gray-500)' }}>Preview:</span>
              <div style={{ width: '32px', height: '32px', borderRadius: 'var(--tuite-radius-sm)', backgroundColor: form.primaryColor || '#4F46E5' }} />
              <div style={{ width: '32px', height: '32px', borderRadius: 'var(--tuite-radius-sm)', backgroundColor: form.secondaryColor || '#0D9488' }} />
            </div>
          </div>
        </fieldset>

        <Button type="submit" isLoading={isSaving} size="lg">
          Save Changes
        </Button>
      </form>
    </div>
  );
}
