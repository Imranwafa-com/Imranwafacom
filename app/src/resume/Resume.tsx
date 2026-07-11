// ════════════════════════════════════════════════════════════
// Resume — a premium PDF reader.
//  • renders /resume.pdf exactly as-is (react-pdf, no content edits)
//  • one page at a time; scroll / arrows / swipe / dots flip pages
//  • pages behave like a physical stack of paper: the front sheet
//    lifts away upward, the next sheet rises from the deck
//  • the site's dot-field background lives behind the document
//  • floating panel (top-right): a note in the site's voice + actions
//  • Back to Home hands off to the router so it cross-fades, no reload
// The PDF is never modified — JS only loads, renders, and animates it.
// ════════════════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import { InteractiveBG } from '../specimen/bg';
import { ResumeLoader } from './ResumeLoader';
import './resume.css';

// Bundle the worker locally so the reader is fully self-contained — no CDN,
// no version drift. pdfjs-dist is pinned to react-pdf's version (5.4.296).
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const FLIP_LOCK = 460; // ms between page flips — tames trackpad inertia
const MOBILE_MQ = '(max-width: 640px)';

// Page width tracks the viewport. Phones get a wider fraction (no side panels)
// and are capped a touch shorter so the sheet fits above the bottom bar.
// This must stay JS: react-pdf rasterizes the canvas at an exact pixel width,
// so it can't be a CSS length — but we debounce updates (below) so the PDF
// re-renders once after a resize settles, not on every intermediate frame.
function calcPageW() {
  const vw = window.innerWidth;
  if (vw <= 640) return Math.min(vw * 0.9, (window.innerHeight - 150) / 1.3);
  return Math.min(vw * 0.82, 760);
}

export default function Resume() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [numPages, setNumPages] = useState(0);
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [hinted, setHinted] = useState(false);
  // The footer only becomes reachable once you've flipped to the last page and
  // keep scrolling — until then the deck owns the scroll.
  const [showFooter, setShowFooter] = useState(false);
  const [pageW, setPageW] = useState(calcPageW);
  const [mob, setMob] = useState(() => window.matchMedia(MOBILE_MQ).matches);
  const lock = useRef(false);

  // Breakpoint via matchMedia — fires only when the boundary is actually
  // crossed, so no per-frame innerWidth reads during a resize drag.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => setMob(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Sheet width: debounce so the PDF re-rasterizes once after the resize
  // settles (150ms), instead of on every intermediate resize event.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => setPageW(calcPageW()), 150); };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, []);

  const go = useCallback((dir: 1 | -1) => {
    if (lock.current || leaving) return;
    const arm = () => { lock.current = true; setTimeout(() => { lock.current = false; }, FLIP_LOCK); };
    if (showFooter) {
      if (dir === -1) { arm(); setShowFooter(false); } // scroll back up to the last page
      return;
    }
    if (dir === 1) {
      if (active >= numPages - 1) {
        // past the last page → reveal the footer
        if (numPages > 0) { arm(); setHinted(true); setShowFooter(true); }
      } else { arm(); setHinted(true); setActive((p) => Math.min(p + 1, numPages - 1)); }
    } else if (active > 0) {
      arm(); setActive((p) => Math.max(p - 1, 0));
    }
  }, [numPages, leaving, showFooter, active]);

  const jump = (i: number) => { if (!leaving) { setHinted(true); setShowFooter(false); setActive(i); } };

  // Wheel flips the deck — but only while nothing overflows. If the page is
  // taller than the viewport (zoom, short windows), yield to native scroll.
  const onWheel = (e: React.WheelEvent) => {
    if (document.documentElement.scrollHeight > window.innerHeight + 1) return;
    if (Math.abs(e.deltaY) < 18) return;
    go(e.deltaY > 0 ? 1 : -1);
  };

  // Keyboard: arrows / space / page keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Never steal keys from focused controls — Space/Enter must activate
      // buttons and links, not flip the deck.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go]);

  // Touch: vertical swipe flips.
  const touchY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchY.current = e.touches[0]?.clientY ?? null; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchY.current == null) return;
    const dy = (e.changedTouches[0]?.clientY ?? touchY.current) - touchY.current;
    if (Math.abs(dy) > 50) go(dy < 0 ? 1 : -1);
    touchY.current = null;
  };

  const home = () => {
    if (leaving) return;
    setLeaving(true);
    // Brief flourish, then hand off to the router (AnimatePresence cross-fades
    // both routes — no full reload, the dot-field carries straight over).
    setTimeout(() => navigate('/'), reduce ? 120 : 620);
  };

  return (
    <div
      className={`resume-stage${showFooter ? ' footer-open' : ''}`}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Dot-field background — same as the main page, kept well behind the sheet */}
      <div className="resume-bg" aria-hidden="true">
        <InteractiveBG />
      </div>

      {/* The paper deck — lifts up and out of the way when the footer opens */}
      <motion.div
        className="resume-deck"
        animate={{
          opacity: leaving || showFooter ? 0 : 1,
          scale: leaving ? 0.97 : 1,
          y: showFooter ? -window.innerHeight * (mob ? 0.3 : 0.5) : 0,
          // 'none' (not 'blur(0px)') when idle: a no-op blur still forces a GPU
          // layer that rasterizes once and won't repaint the async-drawn PDF
          // canvas until a scroll invalidates it — the "blank until you scroll"
          // bug. Only promote to a filter layer during the leaving flourish.
          filter: leaving ? 'blur(6px)' : 'none',
        }}
        transition={{ duration: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Document
          file="/resume.pdf"
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(e) => console.error(e)}
          loading={<ResumeLoader />}
          error={<div className="resume-status resume-status-err">couldn't load the resume. the file's at <code>/resume.pdf</code> if you'd rather grab it directly.</div>}
        >
          {numPages > 0 && Array.from({ length: numPages }, (_, i) => {
            const d = i - active;            // <0 read · 0 front · >0 still in deck
            const read = d < 0;
            return (
              <motion.div
                key={i}
                className="resume-sheet"
                style={{ zIndex: read ? 10 + i : 100 - d }}
                initial={false}
                animate={reduce ? {
                  // Reduced motion: just swap, no flight.
                  opacity: d === 0 ? 1 : 0,
                  y: 0, scale: 1, rotateX: 0, rotateZ: 0, filter: 'none',
                } : {
                  // Read sheets lift off the top of the deck; deck sheets fan
                  // out below the front. Toned down on mobile — a smaller, flatter
                  // slide instead of the big tilted arc, which feels jarring on a
                  // small screen (and skips the blur for performance).
                  y: read ? -window.innerHeight * (mob ? 0.55 : 0.92) : Math.min(d, 4) * (mob ? 12 : 24),
                  scale: read ? (mob ? 1.02 : 1.08) : 1 - Math.min(d, 4) * (mob ? 0.03 : 0.05),
                  rotateX: read ? (mob ? 6 : 22) : 0,
                  rotateZ: read ? (mob ? (i % 2 ? -1.5 : 1.5) : (i % 2 ? -4 : 4)) : 0,
                  opacity: read ? 0 : Math.max(0, 1 - Math.min(d, 4) * 0.16),
                  // Real blur only on the read-away sheets (desktop); the front
                  // and deck sheets stay 'none' so their PDF canvas isn't trapped
                  // in a stale GPU layer (see the deck's filter note above).
                  filter: !mob && read ? 'blur(3px)' : 'none',
                }}
                transition={mob
                  ? { type: 'spring', stiffness: 300, damping: 34 }   // snappier, little overshoot
                  : { type: 'spring', stiffness: 200, damping: 24, mass: 1 }}
              >
                <Page
                  pageNumber={i + 1}
                  width={pageW}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  loading=""
                />
              </motion.div>
            );
          })}
        </Document>
      </motion.div>

      {/* Specimen type label — top left, mirrors the action panel */}
      <AnimatePresence>
        {!leaving && !showFooter && (
          <motion.aside
            className="resume-spec"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="resume-spec-mark">A Specimen Sheet</div>
            <div className="resume-spec-glyph">Aa<span className="resume-spec-glyph-cap">Space Grotesk · 400</span></div>
            <div className="resume-spec-rows">
              <div className="resume-spec-row"><span>Document</span><span>Résumé / CV</span></div>
              <div className="resume-spec-row"><span>Subject</span><span>Imran Wafa</span></div>
              <div className="resume-spec-row"><span>Discipline</span><span>NOC · Analyst</span></div>
              <div className="resume-spec-row"><span>Format</span><span>{numPages || '—'} pp · A4</span></div>
              <div className="resume-spec-row"><span>Set in</span><span>Grotesk · Mono</span></div>
              <div className="resume-spec-row"><span>Filed</span><span>MMXXVI</span></div>
            </div>
            <div className="resume-spec-foot">Vol. 03 / Iss. 01</div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Floating info panel — top right */}
      <AnimatePresence>
        {!leaving && !showFooter && (
          <motion.aside
            className="resume-panel"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="resume-panel-kicker">the paper version</div>
            <h2 className="resume-panel-name">Imran Wafa<span className="resume-panel-it"> — resume</span></h2>
            <div className="resume-panel-role">NOC Technician · Data Analyst</div>
            <p className="resume-panel-msg">
              same me, on one neat stack. scroll to flip through the pages, or grab the file and read it your way.
            </p>
            <div className="resume-panel-actions">
              <a href="/resume.pdf" download className="resume-btn resume-btn-primary">Download resume</a>
              <a href="mailto:contact@imranwafa.com" className="resume-btn resume-btn-ghost">Email me</a>
              <button type="button" onClick={home} className="resume-btn resume-btn-ghost">Back to home</button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Slider dots — one per page, plus a third option for the footer */}
      {numPages > 0 && !leaving && (
        <div className="resume-dots" role="tablist" aria-label="resume pages">
          {Array.from({ length: numPages }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`resume-dot${!showFooter && i === active ? ' is-active' : ''}`}
              aria-label={`page ${i + 1}`}
              aria-selected={!showFooter && i === active}
              onClick={() => jump(i)}
            />
          ))}
          <span className="resume-dots-sep" aria-hidden="true" />
          <button
            type="button"
            className={`resume-dot resume-dot-footer${showFooter ? ' is-active' : ''}`}
            aria-label="footer"
            aria-selected={showFooter}
            title="footer"
            onClick={() => { setHinted(true); setShowFooter(true); }}
          />
        </div>
      )}

      {/* Scroll hint — "flip" before the first flip, "keep going" on the last page */}
      <AnimatePresence>
        {numPages > 1 && !hinted && !leaving && !showFooter && (
          <motion.div
            key="hint-flip"
            className="resume-hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            scroll to flip ↓
          </motion.div>
        )}
        {numPages > 0 && hinted && active === numPages - 1 && !leaving && !showFooter && (
          <motion.div
            key="hint-end"
            className="resume-hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5 }}
          >
            keep scrolling ↓
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaving flourish */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            className="resume-leaving"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            heading back<span className="resume-leaving-it"> home</span>…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer — only reachable by scrolling past the last page */}
      <motion.footer
        className={`resume-footer${showFooter ? ' is-open' : ''}`}
        initial={false}
        animate={{ y: showFooter ? '0%' : '100%' }}
        transition={{ type: 'spring', stiffness: 180, damping: 26 }}
        aria-hidden={!showFooter}
      >
        <div className="resume-footer-inner">
          <div className="rf-col">
            <div className="rf-big">Imran Wafa</div>
            <a href="mailto:contact@imranwafa.com">contact@imranwafa.com</a>
            <a href="https://github.com/imranhwafa" target="_blank" rel="noreferrer">github.com/imranhwafa</a>
          </div>
          <div className="rf-col">
            <div className="rf-big">Colophon</div>
            <div>Set in Space Grotesk</div>
            <div>&amp; JetBrains Mono</div>
            <div>Rendered with pdf.js</div>
          </div>
          <div className="rf-col rf-r">
            <div className="rf-big">© MMXXVI</div>
            <div>the paper version</div>
            <div>Washington, DC</div>
          </div>
        </div>
        <div className="resume-footer-actions">
          <a href="/resume.pdf" download className="resume-btn resume-btn-primary">Download resume</a>
          <button type="button" className="resume-btn resume-btn-ghost" onClick={() => setShowFooter(false)}>↑ Back to the pages</button>
          <button type="button" className="resume-btn resume-btn-ghost" onClick={home}>Back to home</button>
        </div>
      </motion.footer>
    </div>
  );
}
