import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimePalette } from '../context/TimeContext';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// < 4 seconds away — misclick tier
const MISCLICK_MESSAGES = [
  "misclicked?",
  "oops, wrong tab?",
  "back already?",
  "that was fast.",
  "thought about leaving, huh?",
  "changed your mind in record time.",
  "almost lost you there.",
  "reflex navigation?",
  "the tab didn't even have time to miss you.",
  "back before i noticed you left.",
];

// 4s – 2 minutes — background check tier
const BACKGROUND_CHECK_MESSAGES = [
  "done with the background check?",
  "googled me, didn't you?",
  "quick LinkedIn detour?",
  "hope the research was promising.",
  "verified. you may proceed.",
  "whatever you found, i can explain.",
  "due diligence appreciated.",
  "cross-referencing your sources?",
  "i'd google me too, honestly.",
  "resume check complete. welcome back.",
];

// 2+ minutes away — long absence tier
const LONG_ABSENCE_MESSAGES = [
  "i thought you forgot about me.",
  "oh, you're back. i redecorated.",
  "i kept the tab warm for you.",
  "welcome back. i haven't moved.",
  "i was starting to take it personally.",
  "you were gone long enough that i questioned my design choices.",
  "the site missed you. i asked.",
  "back from the void?",
  "i aged a little while you were gone.",
  "this tab has been patiently waiting.",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function TabWatcher() {
  const palette = useTimePalette();
  const [message, setMessage] = useState<string | null>(null);
  const hiddenAt = useRef<number | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
      } else {
        if (hiddenAt.current === null) return;
        const away = Date.now() - hiddenAt.current;
        hiddenAt.current = null;

        let msg: string;
        if (away < 4000) {
          msg = pickRandom(MISCLICK_MESSAGES);
        } else if (away < 120_000) {
          msg = pickRandom(BACKGROUND_CHECK_MESSAGES);
        } else {
          msg = pickRandom(LONG_ABSENCE_MESSAGES);
        }

        if (msgTimer.current) clearTimeout(msgTimer.current);
        setMessage(msg);
        msgTimer.current = setTimeout(() => setMessage(null), 4000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (msgTimer.current) clearTimeout(msgTimer.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="fixed bottom-8 left-0 right-0 z-[7] pointer-events-none flex justify-center px-6"
        >
          <p
            className="text-sm italic text-center"
            style={{
              color: hexToRgba(palette.accent, 0.3),
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.02em',
              textShadow: `0 0 30px ${hexToRgba(palette.accent, 0.08)}`,
            }}
          >
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
