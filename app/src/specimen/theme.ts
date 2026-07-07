// ════════════════════════════════════════════════════════════
// Theme — "paper" (light, default) and "carbon" (dark).
// The token set lives in specimen.css (:root + [data-theme="carbon"]).
// index.html restores the persisted choice pre-paint (no flash);
// this module owns runtime switching + persistence + the event
// other systems (bg canvas, quirks) listen to.
// ════════════════════════════════════════════════════════════
export type ThemeName = "paper" | "carbon";

const KEY = "iw_theme";
export const THEME_EVENT = "iw-theme";

// Keep in sync with --paper in specimen.css for each theme.
const META_COLOR: Record<ThemeName, string> = {
  paper: "#fbfbfc",
  carbon: "#101014",
};

export function currentTheme(): ThemeName {
  return document.documentElement.dataset.theme === "carbon" ? "carbon" : "paper";
}

export function setTheme(t: ThemeName) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch { /* private mode — session-only */ }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOR[t]);
  window.dispatchEvent(new CustomEvent<ThemeName>(THEME_EVENT, { detail: t }));
}

export function toggleTheme(): ThemeName {
  const next: ThemeName = currentTheme() === "paper" ? "carbon" : "paper";
  setTheme(next);
  return next;
}
