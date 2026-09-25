'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CreateBatchRequest } from '@tuite/shared-types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';

interface BatchRow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  teacherCount: number;
  createdAt: string;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateBatchRequest>({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<BatchRow[]>('/api/v1/batches');
      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch batches', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await api.post('/api/v1/batches', form);
      setIsModalOpen(false);
      setForm({ name: '', description: '' });
      await fetchBatches();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deactivate this batch? It can be reactivated later.')) return;

    try {
      await api.delete(`/api/v1/batches/${id}`);
      await fetchBatches();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const columns = [
    { key: 'name', header: 'Batch Name', render: (b: BatchRow) => (
      <span style={{ fontWeight: 500, color: 'var(--tuite-gray-900)' }}>{b.name}</span>
    )},
    { key: 'description', header: 'Description', render: (b: BatchRow) => (
      <span style={{ color: 'var(--tuite-gray-500)' }}>{b.description || '—'}</span>
    )},
    { key: 'teacherCount', header: 'Teachers', width: '100px', render: (b: BatchRow) => (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '28px',
          padding: '2px 10px',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: 'var(--tuite-radius-full)',
          backgroundColor: 'var(--tuite-color-primary-light)',
          color: 'var(--tuite-color-primary)',
        }}
      >
        {b.teacherCount}
      </span>
    )},
    { key: 'isActive', header: 'Status', width: '100px', render: (b: BatchRow) => (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: b.isActive ? 'var(--tuite-success)' : 'var(--tuite-gray-400)',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: b.isActive ? 'var(--tuite-success)' : 'var(--tuite-gray-400)',
          }}
        />
        {b.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', header: '', width: '80px', render: (b: BatchRow) => (
      b.isActive ? (
        <button
          onClick={() => handleDelete(b.id)}
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            color: 'var(--tuite-error)',
            backgroundColor: 'transparent',
            border: '1px solid var(--tuite-error)',
            borderRadius: 'var(--tuite-radius-sm)',
            cursor: 'pointer',
            transition: 'all var(--tuite-transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--tuite-error)';
            e.currentTarget.style.color = 'var(--tuite-white)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--tuite-error)';
          }}
        >
          Deactivate
        </button>
      ) : null
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: 'var(--tuite-gray-500)', fontSize: '14px' }}>
          Manage your classes and batches. Assign teachers from the Staff page.
        </p>
        <Button onClick={() => setIsModalOpen(true)}>
          + New Batch
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={batches}
        keyExtractor={(b) => b.id}
        isLoading={isLoading}
        emptyMessage="No batches yet. Create your first batch to get started."
      />

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Batch">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)' }}>
          {error && (
            <div style={{ padding: '10px', backgroundColor: 'var(--tuite-error-light)', color: 'var(--tuite-error)', borderRadius: 'var(--tuite-radius-md)', fontSize: '13px' }}>
              {error}
            </div>
          )}
          <Input
            label="Batch Name"
            placeholder="e.g. Class 10 Math"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
            id="batch-name"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="batch-description" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--tuite-gray-700)' }}>
              Description (optional)
            </label>
            <textarea
              id="batch-description"
              placeholder="Briefly describe this batch..."
              value={form.description || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
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
          <div style={{ display: 'flex', gap: 'var(--tuite-space-sm)', justifyContent: 'flex-end', marginTop: 'var(--tuite-space-sm)' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Create Batch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
