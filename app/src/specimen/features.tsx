// ============================================================
// Easter eggs + interactive features for the Specimen Sheet.
// Ported from the Claude Design handoff (features.jsx).
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { SITE } from "./site-config";
import { COPY } from "./copy";
import { sectionTimes, pageStart } from "./runtime";
import { expCurrent, REDUCED } from "./motion";
import { KEYWORD_EGGS } from "./keyword-eggs";
import { advanceVerb } from "./switch-verb";
import { toggleTheme } from "./theme";
import { emitTap } from "./microtaps";

const CFG = SITE;

// ── Mouse aurora — soft accent halo follows cursor ──────────
export function MouseAurora() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (REDUCED) return; // honour prefers-reduced-motion — no cursor-tracking loop
    let raf = 0;
    let tx = -200, ty = -200, x = -200, y = -200;
    const tick = () => {
      const dx = tx - x;
      const dy = ty - y;
      x += dx * 0.18;
      y += dy * 0.18;
      if (ref.current) ref.current.style.transform = `translate(${x}px, ${y}px)`;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const onMove = (e: MouseEvent) => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <div className="aurora" ref={ref} aria-hidden="true" />;
}

// ── Idle message — appears after 2 min of no input ──────────
export function IdleMessage() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const used = new Set<number>();
    const reset = () => {
      clearTimeout(timer);
      setMsg(null);
      timer = setTimeout(() => {
        const pool = CFG.idleMessages.filter((_, i) => !used.has(i));
        const arr = pool.length ? pool : CFG.idleMessages;
        const idx = Math.floor(Math.random() * arr.length);
        const choice = arr[idx];
        used.add(CFG.idleMessages.indexOf(choice));
        setMsg(choice);
      }, 120000);
    };
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);
  if (!msg) return null;
  return <div className="idle-msg"><span>{msg}</span></div>;
}

// ── Section tracker — record active reading time per section ─
export function useSectionTracker(name: string): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let entered = 0;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio > 0.3) {
          entered = Date.now();
        } else if (entered) {
          sectionTimes[name] = (sectionTimes[name] || 0) + (Date.now() - entered) / 1000;
          entered = 0;
        }
      });
    }, { threshold: [0, 0.3, 0.6, 1] });
    obs.observe(el);
    return () => {
      if (entered) sectionTimes[name] = (sectionTimes[name] || 0) + (Date.now() - entered) / 1000;
      obs.disconnect();
    };
  }, [name]);
  return ref;
}

// ── Scroll toasts — speed warning, bottom celebration, tldr unlock ──
export function ScrollToasts() {
  const [speed, setSpeed] = useState<string | null>(null);
  const [bottom, setBottom] = useState<string | null>(null);
  const [tldr, setTldr] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let lastT = Date.now();
    let speedHits = 0;
    let speedTimer: ReturnType<typeof setTimeout> | undefined;
    let bottomTimer: ReturnType<typeof setTimeout> | undefined;
    let bottomShown = sessionStorage.getItem("portfolio_bottom") === "1";
    const tldrShown = sessionStorage.getItem("portfolio_tldr") === "1";
    let skipped = 0;

    const onScroll = () => {
      const y = window.scrollY;
      const t = Date.now();
      const dt = t - lastT;
      const dy = Math.abs(y - lastY);
      if (dt > 0) {
        const v = dy / dt;
        if (v > 6) {
          speedHits++;
          skipped++;
          if (speedHits >= 3) {
            const arr = CFG.scrollQuirks.speedWarnings;
            setSpeed(arr[Math.floor(Math.random() * arr.length)]);
            clearTimeout(speedTimer);
            speedTimer = setTimeout(() => setSpeed(null), 2400);
            speedHits = 0;
          }
          if (skipped >= 3 && !tldrShown && !sessionStorage.getItem("portfolio_tldr_shown")) {
            sessionStorage.setItem("portfolio_tldr_shown", "1");
            setTldr(true);
          }
        }
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && y >= max - 4 && !bottomShown) {
        bottomShown = true;
        sessionStorage.setItem("portfolio_bottom", "1");
        const arr = CFG.scrollQuirks.bottomMessages;
        setBottom(arr[Math.floor(Math.random() * arr.length)]);
        bottomTimer = setTimeout(() => setBottom(null), 4000);
      }
      lastY = y;
      lastT = t;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(speedTimer); clearTimeout(bottomTimer); };
  }, []);
  return (
    <>
      {speed && <div className="toast toast-speed">{speed}</div>}
      {bottom && <div className="toast toast-bottom">{bottom}</div>}
      {tldr && (
        <div className="toast toast-tldr">
          <span>{CFG.tldr.unlockMessage}</span>
          <button onClick={() => { setTldr(false); document.getElementById("tldr-modal-trigger")?.click(); }}>open /tldr</button>
          <button className="x" onClick={() => setTldr(false)} aria-label="dismiss">×</button>
        </div>
      )}
    </>
  );
}

// ── Click counter — easter egg on the wordmark ──────────────
export function ClickCounter({ children }: { children?: ReactNode }) {
  const [n, setN] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const messages = COPY.quirks.clickCounter;
  const onClick = () => {
    const next = n + 1;
    setN(next);
    if (messages[next]) {
      setMsg(messages[next]);
      // reset the hide timer so a fast earlier click can't wipe this message
      clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => setMsg(null), 2200);
    }
  };
  return (
    <div className="click-wrap" onClick={onClick} title="(click me)">
      {children}
      {msg && <div className="click-msg">{msg}</div>}
    </div>
  );
}

// ── Command palette — invokes on `/`, `?`, Cmd+K, or any letter ──
interface Command { cmd: string; action: string; target?: string; desc: string }
const COMMANDS: Command[] = [
  { cmd: "/about", action: "scroll", target: "about", desc: CFG.commandPalette.commandDescriptions.about },
  { cmd: "/projects", action: "scroll", target: "work", desc: CFG.commandPalette.commandDescriptions.projects },
  { cmd: "/education", action: "scroll", target: "education", desc: "school & studies" },
  { cmd: "/certs", action: "scroll", target: "certs", desc: "certifications" },
  { cmd: "/experience", action: "scroll", target: "experience", desc: "work history" },
  { cmd: "/contact", action: "scroll", target: "contact", desc: "send me a message" },
  { cmd: "/resume", action: "resume", desc: "open the paper version (pdf reader)" },
  { cmd: "/home", action: "scroll", target: "top", desc: CFG.commandPalette.commandDescriptions.home },
  { cmd: "/tldr", action: "tldr", desc: CFG.commandPalette.commandDescriptions.tldr },
  { cmd: "/stats", action: "stats", desc: CFG.commandPalette.commandDescriptions.stats },
  { cmd: "/txt", action: "txt", desc: CFG.commandPalette.commandDescriptions.txt },
  { cmd: "/email", action: "email", desc: CFG.commandPalette.commandDescriptions.email },
  { cmd: "/github", action: "github", desc: CFG.commandPalette.commandDescriptions.github },
  { cmd: "/linkedin", action: "linkedin", desc: CFG.commandPalette.commandDescriptions.linkedin },
  { cmd: "/secret", action: "secret", desc: CFG.commandPalette.commandDescriptions.secret },
  { cmd: "/theme", action: "theme", desc: "flip the lights (paper ⇄ carbon)" },
  { cmd: "/inspect", action: "inspect", desc: "examine the page under a blueprint loupe" },
  { cmd: "/debug", action: "debug", desc: "toggle the dev debug overlay" },
  { cmd: "/clear", action: "close", desc: CFG.commandPalette.commandDescriptions.clear },
  { cmd: "/switch", action: "switch", desc: "switch the hero verb (build → fix → ship …)" },
];

function fmtTime(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}m ${r}s`;
}

export function CommandPalette({ openTldr }: { openTldr: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "stats" | "secret" | "txt">("list");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const close = useCallback(() => { setOpen(false); setQuery(""); setView("list"); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = ((e.target as HTMLElement | null)?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); return; }
      if (open) {
        if (e.key === "Escape") { e.preventDefault(); close(); }
        return;
      }
      if (e.key === "/" || e.key === "?" || e.key === ":") {
        e.preventDefault();
        setOpen(true);
        setQuery(e.key === "/" ? "/" : e.key === ":" ? ":" : "");
      } else if (/^[a-zA-Z]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setOpen(true);
        setQuery(e.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const filtered = COMMANDS.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase().replace(/^\//, "");
    return c.cmd.toLowerCase().includes(q);
  });

  const run = (c: Command) => {
    if (c.action === "scroll") {
      const el = c.target === "top" ? document.body : document.getElementById(c.target!);
      if (el) window.scrollTo({ top: c.target === "top" ? 0 : (el as HTMLElement).offsetTop - 60, behavior: "smooth" });
      close();
    } else if (c.action === "tldr") {
      close();
      setTimeout(() => openTldr(), 100);
    } else if (c.action === "stats") {
      setView("stats"); setQuery("");
    } else if (c.action === "txt") {
      setView("txt"); setQuery("");
    } else if (c.action === "secret") {
      setView("secret"); setQuery("");
    } else if (c.action === "email") {
      window.location.href = "mailto:" + CFG.personal.email;
      close();
    } else if (c.action === "github") {
      window.open(CFG.personal.github, "_blank");
      close();
    } else if (c.action === "linkedin") {
      const li = CFG.socialLinks.find((s) => s.platform === "LinkedIn");
      if (li) window.open(li.url, "_blank");
      close();
    } else if (c.action === "inspect") {
      // The loupe needs a fine pointer + hover; on touch it's a no-op, so say so.
      if (window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) {
        window.dispatchEvent(new CustomEvent("iw-loupe-toggle"));
      } else {
        emitTap("inspect needs a mouse — try it on desktop.");
      }
      close();
    } else if (c.action === "debug") {
      window.dispatchEvent(new CustomEvent("iw-debug-toggle"));
      close();
    } else if (c.action === "resume") {
      close();
      navigate("/resume");
    } else if (c.action === "switch") {
      advanceVerb();
      setQuery("");
    } else if (c.action === "theme") {
      const next = toggleTheme();
      emitTap(next === "carbon" ? COPY.masthead.theme.toDark : COPY.masthead.theme.toLight);
      close();
    } else if (c.action === "close") {
      close();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      // :switch: / switch / /switch all advance the hero verb (keep palette open).
      const norm = query.toLowerCase().replace(/[/:]/g, "").trim();
      if (norm === "switch") { advanceVerb(); setQuery(""); return; }
      // Hidden keyword easter eggs: type the bare word (e.g. "color", "dance") + Enter.
      const egg = query.toLowerCase().replace(/^\//, "").trim();
      if (KEYWORD_EGGS[egg]) { KEYWORD_EGGS[egg](); close(); return; }
      const match = COMMANDS.find((c) => c.cmd === query.toLowerCase()) || filtered[0];
      if (match) run(match);
    }
  };

  if (!open) return null;
  return (
    <>
      <div className="palette-back" onClick={close} />
      <div className="palette" role="dialog" aria-label="Command palette">
        {view === "list" && (
          <>
            <div className="palette-input-row">
              <span className="palette-prompt">›</span>
              <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} placeholder={CFG.commandPalette.placeholder} />
              <kbd>esc</kbd>
            </div>
            <div className="palette-body">
              {filtered.length === 0 ? (
                <div className="palette-feedback">no command matches "{query}".</div>
              ) : (
                <div className="palette-list">
                  {filtered.map((c) => (
                    <button key={c.cmd} onClick={() => run(c)}>
                      <code>{c.cmd}</code>
                      <span>{c.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="palette-foot-bar">
              <span>{CFG.commandPalette.hintTyping}</span>
              <span>{CFG.commandPalette.hintKeys}</span>
            </div>
          </>
        )}

        {view === "stats" && (
          <div className="palette-body" style={{ paddingTop: 22 }}>
            <button className="palette-back-btn" onClick={() => setView("list")}>{CFG.commandPalette.backText}</button>
            <h4>{CFG.commandPalette.statsHeading}</h4>
            <div className="palette-grid">
              {["hero", "about", "education", "certs", "work", "experience", "dash", "contact"].map((s) => (
                <div className="palette-stat" key={s}>
                  <div className="k">{s}</div>
                  <div className="v">{fmtTime(sectionTimes[s] || 0)}</div>
                </div>
              ))}
              <div className="palette-stat">
                <div className="k">scroll</div>
                <div className="v">{Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100) || 0}%</div>
              </div>
              <div className="palette-stat">
                <div className="k">on page</div>
                <div className="v">{fmtTime((Date.now() - pageStart) / 1000)}</div>
              </div>
            </div>
            <div className="palette-foot">↑ time per section, in seconds</div>
          </div>
        )}

        {view === "txt" && (
          <div className="palette-body" style={{ paddingTop: 22 }}>
            <button className="palette-back-btn" onClick={() => setView("list")}>{CFG.commandPalette.backText}</button>
            <h4>{CFG.commandPalette.txtHeading}</h4>
            <div className="palette-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="palette-stat">
                <div className="k">phone</div>
                <div className="v"><a href={"tel:" + CFG.commandPalette.phone.replace(/\D/g, "")}>{CFG.commandPalette.phone}</a></div>
              </div>
              <div className="palette-stat">
                <div className="k">email</div>
                <div className="v"><a href={"mailto:" + CFG.personal.email}>{CFG.personal.email}</a></div>
              </div>
            </div>
            <div className="palette-foot" style={{ textAlign: "left", marginTop: 16 }}>
              <a href="#contact" onClick={() => close()} style={{ color: "var(--accent)", textDecoration: "none" }}>{CFG.commandPalette.txtChatLink}</a>
            </div>
          </div>
        )}

        {view === "secret" && (
          <div className="palette-body" style={{ paddingTop: 22 }}>
            <button className="palette-back-btn" onClick={() => setView("list")}>{CFG.commandPalette.backText}</button>
            <h4>{CFG.commandPalette.secretHeading}</h4>
            <div className="palette-feedback" style={{ paddingTop: 0, paddingBottom: 14 }}>
              {CFG.commandPalette.secretFoundText}
            </div>
            <div className="palette-secret-section">
              <div className="palette-section-label">{CFG.commandPalette.secretSections.commands}</div>
              {COMMANDS.map((c) => (
                <div className="palette-secret-row" key={c.cmd}>
                  <code style={{ minWidth: 80 }}>{c.cmd}</code>
                  <span>{c.desc}</span>
                </div>
              ))}
            </div>
            <div className="palette-secret-section">
              <div className="palette-section-label">{CFG.commandPalette.secretSections.shortcuts}</div>
              {CFG.commandPalette.secretSections.shortcutItems.map((s, i) => (
                <div className="palette-secret-row" key={i}>
                  <code style={{ minWidth: 110 }}>{s.key}</code>
                  <span>{s.desc}</span>
                </div>
              ))}
              <div className="palette-secret-row">
                <code style={{ minWidth: 110 }}>/ or ?</code>
                <span>open this palette</span>
              </div>
              <div className="palette-secret-row">
                <code style={{ minWidth: 110 }}>cmd/ctrl + k</code>
                <span>open this palette</span>
              </div>
            </div>
            <div className="palette-secret-section">
              <div className="palette-section-label">{CFG.commandPalette.secretSections.hidden}</div>
              {CFG.commandPalette.secretSections.hiddenItems.map((s, i) => (
                <div className="palette-secret-row" key={i}>
                  <code style={{ minWidth: 130 }}>{s.key}</code>
                  <span>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── TLDR modal ──────────────────────────────────────────────
export function TldrModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const t = CFG.tldr;
  return (
    <>
      <div className="palette-back" onClick={onClose} />
      <div className="tldr-modal" style={{ position: "fixed" }}>
        <button className="tldr-x" onClick={onClose} aria-label="close">×</button>
        <div className="label" style={{ color: "var(--accent)" }}>※ {t.title}</div>
        <h3>here's the whole site<br />in <em>30 seconds</em></h3>
        <div className="tldr-sub">{t.summaryText}</div>
        <div className="tldr-list">
          {t.items.map((it, i) => (
            <div className="tldr-row" key={i}>
              <span className="k">{it.label}</span>
              <span className="v">{it.value}</span>
            </div>
          ))}
        </div>
        <button className="tldr-back" onClick={onClose}>{t.backText} →</button>
        <div className="tldr-hint">{t.footerHint}</div>
      </div>
    </>
  );
}

// ── Source easter egg — Cmd/Ctrl + U or I ───────────────────
export function SourceEgg() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "u" || e.key === "i" || e.key === "U" || e.key === "I")) {
        e.preventDefault();
        setShow(true);
        setTimeout(() => setShow(false), 6000);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!show) return null;
  const e = CFG.easterEgg;
  return (
    <div className="src-egg">
      <div className="src-egg-eye">👀</div>
      <div className="src-egg-title">{e.overlayTitle}</div>
      <div className="src-egg-msg">{e.overlayMessage}</div>
      <a className="src-egg-btn" href={CFG.personal.github} target="_blank" rel="noopener">{e.overlayButtonText}</a>
    </div>
  );
}

// ── useFps — live frames-per-second sampler ─────────────────
export function useFps(active = true) {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frames = 0, last = performance.now(), raf = 0;
    const loop = (t: number) => {
      frames++;
      if (t - last >= 1000) { setFps(frames); frames = 0; last = t; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return fps;
}

// ── DebugHUD — toggleable dev inspector overlay (/debug, Ctrl+`) ──
export function DebugHUD() {
  const [open, setOpen] = useState(false);
  const [, tick] = useState(0);
  const mouse = useRef({ x: 0, y: 0 });
  const fps = useFps(open);
  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "`") { e.preventDefault(); toggle(); }
    };
    window.addEventListener("iw-debug-toggle", toggle);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("iw-debug-toggle", toggle);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove, { passive: true });
    const id = setInterval(() => tick((n) => n + 1), 100);
    return () => { window.removeEventListener("mousemove", onMove); clearInterval(id); };
  }, [open]);

  if (!open) return null;
  const cur = expCurrent();
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
  const rows: [string, string][] = [
    ["viewport", `${window.innerWidth}×${window.innerHeight}`],
    ["dpr", String(window.devicePixelRatio || 1)],
    ["mouse", `${mouse.current.x}, ${mouse.current.y}`],
    ["scroll", `${Math.round(window.scrollY)}px · ${scrollPct}%`],
    ["fps", String(fps)],
    ["a/b font", cur.font],
    ["a/b anim", cur.mode],
  ];
  return (
    <div className="debug-hud">
      <div className="debug-hud-head">
        <span className="dot-pulse" />
        <span>DEBUG · LIVE</span>
        <button onClick={() => setOpen(false)} aria-label="close">×</button>
      </div>
      <div className="debug-hud-grid">
        {rows.map(([k, v]) => (
          <div className="debug-hud-row" key={k}><span className="dk">{k}</span><span className="dv">{v}</span></div>
        ))}
      </div>
      <div className="debug-hud-foot">ctrl + ` to toggle · /debug</div>
    </div>
  );
}

// ── Console greeting ────────────────────────────────────────
let _greeted = false;
export function consoleEgg() {
  if (_greeted) return;
  _greeted = true;
  const e = CFG.easterEgg;
  console.log("%c" + e.consoleGreeting, "font: 600 18px serif; color: #4f6bff;");
  console.log("%c" + e.consoleMessage, "font: 13px monospace; color: #2a2620;");
  console.log("%c" + e.consoleTech, "font: 11px monospace; color: #6a6358;");
  console.log("%c" + e.consoleRecruiter, "font-style: italic; color: #6a6358;");
}
