// Formatting helpers — ported from the original inline <script>. All date
// arguments here are canonical "YYYY-MM-DD" strings (see metrics.js).

export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(dateStr) {
  const d = parseLocalDate(dateStr);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmt(n) {
  return n === null || n === undefined || isNaN(n) ? "—" : Number(n).toLocaleString();
}

export function fmtPercent(n) {
  return n === null || n === undefined || isNaN(n) ? "—" : Number(n).toFixed(1) + "%";
}

export function fmtCurrency(n, currencyLabel) {
  return n === null || n === undefined || isNaN(n)
    ? "—"
    : Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 }) + " " + currencyLabel;
}

export function compactNumber(v) {
  const abs = Math.abs(v);
  if (abs >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1000) return Math.round(v / 1000) + "k";
  return v;
}

export function fmtCurrencyCompact(n, currencyLabel) {
  return n === null || n === undefined || isNaN(n) ? "—" : compactNumber(Math.round(n)) + " " + currencyLabel;
}

export function pctDelta(current, prior) {
  if (current === null || current === undefined || isNaN(current)) return null;
  if (prior === null || prior === undefined || prior === 0 || isNaN(prior)) return null;
  return ((current - prior) / prior) * 100;
}

// Formats a value from a unit descriptor produced by lib/units.js's
// unitFor(): { type: "currency"|"percent"|"count"|"custom", currency?,
// label? }. `currencyLabel` is the app-wide currency setting, used unless
// the unit itself pins a specific currency.
export function formatByUnit(v, unit, currencyLabel) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  const type = (unit && unit.type) || "count";
  if (type === "currency") return fmtCurrency(v, (unit && unit.currency) || currencyLabel);
  if (type === "percent") return fmtPercent(v);
  if (type === "custom") return Number(v).toLocaleString() + (unit && unit.label ? " " + unit.label : "");
  return fmt(v);
}

// Shared shape for a delta pill: {dir: 'up'|'down'|'flat', arrow, text}
export function deltaInfo(delta) {
  if (delta === null || delta === undefined || isNaN(delta)) return null;
  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "•";
  return { dir, arrow, text: `${arrow} ${Math.abs(delta).toFixed(1)}%` };
}
