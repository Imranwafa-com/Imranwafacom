import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTimePalette } from '../hooks/useTimeOfDay';
import config from '../lib/config';

const IDLE_MESSAGES = config.idleMessages;

const IDLE_TIMEOUT = 120_000; // 2 minutes
const MESSAGE_INTERVAL = 45_000; // new message every 45s after first

export default function IdleMessage() {
  const [message, setMessage] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const messageTimer = useRef<ReturnType<typeof setInterval>>(null);
  const messageIndex = useRef(0);
  const usedIndices = useRef<Set<number>>(new Set());

  const pickMessage = () => {
    // Pick a random message we haven't used yet
    const available = IDLE_MESSAGES.map((_, i) => i).filter(i => !usedIndices.current.has(i));
    if (available.length === 0) {
      usedIndices.current.clear();
      return IDLE_MESSAGES[0];
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    usedIndices.current.add(idx);
    return IDLE_MESSAGES[idx];
  };

  const resetIdle = () => {
    setShow(false);
    setMessage(null);
    messageIndex.current = 0;

    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (messageTimer.current) clearInterval(messageTimer.current);

    idleTimer.current = setTimeout(() => {
      // User has been idle for IDLE_TIMEOUT
      setMessage(pickMessage());
      setShow(true);

      // Keep showing new messages
      messageTimer.current = setInterval(() => {
        setShow(false);
        setTimeout(() => {
          setMessage(pickMessage());
          setShow(true);
        }, 1000);
      }, MESSAGE_INTERVAL);
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    // Debounce activity
    let debounce: ReturnType<typeof setTimeout>;
    const handleActivity = () => {
      clearTimeout(debounce);
      debounce = setTimeout(resetIdle, 500);
    };

    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    resetIdle();

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (messageTimer.current) clearInterval(messageTimer.current);
      clearTimeout(debounce);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="fixed bottom-8 left-0 right-0 z-[5] pointer-events-none flex justify-center px-6"
        >
          <p
            className="text-sm md:text-base italic max-w-md text-center"
            style={{
              color: getTimePalette().accentGlow,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.02em',
              textShadow: `0 0 30px ${getTimePalette().accentGlow}`,
            }}
          >
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
