'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
  showHeader?: boolean;
  heroImage?: string;
  heroImageAlt?: string;
  heroObjectPosition?: string;
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  showHeader = true,
  heroImage,
  heroImageAlt = 'Onboarding visual',
  heroObjectPosition = 'center',
}: OnboardingLayoutProps) {
  return (
    <div className="h-dvh overflow-hidden bg-[#0A0F1E] text-white">
      {showHeader && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4 sm:px-6 lg:px-8">
          {onBack ? (
            <button
              onClick={onBack}
              className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/90 transition-smooth hover:bg-white/10 hover:text-white"
              aria-label="Go back"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="currentColor" />
            </button>
          ) : (
            <span className="h-11 w-11" aria-hidden="true" />
          )}

          {currentStep !== undefined && totalSteps !== undefined ? (
            <span className="pointer-events-auto text-[11px] font-medium uppercase tracking-[0.3em] text-white/45 sm:text-xs">
              {currentStep} of {totalSteps}
            </span>
          ) : (
            <span className="h-11" aria-hidden="true" />
          )}
        </div>
      )}

      <div className="grid h-dvh grid-rows-[60dvh_40dvh] lg:grid-cols-[3fr_2fr] lg:grid-rows-1">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#16233e_0%,#0f172c_42%,#070b16_100%)] lg:border-r lg:border-white/5">
          {heroImage ? (
            <>
              <Image
                src={heroImage}
                alt={heroImageAlt}
                fill
                priority
                className="object-cover"
                style={{ objectPosition: heroObjectPosition }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,30,0.1)_0%,rgba(10,15,30,0.38)_100%)]" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,transparent_24%,transparent_76%,rgba(255,255,255,0.03)_100%)] opacity-80" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_38%,rgba(0,0,0,0.35)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,197,94,0.12),transparent_26%),radial-gradient(circle_at_22%_72%,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_78%_28%,rgba(255,255,255,0.05),transparent_18%)]" />
              <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:72px_72px] [background-position:center]" />

              <div className="absolute inset-0 flex items-center justify-center px-8">
                <div className="relative flex aspect-[4/5] w-full max-w-[30rem] items-center justify-center rounded-[2rem] bg-[#08101f] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.45)]">
                  <div className="absolute inset-0 rounded-[2rem] border border-white/5" />
                  <div className="absolute inset-[20%] rounded-[1.6rem] border border-white/10 bg-white/[0.04]" />
                  <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-white/[0.06] shadow-[0_0_70px_rgba(34,197,94,0.12)]" />
                  <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1.15rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.38),rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
                  <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-[0_0_28px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
            </>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(180deg,rgba(10,15,30,0)_0%,rgba(10,15,30,0.55)_45%,#0A0F1E_100%)] lg:h-[38%]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.1),transparent_40%)]" />
        </section>

        <section className="relative flex min-h-0 flex-col justify-end overflow-hidden bg-[#0A0F1E] px-5 pb-4 pt-16 sm:px-7 sm:pb-6 sm:pt-20 lg:justify-center lg:px-12 lg:py-16">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,30,0)_0%,rgba(10,15,30,0.72)_46%,#0A0F1E_100%)] lg:hidden" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_30%),radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.04),transparent_18%)] opacity-90" />
          <div className="relative z-10 flex h-full min-h-0 w-full items-end lg:items-center">
            <div className="h-full w-full max-w-xl lg:h-auto lg:pr-2">
              {children}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
