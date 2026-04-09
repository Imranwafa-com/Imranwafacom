import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnalyticsSummary, type AnalyticsSummary } from '../lib/analytics';

const PAGE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/about': 'About',
  '/projects': 'Projects',
  '/contact': 'Contact',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return '< 1s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function formatDate(iso: string): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getQuickestSkip(summary: AnalyticsSummary): string | null {
  const pageViewEvents = summary.recentEvents.filter(
    e => e.type === 'page_view' && e.duration && e.page
  );
  if (pageViewEvents.length === 0) return null;

  const quickest = pageViewEvents.reduce((min, e) =>
    (e.duration! < min.duration!) ? e : min
  );

  if (quickest.duration! < 5000) {
    return `${PAGE_LABELS[quickest.page!] || quickest.page} (${formatDuration(quickest.duration!)})`;
  }
  return null;
}

export default function StatsOverlay() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const buffer = useRef('');
  const bufferTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input/textarea/contenteditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // If overlay is open, close on Escape
    if (open && e.key === 'Escape') {
      setOpen(false);
      return;
    }

    // Build up the "stats" buffer
    if (e.key.length === 1) {
      buffer.current += e.key.toLowerCase();

      // Reset buffer after 2 seconds of no typing
      if (bufferTimer.current) clearTimeout(bufferTimer.current);
      bufferTimer.current = setTimeout(() => {
        buffer.current = '';
      }, 2000);

      // Check if buffer ends with "stats"
      if (buffer.current.endsWith('stats')) {
        buffer.current = '';
        const summary = getAnalyticsSummary();
        setStats(summary);
        setOpen(prev => !prev);
      }
    }
  }, [open]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      if (bufferTimer.current) clearTimeout(bufferTimer.current);
    };
  }, [handleKeydown]);

  const quickSkip = stats ? getQuickestSkip(stats) : null;

  return (
    <AnimatePresence>
      {open && stats && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Stats Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(10, 10, 20, 0.85)',
                backdropFilter: 'blur(40px) saturate(1.5)',
                border: '1px solid rgba(103, 232, 249, 0.12)',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(103, 232, 249, 0.05)',
              }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-cyan-400/60 font-medium mb-1">
                      secret menu
                    </p>
                    <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      Your Stats
                    </h2>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-white/30 mt-2">
                  you found this by typing "stats" — nice one
                </p>
              </div>

              {/* Stats Grid */}
              <div className="px-6 py-5 grid grid-cols-2 gap-4">
                <StatCard
                  label="Total Visits"
                  value={String(stats.totalSessions)}
                  icon="👁"
                />
                <StatCard
                  label="Pages Viewed"
                  value={String(stats.totalPageViews)}
                  icon="📄"
                />
                <StatCard
                  label="Avg. Session"
                  value={formatDuration(stats.averageSessionDuration)}
                  icon="⏱"
                />
                <StatCard
                  label="Messages Sent"
                  value={String(stats.totalMessages)}
                  icon="💬"
                />
              </div>

              {/* Top Pages */}
              {stats.topPages.length > 0 && (
                <div className="px-6 pb-4">
                  <p className="text-xs uppercase tracking-wider text-white/30 mb-3">
                    Most Visited Pages
                  </p>
                  <div className="space-y-2">
                    {stats.topPages.slice(0, 4).map((p, i) => (
                      <div
                        key={p.page}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/20 w-4">{i + 1}.</span>
                          <span className="text-sm text-white/70">
                            {PAGE_LABELS[p.page] || p.page}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400/40 to-blue-400/40"
                            style={{
                              width: `${Math.max(20, (p.views / stats.topPages[0].views) * 80)}px`,
                            }}
                          />
                          <span className="text-xs text-white/40 w-8 text-right">
                            {p.views}x
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick skip callout */}
              {quickSkip && (
                <div className="px-6 pb-4">
                  <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <p className="text-xs text-red-400/80">
                      ⚡ Quickest skip: <span className="text-red-300">{quickSkip}</span>
                    </p>
                    <p className="text-[10px] text-red-400/40 mt-1">ouch. that one hurt a little.</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between text-[10px] text-white/20">
                  <span>first visit: {formatDate(stats.firstVisit)}</span>
                  <span>all data is local — nothing leaves your browser</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-white/30">{label}</span>
      </div>
      <p className="text-lg font-semibold text-white/90" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        {value}
      </p>
    </div>
  );
}
