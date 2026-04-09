import { useMemo } from 'react';
import { getDetailedAnalytics } from '../lib/analytics';
import { getReadStats } from '../hooks/useScrollQuirks';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/about': 'About',
  '/projects': 'Projects',
  '/contact': 'Contact',
  '/tldr': 'TLDR',
};

function fmt(ms: number): string {
  if (ms < 1000) return '< 1s';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

// ── Stat card ──
function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">{label}</p>
      <p className="text-[15px] font-bold text-white/80 leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{value}</p>
      {sub && <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Horizontal bar chart ──
function BarChart({ items, accent, maxLabel = '' }: {
  items: { label: string; value: number; display: string }[];
  accent: string;
  maxLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[11px] text-white/30 w-16 shrink-0 text-right truncate">{item.label}</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: hexToRgba(accent, 0.08) }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: `linear-gradient(90deg, ${hexToRgba(accent, 0.5)}, ${hexToRgba(accent, 0.25)})`,
              }}
            />
          </div>
          <span className="text-[11px] text-white/30 w-12 shrink-0">{item.display}</span>
        </div>
      ))}
      {maxLabel && <p className="text-[9px] text-white/15 text-right">{maxLabel}</p>}
    </div>
  );
}

// ── Donut arc (sections read/skipped) ──
function DonutChart({ read, skipped, total, accent }: { read: number; skipped: number; total: number; accent: string }) {
  const r = 28;
  const cx = 36;
  const cy = 36;
  const circ = 2 * Math.PI * r;
  const readFrac = total > 0 ? read / total : 0;
  const skipFrac = total > 0 ? skipped / total : 0;
  const neither = 1 - readFrac - skipFrac;

  const readDash = readFrac * circ;
  const skipDash = skipFrac * circ;
  const neitherDash = neither * circ;

  // Offsets: start from top (rotate -90deg via transform)
  const readOffset = 0;
  const skipOffset = readDash;
  const neitherOffset = readDash + skipDash;

  return (
    <div className="flex items-center gap-4">
      <svg width="72" height="72" viewBox="0 0 72 72">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
        {/* Read */}
        {read > 0 && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={hexToRgba(accent, 0.7)} strokeWidth="8"
            strokeDasharray={`${readDash} ${circ - readDash}`}
            strokeDashoffset={-readOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
          />
        )}
        {/* Skipped */}
        {skipped > 0 && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="rgba(239,68,68,0.4)" strokeWidth="8"
            strokeDasharray={`${skipDash} ${circ - skipDash}`}
            strokeDashoffset={-skipOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
          />
        )}
        {/* Neither (unseen) */}
        {neither > 0.01 && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="8"
            strokeDasharray={`${neitherDash} ${circ - neitherDash}`}
            strokeDashoffset={-neitherOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="bold">
          {total > 0 ? Math.round(readFrac * 100) : 0}%
        </text>
      </svg>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hexToRgba(accent, 0.7) }} />
          <span className="text-[11px] text-white/40">{read} read</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400/40 shrink-0" />
          <span className="text-[11px] text-white/40">{skipped} skipped</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/10 shrink-0" />
          <span className="text-[11px] text-white/40">{total - read - skipped} unseen</span>
        </div>
      </div>
    </div>
  );
}

// ── Hour-of-day sparkline ──
function HourChart({ hours, accent }: { hours: number[]; accent: string }) {
  const bins = Array(24).fill(0);
  hours.forEach((h) => bins[h]++);
  const max = Math.max(...bins, 1);
  const w = 280;
  const h = 32;
  const barW = w / 24;

  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-white/20 mb-1.5">visits by hour of day</p>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        {bins.map((count, i) => {
          const barH = max > 0 ? (count / max) * (h - 4) : 0;
          return (
            <rect
              key={i}
              x={i * barW + 1}
              y={h - barH}
              width={barW - 2}
              height={barH}
              rx="1"
              fill={count > 0 ? hexToRgba(accent, 0.35 + (count / max) * 0.45) : hexToRgba(accent, 0.05)}
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-[9px] text-white/15 mt-1">
        <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
      </div>
    </div>
  );
}

// ── Session sparkline (durations) ──
function SessionSparkline({ durations, accent }: { durations: number[]; accent: string }) {
  if (durations.length < 2) return null;
  const recent = durations.slice(-20);
  const max = Math.max(...recent, 1);
  const w = 280;
  const h = 28;
  const step = w / (recent.length - 1);

  const points = recent.map((d, i) => {
    const x = i * step;
    const y = h - (d / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-white/20 mb-1.5">session lengths (recent)</p>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline
          points={points}
          fill="none"
          stroke={hexToRgba(accent, 0.4)}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {recent.map((d, i) => (
          <circle
            key={i}
            cx={i * step}
            cy={h - (d / max) * (h - 4) - 2}
            r="2.5"
            fill={hexToRgba(accent, 0.6)}
          />
        ))}
      </svg>
      <div className="flex justify-between text-[9px] text-white/15 mt-1">
        <span>oldest</span><span>most recent</span>
      </div>
    </div>
  );
}

// ── Main export ──
export default function StatsPanel({ accent }: { accent: string }) {
  const analytics = useMemo(() => getDetailedAnalytics(), []);
  const scrollStats = useMemo(() => getReadStats(), []);

  const pageTimeItems = Object.entries(analytics.pageTimings)
    .map(([page, ms]) => ({
      label: PAGE_LABELS[page] ?? page,
      value: ms,
      display: fmt(ms),
    }))
    .sort((a, b) => b.value - a.value);

  const pageViewItems = analytics.topPages.map((p) => ({
    label: PAGE_LABELS[p.page] ?? p.page,
    value: p.views,
    display: `${p.views}x`,
  }));

  const mostActiveHour = analytics.visitHours.length > 0
    ? (() => {
        const bins = Array(24).fill(0);
        analytics.visitHours.forEach((h) => bins[h]++);
        const peak = bins.indexOf(Math.max(...bins));
        const suffix = peak >= 12 ? 'pm' : 'am';
        return `${peak % 12 || 12}${suffix}`;
      })()
    : '—';

  const avgVisitsPerDay = analytics.daysSinceFirst > 0
    ? (analytics.totalSessions / Math.max(analytics.daysSinceFirst, 1)).toFixed(1)
    : analytics.totalSessions.toString();

  return (
    <div className="space-y-5 mt-2 pb-2">

      {/* ── Row 1: top-level KPIs ── */}
      <div className="grid grid-cols-3 gap-2">
        <Card label="total visits" value={String(analytics.totalSessions)} sub={`${avgVisitsPerDay}/day avg`} />
        <Card label="total time" value={fmt(analytics.totalTimeOnSite)} sub="on this site" />
        <Card label="page views" value={String(analytics.totalPageViews)} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card label="avg session" value={fmt(analytics.averageSessionDuration)} />
        <Card label="longest" value={fmt(analytics.longestSession)} sub="session" />
        <Card label="shortest" value={fmt(analytics.shortestSession)} sub="session" />
      </div>

      {/* ── Row 2: engagement ── */}
      <div className="grid grid-cols-4 gap-2">
        <Card label="theme toggles" value={String(analytics.themeToggleCount)} />
        <Card label="filter clicks" value={String(analytics.projectFilterCount)} />
        <Card label="link clicks" value={String(analytics.linkClickCount)} />
        <Card label="messages" value={String(analytics.totalMessages)} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card label="scroll flips" value={String(scrollStats.scrollBackCount)} sub="direction changes" />
        <Card label="peak hour" value={mostActiveHour} sub="most visits" />
        <Card label="since first visit" value={analytics.daysSinceFirst === 0 ? 'today' : `${analytics.daysSinceFirst}d`} sub={fmtDate(analytics.firstVisit)} />
      </div>

      {/* ── Section read donut ── */}
      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[9px] uppercase tracking-widest text-white/20 mb-3">section engagement</p>
        <DonutChart
          read={scrollStats.read}
          skipped={scrollStats.skipped}
          total={scrollStats.total}
          accent={accent}
        />
      </div>

      {/* ── Time per page bar ── */}
      {pageTimeItems.length > 0 && (
        <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[9px] uppercase tracking-widest text-white/20 mb-3">time spent per page</p>
          <BarChart items={pageTimeItems} accent={accent} />
        </div>
      )}

      {/* ── Page views bar ── */}
      {pageViewItems.length > 0 && (
        <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[9px] uppercase tracking-widest text-white/20 mb-3">page visit count</p>
          <BarChart items={pageViewItems} accent={accent} />
        </div>
      )}

      {/* ── Hour of day chart ── */}
      {analytics.visitHours.length > 0 && (
        <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <HourChart hours={analytics.visitHours} accent={accent} />
        </div>
      )}

      {/* ── Session sparkline ── */}
      {analytics.sessionDurations.length >= 2 && (
        <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <SessionSparkline durations={analytics.sessionDurations} accent={accent} />
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between text-[9px] text-white/15 pt-1">
        <span>first: {fmtDate(analytics.firstVisit)}</span>
        <span>all data is local · nothing leaves your browser</span>
        <span>last: {fmtDate(analytics.lastVisit)}</span>
      </div>
    </div>
  );
}
