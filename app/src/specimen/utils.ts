// Fill {placeholders} in a template string from a vars map.
export function tpl(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
