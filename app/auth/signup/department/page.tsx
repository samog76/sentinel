'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/layouts/OnboardingLayout';

const DEPARTMENTS = [
  'Emergency',
  'Surgery',
  'ICU',
  'Pediatrics',
  'General',
  'Radiology',
  'Oncology',
  'Other',
];

export default function SignupDepartmentPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!selected) {
      setError('Please select a department');
      return;
    }

    const resolvedDepartment = selected === 'Other' ? customDepartment.trim() : selected;
    if (!resolvedDepartment) {
      setError('Please enter your department');
      return;
    }

    const existingData = JSON.parse(sessionStorage.getItem('signupData') || '{}');
    sessionStorage.setItem('signupData', JSON.stringify({
      ...existingData,
      department: resolvedDepartment,
    }));
    router.push('/auth/signup/hospital');
  };

  const handleBack = () => {
    router.push('/auth/signup/staffid');
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={5}
      onBack={handleBack}
      heroImage="/department.png"
      heroImageAlt="Department onboarding"
    >
      <div className="relative flex h-full flex-col justify-end gap-5 lg:justify-center">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
            Sign up
          </p>
          <h1 className="max-w-[13ch] text-[clamp(1.35rem,3.3vw,2.1rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-white text-balance">
            Which department?
          </h1>
          <p className="max-w-md text-[11px] leading-5 text-white/60 sm:text-xs sm:leading-5 lg:text-sm lg:leading-6">
            Choose the department that best matches your current role.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2.5">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                onClick={() => {
                  setSelected(dept);
                  if (dept !== 'Other') {
                    setCustomDepartment('');
                  }
                  setError('');
                }}
                className={`rounded-full px-3.5 py-2 text-xs font-medium transition-smooth sm:text-sm ${
                  selected === dept
                    ? 'bg-white text-[#0A0F1E]'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-sm text-[#FF7A7A]">{error}</p>
          )}
        </div>

        {selected === 'Other' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(100%-3.75rem)] z-20 sm:bottom-[calc(100%-4.5rem)]">
            <div className="bg-[linear-gradient(180deg,rgba(10,15,30,0)_0%,rgba(10,15,30,0.74)_36%,#0A0F1E_100%)] px-1 pb-2 pt-12">
              <div className="pointer-events-auto rounded-2xl border border-white/10 bg-[#0A0F1E]/86 px-4 py-2.5 backdrop-blur-sm">
                <input
                  type="text"
                  value={customDepartment}
                  onChange={(e) => {
                    setCustomDepartment(e.target.value);
                    setError('');
                  }}
                  placeholder="Type your department"
                  className="w-full border-0 bg-transparent px-0 py-1 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

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
