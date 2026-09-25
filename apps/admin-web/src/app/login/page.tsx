'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-provider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { tenant, resolveTenant } = useTheme();

  const [step, setStep] = useState<'slug' | 'phone' | 'otp'>('slug');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleResolveSlug = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resolveTenant(slug);
      setStep('phone');
    } catch {
      setError('Institute not found. Please check the slug and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();

      // Initialize reCAPTCHA
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current!, {
          size: 'invisible',
        });
      }

      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err) {
      setError(`Failed to send OTP: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!confirmationResult) throw new Error('No confirmation result');

      const credential = await confirmationResult.confirm(otp);
      const idToken = await credential.user.getIdToken();

      await login(idToken, slug);
      router.replace('/dashboard');
    } catch {
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, var(--tuite-color-primary-dark) 0%, var(--tuite-color-primary) 50%, var(--tuite-color-secondary) 100%)`,
        padding: 'var(--tuite-space-md)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--tuite-white)',
          borderRadius: 'var(--tuite-radius-xl)',
          boxShadow: 'var(--tuite-shadow-xl)',
          padding: 'var(--tuite-space-2xl)',
          animation: 'fadeIn 0.5s ease',
        }}
      >
        {/* Logo / Branding */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--tuite-space-xl)' }}>
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={`${tenant.name} logo`}
              style={{ maxHeight: '64px', marginBottom: 'var(--tuite-space-md)' }}
            />
          ) : (
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                fontFamily: 'var(--tuite-font-display)',
                color: 'var(--tuite-color-primary)',
                marginBottom: 'var(--tuite-space-sm)',
              }}
            >
              {tenant?.name || 'Tuite'}
            </div>
          )}
          <p style={{ color: 'var(--tuite-gray-500)', fontSize: '14px' }}>
            {step === 'slug' && 'Enter your institute code to get started'}
            {step === 'phone' && `Sign in to ${tenant?.name}`}
            {step === 'otp' && 'Enter the verification code sent to your phone'}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--tuite-error-light)',
              color: 'var(--tuite-error)',
              borderRadius: 'var(--tuite-radius-md)',
              fontSize: '13px',
              marginBottom: 'var(--tuite-space-md)',
            }}
          >
            {error}
          </div>
        )}

        {/* Step 1: Slug Resolution */}
        {step === 'slug' && (
          <form onSubmit={handleResolveSlug} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)' }}>
            <Input
              label="Institute Code"
              placeholder="e.g. my-academy"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              id="login-slug"
            />
            <Button type="submit" isLoading={isLoading} fullWidth>
              Continue
            </Button>
          </form>
        )}

        {/* Step 2: Phone Number */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)' }}>
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              required
              id="login-phone"
            />
            <Button type="submit" isLoading={isLoading} fullWidth>
              Send OTP
            </Button>
            <button
              type="button"
              onClick={() => setStep('slug')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--tuite-gray-500)',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              ← Change institute
            </button>
          </form>
        )}

        {/* Step 3: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)' }}>
            <Input
              label="Verification Code"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
              id="login-otp"
            />
            <Button type="submit" isLoading={isLoading} fullWidth>
              Verify & Sign In
            </Button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--tuite-gray-500)',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              ← Resend code
            </button>
          </form>
        )}

        {/* reCAPTCHA container (invisible) */}
        <div ref={recaptchaContainerRef} id="recaptcha-container" />
      </div>
    </div>
  );
}
