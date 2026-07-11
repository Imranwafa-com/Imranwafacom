// ============================================================
// Interactive data-viz primitives for the Specimen Sheet.
// Ported from the Claude Design handoff (charts.jsx).
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { REDUCED, useReveal, useTween } from "./motion";
import { emitTap } from "./microtaps";
import { tpl } from "./utils";
import { COPY } from "./copy";

// useCount — animated number tween (easeOutCubic)
function useCount(target: number, duration = 1200, start = false): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    const t0 = Date.now();
    const to = +target || 0;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      setN(to * ease(p));
      if (p >= 1) clearInterval(id);
    }, 33);
    return () => clearInterval(id);
  }, [target, duration, start]);
  return n;
}

function fmtNum(n: number, digits = 0): string {
  if (digits) return n.toFixed(digits);
  return Math.round(n).toString();
}

// ── Sparkline — hover scrub + tooltip ───────────────────────
interface SparklineProps {
  data: number[];
  w?: number;
  h?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  labels?: (string | number)[];
  pulse?: boolean;
}
export function Sparkline({ data, w = 120, h = 28, stroke = "currentColor", fill = "none", strokeWidth = 1.25, labels, pulse = false }: SparklineProps) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [wrapRef, shown] = useReveal<HTMLSpanElement>(0.3);

  const { path, points, lastX, lastY } = useMemo(() => {
    if (!data || !data.length) return { path: "", points: [] as { x: number; y: number; v: number }[], lastX: 0, lastY: 0 };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const step = w / (data.length - 1 || 1);
    const pts = data.map((v, i) => ({ x: i * step, y: h - ((v - min) / span) * h, v }));
    const p = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
    return { path: p, points: pts, lastX: pts[pts.length - 1].x, lastY: pts[pts.length - 1].y };
  }, [data, w, h]);

  const onMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * w;
    let nearest = 0, minD = Infinity;
    points.forEach((p, i) => { const d = Math.abs(p.x - x); if (d < minD) { minD = d; nearest = i; } });
    setHover(nearest);
  };

  return (
    <span className="sparkline-wrap" ref={wrapRef}>
      <svg ref={svgRef} className="sparkline" width={w} height={h} viewBox={`0 0 ${w} ${h}`} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <path
          className={"spark-path" + (shown || REDUCED ? " drawn" : "")}
          pathLength={1}
          d={path}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={lastX} cy={lastY} r="2" fill={stroke} />
        {pulse && !REDUCED && shown && path && (
          <circle className="spark-pulse" r={1.9} fill={stroke}>
            <animateMotion dur="3.4s" repeatCount="indefinite" path={path} />
          </circle>
        )}
        {hover !== null && points[hover] && (
          <>
            <line x1={points[hover].x} x2={points[hover].x} y1={0} y2={h} stroke={stroke} strokeOpacity="0.3" strokeDasharray="2 2" />
            <circle cx={points[hover].x} cy={points[hover].y} r="3" fill={stroke} stroke="var(--paper)" strokeWidth="1.5" />
          </>
        )}
      </svg>
      {hover !== null && points[hover] && (
        <span className="spark-tip" style={{ left: points[hover].x }}>
          {labels?.[hover] ? `${labels[hover]} · ` : ""}{points[hover].v}
        </span>
      )}
    </span>
  );
}

// ── BarRow — animated fill on reveal, hover highlight ───────
interface BarRowProps {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  barColor?: string;
  onClick?: () => void;
  active?: boolean;
  animate?: boolean;
}
export function BarRow({ label, value, max, suffix = "", barColor = "var(--accent)", onClick, active, animate = true }: BarRowProps) {
  const [ref, seen] = useReveal<HTMLDivElement>(0.15);
  const tw = useTween(seen, 0, 700);
  const pct = Math.round((value / (max || 1)) * 100);
  const w = animate ? pct * tw : pct;
  const handle = onClick || (() => emitTap(`${label}: ${value}${suffix}`));
  return (
    <div ref={ref} className={"bar-row bar-clickable" + (active ? " bar-active" : "")} onClick={handle}
      role="button" tabIndex={0} aria-label={`${label}: ${value}${suffix}`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handle(); } }}>
      <div className="bar-label">{label}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${w}%`, background: active ? "var(--accent)" : barColor }} />
      </div>
      <div className="bar-value">{value}{suffix}</div>
    </div>
  );
}

// ── Donut — hover slices with tooltip ───────────────────────
interface DonutDatum { label: string; value: number; color?: string }
interface DonutProps { data: DonutDatum[]; size?: number; thickness?: number; onSliceHover?: (i: number | null) => void }
export function Donut({ data, size = 110, thickness = 14, onSliceHover }: DonutProps) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
          <circle r={r} fill="none" stroke="var(--rule)" strokeWidth={thickness} />
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            /* 2px gap between slices so adjacent segments read as distinct */
            const dasharray = `${Math.max(0, len - 2)} ${c - len + 2}`;
            const isHover = hover === i;
            const expanded = thickness + 5;
            const announce = () => emitTap(tpl(COPY.viz.donut, { label: d.label, value: d.value }));
            const el = (
              <circle
                key={i}
                r={r}
                fill="none"
                stroke={d.color || "var(--accent)"}
                strokeWidth={isHover ? expanded : thickness}
                strokeDasharray={dasharray}
                strokeDashoffset={-offset}
                style={{ transition: "stroke-width 200ms", cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`${d.label}: ${d.value}%`}
                onFocus={() => { setHover(i); onSliceHover?.(i); }}
                onBlur={() => { setHover(null); onSliceHover?.(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); announce(); } }}
                onMouseEnter={() => { setHover(i); onSliceHover?.(i); }}
                onMouseLeave={() => { setHover(null); onSliceHover?.(null); }}
                onClick={announce}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        {hover !== null ? (
          <>
            <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="donut-center-sm">{data[hover].label}</text>
            <text x={size / 2} y={size / 2 + 18} textAnchor="middle" className="donut-center">{data[hover].value}<tspan className="pct" dx="2">%</tspan></text>
          </>
        ) : (
          <>
            <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="donut-center-sm">total</text>
            <text x={size / 2} y={size / 2 + 18} textAnchor="middle" className="donut-center">{total}<tspan className="pct" dx="2">%</tspan></text>
          </>
        )}
      </svg>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div
            key={i}
            className={"legend-row" + (hover === i ? " legend-active" : "") + (hover !== null && hover !== i ? " legend-dim" : "")}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => emitTap(tpl(COPY.viz.donut, { label: d.label, value: d.value }))}
            style={{ cursor: "pointer" }}
          >
            <span className="dot" style={{ background: d.color || "var(--accent)" }} />
            <span className="legend-k">{d.label}</span>
            <span className="legend-v">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Heatmap — hover detail tooltip + click to pin ───────────
interface HeatCell { w: number; d: number; level: number; commits: number; date: Date }
export function Heatmap({ weeks = 26, seed = 42 }: { weeks?: number; seed?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  // Escape releases a pinned tooltip — clicking the exact same cell shouldn't
  // be the only way out.
  useEffect(() => {
    if (pinned === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPinned(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned]);

  const cells = useMemo<HeatCell[]>(() => {
    let s = seed;
    const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const days = 7;
    const out: HeatCell[] = [];
    const today = new Date();
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < days; d++) {
        const weekend = (d === 0 || d === 6) ? 0.45 : 1;
        const recency = 0.5 + (w / weeks) * 0.7;
        const rv = rng() * weekend * recency;
        let level = 0;
        if (rv > 0.20) level = 1;
        if (rv > 0.40) level = 2;
        if (rv > 0.62) level = 3;
        if (rv > 0.82) level = 4;
        const commits = level === 0 ? 0 : Math.round(rv * 12 + level);
        const ago = (weeks - 1 - w) * 7 + (6 - d);
        const date = new Date(today.getTime() - ago * 86400000);
        out.push({ w, d, level, commits, date });
      }
    }
    return out;
  }, [weeks, seed]);

  const cell = 11;
  const gap = 3;
  const W = weeks * (cell + gap);
  const H = 7 * (cell + gap);
  const totalCommits = cells.reduce((a, c) => a + c.commits, 0);
  const activeDays = cells.filter((c) => c.level > 0).length;
  const detail = pinned !== null ? cells[pinned] : (hover !== null ? cells[hover] : null);

  return (
    <div className="heatmap-container">
      <div className="heatmap-summary">
        <span><strong>{totalCommits}</strong> commits · <strong>{activeDays}</strong> active days</span>
        {detail && (
          <span className="heatmap-detail">
            {detail.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            : <strong>{detail.commits}</strong> commits
          </span>
        )}
      </div>
      <svg className="heatmap" width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {cells.map((c, i) => (
          <rect
            key={i}
            x={c.w * (cell + gap)}
            y={c.d * (cell + gap)}
            width={cell}
            height={cell}
            rx={1}
            className={`hm hm-${c.level}` + (hover === i || pinned === i ? " hm-hover" : "")}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => {
              setPinned(pinned === i ? null : i);
              const date = c.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              emitTap(tpl(c.commits ? COPY.viz.heatmap : COPY.viz.heatmapEmpty, { date, commits: c.commits }));
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// ── Stat — live count-up + sparkline + delta ────────────────
interface StatProps {
  label: string;
  value: number | string;
  unit?: string;
  delta?: number;
  trend?: number[];
  digits?: number;
}
export function Stat({ label, value, unit, delta, trend, digits = 0 }: StatProps) {
  const [ref, seen] = useReveal<HTMLDivElement>(0.2);
  const target = typeof value === "number" ? value : parseFloat(value) || 0;
  const animated = useCount(target, 1400, seen);
  const display = typeof value === "string" && isNaN(parseFloat(value)) ? value : fmtNum(animated, digits);
  const up = !!delta && delta > 0;
  return (
    <div
      className="stat-card"
      ref={ref}
      style={{ cursor: "pointer" }}
      onClick={() => emitTap(tpl(COPY.viz.stat, { label, value: String(value), unit: unit ? ` ${unit}` : "" }))}
    >
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        <span className="num">{display}</span>
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="stat-bottom">
        {trend && <Sparkline data={trend} w={64} h={18} stroke="var(--accent)" pulse />}
        {delta !== undefined && (
          <span className={"delta " + (up ? "up" : "down")}>
            {up ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── LineChart — animated draw + hover crosshair tooltip ─────
interface LineSeries { label: string; color?: string; data: { x: number; y: number }[] }
interface LineChartProps { series: LineSeries[]; w?: number; h?: number; padding?: number; yMax?: number }
export function LineChart({ series, w = 600, h = 200, padding = 32, yMax }: LineChartProps) {
  const [ref, seen] = useReveal<HTMLDivElement>(0.2);
  const draw = useTween(seen, 150, 1400);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const allX = series.flatMap((s) => s.data.map((p) => p.x));
  const allY = series.flatMap((s) => s.data.map((p) => p.y));
  const xMin = Math.min(...allX);
  const xMax = Math.max(...allX);
  const yLo = 0;
  const yHi = yMax || Math.max(...allY) * 1.1;

  const sx = (x: number) => padding + ((x - xMin) / (xMax - xMin || 1)) * (w - padding * 2);
  const sy = (y: number) => h - padding - ((y - yLo) / (yHi - yLo || 1)) * (h - padding * 2);

  const yTicks = 4;
  const xTickValues = Array.from(new Set(allX)).sort((a, b) => a - b);

  const onMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * w;
    let nearest = xTickValues[0], minD = Infinity;
    xTickValues.forEach((xv) => { const d = Math.abs(sx(xv) - x); if (d < minD) { minD = d; nearest = xv; } });
    setHover(nearest);
  };

  return (
    <div className="line-chart-wrap" ref={ref}>
      <svg ref={svgRef} className="line-chart" width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padding + (i / yTicks) * (h - padding * 2);
          const v = Math.round(yHi - (i / yTicks) * (yHi - yLo));
          return (
            <g key={"y" + i}>
              <line x1={padding} x2={w - padding} y1={y} y2={y} stroke="var(--rule)" strokeDasharray="2 4" />
              <text x={padding - 6} y={y + 3} textAnchor="end" className="axis">{v}</text>
            </g>
          );
        })}
        {xTickValues.map((x, i) => (
          <text key={"x" + i} x={sx(x)} y={h - padding + 16} textAnchor="middle" className="axis">{x}</text>
        ))}
        {hover !== null && (
          <line x1={sx(hover)} x2={sx(hover)} y1={padding} y2={h - padding} stroke="var(--ink-3)" strokeDasharray="2 3" strokeOpacity="0.6" />
        )}
        {series.map((s, i) => {
          const path = s.data.map((p, j) => `${j === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
          return (
            <g key={i}>
              <path d={path} fill="none" stroke={s.color || "var(--accent)"} strokeWidth="1.5" strokeDasharray="2000" strokeDashoffset={(1 - draw) * 2000} />
              {s.data.map((p, j) => {
                const isHover = hover === p.x;
                return (
                  <circle
                    key={j}
                    cx={sx(p.x)} cy={sy(p.y)}
                    r={isHover ? 5 : 2.5}
                    fill={s.color || "var(--accent)"}
                    stroke={isHover ? "var(--paper)" : "none"}
                    strokeWidth={isHover ? 2 : 0}
                    style={{ transition: "r 150ms", cursor: "pointer" }}
                    opacity={draw}
                    onClick={() => emitTap(tpl(COPY.viz.line, { label: s.label, value: p.y }))}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="chart-tooltip" style={{ left: `clamp(56px, ${(sx(hover) / w) * 100}%, calc(100% - 56px))` }}>
          <div className="tt-title">{hover}</div>
          {series.map((s, i) => {
            const pt = s.data.find((p) => p.x === hover);
            if (!pt) return null;
            return (
              <div className="tt-row" key={i}>
                <span className="tt-dot" style={{ background: s.color || "var(--accent)" }} />
                <span className="tt-label">{s.label}</span>
                <span className="tt-val">{pt.y}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── TagCloud — clickable, drives external filter ────────────
interface TagCloudProps {
  tags: { name: string; weight: number }[];
  onSelect?: (name: string | null) => void;
  selected?: string | null;
}
export function TagCloud({ tags, onSelect, selected }: TagCloudProps) {
  return (
    <div className="tag-cloud">
      {tags.map((t, i) => {
        const isSel = selected === t.name;
        const dim = selected && !isSel;
        return (
          <span
            key={i}
            className={`tag tag-w${t.weight}${isSel ? " tag-sel" : ""}${dim ? " tag-dim" : ""}`}
            onClick={() => onSelect && onSelect(isSel ? null : t.name)}
          >
            {t.name}
          </span>
        );
      })}
    </div>
  );
}

// ── RadarChart — capability profile (animated polygon draw) ─
interface RadarDatum { axis: string; value: number }
export function RadarChart({ data, size = 230, levels = 4 }: { data: RadarDatum[]; size?: number; levels?: number }) {
  const [ref, seen] = useReveal<HTMLDivElement>(0.2);
  const t = useTween(seen, 150, 1100);
  const [hover, setHover] = useState<number | null>(null);
  const cx = size / 2, cy = size / 2, R = size / 2 - 38;
  const n = data.length;
  const angle = (i: number) => -Math.PI / 2 + i * ((2 * Math.PI) / n);
  const pt = (i: number, rad: number): [number, number] => [cx + Math.cos(angle(i)) * rad, cy + Math.sin(angle(i)) * rad];
  const ring = (lvl: number) => data.map((_, i) => pt(i, R * (lvl / levels)).join(",")).join(" ");
  const areaPts = data.map((d, i) => pt(i, R * d.value * t).join(",")).join(" ");
  return (
    <div className="radar-wrap" ref={ref}>
      <svg width="100%" viewBox={`-46 0 ${size + 92} ${size}`} className="radar" preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: levels }).map((_, l) => (
          <polygon key={l} className="radar-grid" points={ring(l + 1)} />
        ))}
        {data.map((d, i) => {
          const [ex, ey] = pt(i, R);
          const [lx, ly] = pt(i, R + 18);
          return (
            <g key={i}>
              <line className="radar-spoke" x1={cx} y1={cy} x2={ex} y2={ey} />
              <text className="radar-axis-label" x={lx} y={ly} textAnchor={Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end"} dominantBaseline="middle">{d.axis}</text>
            </g>
          );
        })}
        <polygon className="radar-area" points={areaPts} style={{ opacity: t }} />
        {data.map((d, i) => {
          const [px, py] = pt(i, R * d.value * t);
          const announce = () => emitTap(tpl(COPY.viz.radar, { axis: d.axis, value: Math.round(d.value * 100) }));
          return <circle key={i} className={"radar-vertex" + (hover === i ? " on" : "")} cx={px} cy={py} r={hover === i ? 5 : 3} style={{ cursor: "pointer" }}
            tabIndex={0} role="button" aria-label={`${d.axis}: ${Math.round(d.value * 100)}`}
            onFocus={() => setHover(i)} onBlur={() => setHover(null)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); announce(); } }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={announce} />;
        })}
        {hover !== null && (() => {
          const [px, py] = pt(hover, R * data[hover].value * t);
          return <text className="radar-val" x={px} y={py - 11} textAnchor="middle">{Math.round(data[hover].value * 100)}</text>;
        })()}
      </svg>
    </div>
  );
}

// ── BubbleChart — project landscape (LoC × files × commits) ─
interface BubbleDatum { label: string; x: number; y: number; r: number }
export function BubbleChart({ data, w = 560, h = 300, padding = 46, xLabel = "LINES OF CODE", yLabel = "FILES" }: {
  data: BubbleDatum[]; w?: number; h?: number; padding?: number; xLabel?: string; yLabel?: string;
}) {
  const [ref, seen] = useReveal<HTMLDivElement>(0.2);
  const t = useTween(seen, 150, 1100);
  const [hover, setHover] = useState<number | null>(null);
  const xMax = Math.max(1, ...data.map((d) => d.x)) * 1.12;
  const yMax = Math.max(1, ...data.map((d) => d.y)) * 1.2;
  const rMax = Math.max(...data.map((d) => d.r));
  const sx = (x: number) => padding + (x / (xMax || 1)) * (w - padding * 1.4);
  const sy = (y: number) => h - padding - (y / (yMax || 1)) * (h - padding * 1.7);
  const sr = (r: number) => 9 + (r / (rMax || 1)) * 26;
  return (
    <div className="bubble-wrap" ref={ref}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="bubble-chart" preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: 4 }).map((_, i) => {
          const yy = padding + (i / 3) * (h - padding * 1.7);
          const v = Math.round(yMax - (i / 3) * yMax);
          return (
            <g key={i}>
              <line className="bubble-grid" x1={padding} x2={w - 10} y1={yy} y2={yy} />
              <text className="axis" x={padding - 6} y={yy + 3} textAnchor="end">{v}</text>
            </g>
          );
        })}
        <text className="bubble-axislabel" x={w - 10} y={h - padding + 24} textAnchor="end">{xLabel} →</text>
        <text className="bubble-axislabel" x={padding - 4} y={padding - 16} textAnchor="start">↑ {yLabel}</text>
        {data.map((d, i) => {
          const on = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => emitTap(tpl(COPY.viz.bubble, { label: d.label, loc: (d.x / 1000).toFixed(1), files: d.y, commits: d.r }))} style={{ cursor: "pointer" }}>
              <circle className={"bubble" + (on ? " on" : "")} cx={sx(d.x)} cy={sy(d.y)} r={sr(d.r) * t} />
              <text className="bubble-label" x={sx(d.x)} y={sy(d.y) + 3} textAnchor="middle" style={{ opacity: t }}>{d.label.slice(0, 2)}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="chart-tooltip" style={{ left: `${(sx(data[hover].x) / w) * 100}%`, top: 8 }}>
          <div className="tt-title">{data[hover].label}</div>
          <div className="tt-row"><span /><span className="tt-label">LoC</span><span className="tt-val">{(data[hover].x / 1000).toFixed(1)}k</span></div>
          <div className="tt-row"><span /><span className="tt-label">Files</span><span className="tt-val">{data[hover].y}</span></div>
          <div className="tt-row"><span /><span className="tt-label">Commits</span><span className="tt-val">{data[hover].r}</span></div>
        </div>
      )}
    </div>
  );
}

// ── RadialGauge — animated arc gauge with count-up center ───
export function RadialGauge({ label, value, unit = "%", digits = 0, size = 124 }: {
  label: string; value: number; unit?: string; digits?: number; size?: number;
}) {
  const [ref, seen] = useReveal<HTMLDivElement>(0.3);
  const t = useTween(seen, 120, 1200);
  const n = useCount(value, 1300, seen);
  const r = (size - 18) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const visible = 0.75;
  return (
    <div
      className="gauge"
      ref={ref}
      style={{ cursor: "pointer" }}
      onClick={() => emitTap(tpl(COPY.viz.gauge, { label, value: digits ? value.toFixed(digits) : Math.round(value), unit }))}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(135 ${cx} ${cy})`}>
          <circle className="gauge-track" cx={cx} cy={cy} r={r} fill="none" strokeWidth={8} strokeDasharray={`${visible * C} ${C}`} strokeLinecap="round" />
          <circle className="gauge-val" cx={cx} cy={cy} r={r} fill="none" strokeWidth={8} strokeDasharray={`${visible * C * (value / 100) * t} ${C}`} strokeLinecap="round" />
        </g>
        <text className="gauge-num" x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
          {digits ? n.toFixed(digits) : Math.round(n)}<tspan className="gauge-unit">{unit}</tspan>
        </text>
      </svg>
      <div className="gauge-label">{label}</div>
    </div>
  );
}

// ── WaffleChart — proportional 10×10 grid (sweep-fill) ──────
interface WaffleDatum { label: string; value: number; color: string }
export function WaffleChart({ data }: { data: WaffleDatum[] }) {
  const [ref, seen] = useReveal<HTMLDivElement>(0.25);
  const t = useTween(seen, 100, 1300);
  const [hover, setHover] = useState<string | null>(null);
  const cells: { color: string; label: string }[] = [];
  data.forEach((d) => { for (let i = 0; i < Math.round(d.value); i++) cells.push({ color: d.color, label: d.label }); });
  while (cells.length < 100) cells.push({ color: "var(--rule)", label: "" });
  cells.length = 100;
  return (
    <div className="waffle-wrap" ref={ref}>
      <div className="waffle-grid">
        {cells.map((c, i) => {
          const reveal = Math.max(0, Math.min(1, (t * 130 - i) / 10));
          const dim = hover && c.label && c.label !== hover ? 0.22 : 1; // never dim empty filler cells — the grid must stay legible
          return (
            <span
              key={i}
              className="waffle-cell"
              style={{ background: c.color, opacity: reveal * dim, cursor: c.label ? "pointer" : "default" }}
              onMouseEnter={() => c.label && setHover(c.label)}
              onMouseLeave={() => setHover(null)}
              onClick={() => c.label && emitTap(tpl(COPY.viz.waffle, { label: c.label }))}
              title={c.label}
            />
          );
        })}
      </div>
      <div className="waffle-legend">
        {data.map((d) => (
          <div
            key={d.label}
            className={"waffle-leg" + (hover && hover !== d.label ? " dim" : "")}
            onMouseEnter={() => setHover(d.label)}
            onMouseLeave={() => setHover(null)}
            onClick={() => emitTap(tpl(COPY.viz.waffle, { label: d.label }))}
            style={{ cursor: "pointer" }}
          >
            <span className="dot" style={{ background: d.color }} />
            <span className="lk">{d.label}</span>
            <span className="lv">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
