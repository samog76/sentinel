'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useShift, formatDuration, formatCountdown, formatTime } from '@/contexts/ShiftContext';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { callGemini, buildInsightPrompt, buildOverviewPrompt } from '@/lib/gemini';

/* ─── Helpers ─────────────────────────────────────────── */

function scoreColor(score: number) {
  if (score >= 75) return '#22C55E';
  if (score >= 55) return '#F59E0B';
  return '#EF4444';
}

function statusLabel(score: number, status?: string): string {
  if (status === 'flagged') return 'Flagged';
  if (status === 'review') return 'Review';
  if (score >= 75) return 'Sharp';
  if (score >= 55) return 'Tired';
  return 'Critical';
}

function statusPillClass(score: number, status?: string): string {
  if (status === 'flagged') return 'bg-[#F59E0B]/15 text-[#F59E0B]';
  if (status === 'review') return 'bg-[#EF4444]/15 text-[#EF4444]';
  if (score >= 75) return 'bg-[#22C55E]/15 text-[#22C55E]';
  if (score >= 55) return 'bg-[#F59E0B]/15 text-[#F59E0B]';
  return 'bg-[#EF4444]/15 text-[#EF4444]';
}

/* ─── Start Shift Screen ──────────────────────────────── */

function StartShiftScreen({
  userName,
  onStartShift,
}: {
  userName: string;
  onStartShift: () => void;
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'good morning';
    if (hour < 17) return 'good afternoon';
    return 'good evening';
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center">
          <Image
            src="/logo.png"
            alt="Sentinel"
            width={80}
            height={80}
            className="rounded-2xl object-cover"
          />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {greeting()}, dr. {userName.split(' ')[0]?.toLowerCase() ?? 'doctor'}
        </h1>

        <p className="mt-3 font-mono text-lg text-slate-400 dark:text-white/40">
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </p>

        <button
          onClick={onStartShift}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#22C55E] px-8 py-4 text-base font-semibold text-[#0A0F1E] transition-all duration-200 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M12 2v10M12 12l4.5 4.5" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          start shift
        </button>

        <p className="mt-4 text-xs text-slate-400 dark:text-white/30">
          this will log your clock-in time and start baseline tests
        </p>
      </div>
    </div>
  );
}

/* ─── Sentinel Overview Modal ─────────────────────────── */

function SentinelModal({
  isOpen,
  onClose,
  avgFatigue,
  avgReactionTime,
  avgWPM,
  avgMemory,
  trendData,
  aiOverview,
  aiOverviewLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  avgFatigue: number;
  avgReactionTime: number;
  avgWPM: number;
  avgMemory: number;
  trendData: { label: string; score: number }[];
  aiOverview: string | null;
  aiOverviewLoading: boolean;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => { if (e.target === backdropRef.current) onClose(); },
    [onClose]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const chartW = 480;
  const chartH = 80;
  const minScore = trendData.length > 0 ? Math.min(...trendData.map((d) => d.score)) - 5 : 0;
  const maxScore = trendData.length > 0 ? Math.max(...trendData.map((d) => d.score)) + 5 : 100;
  const toX = (i: number) => trendData.length > 1 ? (i / (trendData.length - 1)) * chartW : chartW / 2;
  const toY = (s: number) => maxScore > minScore ? chartH - ((s - minScore) / (maxScore - minScore)) * chartH : chartH / 2;
  const points = trendData.map((d, i) => `${toX(i)},${toY(d.score)}`).join(' ');
  const areaPoints = `0,${chartH} ${points} ${chartW},${chartH}`;

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={handleBackdropClick}
    >
      <div className="modal-card relative w-full max-w-[560px] rounded-2xl border border-[#1E293B] bg-[#0D1526] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E293B] text-white/50 transition-all duration-150 hover:border-[#22C55E]/40 hover:bg-[#22C55E]/10 hover:text-white"
          aria-label="Close modal"
        >
          <XIcon />
        </button>

        <div className="flex items-center gap-2.5 pr-10">
          <PulseDot />
          <h2 className="text-lg font-semibold text-white">sentinel&apos;s overview</h2>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'avg fatigue', value: avgFatigue, suffix: '' },
            { label: 'avg reaction', value: avgReactionTime, suffix: 'ms' },
            { label: 'avg WPM', value: avgWPM, suffix: '' },
            { label: 'avg memory', value: `${avgMemory}/5`, suffix: '' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[#1E293B] bg-[#0A0F1E] p-3">
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">{stat.label}</p>
              <p className="mt-1.5 text-2xl font-semibold text-white">
                {stat.value}
                {stat.suffix && <span className="ml-0.5 text-sm font-normal text-white/50">{stat.suffix}</span>}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[#1E293B] bg-[#0A0F1E] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#22C55E]/80">AI shift analysis</p>
          {aiOverviewLoading ? (
            <div className="mt-2 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-white/10" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-white/70">
              {aiOverview || 'Complete a check-in to get an AI-generated shift summary.'}
            </p>
          )}
        </div>

        {trendData.length > 1 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">fatigue trend</p>
            <div className="overflow-hidden rounded-xl border border-[#1E293B] bg-[#0A0F1E] px-4 py-3">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: '70px' }} aria-hidden="true">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#lineGrad)" />
                <polyline points={points} fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
                {trendData.map((d, i) => (
                  <circle key={i} cx={toX(i)} cy={toY(d.score)} r="3.5" fill="#22C55E" stroke="#0A0F1E" strokeWidth="2" />
                ))}
              </svg>
              <div className="mt-1 flex justify-between">
                {trendData.map((d, i) => (
                  <span key={i} className="text-[9px] text-white/35">{d.label}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────── */

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const shift = useShift();
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/splash');
  }, [isAuthenticated, router]);

  // Fetch AI insight when check-ins change and insight is empty
  useEffect(() => {
    if (
      shift.isShiftActive &&
      shift.baseline &&
      shift.checkIns.length > 0 &&
      !shift.aiInsight &&
      !insightLoading
    ) {
      const latestCheckIn = shift.checkIns[shift.checkIns.length - 1];
      if (latestCheckIn.status === 'flagged') return;

      setInsightLoading(true);
      const prompt = buildInsightPrompt({
        doctorName: user?.name ?? 'Doctor',
        fatigueScore: latestCheckIn.fatigueScore,
        baseline: shift.baseline,
        deviations: latestCheckIn.deviations,
        hoursOnShift: shift.shiftDurationSeconds / 3600,
        checksCompleted: shift.checkIns.length,
      });

      callGemini(prompt)
        .then((text) => shift.setAiInsight(text))
        .catch(() => shift.setAiInsight('Unable to generate insight at this time.'))
        .finally(() => setInsightLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift.checkIns.length, shift.aiInsight]);

  // Fetch AI overview when modal opens
  useEffect(() => {
    if (
      overviewOpen &&
      shift.isShiftActive &&
      shift.baseline &&
      !shift.aiOverview &&
      !overviewLoading
    ) {
      setOverviewLoading(true);
      const prompt = buildOverviewPrompt({
        doctorName: user?.name ?? 'Doctor',
        hoursOnShift: shift.shiftDurationSeconds / 3600,
        baseline: shift.baseline,
        checkIns: shift.checkIns,
      });

      callGemini(prompt)
        .then((text) => shift.setAiOverview(text))
        .catch(() => shift.setAiOverview('Unable to generate overview at this time.'))
        .finally(() => setOverviewLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewOpen, shift.aiOverview]);

  if (!isAuthenticated || !user) return null;

  /* ─── No active shift → show start screen ─── */
  if (!shift.isShiftActive) {
    return (
      <MainLayout>
        <StartShiftScreen
          userName={user.name ?? 'Doctor'}
          onStartShift={() => {
            shift.startShift();
            router.push('/baseline/intro');
          }}
        />
      </MainLayout>
    );
  }

  /* ─── Shift active but no baseline yet → redirect to baseline ─── */
  if (!shift.baseline) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-[#22C55E]/20" />
            <p className="text-sm text-slate-500 dark:text-white/55">setting up your baseline...</p>
            <Link href="/baseline/intro" className="text-sm font-medium text-[#22C55E]">
              go to baseline tests →
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  /* ─── Full dashboard ─── */
  const {
    checkIns,
    shiftDurationSeconds,
    nextCheckInSeconds,
    avgFatigue,
    avgReactionTime,
    avgWPM,
    avgMemory,
    latestFatigue,
    clockInTime,
    baseline,
    aiInsight,
    aiOverview,
  } = shift;

  const fatigueColor = scoreColor(latestFatigue);
  const fatigueLabel = latestFatigue >= 75 ? 'feeling sharp' : latestFatigue >= 55 ? 'getting tired' : 'fatigue critical';

  const scoredCheckIns = checkIns.filter((c) => c.status !== 'flagged');

  const trendData = clockInTime
    ? [
        { label: formatTime(clockInTime), score: 100 },
        ...scoredCheckIns.map((c) => ({ label: formatTime(c.timestamp), score: c.fatigueScore })),
        ...(scoredCheckIns.length === 0 ? [{ label: 'Now', score: 100 }] : [])
      ]
    : [];

  const checkInIntervalS = 6120;
  const countdownProgress = Math.round(((checkInIntervalS - nextCheckInSeconds) / checkInIntervalS) * 100);

  const donutPercent = checkIns.length > 0 ? avgFatigue : 100;
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - donutPercent / 100);

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* ── 4 Stat Cards ─── */}
        <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
          <article
            className="card-hover rounded-2xl border border-[#1E293B] p-5"
            style={{ backgroundColor: fatigueColor, color: '#0A0F1E' }}
          >
            <p className="text-sm font-medium">Fatigue Score</p>
            <p className="mt-4 text-5xl font-semibold tracking-tight">
              {latestFatigue}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="rounded-full bg-black/10 px-2 py-1 flex items-center gap-1.5">
                {checkIns.length === 0 && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-black opacity-70"></span></span>}
                {fatigueLabel}
              </span>
              {checkIns.length > 0 && (
                <span className="font-semibold">{checkIns.length} check-in{checkIns.length > 1 ? 's' : ''}</span>
              )}
            </div>
          </article>

          <StatCard
            title="Shift Duration"
            value={formatDuration(shiftDurationSeconds)}
            subtitle={clockInTime ? `started ${formatTime(clockInTime)}` : '--'}
          />
          <StatCard
            title="Checks Completed"
            value={`${checkIns.length}`}
            subtitle={nextCheckInSeconds > 0 ? `next in ${formatCountdown(nextCheckInSeconds)}` : 'due now'}
          />
          <StatCard title="Alerts Today" value="0" subtitle="all clear" />
        </div>

        {/* ── Sentinel's Overview Card ─── */}
        {checkIns.length > 0 && (
          <button
            onClick={() => setOverviewOpen(true)}
            className="group card-hover sentinel-card-glow w-full cursor-pointer rounded-2xl border border-[#1E293B] bg-white p-5 text-left transition-all duration-200 dark:bg-[#0D1526]"
            aria-label="Open Sentinel's Overview"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <PulseDot />
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">sentinel&apos;s overview</h2>
                <span className="ml-1 rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-semibold text-[#22C55E]">AI</span>
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-6">
                <OverviewStat label="avg fatigue" value={String(avgFatigue)} />
                <OverviewStat label="avg reaction" value={`${avgReactionTime}ms`} />
                <OverviewStat label="avg WPM" value={String(avgWPM)} />
                <OverviewStat label="avg memory" value={`${avgMemory}/5`} />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-white/60">
              {aiInsight || 'generating insight...'}{' '}
              <span className="font-medium text-[#22C55E]">click to expand →</span>
            </p>
          </button>
        )}

        {/* ── Chart + widgets ─── */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="card-hover rounded-2xl border border-[#1E293B] bg-white p-4 dark:bg-[#0D1526] xl:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Fatigue Timeline</h2>
              <span className="text-xs text-slate-500 dark:text-white/50">
                {clockInTime ? `${formatTime(clockInTime)} to now` : '--'}
              </span>
            </div>
            <div className="h-44 rounded-xl border border-slate-200 p-4 dark:border-[#1E293B]">
              <MiniChart data={trendData} height={120} />
            </div>
          </div>

          <div className="space-y-4 xl:col-span-2">
            {/* AI Insight card */}
            <article className="card-hover rounded-2xl border border-[#1E293B] bg-white p-4 dark:bg-[#0D1526]">
              <div className="mb-3 flex items-center gap-2">
                {insightLoading ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                )}
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Sentinel AI Insight</h3>
              </div>
              <p className="text-sm leading-6 text-slate-600 dark:text-white/65">
                {insightLoading
                  ? 'analyzing your shift data...'
                  : aiInsight || 'complete a check-in to get your first AI insight.'}
              </p>
              {aiInsight && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => shift.clearAiInsight()}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 dark:border-[#1E293B] dark:text-white/65 dark:hover:bg-[#101a2e]"
                  >
                    dismiss
                  </button>
                  <Link
                    href="/baseline/intro"
                    className="rounded-xl bg-[#22C55E] px-3 py-2 text-xs font-semibold text-[#0A0F1E] transition hover:brightness-95"
                  >
                    start check-in
                  </Link>
                </div>
              )}
            </article>

            {/* Next check-in */}
            <article className="card-hover rounded-2xl border border-[#1E293B] bg-[#0D1526] p-4">
              <h3 className="text-base font-semibold text-white">Next Check-in</h3>
              <p className="mt-2 font-mono text-4xl font-semibold text-white">
                {nextCheckInSeconds > 0 ? formatCountdown(nextCheckInSeconds) : 'due now'}
              </p>
              <p className="mt-1 text-xs text-white/55">counts down in real-time</p>
              <div className="mt-3 h-1.5 rounded-full bg-white/10">
                <div
                  className="h-1.5 rounded-full bg-[#22C55E] transition-all duration-1000"
                  style={{ width: `${Math.min(100, countdownProgress)}%` }}
                />
              </div>
              <Link
                href="/baseline/intro"
                className="mt-4 inline-block rounded-xl border border-[#1E293B] px-3 py-2 text-xs font-medium text-white/75 transition-all duration-200 hover:bg-white/10"
              >
                start {checkIns.length > 0 ? 'check-in' : 'early'}
              </Link>
            </article>
          </div>
        </section>

        {/* ── History + donut ─── */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <article className="card-hover rounded-2xl border border-[#1E293B] bg-white p-4 dark:bg-[#0D1526] xl:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Check-in History</h2>
              <Link href="/history" className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 dark:border-[#1E293B] dark:text-white/65">
                view all
              </Link>
            </div>
            {checkIns.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-[#1E293B]">
                <p className="text-sm text-slate-400 dark:text-white/35">no check-ins yet this shift</p>
              </div>
            ) : (
              <div className="space-y-2">
                {checkIns.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 transition-all duration-200 hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between dark:border-[#1E293B] dark:hover:border-[#22C55E]/20"
                  >
                    <p className="w-28 shrink-0 text-sm font-medium text-slate-700 dark:text-white/85">
                      {formatTime(entry.timestamp)}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <MetricPill label="reaction" value={`${entry.reactionTime}ms`} />
                      <MetricPill label="wpm" value={String(entry.wpm)} />
                      <MetricPill label="memory" value={`${entry.memoryScore}/5`} />
                    </div>
                    <span className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(entry.fatigueScore, entry.status)}`}>
                      {statusLabel(entry.fatigueScore, entry.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="card-hover rounded-2xl border border-[#1E293B] bg-white p-4 dark:bg-[#0D1526] xl:col-span-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Overall Shift Score</h2>
            <div className="mt-4 flex items-center justify-center">
              <div className="relative h-44 w-44">
                <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
                  <circle cx="90" cy="90" r={radius} stroke="rgba(148,163,184,0.18)" strokeWidth="18" fill="none" />
                  <circle
                    cx="90" cy="90" r={radius}
                    stroke={scoreColor(donutPercent)}
                    strokeWidth="18" fill="none" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    style={{ filter: `drop-shadow(0 0 6px ${scoreColor(donutPercent)}66)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {checkIns.length > 0 ? `${donutPercent}%` : '--'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-white/55">
                    {checkIns.length > 0 ? fatigueLabel : 'awaiting data'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
              <LegendItem label="Sharp" color="#22C55E" />
              <LegendItem label="Tired" color="#F59E0B" />
              <LegendItem label="Critical" color="#EF4444" />
            </div>
          </article>
        </section>
      </div>

      <SentinelModal
        isOpen={overviewOpen}
        onClose={() => setOverviewOpen(false)}
        avgFatigue={avgFatigue}
        avgReactionTime={avgReactionTime}
        avgWPM={avgWPM}
        avgMemory={avgMemory}
        trendData={trendData}
        aiOverview={aiOverview}
        aiOverviewLoading={overviewLoading}
      />
    </MainLayout>
  );
}

/* ── Small Components ───────────────────────────────── */

function PulseDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
    </span>
  );
}

function MiniChart({ data, height }: { data: { label: string; score: number }[]; height: number }) {
  const w = 480;
  const h = height;
  const minS = Math.min(...data.map((d) => d.score)) - 5;
  const maxS = Math.max(...data.map((d) => d.score)) + 5;
  const toX = (i: number) => (i / (data.length - 1)) * w;
  const toY = (s: number) => h - ((s - minS) / (maxS - minS)) * h;
  const pts = data.map((d, i) => `${toX(i)},${toY(d.score)}`).join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: `${height - 20}px` }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#areaGrad)" />
        <polyline points={pts} fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.score)} r="4" fill="#22C55E" stroke="#0D1526" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-white/35">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <article className="card-hover rounded-2xl border border-[#1E293B] bg-white p-5 dark:bg-[#0D1526]">
      <p className="text-sm font-medium text-slate-600 dark:text-white/65">{title}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500 dark:text-white/50">{subtitle}</p>
    </article>
  );
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-white/40">{label}</span>
      <span className="text-xl font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-slate-600 dark:border-[#1E293B] dark:bg-[#101a2e] dark:text-white/70">
      {label} {value}
    </span>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-white/60">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </span>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
