'use client';

import { useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useShift, formatDuration } from '@/contexts/ShiftContext';
import { callGemini, buildCoachSystemPrompt, type GeminiMessage } from '@/lib/gemini';

interface MainLayoutProps {
  children: ReactNode;
}

type NavItem = {
  name: string;
  href: string;
  icon: (props: { className?: string }) => ReactNode;
  match: (pathname: string) => boolean;
};

const MONITOR_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/home', icon: DashboardIcon, match: (p) => p === '/home' },
  { name: 'Check-in', href: '/baseline/intro', icon: CheckInIcon, match: (p) => p.startsWith('/baseline') },
  { name: 'History', href: '/history', icon: HistoryIcon, match: (p) => p === '/history' },
  { name: 'Alerts', href: '/alerts', icon: AlertIcon, match: (p) => p === '/alerts' },
];

const GENERAL_NAV: NavItem[] = [
  { name: 'Profile', href: '/profile', icon: ProfileIcon, match: (p) => p === '/profile' },
  { name: 'Settings', href: '/settings', icon: SettingsIcon, match: (p) => p === '/settings' },
];

function NavSection({ title, items, pathname, onNavigate, darkMode }: {
  title: string; items: NavItem[]; pathname: string; onNavigate?: () => void; darkMode: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className={`px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
        <span className="xl:hidden">{title.slice(0, 1)}</span>
        <span className="hidden xl:inline">{title}</span>
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} onClick={onNavigate}
              className={`group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? darkMode ? 'border-[#1E293B] bg-[#0D1526] text-white ring-1 ring-[#22C55E]/20' : 'border-[#D1FAE5] bg-[#F0FDF4] text-[#15803D] ring-1 ring-[#22C55E]/30'
                  : darkMode ? 'border-transparent text-white/60 hover:border-[#1E293B] hover:bg-[#0D1526]/70 hover:text-white' : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-800'
              } justify-center xl:justify-start xl:px-3`}
              aria-label={item.name}
            >
              <span className={`absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-[#22C55E] transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
              <span className="shrink-0"><Icon className="h-[18px] w-[18px]" /></span>
              <span className="hidden font-medium xl:inline">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─── AI Shift Coach Chat Modal ───────────────────────── */

function CoachChatModal({ isOpen, onClose, darkMode }: { isOpen: boolean; onClose: () => void; darkMode: boolean }) {
  const shift = useShift();
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Build history for multi-turn
      const history: GeminiMessage[] = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      // Build system prompt with full shift context
      const systemPrompt = shift.baseline
        ? buildCoachSystemPrompt({
            doctorName: user?.name ?? 'Doctor',
            clockInTime: shift.clockInTime ?? new Date(),
            hoursOnShift: shift.shiftDurationSeconds / 3600,
            fatigueScore: shift.latestFatigue,
            baseline: shift.baseline,
            checkIns: shift.checkIns,
          })
        : 'You are Sentinel, an AI shift coach for healthcare professionals. The doctor has not yet completed their baseline tests. Encourage them to complete the baseline first.';

      const response = await callGemini(userMsg, history, systemPrompt);
      setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I couldn\'t process that right now. Try again in a moment.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading, shift, user]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card flex h-[min(600px,80vh)] w-full max-w-[480px] flex-col rounded-2xl border border-[#1E293B] bg-[#0D1526] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            </span>
            <h2 className="text-base font-semibold text-white">AI Shift Coach</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E293B] text-white/50 transition hover:bg-white/5 hover:text-white" aria-label="Close chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-sm text-white/50">ask sentinel anything about your shift</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['am i okay to continue?', 'how has my shift been?', 'should i take a break?'].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="rounded-xl border border-[#1E293B] px-3 py-1.5 text-xs text-white/50 transition hover:border-[#22C55E]/30 hover:text-white/70"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                m.role === 'user'
                  ? 'bg-[#22C55E] text-[#0A0F1E]'
                  : 'border border-[#1E293B] bg-[#0A0F1E] text-white/80'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl border border-[#1E293B] bg-[#0A0F1E] px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#22C55E]" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#22C55E]" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#22C55E]" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#1E293B] px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="ask sentinel..."
              className="flex-1 rounded-xl border border-[#1E293B] bg-[#0A0F1E] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#22C55E]/40 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22C55E] text-[#0A0F1E] transition-all duration-200 hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Layout ─────────────────────────────────────── */

export function MainLayout({ children }: MainLayoutProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const shift = useShift();

  useEffect(() => {
    const savedTheme = localStorage.getItem('sentinel-theme');
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : true;
    document.documentElement.classList.toggle('dark', shouldUseDark);
    document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light';
    setDarkMode(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
    localStorage.setItem('sentinel-theme', next ? 'dark' : 'light');
  };

  const pageTitle = () => {
    if (pathname === '/home') return 'Dashboard';
    if (pathname.startsWith('/baseline')) return 'Check-in';
    if (pathname === '/history') return 'History';
    if (pathname === '/alerts') return 'Alerts';
    if (pathname === '/profile') return 'Profile';
    if (pathname === '/settings') return 'Settings';
    return 'Dashboard';
  };

  const today = new Date();
  const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  const sidebarBg = darkMode ? 'bg-[#0A0F1E]' : 'bg-white';
  const sidebarBorder = darkMode ? 'border-[#1E293B]' : 'border-slate-200';
  const sidebarText = darkMode ? 'text-white' : 'text-slate-900';

  const handleEndShift = () => {
    shift.endShift();
    router.push('/home');
  };

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col p-3 xl:p-5">
      <Link href="/home" className={`flex items-center gap-3 rounded-2xl px-2 py-2 transition-all duration-200 ${pathname === '/home' ? (darkMode ? 'bg-[#0D1526]' : 'bg-slate-100') : ''}`}>
        <Image src="/logo.png" alt="Sentinel logo" width={36} height={36} className="rounded-lg object-cover" />
        <span className={`hidden text-lg font-semibold tracking-tight xl:inline ${sidebarText}`}>sentinel</span>
      </Link>

      <nav className="mt-6 flex-1 space-y-5 overflow-y-auto">
        <NavSection title="Monitor" items={MONITOR_NAV} pathname={pathname} onNavigate={onNavigate} darkMode={darkMode} />
        <div className={`h-px ${darkMode ? 'bg-[#1E293B]' : 'bg-slate-200'}`} />
        <NavSection title="General" items={GENERAL_NAV} pathname={pathname} onNavigate={onNavigate} darkMode={darkMode} />

        {shift.isShiftActive && (
          <button
            onClick={handleEndShift}
            className={`group relative flex w-full items-center justify-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm transition-all duration-200 xl:justify-start ${
              darkMode ? 'text-red-400/70 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400' : 'text-red-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
            <span className="hidden font-medium xl:inline">End Shift</span>
          </button>
        )}

        <button
          onClick={() => { logout(); router.push('/splash'); }}
          className={`group relative flex w-full items-center justify-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm transition-all duration-200 ${
            darkMode ? 'text-white/55 hover:border-[#1E293B] hover:bg-[#0D1526]/70 hover:text-white' : 'text-slate-400 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-800'
          } xl:justify-start`}
        >
          <LogoutIcon className="h-[18px] w-[18px]" />
          <span className="hidden font-medium xl:inline">Logout</span>
        </button>
      </nav>

      {/* AI Coach card */}
      <div className={`hidden rounded-2xl border p-4 xl:block ${darkMode ? 'border-[#1E293B] bg-[#0D1526]' : 'border-slate-200 bg-slate-50'}`}>
        <p className={`text-sm font-semibold ${sidebarText}`}>AI Shift Coach</p>
        <p className={`mt-1 text-xs leading-5 ${darkMode ? 'text-white/55' : 'text-slate-500'}`}>ask sentinel anything</p>
        <button
          onClick={() => setChatOpen(true)}
          className="mt-3 w-full rounded-xl bg-[#22C55E] px-3 py-2 text-sm font-semibold text-[#0A0F1E] transition hover:brightness-95"
        >
          open chat
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0A0F1E] text-white' : 'bg-[#F3F5F8] text-slate-900'}`}>
      <aside className={`hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-[72px] md:flex-col md:border-r md:${sidebarBorder} md:${sidebarBg} xl:w-[264px] transition-colors duration-200`}>
        <Sidebar />
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className={`absolute inset-y-0 left-0 w-72 ${sidebarBg} border-r ${sidebarBorder} flex flex-col shadow-2xl`}>
            <div className="flex items-center justify-between px-4 py-4">
              <span className={`text-lg font-semibold ${sidebarText}`}>sentinel</span>
              <button onClick={() => setMobileMenuOpen(false)} className={`text-2xl leading-none ${darkMode ? 'text-white/60' : 'text-slate-400'}`}>×</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="md:ml-[72px] xl:ml-[264px] transition-all duration-200">
        <header className={`sticky top-0 z-30 border-b ${darkMode ? 'border-[#1E293B]/70 bg-[#0A0F1E]/90' : 'border-slate-200/80 bg-white/90'} backdrop-blur transition-colors duration-200`}>
          <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 xl:px-8">
            <div className="flex items-center gap-3">
              <button
                className={`mr-1 flex h-9 w-9 items-center justify-center rounded-xl border md:hidden ${darkMode ? 'border-[#1E293B] bg-[#0D1526] text-white' : 'border-slate-200 bg-slate-100 text-slate-700'} transition-colors`}
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className={`text-xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{pageTitle()}</h1>
                <p className={`text-xs ${darkMode ? 'text-white/55' : 'text-slate-500'}`}>
                  {dayName.toLowerCase()}, {dateStr}
                  {shift.isShiftActive && <> &mdash; shift active {formatDuration(shift.shiftDurationSeconds)}</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={toggleTheme} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-all duration-200 ${darkMode ? 'border-[#1E293B] bg-[#0D1526] text-white hover:bg-[#101a2e]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                {darkMode ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                <span className="hidden sm:inline text-xs">{darkMode ? 'light' : 'dark'}</span>
              </button>
              <Link href="/alerts" className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ${darkMode ? 'border-[#1E293B] bg-[#0D1526] text-white hover:bg-[#101a2e]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                <BellIcon className="h-4 w-4" />
              </Link>
              <div className={`hidden items-center gap-2.5 rounded-xl border px-2.5 py-1.5 sm:flex transition-colors duration-200 ${darkMode ? 'border-[#1E293B] bg-[#0D1526]' : 'border-slate-200 bg-white'}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22C55E] text-sm font-bold text-[#0A0F1E]">
                  {(user?.name ?? 'D').charAt(0).toUpperCase()}
                </div>
                <div className="pr-1">
                  <p className={`text-sm font-semibold leading-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>{user?.name ?? 'Doctor'}</p>
                  <p className={`text-[11px] ${darkMode ? 'text-white/55' : 'text-slate-500'}`}>{user?.staffId ?? 'STAFF-1024'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 pb-24 sm:px-6 xl:px-8">
          <div className="page-fade-in" key={pathname}>{children}</div>
        </main>

        <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t ${darkMode ? 'border-[#1E293B] bg-[#0A0F1E]/95' : 'border-slate-200 bg-white/95'} backdrop-blur md:hidden transition-colors duration-200`}>
          <div className="grid grid-cols-5">
            {[...MONITOR_NAV, ...GENERAL_NAV.slice(0, 1)].map((item) => {
              const Icon = item.icon;
              const isActive = item.match(pathname);
              return (
                <Link key={item.name} href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${isActive ? 'text-[#22C55E]' : darkMode ? 'text-white/50' : 'text-slate-400'}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <CoachChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} darkMode={darkMode} />
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────── */

function MenuIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}><path d="M3 6h18M3 12h18M3 18h18" /></svg>);
}
function DashboardIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></svg>);
}
function CheckInIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" /><path d="m9.5 14.5 1.8 1.8 3.4-3.8" /></svg>);
}
function HistoryIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M4 12a8 8 0 1 0 2.35-5.65" /><path d="M4 4v4h4" /><path d="M12 8v5l3 2" /></svg>);
}
function AlertIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v5M12 17h.01" /></svg>);
}
function ProfileIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><circle cx="12" cy="8" r="3.5" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>);
}
function SettingsIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M10.2 2h3.6l.8 2.6a7.7 7.7 0 0 1 1.9 1.1l2.6-.8 1.8 3.1-1.9 2a7.6 7.6 0 0 1 0 2.2l1.9 2-1.8 3.1-2.6-.8a7.7 7.7 0 0 1-1.9 1.1l-.8 2.6h-3.6l-.8-2.6a7.7 7.7 0 0 1-1.9-1.1l-2.6.8-1.8-3.1 1.9-2a7.6 7.6 0 0 1 0-2.2l-1.9-2 1.8-3.1 2.6.8a7.7 7.7 0 0 1 1.9-1.1L10.2 2Z" /><circle cx="12" cy="12" r="2.8" /></svg>);
}
function LogoutIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" /><path d="M10 17 15 12 10 7" /><path d="M15 12H4" /></svg>);
}
function BellIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M5 16.5h14l-1.5-2.3V10a5.5 5.5 0 1 0-11 0v4.2L5 16.5Z" /><path d="M10 18.5a2 2 0 0 0 4 0" /></svg>);
}
function SunIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><circle cx="12" cy="12" r="4" /><path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" /></svg>);
}
function MoonIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M20 14.2A8.5 8.5 0 1 1 9.8 4 7 7 0 0 0 20 14.2Z" /></svg>);
}
