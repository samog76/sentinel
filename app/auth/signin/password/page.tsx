'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type User } from '@/contexts/AuthContext';
import { OnboardingLayout } from '@/components/layouts/OnboardingLayout';
import { HugeiconsIcon } from '@hugeicons/react';
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';

const USERS_STORAGE_KEY = 'sentinelUsers';

export default function SignInPasswordPage() {
  const router = useRouter();
  const { setUser, setIsOnboarding } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const pendingEmail = sessionStorage.getItem('pendingEmail') || '';
      const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
      const users = rawUsers ? (JSON.parse(rawUsers) as User[]) : [];
      const account = users.find(
        (candidate) => candidate.email.toLowerCase() === pendingEmail.toLowerCase()
      );

      if (!account || account.password !== password) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      setUser(account);
      setIsOnboarding(false);
      sessionStorage.removeItem('pendingEmail');
      router.push('/home');
      setIsLoading(false);
    }, 500);
  };

  const handleBack = () => {
    router.push('/auth/signin/email');
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={2}
      onBack={handleBack}
      heroImage="/password.png"
      heroImageAlt="Sign in password"
    >
      <div className="flex h-full flex-col justify-end gap-5 lg:justify-center">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
            Sign in
          </p>
          <h1 className="max-w-[11ch] text-[clamp(1.55rem,3.8vw,2.45rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-white text-balance">
            And your password?
          </h1>
          <p className="max-w-md text-xs leading-5 text-white/60 sm:text-sm sm:leading-6 lg:text-base">
            Enter your account password to continue.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="••••••••"
              className="w-full border-0 border-b border-white/16 bg-transparent px-0 py-3 pr-10 text-base text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-0"
              autoFocus
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-white/45 transition-smooth hover:text-white"
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <HugeiconsIcon icon={ViewOffIcon} size={20} color="currentColor" />
              ) : (
                <HugeiconsIcon icon={ViewIcon} size={20} color="currentColor" />
              )}
            </button>
          </div>
          {error && <p className="text-sm text-[#FF7A7A]">{error}</p>}
        </div>

        <div className="pt-2 sm:pt-4">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-52"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
