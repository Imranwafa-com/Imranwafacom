import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useSectionTracker,
  anyPreviousSkipped,
  useScrollQuirks,
} from '../hooks/useScrollQuirks';
import { useTimePalette } from '../context/TimeContext';
import { getTimePalette } from '../hooks/useTimeOfDay';
import config from '../lib/config';

// Helper: derive rgba from hex accent at a given alpha
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Snarky prefix when previous section was skipped ──
const SKIP_COMMENTS = config.scrollQuirks.skipComments;

// ── Messages when user scrolls back to a skipped section ──
const CAME_BACK_COMMENTS = config.scrollQuirks.cameBackComments;

// ── Speed reader warnings ──
const SPEED_WARNINGS = config.scrollQuirks.speedWarnings;

// ── Bottom page messages ──
const BOTTOM_MESSAGES = config.scrollQuirks.bottomMessages;

function pickRandom<T>(arr: T[], seed?: string): T {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return arr[Math.abs(hash) % arr.length];
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── SnarkyPrefix: shows above a section when previous was skipped ──
export function SnarkyPrefix({ sectionId }: { sectionId: string }) {
  const palette = useTimePalette();
  const [comment, setComment] = useState<string | null>(null);
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    const interval = setInterval(() => {
      const skippedId = anyPreviousSkipped(sectionId);
      if (skippedId && !shown.current) {
        shown.current = true;
        setComment(pickRandom(SKIP_COMMENTS, sectionId));
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [sectionId]);

  return (
    <AnimatePresence>
      {comment && (
        <motion.p
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-[13px] italic mb-4 leading-relaxed"
          style={{
            color: hexToRgba(palette.accent, 0.35),
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {comment}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ── CameBackBadge: shows when user scrolls back to a section they skipped ──
export function CameBackBadge({ sectionId }: { sectionId: string }) {
  const palette = useTimePalette();
  const tracker = useSectionTracker(sectionId);
  const [comment, setComment] = useState<string | null>(null);
  const shown = useRef(false);

  useEffect(() => {
    if (tracker.cameBack && !shown.current) {
      shown.current = true;
      setComment(pickRandom(CAME_BACK_COMMENTS, sectionId));
    }
  }, [tracker.cameBack, sectionId]);

  return (
    <>
      <div ref={tracker.ref} />
      <AnimatePresence>
        {comment && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-block mb-3"
          >
            <span
              className="text-[12px] px-3 py-1.5 rounded-full border italic"
              style={{
                color: hexToRgba(palette.accent, 0.45),
                borderColor: hexToRgba(palette.accent, 0.12),
                backgroundColor: hexToRgba(palette.accent, 0.04),
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {comment}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── SpeedReaderNotice: floats in when scrolling too fast ──
export function SpeedReaderNotice() {
  const palette = useTimePalette();
  const quirks = useScrollQuirks();
  const [show, setShow] = useState(false);
  const shownCount = useRef(0);
  const lastTrigger = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (
      quirks.speedReaderMode &&
      shownCount.current < 2 &&
      now - lastTrigger.current > 30000
    ) {
      lastTrigger.current = now;
      shownCount.current++;
      setShow(true);
      setTimeout(() => setShow(false), 3500);
    }
  }, [quirks.speedReaderMode]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="fixed bottom-20 left-0 right-0 z-[6] pointer-events-none flex justify-center px-6"
        >
          <p
            className="text-sm italic text-center"
            style={{
              color: hexToRgba(palette.accent, 0.35),
              fontFamily: "'DM Sans', sans-serif",
              textShadow: `0 0 20px ${hexToRgba(palette.accent, 0.1)}`,
            }}
          >
            {pickRandom(SPEED_WARNINGS)}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── BottomMessage: shows when user reaches the bottom ──
export function BottomMessage() {
  const palette = useTimePalette();
  const quirks = useScrollQuirks();
  const [show, setShow] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    if (quirks.bottomReached && !shown.current) {
      shown.current = true;
      setTimeout(() => setShow(true), 500);
      setTimeout(() => setShow(false), 5000);
    }
  }, [quirks.bottomReached]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed top-20 left-0 right-0 z-[6] pointer-events-none flex justify-center px-6"
        >
          <p
            className="text-xs tracking-widest uppercase text-center"
            style={{
              color: hexToRgba(palette.accent, 0.25),
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {pickRandom(BOTTOM_MESSAGES)}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── TldrUnlockToast: persistent pill near the navbar once unlocked ──
export function TldrUnlockToast() {
  const palette = useTimePalette();
  const quirks = useScrollQuirks();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (quirks.tldrUnlocked && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [quirks.tldrUnlocked, dismissed]);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(6px)' }}
          transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          className="fixed top-[60px] right-6 z-[101] flex items-center gap-2"
        >
          <a
            href="/tldr"
            className="text-[12px] px-4 py-2 rounded-full border italic transition-all duration-300 hover:scale-105 backdrop-blur-xl"
            style={{
              color: hexToRgba(palette.accent, 0.65),
              borderColor: hexToRgba(palette.accent, 0.15),
              backgroundColor: hexToRgba(palette.accent, 0.06),
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: `0 4px 20px ${hexToRgba(palette.accent, 0.08)}`,
            }}
          >
            /tldr unlocked
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/15 hover:text-white/30 transition-colors text-[10px] leading-none"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── HoverReveal: text that changes on hover ──
export function HoverReveal({
  children,
  hoverText,
  className = '',
}: {
  children: React.ReactNode;
  hoverText: string;
  className?: string;
}) {
  const palette = useTimePalette();
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className={`cursor-default transition-all duration-300 ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence mode="wait">
        {hovered ? (
          <motion.span
            key="hover"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="italic"
            style={{ color: hexToRgba(palette.accent, 0.55) }}
          >
            {hoverText}
          </motion.span>
        ) : (
          <motion.span
            key="normal"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── ClickCounter: tracks clicks and reacts (with auto-clicker detection) ──
const CLICK_MESSAGES: Record<number, string> = {
  1:  '',
  2:  '',
  3:  'yes, that does something.',
  4:  '',
  5:  "you're persistent.",
  6:  '',
  7:  'still going?',
  8:  '',
  9:  '',
  10: '🏆 okay, you win.',
  11: '',
  12: 'this is just my name, not a button.',
  13: '',
  14: '',
  15: "seriously? there's nothing more here.",
  16: '',
  17: 'i respect the commitment.',
  18: '',
  19: '',
  20: '...or is there?',
  21: '',
  22: 'spoiler: there isn\'t.',
  23: '',
  24: '',
  25: 'twenty-five clicks. noted.',
  26: '',
  27: 'you need a hobby.',
  28: '',
  29: '',
  30: 'i\'m starting to feel self-conscious.',
  31: '',
  32: '',
  33: 'thirty-three is an odd number to stop on.',
  34: '',
  35: 'i\'m not going anywhere.',
  36: '',
  37: '',
  38: 'still here.',
  39: '',
  40: '40 clicks. i need a moment.',
  41: '',
  42: '',
  43: 'have you tried the contact page instead?',
  44: '',
  45: 'this is a one-sided conversation.',
  46: '',
  47: '',
  48: 'i feel seen.',
  49: '',
  50: '50. halfway to… something.',
  51: '',
  52: '',
  53: 'at this point you\'re just stress-clicking.',
  54: '',
  55: 'click therapy?',
  56: '',
  57: '',
  58: 'i\'ve lost count. wait, no i haven\'t.',
  59: '',
  60: '60 clicks. this is art now.',
  61: '',
  62: '',
  63: 'i\'m legally required to say hi back.',
  64: '',
  65: 'hi.',
  66: '',
  67: '',
  68: 'sixty-eight. almost there.',
  69: '',
  70: '70. a sacred number apparently.',
  71: '',
  72: '',
  73: 'you\'re outlasting most job interviews.',
  74: '',
  75: '75. okay this is a dedicated bit.',
  76: '',
  77: '',
  78: 'my name is slowly losing all meaning.',
  79: '',
  80: '80 clicks. are you okay?',
  81: '',
  82: '',
  83: 'i\'m touched and mildly concerned.',
  84: '',
  85: 'no therapy needed, just stop clicking.',
  86: '',
  87: '',
  88: 'eighty-eight. lucky in some cultures.',
  89: '',
  90: '90. almost a century.',
  91: '',
  92: '',
  93: 'my hand would be tired by now.',
  94: '',
  95: 'five more to triple digits.',
  96: '',
  97: '',
  98: 'two more.',
  99: 'one more.',
  100: '💀 100 clicks. i am in awe.',
};

const AUTO_CLICKER_MESSAGES = [
  'auto-clicker detected. cheater.',
  'no bots allowed on my portfolio.',
  'okay, script kiddie.',
  'i see you, autoclicker.',
  'that\'s not how you appreciate a portfolio.',
  'technically impressive. still weird.',
  'your clicks-per-second is illegal.',
  'nice script. still not impressed.',
  'i\'m flagging this in the logs.',
  'human? doubtful.',
];

export function ClickCounter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const palette = useTimePalette();
  const [clicks, setClicks] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const recentClicks = useRef<number[]>([]);
  const autoClickerShown = useRef(false);
  const msgTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const showMessage = (msg: string) => {
    if (msgTimer.current) clearTimeout(msgTimer.current);
    setMessage(msg);
    msgTimer.current = setTimeout(() => setMessage(null), 3000);
  };

  const handleClick = () => {
    const now = Date.now();
    recentClicks.current.push(now);
    // Keep only clicks in the last 1 second
    recentClicks.current = recentClicks.current.filter((t) => now - t < 1000);

    // Auto-clicker: 8+ clicks in 1 second
    if (recentClicks.current.length >= 8 && !autoClickerShown.current) {
      autoClickerShown.current = true;
      showMessage(pickRandom(AUTO_CLICKER_MESSAGES));
      return;
    }

    const next = clicks + 1;
    setClicks(next);
    const msg = CLICK_MESSAGES[Math.min(next, 100)];
    if (msg) showMessage(msg);
    // After 100, cycle through fun messages
    if (next > 100) {
      const post = [
        'still going.',
        'okay.',
        'sure.',
        'mmhmm.',
        'yep.',
        '.',
        '..',
        '...',
        'are you winning?',
        'i give up counting.',
      ];
      showMessage(post[(next - 101) % post.length]);
    }
  };

  return (
    <span className={`relative cursor-pointer select-none ${className}`} onClick={handleClick}>
      {children}
      <AnimatePresence>
        {message && (
          <motion.span
            key={message}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: -24, scale: 1 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full pointer-events-none"
            style={{
              color: hexToRgba(palette.accent, 0.55),
              backgroundColor: hexToRgba(palette.accent, 0.06),
              border: `1px solid ${hexToRgba(palette.accent, 0.12)}`,
            }}
          >
            {message}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── LongHover: reacts when hovering a button for too long ──
const LONG_HOVER_MESSAGES = [
  "you've been hovering for a while.",
  'just click it.',
  'it won\'t bite.',
  'still deciding?',
  'the button is getting nervous.',
  'hover-to-read ratio is off.',
  'click it or don\'t. but like, soon.',
  'i can feel you thinking.',
  'this is a judgment-free zone. click.',
  'the suspense is killing us both.',
];

export function LongHover({
  children,
  className = '',
  thresholdMs = 2500,
}: {
  children: React.ReactNode;
  className?: string;
  thresholdMs?: number;
}) {
  const palette = useTimePalette();
  const [quirkMsg, setQuirkMsg] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const shownForThisHover = useRef(false);

  const handleEnter = () => {
    shownForThisHover.current = false;
    hoverTimer.current = setTimeout(() => {
      if (!shownForThisHover.current) {
        shownForThisHover.current = true;
        setQuirkMsg(pickRandom(LONG_HOVER_MESSAGES));
        setTimeout(() => setQuirkMsg(null), 2500);
      }
    }, thresholdMs);
  };

  const handleLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setQuirkMsg(null);
  };

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      <AnimatePresence>
        {quirkMsg && (
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: -28 }}
            exit={{ opacity: 0, y: -34 }}
            transition={{ duration: 0.35 }}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full pointer-events-none italic"
            style={{
              color: hexToRgba(palette.accent, 0.5),
              backgroundColor: hexToRgba(palette.accent, 0.05),
              border: `1px solid ${hexToRgba(palette.accent, 0.1)}`,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {quirkMsg}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── ScrollDirectionText: text that swaps based on scroll direction ──
export function ScrollDirectionText({
  downText,
  upText,
  className = '',
}: {
  downText: string;
  upText: string;
  className?: string;
}) {
  const quirks = useScrollQuirks();

  return (
    <span className={className}>
      <AnimatePresence mode="wait">
        <motion.span
          key={quirks.scrollDirection}
          initial={{ opacity: 0, y: quirks.scrollDirection === 'down' ? 6 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {quirks.scrollDirection === 'down' ? downText : upText}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ── VisitAwareText: shows different text on revisit vs first visit of a section ──
export function VisitAwareText({
  sectionId,
  firstVisit,
  revisit,
  className = '',
}: {
  sectionId: string;
  firstVisit: string;
  revisit: string;
  className?: string;
}) {
  const tracker = useSectionTracker(sectionId);

  return (
    <>
      <span ref={tracker.ref} />
      <span className={className}>
        {tracker.scrollPastCount > 1 ? revisit : firstVisit}
      </span>
    </>
  );
}

// Re-export getTimePalette-based hex helper for non-context components
export function getQuirkAccent(alpha: number): string {
  const p = getTimePalette();
  return hexToRgba(p.accent, alpha);
}
