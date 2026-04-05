'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface ReactionTestProps {
  onComplete: (result: {
    reactionTime: number;
    rounds: number[];
    integrityFlag: boolean;
  }) => void;
}

type Phase = 'intro' | 'countdown' | 'waiting' | 'go' | 'result' | 'tooEarly';

const TOTAL_ROUNDS = 5;
const MAX_REACTION_MS = 2500;

/** Crypto-secure random integer in [min, max] */
function secureRandom(min: number, max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return min + (arr[0] % (max - min + 1));
}

export function ReactionTest({ onComplete }: ReactionTestProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [rounds, setRounds] = useState<number[]>([]);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const startTimeRef = useRef<number>(0);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const flaggedRoundsRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const triggerTooEarly = useCallback(() => {
    setStatus('too early — restarting round');
    setIsShaking(true);
    setPhase('tooEarly');
    clearTimers();
    const t = setTimeout(() => {
      setIsShaking(false);
      setPhase('intro');
      setStatus('');
    }, 1200);
    timersRef.current.push(t);
  }, [clearTimers]);

  const beginSequence = useCallback(() => {
    clearTimers();
    setStatus('');
    setLastTime(null);
    setPhase('countdown');
    setCountdown(3);

    [3, 2, 1].forEach((value, index) => {
      const timer = setTimeout(() => setCountdown(value), index * 680);
      timersRef.current.push(timer);
    });

    const waitTimer = setTimeout(() => {
      setPhase('waiting');
      // Crypto-secure random delay 1000–4000ms
      const delay = secureRandom(1000, 4000);
      const goTimer = setTimeout(() => {
        startTimeRef.current = performance.now();
        setPhase('go');

        // Auto-flag if no response after MAX_REACTION_MS
        const timeoutTimer = setTimeout(() => {
          // If still in 'go' phase, record as flagged
          setPhase((p) => {
            if (p === 'go') {
              flaggedRoundsRef.current++;
              const measured = MAX_REACTION_MS;
              setLastTime(measured);
              setRounds((prev) => {
                const updated = [...prev, measured];
                if (updated.length >= TOTAL_ROUNDS) {
                  // Will handle in result display
                }
                return updated;
              });
              return 'result';
            }
            return p;
          });
        }, MAX_REACTION_MS);
        timersRef.current.push(timeoutTimer);
      }, delay);
      timersRef.current.push(goTimer);
    }, 3 * 680);
    timersRef.current.push(waitTimer);
  }, [clearTimers]);

  const handleArenaTap = useCallback(() => {
    if (phase === 'countdown' || phase === 'waiting') {
      triggerTooEarly();
      return;
    }
    if (phase !== 'go') return;

    clearTimers(); // Cancel the timeout timer
    const measured = Math.max(1, Math.round(performance.now() - startTimeRef.current));
    setLastTime(measured);
    setRounds((prev) => [...prev, measured]);
    setPhase('result');
  }, [phase, triggerTooEarly, clearTimers]);

  const handleNextRound = useCallback(() => {
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    if (nextRound >= TOTAL_ROUNDS) {
      // Finish — compute integrity
      const allRounds = [...rounds];
      const avgTime = allRounds.reduce((a, b) => a + b, 0) / allRounds.length;

      // Variance check: if all within 50ms and avg is slow (>400ms)
      const minR = Math.min(...allRounds);
      const maxR = Math.max(...allRounds);
      const variance = maxR - minR;
      const suspiciouslyConsistent = variance <= 50 && avgTime > 400;

      const integrityFlag = suspiciouslyConsistent;

      onComplete({
        reactionTime: Math.round(avgTime),
        rounds: allRounds,
        integrityFlag,
      });
    } else {
      setPhase('intro');
      setLastTime(null);
      setStatus('');
    }
  }, [currentRound, rounds, onComplete]);

  // Auto-advance when rounds array fills
  const allDone = rounds.length >= TOTAL_ROUNDS;

  return (
    <div
      className={`relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl border border-white/8 bg-black/20 px-4 py-6 transition-smooth ${
        phase === 'countdown' || phase === 'waiting' ? 'bg-black/75' : 'bg-black/20'
      } ${isShaking ? 'baseline-shake' : ''}`}
      onClick={handleArenaTap}
      role="presentation"
    >
      {(phase === 'countdown' || phase === 'waiting') && (
        <div className="absolute inset-0 bg-black/72" />
      )}

      {/* Round indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-6 rounded-full transition-all duration-200 ${
              i < rounds.length
                ? 'bg-primary'
                : i === rounds.length
                ? 'bg-white/60'
                : 'bg-white/15'
            }`}
          />
        ))}
      </div>

      {phase === 'intro' && (
        <>
          <p className="relative z-10 text-center text-sm text-white/80 sm:text-base">
            tap the circle the moment it appears
          </p>
          <p className="relative z-10 text-xs text-white/40">
            round {rounds.length + 1} of {TOTAL_ROUNDS}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              beginSequence();
            }}
            className="relative z-10 rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#0A0F1E] transition-smooth hover:scale-[1.02]"
          >
            ready?
          </button>
        </>
      )}

      {phase === 'tooEarly' && (
        <div className="relative z-10 text-center space-y-2 baseline-feedback">
          <p className="text-lg font-semibold text-amber-300">too early</p>
          <p className="text-sm text-white/55">wait for the circle to appear, then tap</p>
        </div>
      )}

      {phase === 'countdown' && (
        <p className="relative z-10 text-7xl font-semibold text-white baseline-feedback">{countdown}</p>
      )}

      {phase === 'go' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleArenaTap();
          }}
          className="relative z-10 h-36 w-36 rounded-full bg-white shadow-[0_0_0_6px_rgba(34,197,94,0.2),0_0_35px_rgba(34,197,94,0.45)] transition-smooth hover:scale-105 sm:h-40 sm:w-40"
          aria-label="Tap reaction circle"
        />
      )}

      {phase === 'result' && lastTime !== null && (
        <div className="relative z-10 text-center space-y-3 baseline-feedback">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/20 ring-1 ring-primary/35 flex items-center justify-center">
            <span className="text-2xl font-semibold text-primary">{lastTime >= MAX_REACTION_MS ? '🐢' : '⚡'}</span>
          </div>
          <p className="text-4xl font-semibold text-white sm:text-5xl">{lastTime}ms</p>
          <p className="text-xs text-white/45">
            {lastTime >= MAX_REACTION_MS ? 'timed out — flagged' : `round ${rounds.length} of ${TOTAL_ROUNDS}`}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextRound();
            }}
            className="mt-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-95"
          >
            {allDone ? 'next test' : 'next round'}
          </button>
        </div>
      )}

      {status && phase !== 'result' && phase !== 'tooEarly' && (
        <p className="relative z-10 text-sm text-amber-200 baseline-feedback">{status}</p>
      )}
    </div>
  );
}
