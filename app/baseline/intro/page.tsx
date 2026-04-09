'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { useAuth, type RotationType, ROTATION_LABELS } from '@/contexts/AuthContext';
import { useShift } from '@/contexts/ShiftContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROTATION_OPTIONS = Object.entries(ROTATION_LABELS) as [RotationType, string][];

export default function BaselineIntroPage() {
  const router = useRouter();
  const { user, setCheckInRotation } = useAuth();
  const { isShiftActive, baseline } = useShift();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';

  // Determine if this is a baseline or a check-in
  const isCheckIn = isShiftActive && baseline !== null;

  const [selectedRotation, setSelectedRotation] = useState<RotationType | ''>('');

  const handleRotationChange = (val: string) => {
    const match = ROTATION_OPTIONS.find(([key]) => key === val);
    if (match) setSelectedRotation(match[0]);
  };

  const handleStart = () => {
    if (isCheckIn && selectedRotation !== '') {
      setCheckInRotation(selectedRotation);
    }
    router.push('/baseline/test/reaction');
  };

  const canBegin = !isCheckIn || selectedRotation !== '';

  return (
    <div className="h-dvh overflow-hidden bg-[#0A0F1E] text-white">
      <div className="grid h-dvh grid-rows-[55dvh_45dvh] lg:grid-cols-[3fr_2fr] lg:grid-rows-1">
        {/* Hero image section */}
        <section className="relative overflow-hidden">
          <Image
            src="/baseline.png"
            alt="Baseline assessment"
            fill
            priority
            className="object-cover"
            style={{ objectPosition: 'center' }}
          />
          {/* Dark fade at bottom */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,30,0.05)_0%,rgba(10,15,30,0.3)_50%,#0A0F1E_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.08),transparent_40%)]" />
        </section>

        {/* Content section */}
        <section className="relative flex min-h-0 flex-col justify-end overflow-hidden bg-[#0A0F1E] px-5 pb-6 pt-8 sm:px-7 sm:pb-8 lg:justify-center lg:px-12 lg:py-16">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,30,0)_0%,rgba(10,15,30,0.72)_30%,#0A0F1E_100%)] lg:hidden" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.06),transparent_25%)] opacity-90" />

          <div className="relative z-10 max-w-xl">
            <div className="space-y-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/40">
                {isCheckIn ? 'check-in' : 'baseline'}
              </p>
              <h1 className="max-w-[18ch] text-[clamp(1.6rem,4vw,2.8rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-white text-balance">
                {isCheckIn
                  ? `time for a check-in, ${firstName}.`
                  : "let\u2019s set your baseline."}
              </h1>
              <p className="max-w-md text-sm leading-6 text-white/55 lg:text-base lg:leading-7">
                {isCheckIn
                  ? "three quick tests to see how you are tracking against your baseline this shift."
                  : 'three quick tests so we know what sharp looks like for you today.'}
              </p>
            </div>

            {isCheckIn && (
              <div className="mt-5 space-y-1.5">
                <label
                  htmlFor="rotation-select"
                  className="block text-xs font-medium uppercase tracking-[0.18em] text-white/45"
                >
                  Select department to select rotation
                </label>
                <Select
                  value={selectedRotation}
                  onValueChange={handleRotationChange}
                >
                  <SelectTrigger
                    id="rotation-select"
                    className="w-full border-white/15 bg-white/5 text-white data-[placeholder]:text-white/35 hover:bg-white/10 focus-visible:border-primary/60 focus-visible:ring-primary/20"
                  >
                    <SelectValue placeholder="Select department…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROTATION_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleStart}
                disabled={!canBegin}
                className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-48"
              >
                begin
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
