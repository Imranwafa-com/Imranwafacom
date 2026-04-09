import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTimePalette } from '../context/TimeContext';
import { getReadStats } from '../hooks/useScrollQuirks';
import { getAnalyticsSummary } from '../lib/analytics';
import StatsPanelFull from './StatsPanel';
import config from '../lib/config';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Command definitions ──
interface Command {
  name: string;
  aliases: string[];
  description: string;
  icon: string;
}

const COMMANDS: Command[] = [
  { name: 'stats', aliases: ['stat', 'analytics', 'data'], description: config.commandPalette.commandDescriptions.stats, icon: '>' },
  { name: 'tldr', aliases: ['tl;dr', 'summary', 'short'], description: config.commandPalette.commandDescriptions.tldr, icon: '>' },
  { name: 'txt', aliases: ['text', 'msg', 'message', 'contact', 'phone'], description: config.commandPalette.commandDescriptions.txt, icon: '>' },
  { name: 'email', aliases: ['mail', 'em'], description: config.commandPalette.commandDescriptions.email, icon: '>' },
  { name: 'secret', aliases: ['secrets', 'shortcuts', 'help', 'commands', '?', 'menu'], description: config.commandPalette.commandDescriptions.secret, icon: '>' },
  { name: 'home', aliases: ['back', 'index'], description: config.commandPalette.commandDescriptions.home, icon: '>' },
  { name: 'about', aliases: ['bio', 'me', 'who'], description: config.commandPalette.commandDescriptions.about, icon: '>' },
  { name: 'projects', aliases: ['work', 'portfolio', 'proj'], description: config.commandPalette.commandDescriptions.projects, icon: '>' },
  { name: 'github', aliases: ['gh', 'repo', 'code', 'source'], description: config.commandPalette.commandDescriptions.github, icon: '>' },
  { name: 'linkedin', aliases: ['li', 'connect'], description: config.commandPalette.commandDescriptions.linkedin, icon: '>' },
  { name: 'clear', aliases: ['cls', 'close', 'exit', 'quit', 'q'], description: config.commandPalette.commandDescriptions.clear, icon: '>' },
];

// ── Levenshtein distance ──
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
      );
    }
  }
  return dp[m][n];
}

function findClosestCommand(input: string): string | null {
  let best: string | null = null;
  let bestDist = Infinity;

  for (const cmd of COMMANDS) {
    // Check name
    const d = levenshtein(input, cmd.name);
    if (d < bestDist) {
      bestDist = d;
      best = cmd.name;
    }
    // Check aliases
    for (const alias of cmd.aliases) {
      const da = levenshtein(input, alias);
      if (da < bestDist) {
        bestDist = da;
        best = cmd.name;
      }
    }
  }

  // Only suggest if within 3 edits and the input is short-ish
  if (best && bestDist <= 3 && input.length <= 12) return best;
  return null;
}

function resolveCommand(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  for (const cmd of COMMANDS) {
    if (cmd.name === normalized || cmd.aliases.includes(normalized)) return cmd.name;
  }
  return null;
}

// ── Stats sub-panel (legacy inline, replaced by StatsPanel.tsx) ──
// @ts-ignore
function _StatsPanel({ accent }: { accent: string }) {
  const scrollStats = getReadStats();
  const analytics = getAnalyticsSummary();

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return '< 1s';
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'visits', value: String(analytics.totalSessions) },
          { label: 'pages viewed', value: String(analytics.totalPageViews) },
          { label: 'avg session', value: formatDuration(analytics.averageSessionDuration) },
          { label: 'messages sent', value: String(analytics.totalMessages) },
          { label: 'sections read', value: `${scrollStats.read}/${scrollStats.total}` },
          { label: 'sections skipped', value: String(scrollStats.skipped) },
          { label: 'scroll reversals', value: String(scrollStats.scrollBackCount) },
          { label: 'first visit', value: analytics.firstVisit ? new Date(analytics.firstVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'today' },
        ].map((s) => (
          <div
            key={s.label}
            className="px-3 py-2 rounded-lg"
            style={{ background: hexToRgba(accent, 0.04), border: `1px solid ${hexToRgba(accent, 0.08)}` }}
          >
            <p className="text-[10px] uppercase tracking-wider" style={{ color: hexToRgba(accent, 0.4) }}>
              {s.label}
            </p>
            <p className="text-sm font-semibold text-white/80 mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/15 text-center">all data is local — nothing leaves your browser</p>
    </div>
  );
}

// ── Secret menu sub-panel ──
function SecretPanel({ accent }: { accent: string }) {
  const { secretSections } = config.commandPalette;
  const sections = [
    {
      title: secretSections.commands,
      items: COMMANDS.filter((c) => c.name !== 'clear').map((c) => ({
        key: c.name,
        desc: c.description,
      })),
    },
    {
      title: secretSections.shortcuts,
      items: secretSections.shortcutItems,
    },
    {
      title: secretSections.hidden,
      items: secretSections.hiddenItems,
    },
  ];

  return (
    <div className="space-y-4 mt-3">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: hexToRgba(accent, 0.4) }}>
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => (
              <div key={item.key} className="flex items-start gap-3">
                <code
                  className="text-[11px] px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: hexToRgba(accent, 0.06), color: hexToRgba(accent, 0.6) }}
                >
                  {item.key}
                </code>
                <span className="text-[12px] text-white/30">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Txt sub-panel ──
function TxtPanel({ accent, onNavigate }: { accent: string; onNavigate: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3 mt-3">
      <div
        className="px-4 py-3 rounded-xl"
        style={{ background: hexToRgba(accent, 0.04), border: `1px solid ${hexToRgba(accent, 0.08)}` }}
      >
        <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: hexToRgba(accent, 0.4) }}>
          phone
        </p>
        <a
          href={`tel:${config.commandPalette.phone.replace(/\D/g, '').replace(/^/, '+')}`}
          className="text-sm font-medium text-white/70 hover:text-white/90 transition-colors"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          {config.commandPalette.phone}
        </a>
      </div>
      <button
        onClick={() => {
          onNavigate();
          navigate('/contact');
        }}
        className="w-full text-left px-4 py-3 rounded-xl text-[13px] transition-all duration-300 hover:scale-[1.01]"
        style={{
          background: hexToRgba(accent, 0.06),
          border: `1px solid ${hexToRgba(accent, 0.1)}`,
          color: hexToRgba(accent, 0.6),
        }}
      >
        {config.commandPalette.txtChatLink}
      </button>
    </div>
  );
}

// ── Main component ──
type PanelView = 'input' | 'stats' | 'secret' | 'txt';

export default function CommandPalette() {
  const palette = useTimePalette();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [panelView, setPanelView] = useState<PanelView>('input');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const buffer = useRef('');
  const bufferTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const accent = palette.accent;

  const close = useCallback(() => {
    setOpen(false);
    setInput('');
    setFeedback(null);
    setPanelView('input');
  }, []);

  const executeCommand = useCallback(
    (cmd: string) => {
      switch (cmd) {
        case 'stats':
          setPanelView('stats');
          setFeedback(null);
          break;
        case 'tldr':
          close();
          navigate('/tldr');
          break;
        case 'txt':
          setPanelView('txt');
          setFeedback(null);
          break;
        case 'email':
          window.location.href = `mailto:${config.personal.email}`;
          close();
          break;
        case 'secret':
          setPanelView('secret');
          setFeedback(null);
          break;
        case 'home':
          close();
          navigate('/');
          break;
        case 'about':
          close();
          navigate('/about');
          break;
        case 'projects':
          close();
          navigate('/projects');
          break;
        case 'github':
          window.open(config.personal.github, '_blank');
          close();
          break;
        case 'linkedin':
          window.open(config.socialLinks.find((l) => l.platform === 'LinkedIn')?.url, '_blank');
          close();
          break;
        case 'clear':
          close();
          break;
      }
    },
    [close, navigate]
  );

  // Handle input changes with 1.5s debounce
  const handleInputChange = (value: string) => {
    setInput(value);
    setFeedback(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) return;

    debounceRef.current = setTimeout(() => {
      const resolved = resolveCommand(value);
      if (resolved) {
        executeCommand(resolved);
        setInput('');
      } else {
        // Not a valid command
        const trimmed = value.trim().toLowerCase();
        const wordCount = trimmed.split(/\s+/).length;

        if (wordCount <= 3) {
          const closest = findClosestCommand(trimmed);
          if (closest) {
            setFeedback(`"${trimmed}" doesn't exist. did you mean "${closest}"?`);
          } else {
            setFeedback(`"${trimmed}" doesn't exist.`);
          }
        } else {
          setFeedback(`that doesn't exist.`);
        }
      }
    }, 1500);
  };

  // Submit on Enter (instant, no debounce)
  const handleSubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const value = input.trim();
    if (!value) return;

    const resolved = resolveCommand(value);
    if (resolved) {
      executeCommand(resolved);
      setInput('');
    } else {
      const trimmed = value.toLowerCase();
      const wordCount = trimmed.split(/\s+/).length;
      if (wordCount <= 3) {
        const closest = findClosestCommand(trimmed);
        if (closest) {
          setFeedback(`"${trimmed}" doesn't exist. did you mean "${closest}"?`);
        } else {
          setFeedback(`"${trimmed}" doesn't exist.`);
        }
      } else {
        setFeedback(`that doesn't exist.`);
      }
    }
  };

  // Global keydown listener — open palette when user starts typing
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (open && e.key === 'Escape') {
        close();
        return;
      }

      // Build buffer for typing without the palette open
      if (!open && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        buffer.current += e.key.toLowerCase();
        if (bufferTimer.current) clearTimeout(bufferTimer.current);
        bufferTimer.current = setTimeout(() => {
          buffer.current = '';
        }, 2000);

        // Open palette when buffer has 2+ chars
        if (buffer.current.length >= 2) {
          setOpen(true);
          setInput(buffer.current);
          setPanelView('input');
          buffer.current = '';

          // Input's onChange debounce will handle validation
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      if (bufferTimer.current) clearTimeout(bufferTimer.current);
    };
  }, [open, close, input]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, scale: 0.98, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(8, 8, 16, 0.9)',
                backdropFilter: 'blur(40px) saturate(1.5)',
                border: `1px solid ${hexToRgba(accent, 0.12)}`,
                boxShadow: `0 30px 80px rgba(0, 0, 0, 0.6), 0 0 60px ${hexToRgba(accent, 0.04)}`,
              }}
            >
              {/* Input row */}
              <div
                className="flex items-center gap-3 px-5 py-4 border-b"
                style={{ borderColor: hexToRgba(accent, 0.06) }}
              >
                <span
                  className="text-sm font-mono shrink-0"
                  style={{ color: hexToRgba(accent, 0.5) }}
                >
                  &gt;
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                    if (e.key === 'Escape') close();
                  }}
                  placeholder={config.commandPalette.placeholder}
                  className="flex-1 bg-transparent text-[14px] text-white/80 placeholder-white/15 outline-none"
                  style={{ fontFamily: "'DM Sans', sans-serif", caretColor: accent }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd
                  className="text-[10px] px-1.5 py-0.5 rounded text-white/15 border border-white/[0.06] hidden sm:inline-block"
                >
                  esc
                </kbd>
              </div>

              {/* Content area */}
              <div className="px-5 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
                <AnimatePresence mode="wait">
                  {/* Feedback / error message */}
                  {panelView === 'input' && feedback && (
                    <motion.p
                      key="feedback"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-[13px] italic mb-3"
                      style={{ color: hexToRgba(accent, 0.4) }}
                    >
                      {feedback}
                    </motion.p>
                  )}

                  {/* Default: show available commands */}
                  {panelView === 'input' && !feedback && (
                    <motion.div
                      key="commands"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1"
                    >
                      {COMMANDS.filter((c) => c.name !== 'clear').map((cmd) => (
                        <button
                          key={cmd.name}
                          onClick={() => {
                            executeCommand(cmd.name);
                            setInput('');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 hover:bg-white/[0.03] group"
                        >
                          <code
                            className="text-[12px] px-1.5 py-0.5 rounded shrink-0 transition-colors"
                            style={{
                              background: hexToRgba(accent, 0.06),
                              color: hexToRgba(accent, 0.5),
                            }}
                          >
                            {cmd.name}
                          </code>
                          <span className="text-[12px] text-white/20 group-hover:text-white/35 transition-colors">
                            {cmd.description}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Stats panel */}
                  {panelView === 'stats' && (
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <button
                        onClick={() => setPanelView('input')}
                        className="text-[11px] text-white/20 hover:text-white/40 transition-colors mb-2"
                      >
                        {config.commandPalette.backText}
                      </button>
                      <h3
                        className="text-lg font-semibold text-white/85"
                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                      >
                        {config.commandPalette.statsHeading}
                      </h3>
                      <StatsPanelFull accent={accent} />
                    </motion.div>
                  )}

                  {/* Secret panel */}
                  {panelView === 'secret' && (
                    <motion.div
                      key="secret"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <button
                        onClick={() => setPanelView('input')}
                        className="text-[11px] text-white/20 hover:text-white/40 transition-colors mb-2"
                      >
                        {config.commandPalette.backText}
                      </button>
                      <h3
                        className="text-lg font-semibold text-white/85"
                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                      >
                        {config.commandPalette.secretHeading}
                      </h3>
                      <p className="text-[11px] text-white/20 italic">
                        {config.commandPalette.secretFoundText}
                      </p>
                      <SecretPanel accent={accent} />
                    </motion.div>
                  )}

                  {/* Txt panel */}
                  {panelView === 'txt' && (
                    <motion.div
                      key="txt"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <button
                        onClick={() => setPanelView('input')}
                        className="text-[11px] text-white/20 hover:text-white/40 transition-colors mb-2"
                      >
                        {config.commandPalette.backText}
                      </button>
                      <h3
                        className="text-lg font-semibold text-white/85"
                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                      >
                        {config.commandPalette.txtHeading}
                      </h3>
                      <TxtPanel accent={accent} onNavigate={close} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom hint */}
              <div
                className="px-5 py-3 flex items-center justify-between border-t"
                style={{ borderColor: hexToRgba(accent, 0.04) }}
              >
                <p className="text-[10px] text-white/12">
                  {config.commandPalette.hintTyping}
                </p>
                <p className="text-[10px] text-white/12">
                  {config.commandPalette.hintKeys}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
