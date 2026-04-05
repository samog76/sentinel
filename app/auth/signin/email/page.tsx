'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/layouts/OnboardingLayout';
import type { User } from '@/contexts/AuthContext';

const USERS_STORAGE_KEY = 'sentinelUsers';

export default function SignInEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const handleContinue = () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email');
      return;
    }

    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users = rawUsers ? (JSON.parse(rawUsers) as User[]) : [];
    const exists = users.some((candidate) => candidate.email.toLowerCase() === normalizedEmail);
    if (!exists) {
      setError('No account found with this email');
      return;
    }

    // Store email temporarily
    sessionStorage.setItem('pendingEmail', normalizedEmail);
    router.push('/auth/signin/password');
  };

  const handleBack = () => {
    router.push('/splash');
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={2}
      onBack={handleBack}
      heroImage="/email.png"
      heroImageAlt="Sign in email"
    >
      <div className="flex h-full flex-col justify-end gap-5 lg:justify-center">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
            Sign in
          </p>
          <h1 className="max-w-[11ch] text-[clamp(1.55rem,3.8vw,2.45rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-white text-balance">
            What&apos;s your email?
          </h1>
          <p className="max-w-md text-xs leading-5 text-white/60 sm:text-sm sm:leading-6 lg:text-base">
            Use the email tied to your Sentinel account.
          </p>
        </div>

        <div className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="you@example.com"
            className="w-full border-0 border-b border-white/16 bg-transparent px-0 py-3 text-base text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-0"
            autoFocus
          />
          {error && (
            <p className="text-sm text-[#FF7A7A]">{error}</p>
          )}
        </div>

        <div className="pt-2 sm:pt-4">
          <button
            onClick={handleContinue}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-95 sm:w-auto sm:min-w-52"
          >
            Continue
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
