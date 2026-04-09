import { useEffect, useRef, useState, useCallback } from 'react';

export interface SectionState {
  seen: boolean;
  skipped: boolean;
  cameBack: boolean;
  timeSpent: number; // ms in viewport
  scrollPastCount: number;
}

type SectionId = string;

interface ScrollQuirksState {
  sections: Record<SectionId, SectionState>;
  scrollDirection: 'up' | 'down';
  totalScrollDistance: number;
  speedReaderMode: boolean; // scrolling unusually fast
  bottomReached: boolean;
  scrollBackCount: number; // how many times user reversed direction
  tldrUnlocked: boolean; // unlocked when 3+ sections skipped
}

const SKIP_THRESHOLD = 600; // ms - if section leaves viewport faster than this, it was skipped
const SPEED_READER_THRESHOLD = 8000; // px/s scroll speed — very aggressive scrolling only
const MIN_READ_TIME = 2000; // ms to count as "read"
const SPEED_SUSTAIN_MS = 400; // must sustain fast speed for this long to trigger

let globalState: ScrollQuirksState = {
  sections: {},
  scrollDirection: 'down',
  totalScrollDistance: 0,
  speedReaderMode: false,
  bottomReached: false,
  scrollBackCount: 0,
  tldrUnlocked: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function initSection(id: SectionId) {
  if (!globalState.sections[id]) {
    globalState.sections[id] = {
      seen: false,
      skipped: false,
      cameBack: false,
      timeSpent: 0,
      scrollPastCount: 0,
    };
  }
}

// Track global scroll behavior
let lastScrollY = 0;
let lastScrollTime = Date.now();
let prevDirection: 'up' | 'down' = 'down';
let scrollInited = false;
let speedWindow: { dy: number; dt: number }[] = [];
let speedCooldownUntil = 0;

function checkTldrUnlock() {
  const sections = Object.values(globalState.sections);
  const skippedCount = sections.filter((s) => s.skipped).length;
  if (skippedCount >= 3 && !globalState.tldrUnlocked) {
    globalState.tldrUnlocked = true;
  }
}

function initScrollTracking() {
  if (scrollInited) return;
  scrollInited = true;

  window.addEventListener(
    'scroll',
    () => {
      const now = Date.now();
      const dy = window.scrollY - lastScrollY;
      const dt = now - lastScrollTime;

      const newDir = dy >= 0 ? 'down' : 'up';
      if (newDir !== prevDirection) {
        globalState.scrollBackCount++;
        prevDirection = newDir;
      }

      globalState.scrollDirection = newDir;
      globalState.totalScrollDistance += Math.abs(dy);

      // Windowed speed detection — must sustain high speed over SPEED_SUSTAIN_MS
      speedWindow.push({ dy: Math.abs(dy), dt });
      speedWindow = speedWindow.filter(
        (_, i) => i >= speedWindow.length - 10 // keep last 10 frames max
      );

      const totalDy = speedWindow.reduce((s, e) => s + e.dy, 0);
      const totalDt = speedWindow.reduce((s, e) => s + e.dt, 0);

      if (totalDt > SPEED_SUSTAIN_MS && now > speedCooldownUntil) {
        const avgSpeed = (totalDy / totalDt) * 1000;
        if (avgSpeed > SPEED_READER_THRESHOLD) {
          globalState.speedReaderMode = true;
          speedCooldownUntil = now + 30000; // 30s cooldown between triggers
        }
      } else if (totalDt > 200) {
        const avgSpeed = (totalDy / totalDt) * 1000;
        if (avgSpeed < SPEED_READER_THRESHOLD * 0.3) {
          globalState.speedReaderMode = false;
        }
      }

      // Bottom reached
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 100) {
        globalState.bottomReached = true;
      }

      // Check TLDR unlock
      checkTldrUnlock();

      lastScrollY = window.scrollY;
      lastScrollTime = now;
      notify();
    },
    { passive: true }
  );
}

export function useScrollQuirks() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    initScrollTracking();
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return globalState;
}

export function useSectionTracker(sectionId: string) {
  const enteredAt = useRef<number | null>(null);
  const [state, setState] = useState<SectionState>({
    seen: false,
    skipped: false,
    cameBack: false,
    timeSpent: 0,
    scrollPastCount: 0,
  });

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;

      initSection(sectionId);
      initScrollTracking();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const section = globalState.sections[sectionId];

            if (entry.isIntersecting) {
              enteredAt.current = Date.now();

              // If it was previously skipped and user came back
              if (section.skipped && !section.cameBack) {
                section.cameBack = true;
              }

              section.seen = true;
            } else if (enteredAt.current !== null) {
              // Section just left viewport
              const timeInView = Date.now() - enteredAt.current;
              section.timeSpent += timeInView;
              section.scrollPastCount++;

              // If they barely saw it, mark as skipped
              if (timeInView < SKIP_THRESHOLD && !section.skipped) {
                section.skipped = true;
                checkTldrUnlock();
              }

              enteredAt.current = null;
            }

            setState({ ...section });
            notify();
          });
        },
        { threshold: [0.15, 0.5] }
      );

      observer.observe(node);

      return () => observer.disconnect();
    },
    [sectionId]
  );

  return { ref, ...state };
}

// Utility: get the previous section's state
export function getPreviousSectionState(sectionId: string): SectionState | null {
  const ids = Object.keys(globalState.sections);
  const idx = ids.indexOf(sectionId);
  if (idx <= 0) return null;
  return globalState.sections[ids[idx - 1]] || null;
}

// Check if ANY previous section was skipped
export function anyPreviousSkipped(sectionId: string): string | null {
  const ids = Object.keys(globalState.sections);
  const idx = ids.indexOf(sectionId);
  for (let i = 0; i < idx; i++) {
    if (globalState.sections[ids[i]]?.skipped) return ids[i];
  }
  return null;
}

// Get read stats
export function getReadStats() {
  const sections = Object.values(globalState.sections);
  const total = sections.length;
  const read = sections.filter((s) => s.timeSpent > MIN_READ_TIME).length;
  const skipped = sections.filter((s) => s.skipped).length;
  return { total, read, skipped, scrollBackCount: globalState.scrollBackCount };
}
