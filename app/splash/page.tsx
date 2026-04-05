'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/layouts/OnboardingLayout';

export default function SplashPage() {
  const router = useRouter();
  const { setIsOnboarding } = useAuth();

  const handleCreateAccount = () => {
    setIsOnboarding(true);
    router.push('/auth/signup/name');
  };

  const handleSignIn = () => {
    router.push('/auth/signin/email');
  };

  return (
    <OnboardingLayout showHeader={false} heroImage="/welcome.png" heroImageAlt="Sentinel welcome">
      <div className="flex h-full flex-col justify-end gap-5 lg:justify-center">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/45">
            Sentinel
          </p>
          <h1 className="max-w-[12ch] text-[clamp(1.9rem,4.2vw,3.3rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-white text-balance">
            Keeping doctors sharp.
          </h1>
          <p className="max-w-md text-xs leading-5 text-white/60 sm:text-sm sm:leading-6 lg:text-base">
            Quiet, fast fatigue monitoring designed to feel calm, modern, and easy to move through.
          </p>
        </div>

        <div className="space-y-2 pb-1 pt-1 sm:pt-3">
          <button
            onClick={handleCreateAccount}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-95"
          >
            Create Account
          </button>
          <button
            onClick={handleSignIn}
            className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition-smooth hover:bg-white/10"
          >
            Sign In
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
