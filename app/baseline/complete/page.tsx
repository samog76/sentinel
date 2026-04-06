'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShift, type BaselineData, type CheckIn } from '@/contexts/ShiftContext';

export default function BaselineCompletePage() {
  const router = useRouter();
  const { baselineData, setIsOnboarding, checkInRotation, setCheckInRotation } = useAuth();
  const shift = useShift();
  const [isAnimating, setIsAnimating] = useState(false);
  const [processedCheckIn, setProcessedCheckIn] = useState<CheckIn | null>(null);
  const [isFlagged, setIsFlagged] = useState(false);

  const isCheckIn = shift.isShiftActive && shift.baseline !== null;

  useEffect(() => {
    setIsAnimating(true);

    if (!baselineData) return;

    const bd = baselineData as any;

    if (isCheckIn) {
      // This is a check-in — compute fatigue and integrity
      const integrityFlags = {
        reaction: bd._reactionIntegrity ?? false,
        typing: bd._typingIntegrity ?? false,
        memory: bd._memoryIntegrity ?? false,
      };

      const flagCount = [integrityFlags.reaction, integrityFlags.typing, integrityFlags.memory].filter(Boolean).length;

      if (flagCount >= 2) {
        setIsFlagged(true);
        // Still add to history as flagged
        const checkIn = shift.addCheckIn({
          reactionTime: bd.reactionTime ?? 300,
          wpm: bd.typingWPM ?? 50,
          accuracy: bd.typingAccuracy ?? 90,
          memoryScore: bd.memoryScore ?? 3,
          rotation: checkInRotation ?? undefined,
          integrityFlags,
          reactionRounds: bd._reactionRounds,
          keystrokeVariance: bd._keystrokeVariance,
          memoryResponseTimes: bd._memoryResponseTimes,
        });
        setProcessedCheckIn(checkIn);
        setCheckInRotation(null);
      } else {
        const checkIn = shift.addCheckIn({
          reactionTime: bd.reactionTime ?? 300,
          wpm: bd.typingWPM ?? 50,
          accuracy: bd.typingAccuracy ?? 90,
          memoryScore: bd.memoryScore ?? 3,
          rotation: checkInRotation ?? undefined,
          integrityFlags,
          reactionRounds: bd._reactionRounds,
          keystrokeVariance: bd._keystrokeVariance,
          memoryResponseTimes: bd._memoryResponseTimes,
        });
        setProcessedCheckIn(checkIn);
        setCheckInRotation(null);
      }
    } else {
      // This is a baseline — save it
      const baseline: BaselineData = {
        reactionTime: bd.reactionTime ?? 300,
        wpm: bd.typingWPM ?? 50,
        accuracy: bd.typingAccuracy ?? 90,
        memoryScore: bd.memoryScore ?? 3,
        timestamp: bd.completedAt ?? new Date().toISOString(),
        reactionRounds: bd._reactionRounds,
        keystrokeVariance: bd._keystrokeVariance,
        memoryResponseTimes: bd._memoryResponseTimes,
      };
      shift.setBaseline(baseline);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDone = () => {
    setIsOnboarding(false);
    router.push('/home');
  };

  const fatigueScore = processedCheckIn?.fatigueScore ?? 0;
  const fatigueColor =
    fatigueScore >= 75 ? '#22C55E' : fatigueScore >= 55 ? '#F59E0B' : '#EF4444';
  const fatigueLabel =
    fatigueScore >= 75 ? 'sharp' : fatigueScore >= 55 ? 'tired' : 'critical';

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0A0F1E] text-white px-5 py-8 sm:px-7 lg:px-10">
      <div className="flex w-full max-w-2xl flex-col gap-7">
        {/* Animated check icon */}
        <div className="space-y-3">
          <div className={`transition-transform duration-700 ${isAnimating ? 'scale-100' : 'scale-90'}`}>
            <div
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border"
              style={{
                borderColor: isFlagged ? 'rgba(245,158,11,0.35)' : 'rgba(34,197,94,0.35)',
                backgroundColor: isFlagged ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
              }}
            >
              {isFlagged ? (
                <svg className="h-7 w-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4M12 17h.01" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3 2.8 19h18.4L12 3Z" />
                </svg>
              ) : (
                <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M5 13l4 4L19 7"
                    style={{
                      strokeDasharray: 32,
                      strokeDashoffset: isAnimating ? 0 : 32,
                      transition: 'stroke-dashoffset 0.6s ease-out 0.2s',
                    }}
                  />
                </svg>
              )}
            </div>
          </div>

          <h1 className="text-[clamp(1.8rem,4.5vw,3rem)] font-semibold leading-tight tracking-[-0.03em] text-white text-balance">
            {isFlagged
              ? 'session flagged'
              : isCheckIn
              ? 'check-in complete'
              : "you're all set"}
          </h1>

          {isFlagged && (
            <p className="max-w-lg text-sm leading-6 text-amber-200/80">
              we noticed some irregularities in this session. this check-in won&apos;t be scored. your supervisor has been notified.
            </p>
          )}
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Reaction Time</p>
            <p className="mt-2 text-2xl font-semibold text-white">{baselineData?.reactionTime ?? '--'} ms</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Typing</p>
            <p className="mt-2 text-2xl font-semibold text-white">{baselineData?.typingWPM ?? '--'} WPM</p>
            <p className="mt-1 text-sm text-white/60">{baselineData?.typingAccuracy ?? '--'}% accuracy</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Memory Score</p>
            <p className="mt-2 text-2xl font-semibold text-white">{baselineData?.memoryScore ?? '--'} / 5</p>
          </div>
        </div>

        {/* Fatigue score (check-in only, not flagged) */}
        {isCheckIn && !isFlagged && processedCheckIn && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-[#0A0F1E]"
                style={{ backgroundColor: fatigueColor }}
              >
                {fatigueScore}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">fatigue score</p>
                <p className="text-sm text-white/55">{fatigueLabel} — compared to your baseline</p>
              </div>
            </div>

            {/* Deviations */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 p-2.5 text-center">
                <p className="text-white/45">reaction</p>
                <p className={`mt-1 font-semibold ${processedCheckIn.deviations.reaction > 0 ? 'text-red-400' : 'text-primary'}`}>
                  {processedCheckIn.deviations.reaction > 0 ? '+' : ''}{processedCheckIn.deviations.reaction}%
                </p>
              </div>
              <div className="rounded-xl border border-white/10 p-2.5 text-center">
                <p className="text-white/45">typing</p>
                <p className={`mt-1 font-semibold ${processedCheckIn.deviations.typing > 0 ? 'text-red-400' : 'text-primary'}`}>
                  {processedCheckIn.deviations.typing > 0 ? '+' : ''}{processedCheckIn.deviations.typing}%
                </p>
              </div>
              <div className="rounded-xl border border-white/10 p-2.5 text-center">
                <p className="text-white/45">memory</p>
                <p className={`mt-1 font-semibold ${processedCheckIn.deviations.memory > 0 ? 'text-red-400' : 'text-primary'}`}>
                  {processedCheckIn.deviations.memory > 0 ? '+' : ''}{processedCheckIn.deviations.memory}%
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-white/55">
          {isCheckIn
            ? isFlagged
              ? 'you can retake the check-in from the dashboard when you\'re ready.'
              : 'your results have been logged. head back to the dashboard.'
            : "we'll use these as your personal benchmark every check-in."}
        </p>

        <div>
          <button
            onClick={handleDone}
            className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-95"
          >
            go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
