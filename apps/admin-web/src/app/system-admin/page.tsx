'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
}

export default function SystemAdminDashboard() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Tenant Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', slug: '', contactEmail: '', contactPhone: '' });
  const [isCreating, setIsCreating] = useState(false);
  
  // Seed Owner Modal
  const [isSeedOpen, setIsSeedOpen] = useState(false);
  const [seedTenantId, setSeedTenantId] = useState<string | null>(null);
  const [seedForm, setSeedForm] = useState({ phone: '', fullName: '' });
  const [isSeeding, setIsSeeding] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<TenantRow[]>('/api/v1/admin/tenants');
      setTenants(data);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to fetch tenants. Ensure GET /api/v1/admin/tenants exists.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);
    try {
      await api.post('/api/v1/admin/tenants', createForm);
      setMessage({ type: 'success', text: `Tenant "${createForm.name}" created successfully!` });
      setIsCreateOpen(false);
      setCreateForm({ name: '', slug: '', contactEmail: '', contactPhone: '' });
      fetchTenants();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSeedOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedTenantId) return;
    setIsSeeding(true);
    setMessage(null);
    try {
      await api.post(`/api/v1/admin/tenants/${seedTenantId}/owner`, seedForm);
      setMessage({ type: 'success', text: `Owner seeded successfully!` });
      setIsSeedOpen(false);
      setSeedTenantId(null);
      setSeedForm({ phone: '', fullName: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const toggleTenantStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this tenant?`)) return;
    try {
      await api.patch(`/api/v1/admin/tenants/${id}/status`, { isActive: !currentStatus });
      fetchTenants();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns = [
    { key: 'name', header: 'Institute', render: (t: TenantRow) => (
      <div>
        <div style={{ fontWeight: 500, color: 'var(--tuite-gray-900)' }}>{t.name}</div>
        <div style={{ fontSize: '12px', color: 'var(--tuite-gray-500)' }}>{t.slug}</div>
      </div>
    )},
    { key: 'contact', header: 'Contact', render: (t: TenantRow) => (
      <div style={{ fontSize: '13px' }}>
        <div>{t.contactEmail || '—'}</div>
        <div style={{ color: 'var(--tuite-gray-500)' }}>{t.contactPhone || '—'}</div>
      </div>
    )},
    { key: 'isActive', header: 'Status', render: (t: TenantRow) => (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 500,
        color: t.isActive ? 'var(--tuite-success)' : 'var(--tuite-error)',
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: t.isActive ? 'var(--tuite-success)' : 'var(--tuite-error)' }} />
        {t.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', header: '', render: (t: TenantRow) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => { setSeedTenantId(t.id); setIsSeedOpen(true); }}
          style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: 'var(--tuite-gray-100)', border: 'none', borderRadius: 'var(--tuite-radius-sm)', cursor: 'pointer' }}
        >
          Seed Owner
        </button>
        <button
          onClick={() => toggleTenantStatus(t.id, t.isActive)}
          style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: 'transparent', border: `1px solid ${t.isActive ? 'var(--tuite-error)' : 'var(--tuite-success)'}`, color: t.isActive ? 'var(--tuite-error)' : 'var(--tuite-success)', borderRadius: 'var(--tuite-radius-sm)', cursor: 'pointer' }}
        >
          {t.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-lg)', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--tuite-gray-900)' }}>Institutes</h1>
          <p style={{ color: 'var(--tuite-gray-500)', fontSize: '14px' }}>Manage white-labeled tenant instances.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>+ New Institute</Button>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--tuite-radius-md)', fontSize: '13px', backgroundColor: message.type === 'success' ? 'var(--tuite-success-light)' : 'var(--tuite-error-light)', color: message.type === 'success' ? 'var(--tuite-success)' : 'var(--tuite-error)' }}>
          {message.text}
        </div>
      )}

      <DataTable
        columns={columns}
        data={tenants}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        emptyMessage="No institutes found."
      />

      {/* Create Tenant Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Institute">
        <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)' }}>
          <Input label="Name" placeholder="e.g. Apollo Academy" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required id="t-name" />
          <Input label="Slug" placeholder="e.g. apollo-academy" value={createForm.slug} onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })} required id="t-slug" />
          <Input label="Contact Email" type="email" placeholder="admin@apollo.com" value={createForm.contactEmail} onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })} id="t-email" />
          <Input label="Contact Phone" type="tel" placeholder="+919876543210" value={createForm.contactPhone} onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })} id="t-phone" />
          <div style={{ display: 'flex', gap: 'var(--tuite-space-sm)', justifyContent: 'flex-end', marginTop: 'var(--tuite-space-sm)' }}>
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCreating}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Seed Owner Modal */}
      <Modal isOpen={isSeedOpen} onClose={() => setIsSeedOpen(false)} title="Seed Institute Owner">
        <form onSubmit={handleSeedOwner} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)' }}>
          <p style={{ fontSize: '13px', color: 'var(--tuite-gray-600)' }}>Create the primary owner account for this institute. They can then log into their dashboard to customize their profile and invite staff.</p>
          <Input label="Owner Phone Number" type="tel" placeholder="+919876543210" value={seedForm.phone} onChange={(e) => setSeedForm({ ...seedForm, phone: e.target.value })} required id="o-phone" />
          <Input label="Owner Full Name (optional)" placeholder="John Doe" value={seedForm.fullName} onChange={(e) => setSeedForm({ ...seedForm, fullName: e.target.value })} id="o-name" />
          <div style={{ display: 'flex', gap: 'var(--tuite-space-sm)', justifyContent: 'flex-end', marginTop: 'var(--tuite-space-sm)' }}>
            <Button type="button" variant="ghost" onClick={() => setIsSeedOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSeeding}>Seed Owner</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
