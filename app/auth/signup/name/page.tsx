'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/layouts/OnboardingLayout';

export default function SignupNamePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    sessionStorage.setItem('signupData', JSON.stringify({
      name: name.trim(),
    }));
    router.push('/auth/signup/staffid');
  };

  const handleBack = () => {
    router.push('/splash');
    sessionStorage.removeItem('signupData');
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={5}
      onBack={handleBack}
      heroImage="/name.png"
      heroImageAlt="Name onboarding"
    >
      <div className="flex h-full flex-col justify-end gap-5 lg:justify-center">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
            Sign up
          </p>
          <h1 className="max-w-[11ch] text-[clamp(1.55rem,3.8vw,2.45rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-white text-balance">
            What&apos;s your name?
          </h1>
          <p className="max-w-md text-xs leading-5 text-white/60 sm:text-sm sm:leading-6 lg:text-base">
            Enter the name you want shown across your account and fatigue reports.
          </p>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Dr. Sarah Smith"
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
