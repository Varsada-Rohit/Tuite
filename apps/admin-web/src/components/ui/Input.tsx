'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, style, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label && (
          <label
            htmlFor={inputId}
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
        <input
          ref={ref}
          id={inputId}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '14px',
            fontFamily: 'var(--tuite-font-sans)',
            border: `1.5px solid ${error ? 'var(--tuite-error)' : 'var(--tuite-gray-300)'}`,
            borderRadius: 'var(--tuite-radius-md)',
            outline: 'none',
            transition: 'border-color var(--tuite-transition-fast), box-shadow var(--tuite-transition-fast)',
            backgroundColor: 'var(--tuite-white)',
            color: 'var(--tuite-gray-900)',
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--tuite-color-primary)';
            e.target.style.boxShadow = '0 0 0 3px var(--tuite-color-primary-light)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--tuite-error)' : 'var(--tuite-gray-300)';
            e.target.style.boxShadow = 'none';
            props.onBlur?.(e);
          }}
          {...props}
        />
        {(error || helperText) && (
          <span
            style={{
              fontSize: '12px',
              color: error ? 'var(--tuite-error)' : 'var(--tuite-gray-500)',
            }}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
