'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';

import { type RotationType } from '@/contexts/AuthContext';

/* ─── Types ───────────────────────────────────────────── */

export interface TestResult {
  reactionTime: number;
  wpm: number;
  accuracy: number;
  memoryScore: number;
}

export interface BaselineData extends TestResult {
  timestamp: string;
  reactionRounds?: number[];
  keystrokeVariance?: number;
  memoryResponseTimes?: number[];
}

export interface CheckIn {
  id: string;
  timestamp: Date;
  reactionTime: number;
  wpm: number;
  accuracy: number;
  memoryScore: number;
  fatigueScore: number;
  status: 'sharp' | 'tired' | 'critical' | 'flagged' | 'review';
  rotation?: RotationType;
  deviations: {
    reaction: number;
    typing: number;
    memory: number;
  };
  integrityFlags: {
    reaction: boolean;
    typing: boolean;
    memory: boolean;
  };
  reactionRounds?: number[];
  keystrokeVariance?: number;
  memoryResponseTimes?: number[];
}

export interface PastShift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  avgFatigue: number;
  checkIns: {
    time: string;
    reactionTime: number;
    wpm: number;
    accuracy: number;
    memoryScore: number;
    fatigueScore: number;
    status?: string;
  }[];
}

export interface ShiftState {
  /** null = no active shift */
  clockInTime: Date | null;
  isShiftActive: boolean;
  baseline: BaselineData | null;
  checkIns: CheckIn[];
  pastShifts: PastShift[];
  shiftDurationSeconds: number;
  nextCheckInSeconds: number;
  /** Computed averages — only meaningful when checkIns.length > 0 */
  avgFatigue: number;
  avgReactionTime: number;
  avgWPM: number;
  avgMemory: number;
  latestFatigue: number;
  /** AI cache keys */
  aiInsight: string | null;
  aiOverview: string | null;
}

export interface ShiftActions {
  startShift: () => void;
  endShift: () => void;
  setBaseline: (data: BaselineData) => void;
  addCheckIn: (result: {
    reactionTime: number;
    wpm: number;
    accuracy: number;
    memoryScore: number;
    rotation?: RotationType;
    integrityFlags: { reaction: boolean; typing: boolean; memory: boolean };
    reactionRounds?: number[];
    keystrokeVariance?: number;
    memoryResponseTimes?: number[];
  }) => CheckIn;
  setAiInsight: (text: string) => void;
  setAiOverview: (text: string) => void;
  clearAiInsight: () => void;
}

type ShiftContextValue = ShiftState & ShiftActions;

const ShiftContext = createContext<ShiftContextValue | undefined>(undefined);

/* ─── Fatigue computation ─────────────────────────────── */

function computeFatigueScore(
  baseline: BaselineData,
  result: { reactionTime: number; wpm: number; accuracy: number; memoryScore: number }
): number {
  // Deviation as percentage (positive = worse, negative = better)
  // Reaction: higher is worse
  const reactionDev = ((result.reactionTime - baseline.reactionTime) / baseline.reactionTime) * 100;
  // WPM: lower is worse
  const wpmDev = ((baseline.wpm - result.wpm) / baseline.wpm) * 100;
  // Memory: lower is worse
  const memoryDev = ((baseline.memoryScore - result.memoryScore) / baseline.memoryScore) * 100;

  // Weighted composite deviation (positive = more fatigued)
  const composite = reactionDev * 0.4 + wpmDev * 0.35 + memoryDev * 0.25;

  // Convert to fatigue score: 100 = sharp, 0 = exhausted
  // At 0% deviation → 100. At 100% deviation → ~30.
  const score = Math.round(Math.max(0, Math.min(100, 100 - composite * 0.7)));
  return score;
}

function fatigueStatus(score: number, baselineScore: number, isFlagged: boolean): CheckIn['status'] {
  if (isFlagged) return 'flagged';
  // If fatigue dropped more than 35 points from baseline-equivalent (100)
  if (100 - score > 35) return 'review';
  if (score >= 75) return 'sharp';
  if (score >= 55) return 'tired';
  return 'critical';
}

/* ─── Helpers ──────────────────────────────────────────── */

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/* ─── Provider ─────────────────────────────────────────── */

const MOCK_PAST_SHIFTS: PastShift[] = [
  {
    id: 'shift-2',
    date: 'Thursday, 3 April 2026',
    startTime: '07:00',
    endTime: '19:30',
    duration: '12h 30m',
    avgFatigue: 74,
    checkIns: [
      { time: '09:00 AM', reactionTime: 270, wpm: 71, accuracy: 97, memoryScore: 5, fatigueScore: 88, status: 'sharp' },
      { time: '11:30 AM', reactionTime: 295, wpm: 66, accuracy: 94, memoryScore: 4, fatigueScore: 79, status: 'sharp' },
      { time: '02:00 PM', reactionTime: 340, wpm: 59, accuracy: 91, memoryScore: 3, fatigueScore: 64, status: 'tired' },
      { time: '04:30 PM', reactionTime: 388, wpm: 52, accuracy: 87, memoryScore: 3, fatigueScore: 51, status: 'critical' },
    ],
  },
  {
    id: 'shift-3',
    date: 'Wednesday, 2 April 2026',
    startTime: '08:00',
    endTime: '20:00',
    duration: '12h 00m',
    avgFatigue: 81,
    checkIns: [
      { time: '10:00 AM', reactionTime: 258, wpm: 73, accuracy: 98, memoryScore: 5, fatigueScore: 91, status: 'sharp' },
      { time: '12:30 PM', reactionTime: 280, wpm: 69, accuracy: 95, memoryScore: 4, fatigueScore: 84, status: 'sharp' },
      { time: '03:00 PM', reactionTime: 302, wpm: 65, accuracy: 93, memoryScore: 4, fatigueScore: 78, status: 'sharp' },
      { time: '05:30 PM', reactionTime: 315, wpm: 61, accuracy: 92, memoryScore: 4, fatigueScore: 74, status: 'tired' },
    ],
  },
  {
    id: 'shift-4',
    date: 'Tuesday, 1 April 2026',
    startTime: '07:30',
    endTime: '19:00',
    duration: '11h 30m',
    avgFatigue: 68,
    checkIns: [
      { time: '09:30 AM', reactionTime: 290, wpm: 67, accuracy: 95, memoryScore: 4, fatigueScore: 83, status: 'sharp' },
      { time: '12:00 PM', reactionTime: 335, wpm: 62, accuracy: 92, memoryScore: 3, fatigueScore: 72, status: 'tired' },
      { time: '02:30 PM', reactionTime: 362, wpm: 55, accuracy: 89, memoryScore: 3, fatigueScore: 61, status: 'tired' },
      { time: '05:00 PM', reactionTime: 410, wpm: 49, accuracy: 84, memoryScore: 2, fatigueScore: 48, status: 'critical' },
    ],
  },
];

export function ShiftProvider({ children }: { children: ReactNode }) {
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [baseline, setBaselineState] = useState<BaselineData | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [pastShifts, setPastShifts] = useState<PastShift[]>([]);
  const [shiftDurationSeconds, setShiftDurationSeconds] = useState(0);
  const [nextCheckInTarget, setNextCheckInTarget] = useState<Date | null>(null);
  const [nextCheckInSeconds, setNextCheckInSeconds] = useState(0);
  const [aiInsight, setAiInsightState] = useState<string | null>(null);
  const [aiOverview, setAiOverviewState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sentinel_past_shifts');
      if (stored) {
        setPastShifts(JSON.parse(stored));
      } else {
        setPastShifts(MOCK_PAST_SHIFTS);
      }
    } catch (e) {
      console.error('Failed to load past shifts', e);
      setPastShifts(MOCK_PAST_SHIFTS);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when pastShifts changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('sentinel_past_shifts', JSON.stringify(pastShifts));
    }
  }, [pastShifts, isLoaded]);

  /* Tick every second for live timers */
  useEffect(() => {
    const tick = setInterval(() => {
      if (clockInTime) {
        setShiftDurationSeconds(
          Math.floor((Date.now() - clockInTime.getTime()) / 1000)
        );
      }
      if (nextCheckInTarget) {
        setNextCheckInSeconds(
          Math.max(0, Math.floor((nextCheckInTarget.getTime() - Date.now()) / 1000))
        );
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [clockInTime, nextCheckInTarget]);

  /* Actions */
  const startShift = useCallback(() => {
    const now = new Date();
    setClockInTime(now);
    setBaselineState(null);
    setCheckIns([]);
    setShiftDurationSeconds(0);
    setNextCheckInTarget(null);
    setNextCheckInSeconds(0);
    setAiInsightState(null);
    setAiOverviewState(null);
  }, []);

  const endShift = useCallback(() => {
    // Save to past shifts before clearing
    if (clockInTime) {
      const scored = checkIns.filter((c) => c.status !== 'flagged');
      const shiftAvgFatigue = avg(scored.map((c) => c.fatigueScore));
      
      const newPastShift: PastShift = {
        id: `shift-${Date.now()}`,
        date: clockInTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        startTime: formatTime(clockInTime),
        endTime: formatTime(new Date()),
        duration: formatDuration(Math.floor((Date.now() - clockInTime.getTime()) / 1000)),
        avgFatigue: shiftAvgFatigue || 100,
        checkIns: checkIns.map((c) => ({
          time: formatTime(c.timestamp),
          reactionTime: c.reactionTime,
          wpm: c.wpm,
          accuracy: c.accuracy,
          memoryScore: c.memoryScore,
          fatigueScore: c.fatigueScore,
          status: c.status,
        })),
      };
      
      setPastShifts((prev) => [newPastShift, ...prev]);
    }

    setClockInTime(null);
    setBaselineState(null);
    setCheckIns([]);
    setShiftDurationSeconds(0);
    setNextCheckInTarget(null);
    setNextCheckInSeconds(0);
    setAiInsightState(null);
    setAiOverviewState(null);
  }, [clockInTime, checkIns]);

  const setBaseline = useCallback((data: BaselineData) => {
    setBaselineState(data);
    // First check-in due 1h 42m from now
    const target = new Date();
    target.setSeconds(target.getSeconds() + 6120);
    setNextCheckInTarget(target);
    setNextCheckInSeconds(6120);
  }, []);

  const addCheckIn = useCallback(
    (result: {
      reactionTime: number;
      wpm: number;
      accuracy: number;
      memoryScore: number;
      rotation?: RotationType;
      integrityFlags: { reaction: boolean; typing: boolean; memory: boolean };
      reactionRounds?: number[];
      keystrokeVariance?: number;
      memoryResponseTimes?: number[];
    }): CheckIn => {
      const bl = baseline;
      if (!bl) throw new Error('Cannot add check-in without baseline');

      const flagCount = [
        result.integrityFlags.reaction,
        result.integrityFlags.typing,
        result.integrityFlags.memory,
      ].filter(Boolean).length;

      const isFlagged = flagCount >= 2;

      const reactionDev = ((result.reactionTime - bl.reactionTime) / bl.reactionTime) * 100;
      const wpmDev = ((bl.wpm - result.wpm) / bl.wpm) * 100;
      const memoryDev = ((bl.memoryScore - result.memoryScore) / bl.memoryScore) * 100;

      const fatigueScore = isFlagged ? 0 : computeFatigueScore(bl, result);
      const status = fatigueStatus(fatigueScore, 100, isFlagged);

      const newCheckIn: CheckIn = {
        id: `checkin-${Date.now()}`,
        timestamp: new Date(),
        reactionTime: result.reactionTime,
        wpm: result.wpm,
        accuracy: result.accuracy,
        memoryScore: result.memoryScore,
        fatigueScore,
        status,
        rotation: result.rotation,
        deviations: {
          reaction: Math.round(reactionDev * 10) / 10,
          typing: Math.round(wpmDev * 10) / 10,
          memory: Math.round(memoryDev * 10) / 10,
        },
        integrityFlags: result.integrityFlags,
        reactionRounds: result.reactionRounds,
        keystrokeVariance: result.keystrokeVariance,
        memoryResponseTimes: result.memoryResponseTimes,
      };

      setCheckIns((prev) => [...prev, newCheckIn]);

      // Reset next check-in timer (1h 42m from now)
      const target = new Date();
      target.setSeconds(target.getSeconds() + 6120);
      setNextCheckInTarget(target);
      setNextCheckInSeconds(6120);

      // Clear AI cache so it regenerates
      setAiInsightState(null);
      setAiOverviewState(null);

      return newCheckIn;
    },
    [baseline]
  );

  const setAiInsight = useCallback((text: string) => setAiInsightState(text), []);
  const setAiOverview = useCallback((text: string) => setAiOverviewState(text), []);
  const clearAiInsight = useCallback(() => setAiInsightState(null), []);

  /* Computed averages */
  const scored = checkIns.filter((c) => c.status !== 'flagged');
  const avgFatigue = scored.length > 0 ? avg(scored.map((c) => c.fatigueScore)) : 100;
  
  const avgReactionTime = avg(scored.map((c) => c.reactionTime));
  const avgWPM = avg(scored.map((c) => c.wpm));
  const avgMemory = scored.length > 0
    ? Math.round((avg(scored.map((c) => c.memoryScore)) / 5) * 100) / 100
    : 0;
  const latestFatigue = scored.length > 0 ? scored[scored.length - 1].fatigueScore : 100;

  const value: ShiftContextValue = {
    clockInTime,
    isShiftActive: clockInTime !== null,
    baseline,
    checkIns,
    pastShifts,
    shiftDurationSeconds,
    nextCheckInSeconds,
    avgFatigue,
    avgReactionTime,
    avgWPM,
    avgMemory,
    latestFatigue,
    aiInsight,
    aiOverview,
    startShift,
    endShift,
    setBaseline,
    addCheckIn,
    setAiInsight,
    setAiOverview,
    clearAiInsight,
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShift(): ShiftContextValue {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error('useShift must be used inside ShiftProvider');
  return ctx;
}

/* ─── Formatting helpers ───────────────────────────────── */

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
