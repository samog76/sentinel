'use client';

import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertStatus = 'active' | 'resolved';

interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  status: AlertStatus;
  category: string;
}

const ALL_ALERTS: Alert[] = [
  {
    id: 'a1',
    severity: 'warning',
    title: 'Reaction Time Elevated',
    description: 'Your reaction time at the 10:30 AM check-in was 311ms — 18% above your baseline average of 263ms. Consider taking a brief break before the next check-in.',
    timestamp: 'Today, 10:32 AM',
    status: 'active',
    category: 'Performance',
  },
  {
    id: 'a2',
    severity: 'info',
    title: 'Check-in Completed',
    description: 'You completed your 2nd check-in of the shift. Fatigue score: 82. All metrics within acceptable range.',
    timestamp: 'Today, 10:30 AM',
    status: 'resolved',
    category: 'System',
  },
  {
    id: 'a3',
    severity: 'info',
    title: 'Shift Started',
    description: 'Your shift began 3 hours ago. First check-in completed at the 1-hour mark. Performance is sharp.',
    timestamp: 'Today, 07:30 AM',
    status: 'resolved',
    category: 'System',
  },
  {
    id: 'a4',
    severity: 'critical',
    title: 'Critical Fatigue — Intervention Required',
    description: 'On April 1st at 5:00 PM, your fatigue score dropped to 48. You were advised to request a handover. Shift supervisor was notified.',
    timestamp: 'Apr 1, 05:02 PM',
    status: 'resolved',
    category: 'Safety',
  },
  {
    id: 'a5',
    severity: 'warning',
    title: 'Memory Score Decline',
    description: 'Memory score dropped to 2/5 during the 5:00 PM check-in on April 1st, indicating significant cognitive load.',
    timestamp: 'Apr 1, 05:00 PM',
    status: 'resolved',
    category: 'Performance',
  },
  {
    id: 'a6',
    severity: 'info',
    title: 'Weekly Performance Report Ready',
    description: 'Your weekly cognitive performance summary for March 30 – April 5 is available. Average fatigue: 74. Strongest shift: April 2 (avg 81).',
    timestamp: 'Apr 5, 08:00 AM',
    status: 'resolved',
    category: 'Report',
  },
];

function severityConfig(severity: AlertSeverity) {
  if (severity === 'critical')
    return {
      border: 'border-l-[#EF4444]',
      badge: 'bg-[#EF4444]/15 text-[#EF4444]',
      dot: 'bg-[#EF4444]',
      label: 'Critical',
    };
  if (severity === 'warning')
    return {
      border: 'border-l-[#F59E0B]',
      badge: 'bg-[#F59E0B]/15 text-[#F59E0B]',
      dot: 'bg-[#F59E0B]',
      label: 'Warning',
    };
  return {
    border: 'border-l-[#06B6D4]',
    badge: 'bg-[#06B6D4]/15 text-[#06B6D4]',
    dot: 'bg-[#06B6D4]',
    label: 'Info',
  };
}

export default function AlertsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  useEffect(() => {
    if (!isAuthenticated) router.push('/splash');
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  const categories = ['All', ...Array.from(new Set(ALL_ALERTS.map((a) => a.category)))];

  const filtered = ALL_ALERTS.filter((a) => {
    const matchesStatus = filter === 'all' || a.status === filter;
    const matchesCat = categoryFilter === 'All' || a.category === categoryFilter;
    return matchesStatus && matchesCat;
  });

  const activeCount = ALL_ALERTS.filter((a) => a.status === 'active').length;

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card-hover rounded-2xl border border-[#1E293B] bg-white p-4 dark:bg-[#0D1526]">
            <p className="text-xs text-slate-500 dark:text-white/45">Active</p>
            <p className="mt-1 text-2xl font-semibold text-[#F59E0B]">{activeCount}</p>
          </div>
          <div className="card-hover rounded-2xl border border-[#1E293B] bg-white p-4 dark:bg-[#0D1526]">
            <p className="text-xs text-slate-500 dark:text-white/45">Resolved</p>
            <p className="mt-1 text-2xl font-semibold text-[#22C55E]">
              {ALL_ALERTS.filter((a) => a.status === 'resolved').length}
            </p>
          </div>
          <div className="card-hover rounded-2xl border border-[#1E293B] bg-white p-4 dark:bg-[#0D1526]">
            <p className="text-xs text-slate-500 dark:text-white/45">Critical (7d)</p>
            <p className="mt-1 text-2xl font-semibold text-[#EF4444]">
              {ALL_ALERTS.filter((a) => a.severity === 'critical').length}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl border border-slate-200 dark:border-[#1E293B] overflow-hidden text-sm font-medium">
            {(['all', 'active', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 capitalize transition-colors ${
                  filter === f
                    ? 'bg-[#22C55E] text-[#0A0F1E]'
                    : 'text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-[#0D1526]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E]'
                    : 'border-slate-300 text-slate-600 dark:border-[#1E293B] dark:text-white/55 hover:border-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Alert cards */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1E293B] bg-white py-16 dark:bg-[#0D1526]">
              <div className="text-4xl">✓</div>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-white/70">No alerts match your filters</p>
            </div>
          ) : (
            filtered.map((alert) => {
              const cfg = severityConfig(alert.severity);
              return (
                <article
                  key={alert.id}
                  className={`card-hover rounded-2xl border border-[#1E293B] border-l-4 bg-white p-4 dark:bg-[#0D1526] ${cfg.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{alert.title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          {alert.status === 'resolved' && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-[#101a2e] dark:text-white/45">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-white/60">
                          {alert.description}
                        </p>
                        <p className="mt-2 text-xs text-slate-400 dark:text-white/35">{alert.timestamp} · {alert.category}</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}
