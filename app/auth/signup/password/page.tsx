'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type User, type ClinicalRole } from '@/contexts/AuthContext';
import { OnboardingLayout } from '@/components/layouts/OnboardingLayout';
import { HugeiconsIcon } from '@hugeicons/react';
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';

const USERS_STORAGE_KEY = 'sentinelUsers';

export default function SignupPasswordPage() {
  const router = useRouter();
  const { setUser, setIsOnboarding } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const handleCreateAccount = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must be 8+ chars and include a letter and number');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users = rawUsers ? (JSON.parse(rawUsers) as User[]) : [];
    const existingUser = users.find(
      (candidate) => candidate.email.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      setError('An account with this email already exists');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const signupData = JSON.parse(sessionStorage.getItem('signupData') || '{}');
      const nextUser: User = {
        id: crypto.randomUUID(),
        email: email.trim(),
        name: signupData.name,
        staffId: signupData.staffId,
        department: signupData.department,
        hospital: signupData.hospital,
        clinicalRole: signupData.clinicalRole as ClinicalRole | undefined,
        password,
      };

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, nextUser]));
      setUser(nextUser);
      setIsOnboarding(true);
      sessionStorage.removeItem('signupData');
      router.push('/baseline/intro');
      setIsLoading(false);
    }, 500);
  };

  const handleBack = () => {
    router.push('/auth/signup/role');
  };

  return (
    <OnboardingLayout
      currentStep={6}
      totalSteps={6}
      onBack={handleBack}
      heroImage="/password.png"
      heroImageAlt="Signup credentials"
    >
      <div className="flex h-full flex-col justify-end gap-4 lg:justify-center">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
            Sign up
          </p>
          <h1 className="max-w-[12ch] text-[clamp(1.5rem,3.8vw,2.35rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white text-balance">
            Create your login
          </h1>
          <p className="max-w-md text-xs leading-5 text-white/60 sm:text-sm sm:leading-6 lg:text-base">
            Add your email and a secure password to finish onboarding.
          </p>
        </div>

        <div className="space-y-3">
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
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Create password"
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

        <div className="pt-1 sm:pt-3">
          <button
            onClick={handleCreateAccount}
            disabled={isLoading}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-52"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
