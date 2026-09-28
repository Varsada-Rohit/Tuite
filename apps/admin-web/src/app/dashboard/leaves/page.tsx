'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { LeaveRequestWithDetails } from '@tuite/shared-types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'var(--tuite-warning-light)', text: 'var(--tuite-warning-dark)' },
  APPROVED: { bg: 'var(--tuite-success-light)', text: 'var(--tuite-success-dark)' },
  REJECTED: { bg: 'var(--tuite-error-light)', text: 'var(--tuite-error-dark)' },
};

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const data = await api.get<LeaveRequestWithDetails[]>(`/api/v1/leaves${query}`);
      setLeaves(data);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleReview = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    setReviewingId(leaveId);
    setError('');
    setSuccessMessage('');
    try {
      await api.patch(`/api/v1/leaves/${leaveId}/review`, { status });
      setSuccessMessage(`Leave request ${status.toLowerCase()} successfully.`);
      await fetchLeaves();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReviewingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (l: LeaveRequestWithDetails) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--tuite-gray-900)' }}>
            {l.studentName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tuite-gray-400)', marginTop: '2px' }}>
            {l.batchName}
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Leave Period',
      render: (l: LeaveRequestWithDetails) => (
        <div style={{ fontSize: '13px', color: 'var(--tuite-gray-700)' }}>
          {formatDate(l.startDate)} — {formatDate(l.endDate)}
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (l: LeaveRequestWithDetails) => (
        <div
          style={{
            fontSize: '13px',
            color: 'var(--tuite-gray-600)',
            maxWidth: '250px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={l.reason}
        >
          {l.reason}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (l: LeaveRequestWithDetails) => {
        const colors = STATUS_COLORS[l.status] || STATUS_COLORS.PENDING;
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '3px 12px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--tuite-radius-full)',
              backgroundColor: colors.bg,
              color: colors.text,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {l.status}
          </span>
        );
      },
    },
    {
      key: 'submitted',
      header: 'Submitted',
      width: '120px',
      render: (l: LeaveRequestWithDetails) => (
        <div style={{ fontSize: '12px', color: 'var(--tuite-gray-500)' }}>
          {formatDate(l.createdAt)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      render: (l: LeaveRequestWithDetails) => {
        if (l.status !== 'PENDING') {
          return (
            <div style={{ fontSize: '12px', color: 'var(--tuite-gray-400)' }}>
              {l.reviewerName ? `by ${l.reviewerName}` : ''}
            </div>
          );
        }
        const isReviewing = reviewingId === l.id;
        return (
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleReview(l.id, 'APPROVED')}
              disabled={isReviewing}
              isLoading={isReviewing}
              style={{ fontSize: '12px', padding: '4px 12px' }}
            >
              ✓ Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleReview(l.id, 'REJECTED')}
              disabled={isReviewing}
              style={{ fontSize: '12px', padding: '4px 12px' }}
            >
              ✕ Reject
            </Button>
          </div>
        );
      },
    },
  ];

  const filterTabs: { label: string; value: string }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'All', value: '' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-lg)' }}>
      {/* Header */}
      <p style={{ color: 'var(--tuite-gray-500)', fontSize: '14px' }}>
        Review and manage student leave applications.
      </p>

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

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--tuite-error-light)',
            color: 'var(--tuite-error)',
            borderRadius: 'var(--tuite-radius-md)',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--tuite-gray-200)', paddingBottom: '0' }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: statusFilter === tab.value ? 600 : 400,
              color: statusFilter === tab.value ? 'var(--tuite-color-primary)' : 'var(--tuite-gray-500)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: statusFilter === tab.value
                ? '2px solid var(--tuite-color-primary)'
                : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all var(--tuite-transition-fast)',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={leaves}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
        emptyMessage={
          statusFilter === 'PENDING'
            ? 'No pending leave requests. All caught up!'
            : 'No leave requests found for this filter.'
        }
      />
    </div>
  );
}
