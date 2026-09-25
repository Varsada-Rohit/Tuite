'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  error?: string;
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  error,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
      {label && (
        <label
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--tuite-gray-700)',
            fontFamily: 'var(--tuite-font-sans)',
          }}
        >
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: '14px',
          fontFamily: 'var(--tuite-font-sans)',
          border: `1.5px solid ${error ? 'var(--tuite-error)' : isOpen ? 'var(--tuite-color-primary)' : 'var(--tuite-gray-300)'}`,
          borderRadius: 'var(--tuite-radius-md)',
          backgroundColor: 'var(--tuite-white)',
          color: selectedLabels.length > 0 ? 'var(--tuite-gray-900)' : 'var(--tuite-gray-400)',
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'border-color var(--tuite-transition-fast)',
          boxShadow: isOpen ? '0 0 0 3px var(--tuite-color-primary-light)' : 'none',
        }}
      >
        {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: 'var(--tuite-white)',
            border: '1px solid var(--tuite-gray-200)',
            borderRadius: 'var(--tuite-radius-md)',
            boxShadow: 'var(--tuite-shadow-lg)',
            zIndex: 50,
            animation: 'fadeIn var(--tuite-transition-fast)',
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '12px 16px', color: 'var(--tuite-gray-400)', fontSize: '14px' }}>
              No options available
            </div>
          ) : (
            options.map((option) => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color var(--tuite-transition-fast)',
                  backgroundColor: selected.includes(option.value)
                    ? 'var(--tuite-color-primary-light)'
                    : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!selected.includes(option.value)) {
                    e.currentTarget.style.backgroundColor = 'var(--tuite-gray-50)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = selected.includes(option.value)
                    ? 'var(--tuite-color-primary-light)'
                    : 'transparent';
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  style={{
                    accentColor: 'var(--tuite-color-primary)',
                    width: '16px',
                    height: '16px',
                  }}
                />
                <span style={{ color: 'var(--tuite-gray-700)' }}>{option.label}</span>
              </label>
            ))
          )}
        </div>
      )}

      {error && (
        <span style={{ fontSize: '12px', color: 'var(--tuite-error)' }}>{error}</span>
      )}
    </div>
  );
}
