'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SystemAdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(getFirebaseAuth(), 'recaptcha-container', {
        size: 'invisible',
      });
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return setError('Please enter a phone number');

    setIsLoading(true);
    setError('');

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(getFirebaseAuth(), phone, appVerifier);
      setConfirmationResult(confirmation);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Ensure phone format is +919876543210');
      window.recaptchaVerifier?.render().then((widgetId) => {
        (window as any).grecaptcha.reset(widgetId);
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken(true);

      // Call our backend admin-login endpoint
      await adminLogin(idToken);
      
      // Navigate to system admin dashboard
      router.push('/system-admin');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP or not a Super Admin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--tuite-gray-50)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: 'var(--tuite-space-xl)', backgroundColor: 'var(--tuite-white)', borderRadius: 'var(--tuite-radius-xl)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--tuite-space-xl)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--tuite-gray-900)' }}>System Admin</h1>
          <p style={{ color: 'var(--tuite-gray-500)', fontSize: '14px', marginTop: '4px' }}>Restricted access</p>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'var(--tuite-error-light)', color: 'var(--tuite-error)', borderRadius: 'var(--tuite-radius-md)', fontSize: '13px', marginBottom: 'var(--tuite-space-lg)' }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)' }}>
            <Input
              label="Phone Number"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              id="admin-phone"
            />
            <Button type="submit" isLoading={isLoading}>
              Send Security Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tuite-space-md)' }}>
            <Input
              label="Security Code (OTP)"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={isLoading}
              id="admin-otp"
            />
            <Button type="submit" isLoading={isLoading}>
              Verify & Login
            </Button>
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--tuite-color-primary)', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}
            >
              ← Back to phone
            </button>
          </form>
        )}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
