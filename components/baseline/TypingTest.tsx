'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface TypingTestProps {
  onComplete: (result: {
    wpm: number;
    accuracy: number;
    keystrokeVariance: number;
    integrityFlag: boolean;
  }) => void;
}

const PHRASES = [
  'Focused teams move faster with clear communication.',
  'Accurate reporting prevents critical medical errors.',
];

export function TypingTest({ onComplete }: TypingTestProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentWpm, setCurrentWpm] = useState(0);
  const [isDone, setIsDone] = useState(false);
  
  const [metricsList, setMetricsList] = useState<{
    wpm: number;
    accuracy: number;
    variance: number;
    integrityFlag: boolean;
  }[]>([]);

  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [finalKeystrokeVariance, setFinalKeystrokeVariance] = useState(0);
  const [finalIntegrityFlag, setFinalIntegrityFlag] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const keystrokeTimestamps = useRef<number[]>([]);

  const SOURCE_SENTENCE = PHRASES[phraseIndex];

  const characterStates = useMemo(() => {
    if (!SOURCE_SENTENCE) return [];
    return SOURCE_SENTENCE.split('').map((char, index) => {
      const typedChar = typed[index];
      if (typedChar === undefined) {
        return { char, state: 'pending' as const };
      }
      return {
        char,
        state: typedChar === char ? ('correct' as const) : ('incorrect' as const),
      };
    });
  }, [typed, SOURCE_SENTENCE]);

  const accuracy = useMemo(() => {
    if (!typed.length || !characterStates.length) return 100;
    const correct = characterStates.filter(
      (entry, index) => index < typed.length && entry.state === 'correct'
    ).length;
    return Math.max(0, Math.min(100, Math.round((correct / typed.length) * 100)));
  }, [characterStates, typed.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [phraseIndex]); // re-focus on new phrase

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isDone) return;

    const value = e.target.value;
    const clamped = value.slice(0, SOURCE_SENTENCE.length);

    // Track keystroke timestamps
    if (clamped.length > typed.length) {
      keystrokeTimestamps.current.push(performance.now());
    }

    setTyped(clamped);

    if (!startTime && clamped.length > 0) {
      setStartTime(Date.now());
    }

    if (startTime && clamped.length > 0) {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      const words = clamped.trim().split(/\s+/).filter(Boolean).length;
      const calculatedWpm = Math.round(words / elapsedMinutes);
      setCurrentWpm(calculatedWpm > 0 ? calculatedWpm : 0);
    }

    if (clamped.length === SOURCE_SENTENCE.length) {
      const elapsedMinutes = ((Date.now() - (startTime || Date.now())) / 60000) || 1 / 60;
      const words = SOURCE_SENTENCE.trim().split(/\s+/).length;
      const measuredWpm = Math.max(1, Math.round(words / elapsedMinutes));
      const correctChars = SOURCE_SENTENCE
        .split('')
        .filter((char, index) => clamped[index] === char).length;
      const measuredAccuracy = Math.round((correctChars / SOURCE_SENTENCE.length) * 100);

      // Compute keystroke interval variance
      const ts = keystrokeTimestamps.current;
      let variance = 0;
      if (ts.length > 2) {
        const intervals: number[] = [];
        for (let i = 1; i < ts.length; i++) {
          intervals.push(ts[i] - ts[i - 1]);
        }
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const sumSquaredDiff = intervals.reduce(
          (sum, val) => sum + Math.pow(val - mean, 2),
          0
        );
        variance = Math.round(sumSquaredDiff / intervals.length);
      }

      // Integrity check: WPM < 15 AND accuracy > 88% → suspicious
      const integrityFlag = measuredWpm < 15 && measuredAccuracy > 88;
      
      const currentMetrics = {
        wpm: measuredWpm,
        accuracy: measuredAccuracy,
        variance,
        integrityFlag
      };

      if (phraseIndex < PHRASES.length - 1) {
        setMetricsList(prev => [...prev, currentMetrics]);
        setPhraseIndex(prev => prev + 1);
        setTyped('');
        setStartTime(null);
        setCurrentWpm(0);
        keystrokeTimestamps.current = [];
      } else {
        const allMetrics = [...metricsList, currentMetrics];
        const avgWpm = Math.round(allMetrics.reduce((sum, m) => sum + m.wpm, 0) / allMetrics.length);
        const avgAcc = Math.round(allMetrics.reduce((sum, m) => sum + m.accuracy, 0) / allMetrics.length);
        const avgVar = Math.round(allMetrics.reduce((sum, m) => sum + m.variance, 0) / allMetrics.length);
        const anyFlag = allMetrics.some(m => m.integrityFlag);

        setFinalWpm(avgWpm);
        setFinalAccuracy(avgAcc);
        setFinalKeystrokeVariance(avgVar);
        setFinalIntegrityFlag(anyFlag);
        setCurrentWpm(avgWpm);
        setIsDone(true);
      }
    }
  };

  const handleNext = () => {
    onComplete({
      wpm: finalWpm,
      accuracy: finalAccuracy,
      keystrokeVariance: finalKeystrokeVariance,
      integrityFlag: finalIntegrityFlag,
    });
  };

  return (
    <div className="flex h-full flex-col justify-end gap-4 lg:justify-center">
      {!isDone ? (
        <>
          <div className="relative w-full rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="absolute right-4 top-4 flex items-center gap-3">
              <span className="text-xs font-semibold text-[#22C55E]/70 uppercase tracking-widest">
                {phraseIndex + 1} / {PHRASES.length}
              </span>
              <div className="rounded-full bg-black/30 px-2 py-1 text-xs font-medium text-white/85">
                {currentWpm} WPM
              </div>
            </div>

            <p className="mb-3 pr-20 text-[11px] uppercase tracking-[0.22em] text-white/50">phrase {phraseIndex + 1}</p>

            <p className="text-sm leading-6 sm:text-base">
              {characterStates.map((entry, index) => (
                <span
                  key={`${entry.char}-${index}-${phraseIndex}`}
                  className={
                    entry.state === 'correct'
                      ? 'text-primary'
                      : entry.state === 'incorrect'
                      ? 'text-[#ff7a7a] bg-[#ff7a7a]/15 rounded-sm'
                      : 'text-white/80'
                  }
                >
                  {entry.char}
                </span>
              ))}
            </p>

            <textarea
              ref={inputRef}
              value={typed}
              onChange={handleTyping}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              placeholder="Start typing the sentence..."
              className="mt-4 h-36 w-full resize-none rounded-xl border border-white/10 bg-[#0c1324] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-primary focus:outline-none"
            />
          </div>
        </>
      ) : (
        <div className="space-y-6 baseline-feedback">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-3xl font-semibold text-white">{finalWpm}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">WPM</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-3xl font-semibold text-white">{finalAccuracy}%</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">accuracy</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-95 sm:w-auto"
          >
            next test
          </button>
        </div>
      )}

      {!isDone && (
        <p className="text-xs text-white/50">Live accuracy: {accuracy}%</p>
      )}
    </div>
  );
}
