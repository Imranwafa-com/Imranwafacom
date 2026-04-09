import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimePalette } from '../context/TimeContext';
import config from '../lib/config';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function MobileDisclaimer() {
  const palette = useTimePalette();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show on touch-primary devices
    const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
    if (!isMobile) return;

    // Don't re-show if dismissed this session
    if (sessionStorage.getItem('mobile-disclaimer-dismissed')) return;

    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('mobile-disclaimer-dismissed', '1');
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          className="fixed bottom-6 left-4 right-4 z-[200] sm:hidden"
        >
          <div
            className="rounded-2xl px-4 py-3.5 flex items-start gap-3"
            style={{
              background: 'rgba(8, 8, 16, 0.88)',
              backdropFilter: 'blur(32px) saturate(1.4)',
              border: `1px solid ${hexToRgba(palette.accent, 0.1)}`,
              boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 30px ${hexToRgba(palette.accent, 0.04)}`,
            }}
          >
            <span className="text-base mt-0.5 shrink-0">💻</span>
            <div className="flex-1 min-w-0">
              <p
                className="text-[13px] font-medium text-white/70 mb-0.5"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {config.mobileDisclaimer.title}
              </p>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: hexToRgba(palette.accent, 0.4), fontFamily: "'DM Sans', sans-serif" }}
              >
                {config.mobileDisclaimer.description}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/20 hover:text-white/40 transition-colors text-[13px] shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
