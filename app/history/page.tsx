'use client';

import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useShift, formatTime } from '@/contexts/ShiftContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

function scoreColor(score: number) {
  if (score >= 75) return '#22C55E';
  if (score >= 55) return '#F59E0B';
  return '#EF4444';
}
function statusLabel(score: number, status?: string) {
  if (status === 'flagged') return 'Flagged';
  if (status === 'review') return 'Review';
  if (score >= 75) return 'Sharp';
  if (score >= 55) return 'Tired';
  return 'Critical';
}
function statusPillClass(score: number) {
  if (score >= 75) return 'bg-[#22C55E]/15 text-[#22C55E]';
  if (score >= 55) return 'bg-[#F59E0B]/15 text-[#F59E0B]';
  return 'bg-[#EF4444]/15 text-[#EF4444]';
}



export default function HistoryPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const shift = useShift();
  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'checkins' | 'shifts'>('checkins');

  useEffect(() => {
    if (!isAuthenticated) router.push('/splash');
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  const todayShift = shift.isShiftActive && shift.clockInTime ? {
    id: 'shift-today',
    date: 'Today, ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    startTime: formatTime(shift.clockInTime),
    endTime: 'ongoing',
    duration: 'active',
    avgFatigue: shift.avgFatigue,
    checkIns: shift.checkIns.map((c) => ({
      time: formatTime(c.timestamp),
      reactionTime: c.reactionTime,
      wpm: c.wpm,
      accuracy: c.accuracy,
      memoryScore: c.memoryScore,
      fatigueScore: c.fatigueScore,
      status: c.status,
    })),
  } : null;

  const allShifts = [...(todayShift ? [todayShift] : []), ...shift.pastShifts];

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-white/50">
              {allShifts.length} shifts recorded
            </p>
          </div>
          <div className="flex rounded-xl border border-slate-200 dark:border-[#1E293B] overflow-hidden text-sm font-medium">
            <button
              onClick={() => setActiveTab('checkins')}
              className={`px-4 py-2 transition-colors ${
                activeTab === 'checkins'
                  ? 'bg-[#22C55E] text-[#0A0F1E]'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-[#0D1526]'
              }`}
            >
              Check-ins
            </button>
            <button
              onClick={() => setActiveTab('shifts')}
              className={`px-4 py-2 transition-colors ${
                activeTab === 'shifts'
                  ? 'bg-[#22C55E] text-[#0A0F1E]'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-[#0D1526]'
              }`}
            >
              Shifts
            </button>
          </div>
        </div>

        {activeTab === 'checkins' ? (
          /* All check-ins flat list */
          <div className="space-y-4">
            {shift.isShiftActive && (
              <div className="flex items-center justify-between rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4">
                <div>
                  <p className="text-sm font-semibold text-[#22C55E]">Active Shift</p>
                  <p className="mt-0.5 text-xs text-[#22C55E]/75">You can update your baseline if you feel conditions have changed.</p>
                </div>
                <button
                  onClick={() => router.push('/baseline/intro')}
                  className="rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0A0F1E] transition-colors hover:bg-[#22C55E]/90"
                >
                  Take Test Again
                </button>
              </div>
            )}
            <div className="space-y-2">
              {allShifts.map((s) =>
              s.checkIns.map((entry, idx) => (
                <div
                  key={`${s.id}-${idx}`}
                  className="card-hover flex flex-col gap-3 rounded-2xl border border-[#1E293B] bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-[#0D1526]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-[#0A0F1E]"
                      style={{ backgroundColor: scoreColor(entry.fatigueScore) }}
                    >
                      {entry.fatigueScore}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.time}</p>
                      <p className="text-xs text-slate-500 dark:text-white/45">{s.date}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <MetricPill label="reaction" value={`${entry.reactionTime}ms`} />
                    <MetricPill label="wpm" value={String(entry.wpm)} />
                    <MetricPill label="accuracy" value={`${entry.accuracy}%`} />
                    <MetricPill label="memory" value={`${entry.memoryScore}/5`} />
                  </div>

                  <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(entry.fatigueScore)}`}>
                    {statusLabel(entry.fatigueScore)}
                  </span>
                </div>
              ))
            )}
            </div>
          </div>
        ) : (
          /* Shifts list with expand */
          <div className="space-y-3">
            {allShifts.map((s) => (
              <div key={s.id} className="card-hover rounded-2xl border border-[#1E293B] bg-white dark:bg-[#0D1526] overflow-hidden">
                <button
                  className="flex w-full items-center justify-between p-4 text-left"
                  onClick={() => setExpandedShift(expandedShift === s.id ? null : s.id)}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.date}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-white/50">
                      {s.startTime} → {s.endTime} &nbsp;·&nbsp; {s.checkIns.length} check-ins
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(s.avgFatigue)}`}>
                      avg {s.avgFatigue}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expandedShift === s.id ? 'rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {expandedShift === s.id && (
                  <div className="border-t border-[#1E293B] px-4 pb-4">
                    <div className="mt-3 space-y-2">
                      {s.checkIns.map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#1E293B]"
                        >
                          <p className="w-24 shrink-0 font-medium text-slate-700 dark:text-white/80">{entry.time}</p>
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            <MetricPill label="reaction" value={`${entry.reactionTime}ms`} />
                            <MetricPill label="wpm" value={String(entry.wpm)} />
                            <MetricPill label="acc" value={`${entry.accuracy}%`} />
                            <MetricPill label="mem" value={`${entry.memoryScore}/5`} />
                          </div>
                          <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(entry.fatigueScore)}`}>
                            {statusLabel(entry.fatigueScore)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-center pt-2">
          <Link
            href="/baseline/intro"
            className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-5 py-2.5 text-sm font-semibold text-[#0A0F1E] transition hover:brightness-95"
          >
            Start New Check-in
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-slate-600 dark:border-[#1E293B] dark:bg-[#101a2e] dark:text-white/70">
      {label} {value}
    </span>
  );
}
