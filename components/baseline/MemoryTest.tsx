'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  BellDotIcon,
  FireIcon,
  Home01Icon,
  House01Icon,
  House02Icon,
  Moon01Icon,
  Shield01Icon,
  Shield02Icon,
  ShieldHalfIcon,
  StarIcon,
  StarsIcon,
  Lightning,
} from '@hugeicons/core-free-icons';

interface MemoryTestProps {
  onComplete: (result: {
    score: number;
    responseTimes: number[];
    integrityFlag: boolean;
  }) => void;
}

interface CardOption {
  id: string;
  icon: IconSvgElement;
  label: string;
}

const ROUND_POOLS: CardOption[][] = [
  [
    { id: 'home-01', icon: Home01Icon, label: 'Home' },
    { id: 'bell-dot', icon: BellDotIcon, label: 'Bell' },
    { id: 'shield-01', icon: Shield01Icon, label: 'Shield' },
  ],
  [
    { id: 'star', icon: StarIcon, label: 'Star' },
    { id: 'moon-01', icon: Moon01Icon, label: 'Moon' },
    { id: 'fire', icon: FireIcon, label: 'Flame' },
  ],
  [
    { id: 'lightning', icon: Lightning, label: 'Lightning' },
    { id: 'shield-half', icon: ShieldHalfIcon, label: 'Shield Half' },
    { id: 'stars', icon: StarsIcon, label: 'Stars' },
  ],
  [
    { id: 'house-01', icon: House01Icon, label: 'House 1' },
    { id: 'house-02', icon: House02Icon, label: 'House 2' },
    { id: 'home-01-hard', icon: Home01Icon, label: 'Home' },
  ],
  [
    { id: 'shield-01-hard', icon: Shield01Icon, label: 'Shield 1' },
    { id: 'shield-02', icon: Shield02Icon, label: 'Shield 2' },
    { id: 'shield-half-hard', icon: ShieldHalfIcon, label: 'Shield Half' },
  ],
];

const TOTAL_ROUNDS = 5;
const REVEAL_DURATION_MS = 1500;
const BLANK_DURATION_MS = 500;

/** Fisher-Yates shuffle using crypto.getRandomValues */
function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  const randomValues = new Uint32Array(result.length);
  crypto.getRandomValues(randomValues);
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function MemoryTest({ onComplete }: MemoryTestProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<'reveal' | 'blank' | 'choose' | 'summary'>('reveal');
  const [targetCard, setTargetCard] = useState<CardOption | null>(null);
  const [options, setOptions] = useState<CardOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const chooseStartRef = useRef<number>(0);

  useEffect(() => {
    if (roundIndex >= TOTAL_ROUNDS) {
      setPhase('summary');
      return;
    }

    const pool = ROUND_POOLS[roundIndex];
    const rnd = new Uint32Array(1);
    crypto.getRandomValues(rnd);
    const selected = pool[rnd[0] % pool.length];

    setTargetCard(selected);
    // Fisher-Yates shuffle for answer positions
    setOptions(fisherYatesShuffle(pool));
    setSelectedId(null);
    setPhase('reveal');

    const revealTimer = setTimeout(() => {
      setPhase('blank');
      const blankTimer = setTimeout(() => {
        chooseStartRef.current = performance.now();
        setPhase('choose');
      }, BLANK_DURATION_MS);
      return () => clearTimeout(blankTimer);
    }, REVEAL_DURATION_MS);

    return () => clearTimeout(revealTimer);
  }, [roundIndex]);

  const handleSelectOption = useCallback((optionId: string) => {
    if (phase !== 'choose' || !targetCard) return;

    const elapsed = Math.round(performance.now() - chooseStartRef.current);
    const isCorrect = optionId === targetCard.id;
    setSelectedId(optionId);
    setAnswers((prev) => [...prev, isCorrect]);
    setResponseTimes((prev) => [...prev, elapsed]);

    setTimeout(() => {
      if (roundIndex === TOTAL_ROUNDS - 1) {
        setRoundIndex(TOTAL_ROUNDS);
      } else {
        setRoundIndex((prev) => prev + 1);
      }
    }, 260);
  }, [phase, targetCard, roundIndex]);

  const score = answers.filter(Boolean).length;

  const handleComplete = useCallback(() => {
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 999;

    // Integrity checks:
    // 1. Score below 2/5
    // 2. Average response time under 300ms (impossibly fast)
    const integrityFlag = score < 2 || avgResponseTime < 300;

    onComplete({
      score,
      responseTimes,
      integrityFlag,
    });
  }, [score, responseTimes, onComplete]);

  return (
    <div className="flex h-full flex-col justify-end gap-4 lg:justify-center">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Test 3 of 3</p>
        <p className="mt-1 text-xs text-white/65">Round {Math.min(roundIndex + 1, TOTAL_ROUNDS)} of {TOTAL_ROUNDS}</p>
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < roundIndex
                ? answers[i]
                  ? 'bg-primary'
                  : 'bg-red-400'
                : i === roundIndex
                ? 'bg-white'
                : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      <p className="max-w-md text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">
        Memorize the icon before it disappears.
      </p>

      {phase !== 'summary' ? (
        <>
          <div className="relative h-28">
            {phase === 'reveal' && targetCard ? (
              <div className="baseline-card-flip relative mx-auto flex h-28 w-28 items-center justify-center rounded-3xl border border-primary/30 bg-primary/12">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke="rgba(255,255,255,0.95)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={326.72}
                    strokeDashoffset={0}
                    className="memory-ring-animate"
                  />
                </svg>
                <HugeiconsIcon icon={targetCard.icon} size={52} color="currentColor" className="text-white" />
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center text-sm text-white/40">
                {phase === 'blank' ? '' : 'choose the icon'}
              </div>
            )}
          </div>

          {phase === 'choose' && options.length > 0 && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {options.map((option, index) => {
                const isPicked = selectedId === option.id;
                const isTarget = targetCard?.id === option.id;

                const stateClass = isPicked
                  ? isTarget
                    ? 'bg-primary/20 border-primary/55 baseline-option-correct'
                    : 'bg-red-500/15 border-red-400/65 baseline-option-wrong'
                  : 'bg-white/5 border-white/12 hover:bg-white/10';

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={`baseline-slide-up flex h-16 items-center justify-center rounded-2xl border transition-smooth ${stateClass}`}
                    style={{ animationDelay: `${index * 40}ms` }}
                    disabled={selectedId !== null}
                  >
                    <HugeiconsIcon icon={option.icon} size={30} color="currentColor" className="text-white/92" />
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-5 baseline-feedback">
          <p className="text-3xl font-semibold text-white">
            {score} of {TOTAL_ROUNDS} correct
          </p>

          <div className="flex gap-2">
            {answers.map((isCorrect, index) => (
              <div
                key={index}
                className={`h-3 w-3 rounded-full ${isCorrect ? 'bg-primary' : 'bg-red-400'}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleComplete}
            className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-95"
          >
            see results
          </button>
        </div>
      )}
    </div>
  );
}
