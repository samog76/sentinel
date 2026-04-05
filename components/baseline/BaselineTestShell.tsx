'use client';

import type { ReactNode } from 'react';

interface BaselineTestShellProps {
  testIndex: 1 | 2 | 3;
  testName: string;
  onSkip: () => void;
  children: ReactNode;
}

export function BaselineTestShell({ testIndex, testName, onSkip, children }: BaselineTestShellProps) {
  return (
    <div className="min-h-dvh bg-[#0A0F1E] text-white flex flex-col items-center">
      <div className="w-full max-w-[600px] flex flex-col flex-1">
        <header className="px-5 pt-5 sm:px-7 sm:pt-6">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-smooth ${
                  step === testIndex ? 'bg-white' : 'bg-white/18'
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-white/50">{testName}</p>
        </header>

        <main className="flex-1 flex flex-col justify-center px-5 sm:px-7">{children}</main>

        <footer className="px-5 pb-5 pt-2 text-center sm:px-7 sm:pb-6">
          <button
            onClick={onSkip}
            className="text-sm text-white/45 transition-smooth hover:text-white/75"
            type="button"
          >
            skip for now
          </button>
        </footer>
      </div>
    </div>
  );
}
