'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { InviteStaffRequest, TeacherProfile } from '@tuite/shared-types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { MultiSelect } from '@/components/ui/MultiSelect';

interface BatchOption {
  id: string;
  name: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<TeacherProfile[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<InviteStaffRequest>({ phone: '', fullName: '', batchIds: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [staffData, batchData] = await Promise.all([
        api.get<TeacherProfile[]>('/api/v1/staff'),
        api.get<BatchOption[]>('/api/v1/batches'),
      ]);
      setStaff(staffData);
      setBatches(batchData.filter((b: any) => b.isActive));
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await api.post<TeacherProfile>('/api/v1/staff/invite', form);
      setIsModalOpen(false);
      setForm({ phone: '', fullName: '', batchIds: [] });
      setSuccessMessage(`Successfully invited ${result.fullName || result.phone} as a teacher.`);
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (t: TeacherProfile) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--tuite-gray-900)' }}>
            {t.fullName || 'Unnamed'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tuite-gray-400)', marginTop: '2px' }}>
            {t.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'batches',
      header: 'Assigned Batches',
      render: (t: TeacherProfile) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {t.batches.length === 0 ? (
            <span style={{ color: 'var(--tuite-gray-400)', fontSize: '13px' }}>No batches</span>
          ) : (
            t.batches.map((b) => (
              <span
                key={b.id}
                style={{
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 500,
                  borderRadius: 'var(--tuite-radius-full)',
                  backgroundColor: 'var(--tuite-color-secondary-light)',
                  color: 'var(--tuite-color-secondary-dark)',
                }}
              >
                {b.name}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '100px',
      render: (t: TeacherProfile) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 500,
            color: t.isActive ? 'var(--tuite-success)' : 'var(--tuite-gray-400)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: t.isActive ? 'var(--tuite-success)' : 'var(--tuite-gray-400)',
            }}
          />
          {t.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: 'var(--tuite-gray-500)', fontSize: '14px' }}>
          Invite teachers and assign them to batches.
        </p>
        <Button onClick={() => { setIsModalOpen(true); setError(''); setSuccessMessage(''); }}>
          + Invite Teacher
        </Button>
      </div>

      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--tuite-success-light)',
            color: 'var(--tuite-success)',
            borderRadius: 'var(--tuite-radius-md)',
            fontSize: '13px',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={staff}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        emptyMessage="No teachers yet. Invite your first teacher to get started."
      />

      {/* Invite Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Invite Teacher" maxWidth="520px">
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)' }}>
          {error && (
            <div style={{ padding: '10px', backgroundColor: 'var(--tuite-error-light)', color: 'var(--tuite-error)', borderRadius: 'var(--tuite-radius-md)', fontSize: '13px' }}>
              {error}
            </div>
          )}
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            type="tel"
            required
            id="staff-phone"
          />
          <Input
            label="Full Name (optional)"
            placeholder="Priya Sharma"
            value={form.fullName || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            id="staff-name"
          />
          <MultiSelect
            label="Assign to Batches"
            options={batches.map((b) => ({ value: b.id, label: b.name }))}
            selected={form.batchIds}
            onChange={(ids) => setForm((prev) => ({ ...prev, batchIds: ids }))}
            placeholder="Select batches..."
            error={form.batchIds.length === 0 ? 'Select at least one batch' : undefined}
          />
          <div style={{ display: 'flex', gap: 'var(--tuite-space-sm)', justifyContent: 'flex-end', marginTop: 'var(--tuite-space-sm)' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={form.batchIds.length === 0}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
