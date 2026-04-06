'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/layouts/OnboardingLayout';
import { type ClinicalRole, CLINICAL_ROLE_LABELS } from '@/contexts/AuthContext';

const ROLES: ClinicalRole[] = [
  'HOUSE_OFFICER',
  'MEDICAL_OFFICER',
  'RESIDENT_JUNIOR',
  'RESIDENT_SENIOR',
  'CONSULTANT',
];

export default function SignupRolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<ClinicalRole | ''>('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!selected) {
      setError('Please select your clinical role');
      return;
    }
    const existingData = JSON.parse(sessionStorage.getItem('signupData') || '{}');
    sessionStorage.setItem('signupData', JSON.stringify({
      ...existingData,
      clinicalRole: selected,
    }));
    router.push('/auth/signup/password');
  };

  const handleBack = () => {
    router.push('/auth/signup/hospital');
  };

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={6}
      onBack={handleBack}
      heroImage="/department.png"
      heroImageAlt="Clinical role onboarding"
    >
      <div className="relative flex h-full flex-col justify-end gap-5 lg:justify-center">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
            Sign up
          </p>
          <h1 className="max-w-[13ch] text-[clamp(1.35rem,3.3vw,2.1rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-white text-balance">
            Your clinical role?
          </h1>
          <p className="max-w-md text-[11px] leading-5 text-white/60 sm:text-xs sm:leading-5 lg:text-sm lg:leading-6">
            Choose the role that best describes your current position.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2.5">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => {
                  setSelected(role);
                  setError('');
                }}
                className={`rounded-full px-3.5 py-2 text-xs font-medium transition-smooth sm:text-sm ${
                  selected === role
                    ? 'bg-white text-[#0A0F1E]'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                {CLINICAL_ROLE_LABELS[role]}
              </button>
            ))}
          </div>

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
