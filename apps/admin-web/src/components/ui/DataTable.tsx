'use client';

import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data found',
  isLoading = false,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div style={{ padding: 'var(--tuite-space-2xl)', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            width: '32px',
            height: '32px',
            border: '3px solid var(--tuite-gray-200)',
            borderTopColor: 'var(--tuite-color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ marginTop: 'var(--tuite-space-md)', color: 'var(--tuite-gray-500)', fontSize: '14px' }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid var(--tuite-gray-200)',
        borderRadius: 'var(--tuite-radius-lg)',
        backgroundColor: 'var(--tuite-white)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          fontFamily: 'var(--tuite-font-sans)',
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: '12px',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                  color: 'var(--tuite-gray-500)',
                  backgroundColor: 'var(--tuite-gray-50)',
                  borderBottom: '1px solid var(--tuite-gray-200)',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: 'var(--tuite-space-2xl)',
                  textAlign: 'center',
                  color: 'var(--tuite-gray-400)',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                style={{ borderBottom: '1px solid var(--tuite-gray-100)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--tuite-gray-50)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '12px 16px',
                      color: 'var(--tuite-gray-700)',
                    }}
                  >
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
