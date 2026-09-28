'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { StudentProfile, CreateStudentRequest, Gender } from '@tuite/shared-types';
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

const INITIAL_FORM: CreateStudentRequest = {
  fullName: '',
  phone: '',
  email: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  address: '',
  batchIds: [],
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateStudentRequest>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await api.get<StudentProfile[]>(`/api/v1/students${query}`);
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  const fetchBatches = useCallback(async () => {
    try {
      const data = await api.get<BatchOption[]>('/api/v1/batches');
      setBatches(data.filter((b: any) => b.isActive));
    } catch (err) {
      console.error('Failed to fetch batches', err);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchStudents(), 300);
    return () => clearTimeout(debounce);
  }, [fetchStudents]);

  const openEnrollModal = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setError('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (student: StudentProfile) => {
    setEditingId(student.id);
    setForm({
      fullName: student.fullName,
      phone: student.phone || '',
      email: student.email || '',
      gender: (student.gender as Gender) || undefined,
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      address: student.address || '',
      batchIds: student.batches.map((b) => b.id),
    });
    setError('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (editingId) {
        await api.patch<StudentProfile>(`/api/v1/students/${editingId}`, {
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          gender: form.gender,
          parentName: form.parentName,
          parentPhone: form.parentPhone,
          parentEmail: form.parentEmail,
          address: form.address,
        });
        setSuccessMessage(`Student "${form.fullName}" updated successfully.`);
      } else {
        await api.post<StudentProfile>('/api/v1/students', form);
        setSuccessMessage(`Student "${form.fullName}" enrolled successfully.`);
      }
      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      await fetchStudents();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (student: StudentProfile) => {
    if (!confirm(`Deactivate ${student.fullName}? This can be reversed later.`)) return;
    try {
      await api.delete(`/api/v1/students/${student.id}`);
      setSuccessMessage(`${student.fullName} has been deactivated.`);
      await fetchStudents();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (s: StudentProfile) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--tuite-gray-900)' }}>
            {s.fullName}
          </div>
          {s.phone && (
            <div style={{ fontSize: '12px', color: 'var(--tuite-gray-400)', marginTop: '2px' }}>
              {s.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'parent',
      header: 'Parent / Guardian',
      render: (s: StudentProfile) => (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--tuite-gray-700)' }}>
            {s.parentName || '—'}
          </div>
          {s.parentPhone && (
            <div style={{ fontSize: '12px', color: 'var(--tuite-gray-400)', marginTop: '2px' }}>
              {s.parentPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'batches',
      header: 'Batches',
      render: (s: StudentProfile) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {s.batches.length === 0 ? (
            <span style={{ color: 'var(--tuite-gray-400)', fontSize: '13px' }}>No batches</span>
          ) : (
            s.batches.map((b) => (
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
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (s: StudentProfile) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 500,
            color: s.isActive ? 'var(--tuite-success)' : 'var(--tuite-gray-400)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: s.isActive ? 'var(--tuite-success)' : 'var(--tuite-gray-400)',
            }}
          />
          {s.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (s: StudentProfile) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button size="sm" variant="ghost" onClick={() => openEditModal(s)}>
            Edit
          </Button>
          {s.isActive && (
            <Button size="sm" variant="ghost" onClick={() => handleDelete(s)}
              style={{ color: 'var(--tuite-error)' }}
            >
              Remove
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--tuite-space-md)' }}>
        <p style={{ color: 'var(--tuite-gray-500)', fontSize: '14px' }}>
          Manage student enrollment, profiles, and batch assignments.
        </p>
        <Button onClick={openEnrollModal}>+ Enroll Student</Button>
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

      {/* Search */}
      <div style={{ maxWidth: '360px' }}>
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="student-search"
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        emptyMessage="No students yet. Enroll your first student to get started."
      />

      {/* Enroll / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Student' : 'Enroll New Student'}
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)' }}>
          {error && (
            <div style={{ padding: '10px', backgroundColor: 'var(--tuite-error-light)', color: 'var(--tuite-error)', borderRadius: 'var(--tuite-radius-md)', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tuite-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Student Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--tuite-space-md)' }}>
            <Input
              label="Full Name"
              placeholder="Aarav Sharma"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              required
              id="student-name"
            />
            <Input
              label="Phone (optional)"
              placeholder="+91 98765 43210"
              value={form.phone || ''}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              id="student-phone"
            />
          </div>

          <Input
            label="Email (optional)"
            placeholder="student@example.com"
            value={form.email || ''}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            type="email"
            id="student-email"
          />

          <Input
            label="Address (optional)"
            placeholder="123 Main St, City"
            value={form.address || ''}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            id="student-address"
          />

          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tuite-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 'var(--tuite-space-sm)' }}>
            Parent / Guardian
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--tuite-space-md)' }}>
            <Input
              label="Parent Name"
              placeholder="Rajesh Sharma"
              value={form.parentName || ''}
              onChange={(e) => setForm((p) => ({ ...p, parentName: e.target.value }))}
              id="parent-name"
            />
            <Input
              label="Parent Phone"
              placeholder="+91 98765 43211"
              value={form.parentPhone || ''}
              onChange={(e) => setForm((p) => ({ ...p, parentPhone: e.target.value }))}
              id="parent-phone"
            />
          </div>

          <Input
            label="Parent Email (optional)"
            placeholder="parent@example.com"
            value={form.parentEmail || ''}
            onChange={(e) => setForm((p) => ({ ...p, parentEmail: e.target.value }))}
            type="email"
            id="parent-email"
          />

          {!editingId && (
            <MultiSelect
              label="Assign to Batches"
              options={batches.map((b) => ({ value: b.id, label: b.name }))}
              selected={form.batchIds || []}
              onChange={(ids) => setForm((p) => ({ ...p, batchIds: ids }))}
              placeholder="Select batches..."
            />
          )}

          <div style={{ display: 'flex', gap: 'var(--tuite-space-sm)', justifyContent: 'flex-end', marginTop: 'var(--tuite-space-sm)' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingId ? 'Save Changes' : 'Enroll Student'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
