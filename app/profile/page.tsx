'use client';

import { useAuth, getClinicalRoleLabel } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useShift } from '@/contexts/ShiftContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const BADGES = [
  { label: '7-Day Streak', icon: '🔥', desc: 'Checked in every shift for 7 days' },
  { label: 'Sharp Mind', icon: '⚡', desc: 'Stayed above 75 fatigue for a full shift' },
  { label: 'Zero Critical', icon: '🛡️', desc: 'No critical alerts this week' },
];

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const shift = useShift();

  useEffect(() => {
    if (!isAuthenticated) router.push('/splash');
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  const initials = (user.name ?? 'D')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const activeShiftInfo = shift.isShiftActive ? {
    date: 'Today',
    avgFatigue: shift.avgFatigue || shift.latestFatigue,
    checkIns: shift.checkIns.length,
    status: 'active' as const
  } : null;

  const pastShiftsInfo = shift.pastShifts.slice(0, activeShiftInfo ? 3 : 4).map(s => ({
    date: s.date.split(',')[0],
    avgFatigue: s.avgFatigue,
    checkIns: s.checkIns.length,
    status: 'complete' as const
  }));

  const recentShiftsData = [...(activeShiftInfo ? [activeShiftInfo] : []), ...pastShiftsInfo];
  const weekAvg = recentShiftsData.length > 0
    ? Math.round(recentShiftsData.reduce((a, b) => a + b.avgFatigue, 0) / recentShiftsData.length)
    : 100;


  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        {/* Profile card */}
        <div className="card-hover rounded-2xl border border-[#1E293B] bg-white p-6 dark:bg-[#0D1526]">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#22C55E] text-2xl font-bold text-[#0A0F1E]">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E] ring-2 ring-white dark:ring-[#0D1526]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-[#0A0F1E]">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </span>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {user.name ?? 'Dr. Unknown'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-white/50">
                {getClinicalRoleLabel(user.clinicalRole)} &mdash; {user.department ?? 'General Medicine'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-white/35">
                {user.hospital ?? 'Lagos University Teaching Hospital'} &bull; {user.staffId ?? 'STAFF-1024'}
              </p>
            </div>

            <Link
              href="/settings"
              className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 dark:border-[#1E293B] dark:text-white/70 dark:hover:bg-[#101a2e]"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Performance overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Week avg fatigue', value: weekAvg, suffix: '' },
            { label: 'Total shifts (7d)', value: 4, suffix: '' },
            { label: 'Avg reaction', value: shift.avgReactionTime, suffix: 'ms' },
            { label: 'Avg memory', value: `${shift.avgMemory}/5`, suffix: '' },
          ].map((s) => (
            <div
              key={s.label}
              className="card-hover rounded-2xl border border-[#1E293B] bg-white p-4 dark:bg-[#0D1526]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/40">
                {s.label}
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-slate-900 dark:text-white">
                {s.value}
                {s.suffix && (
                  <span className="ml-0.5 text-sm font-normal text-slate-500 dark:text-white/45">{s.suffix}</span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Recent shifts */}
        <div className="card-hover rounded-2xl border border-[#1E293B] bg-white p-5 dark:bg-[#0D1526]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Shifts</h3>
            <Link
              href="/history"
              className="text-xs font-medium text-[#22C55E] hover:underline"
            >
              view all
            </Link>
          </div>
          <div className="space-y-2">
            {recentShiftsData.map((s) => (
              <div
                key={s.date}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-[#1E293B]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        s.status === 'active' ? '#22C55E' : s.avgFatigue >= 75 ? '#22C55E' : s.avgFatigue >= 55 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                  <span className="text-sm font-medium text-slate-800 dark:text-white/85">{s.date}</span>
                  {s.status === 'active' && (
                    <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-semibold text-[#22C55E]">
                      live
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-white/50">
                  <span>{s.checkIns} check-ins</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{s.avgFatigue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="card-hover rounded-2xl border border-[#1E293B] bg-white p-5 dark:bg-[#0D1526]">
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Achievements</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BADGES.map((b) => (
              <div
                key={b.label}
                className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-[#1E293B]"
              >
                <span className="text-xl">{b.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{b.label}</p>
                  <p className="text-xs text-slate-500 dark:text-white/45">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-hover rounded-2xl border border-[#1E293B] bg-white p-5 dark:bg-[#0D1526]">
          <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Today&apos;s Baseline</h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-white/50">
            {shift.baseline ? 'Set at the start of this shift. Used to compute your fatigue score.' : 'Start a shift to set your baseline.'}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            {[
              { label: 'Reaction', value: shift.baseline ? `${shift.baseline.reactionTime}ms` : '--' },
              { label: 'WPM', value: shift.baseline ? String(shift.baseline.wpm) : '--' },
              { label: 'Accuracy', value: shift.baseline ? `${shift.baseline.accuracy}%` : '--' },
              { label: 'Memory', value: shift.baseline ? `${shift.baseline.memoryScore}/5` : '--' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 p-3 dark:border-[#1E293B]">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/35">{item.label}</p>
                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
