'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

interface TestTransitionProps {
  nextLabel: string;
  nextHref: string;
  icon: IconSvgElement;
  durationMs?: number;
}

export function TestTransition({
  nextLabel,
  nextHref,
  icon,
  durationMs = 2400,
}: TestTransitionProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(nextHref);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, nextHref, router]);

  return (
    <div className="min-h-dvh bg-[#0A0F1E] text-white flex items-center justify-center px-6">
      <div className="text-center space-y-4 baseline-feedback">
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">coming up next</p>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/5">
          <HugeiconsIcon icon={icon} size={28} color="currentColor" className="text-white/85" />
        </div>
        <h1 className="text-[clamp(1.8rem,4.5vw,3rem)] font-semibold leading-tight tracking-[-0.03em] text-white text-balance">
          {nextLabel}
        </h1>
      </div>
    </div>
  );
}
