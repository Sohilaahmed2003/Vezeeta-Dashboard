import { has, ALL_REVENUE_KEYS } from "./metrics";
import { fmt, fmtCurrency, pctDelta, formatDate, parseLocalDate } from "./format";

// Composite figures built by summing several raw columns (see deriveComputed
// in metrics.js). If only SOME of a composite's inputs are loaded, the total
// is real but incomplete — e.g. "MP Total Bookings" with only Saudi data
// loaded is the Saudi number wearing a company-wide label. We flag it
// ("partial") rather than change the underlying math.
export const AGGREGATE_COMPONENTS = {
  "MP Total Bookings": ["MP Egypt Book Transactions", "MP Saudi Book Transactions", "MP Other Book Transactions"],
  "MP Booking Revenue": ["MP Egypt Booking Revenue", "MP Saudi Booking Revenue", "MP Other Booking Revenue"],
  "MP Revenue Total": ["MP Egypt Booking Revenue", "MP Saudi Booking Revenue", "MP Other Booking Revenue", "MP Pharmacy Revenue"],
  "Shamel Total Transactions": ["Shamel Book Transactions", "Shamel Pharmacy Orders", "Shamel Lab Transactions", "Shamel Scan Transactions"],
  "Shamel Total Revenue": ["Shamel Book Revenue", "Shamel Pharmacy Revenue", "Shamel Lab Revenue", "Shamel Scan Revenue"],
  "Total Pharmacy Orders": ["MP Pharmacy Orders", "Shamel Pharmacy Orders"],
  "Total Pharmacy Revenue": ["MP Pharmacy Revenue", "Shamel Pharmacy Revenue"],
  "Total Booking Revenue": ["MP Egypt Booking Revenue", "MP Saudi Booking Revenue", "MP Other Booking Revenue", "Shamel Book Revenue"],
  "Total Revenue": ALL_REVENUE_KEYS,
};

export function aggregateCoverage(metric, values) {
  const comps = AGGREGATE_COMPONENTS[metric];
  if (!comps || !values) return "full";
  const present = comps.filter((c) => has(values, c)).length;
  if (present === 0) return "none";
  return present === comps.length ? "full" : "partial";
}

// Raw inputs grouped the way a CEO thinks about "a data source" — coarser
// than the 27 individual columns — for the coverage checklist.
export const METRIC_GROUPS = [
  { label: "MP — Egypt bookings", keys: ["MP Egypt Book Transactions", "MP Egypt Booking Revenue"] },
  { label: "MP — Saudi bookings", keys: ["MP Saudi Book Transactions", "MP Saudi Booking Revenue"] },
  { label: "MP — Other-market bookings", keys: ["MP Other Book Transactions", "MP Other Booking Revenue"] },
  { label: "MP — booking source mix", keys: ["MP Organic Bookings", "MP Paid Bookings", "MP Referral Bookings"] },
  { label: "MP — pharmacy", keys: ["MP Pharmacy Orders", "MP Pharmacy Revenue"] },
  { label: "Shamel — bookings", keys: ["Shamel Book Transactions", "Shamel Book Revenue"] },
  { label: "Shamel — pharmacy", keys: ["Shamel Pharmacy Orders", "Shamel Pharmacy Revenue"] },
  { label: "Shamel — lab", keys: ["Shamel Lab Transactions", "Shamel Lab Revenue"] },
  { label: "Shamel — scan", keys: ["Shamel Scan Transactions", "Shamel Scan Revenue"] },
  { label: "Shamel — subscriptions & users", keys: ["Shamel Accumulative Subscriptions", "Shamel Accumulative Users", "Shamel B2B Subscriptions", "Shamel B2B2C Subscriptions", "Shamel B2C Subscriptions"] },
  { label: "Company-wide transaction count", keys: ["Overall Transactions"] },
];

export function computeGroupCoverage(rows) {
  return METRIC_GROUPS.map((g) => {
    const coveredKeys = g.keys.filter((k) => rows.some((r) => has(r.values, k)));
    return { label: g.label, covered: coveredKeys.length, total: g.keys.length, live: coveredKeys.length === g.keys.length, missing: coveredKeys.length === 0 };
  });
}

// Picks the first metric in a priority list with enough real history to
// analyze — lets the snapshot degrade gracefully to whatever is actually
// loaded instead of only working once every column is filled in.
export function firstMetricWithCoverage(rows, candidates, minDays) {
  minDays = minDays || 1;
  for (const m of candidates) {
    if (rows.filter((r) => has(r.values, m)).length >= minDays) return m;
  }
  return null;
}

export const HEADLINE_VOLUME_CANDIDATES = ["Overall Transactions", "MP Total Bookings", "Shamel Total Transactions", "MP Saudi Book Transactions", "MP Egypt Book Transactions", "MP Other Book Transactions", "Total Pharmacy Orders"];
export const HEADLINE_REVENUE_CANDIDATES = ["Total Revenue", "MP Revenue Total", "MP Booking Revenue", "MP Saudi Booking Revenue", "Shamel Total Revenue"];

// Last n values for a metric, most-recent last, keeping gaps as null so a
// sparkline can skip them rather than drawing a false flat line.
export function seriesFor(rows, metric, n) {
  return rows.slice(-n).map((r) => (r.values[metric] === undefined ? null : r.values[metric]));
}

// Value of a metric `stepsBack` rows before the latest one: 0 = latest,
// 1 = prior day, 7 = same weekday one week back.
export function valueStepsBack(rows, metric, stepsBack) {
  const idx = rows.length - 1 - stepsBack;
  if (idx < 0) return null;
  const v = rows[idx].values[metric];
  return v === undefined ? null : v;
}

export function median(nums) {
  if (!nums.length) return null;
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Flags a single weekday that's a consistent outlier vs the rest of the week
// for a given metric (e.g. one day a week running far below every other).
// Generic and data-driven — not hardcoded to any particular day or dataset.
export function weekdaySeasonality(rows, metric) {
  const buckets = {};
  rows.forEach((r) => {
    const v = r.values[metric];
    if (v === null || v === undefined || isNaN(v)) return;
    const dow = parseLocalDate(r.date).getDay();
    (buckets[dow] = buckets[dow] || []).push(v);
  });
  const dows = Object.keys(buckets);
  if (dows.length < 5) return null; // need most of the week represented
  const allVals = dows.reduce((a, k) => a.concat(buckets[k]), []);
  const overallAvg = allVals.reduce((a, b) => a + b, 0) / allVals.length;
  if (!overallAvg) return null;
  let worst = null;
  dows.forEach((k) => {
    const vals = buckets[k];
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const dev = ((avg - overallAvg) / overallAvg) * 100;
    if (!worst || Math.abs(dev) > Math.abs(worst.dev)) worst = { dow: Number(k), dev, avg, n: vals.length };
  });
  if (!worst || worst.n < 3 || Math.abs(worst.dev) < 40) return null;
  return { metric, dow: worst.dow, dev: worst.dev, avg: worst.avg, n: worst.n, overallAvg };
}

// Flags the latest value if it's far from the recent (trailing week,
// excluding itself) median for that metric — a generic "is today unusual"
// check independent of the weekday-pattern check above.
export function latestPointAnomaly(rows, metric) {
  const filtered = rows.filter((r) => has(r.values, metric));
  if (filtered.length < 8) return null;
  const latest = filtered[filtered.length - 1];
  const trailing = filtered.slice(-8, -1).map((r) => r.values[metric]);
  const base = median(trailing);
  if (!base) return null;
  const dev = ((latest.values[metric] - base) / base) * 100;
  if (Math.abs(dev) < 35) return null;
  return { metric, dev, date: latest.date, value: latest.values[metric], base };
}

export const METRIC_DISPLAY_LABELS = {
  "MP Saudi Book Transactions": "Saudi Marketplace bookings",
  "MP Egypt Book Transactions": "Egypt Marketplace bookings",
  "MP Other Book Transactions": "Other-market Marketplace bookings",
  "MP Total Bookings": "Marketplace bookings",
  "Overall Transactions": "Company-wide transactions",
  "Shamel Total Transactions": "Shamel transactions",
  "Total Pharmacy Orders": "Pharmacy orders",
  "Total Revenue": "Total revenue",
  "MP Revenue Total": "Marketplace revenue",
  "MP Booking Revenue": "Marketplace booking revenue",
  "MP Saudi Booking Revenue": "Saudi Marketplace revenue",
  "Shamel Total Revenue": "Shamel revenue",
};

export function metricLabel(metric) {
  return METRIC_DISPLAY_LABELS[metric] || metric;
}

// Freshness of the loaded data relative to "now" — evaluated at request
// time on the server (this app is server-rendered on every request; see
// `dynamic = "force-dynamic"` in the pages), which for a self-hosted
// dashboard is effectively the same clock the viewer would use.
export function freshnessInfo(rows) {
  if (rows.length === 0) return null;
  const latest = rows[rows.length - 1].date;
  const latestDay = parseLocalDate(latest);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const gapDays = Math.round((today - latestDay) / 86400000);
  const level = gapDays <= 1 ? "good" : gapDays <= 3 ? "warn" : "stale";
  return { latest, gapDays, level };
}

// Builds the plain-text lines behind the Executive Snapshot panel AND the
// "Copy summary" button, so the two never drift out of sync. Each line is a
// {kind, text} pair — kind drives the icon + color of its list item.
export function buildExecutiveInsights(rows, currencyLabel) {
  const lines = [];
  if (rows.length === 0) return lines;

  const fresh = freshnessInfo(rows);
  if (fresh) {
    if (fresh.gapDays <= 0) lines.push({ kind: "good", text: `Data is current through today, ${formatDate(fresh.latest)}.` });
    else lines.push({ kind: fresh.level === "stale" ? "warn" : "info", text: `Data is current through ${formatDate(fresh.latest)} — ${fresh.gapDays} day${fresh.gapDays === 1 ? "" : "s"} old.` });
  }

  const groups = computeGroupCoverage(rows);
  const liveCount = groups.filter((g) => g.live).length;
  const missingLabels = groups.filter((g) => g.missing).map((g) => g.label.replace(/^MP — |^Shamel — /, ""));
  if (liveCount === groups.length) {
    lines.push({ kind: "good", text: `All ${groups.length} tracked data categories are live.` });
  } else {
    const missingPreview = missingLabels.slice(0, 4).join(", ") + (missingLabels.length > 4 ? `, +${missingLabels.length - 4} more` : "");
    lines.push({ kind: "info", text: `${liveCount} of ${groups.length} data categories are live right now. Still missing: ${missingPreview || "none — check partial categories below"}.` });
  }

  const volMetric = firstMetricWithCoverage(rows, HEADLINE_VOLUME_CANDIDATES);
  if (volMetric) {
    const curr = valueStepsBack(rows, volMetric, 0);
    const dayDelta = pctDelta(curr, valueStepsBack(rows, volMetric, 1));
    const weekDelta = pctDelta(curr, valueStepsBack(rows, volMetric, 7));
    let text = `${metricLabel(volMetric)}: ${fmt(curr)} on the latest day`;
    const parts = [];
    if (dayDelta !== null) parts.push(`${dayDelta >= 0 ? "+" : ""}${dayDelta.toFixed(1)}% vs prior day`);
    if (weekDelta !== null) parts.push(`${weekDelta >= 0 ? "+" : ""}${weekDelta.toFixed(1)}% vs same day last week`);
    lines.push({ kind: "neutral", text: text + (parts.length ? ` (${parts.join(", ")})` : "") + "." });
  }
  const revMetric = firstMetricWithCoverage(rows, HEADLINE_REVENUE_CANDIDATES);
  if (revMetric) {
    const curr = valueStepsBack(rows, revMetric, 0);
    const dayDelta = pctDelta(curr, valueStepsBack(rows, revMetric, 1));
    lines.push({ kind: "neutral", text: `${metricLabel(revMetric)}: ${fmtCurrency(curr, currencyLabel)} on the latest day${dayDelta !== null ? ` (${dayDelta >= 0 ? "+" : ""}${dayDelta.toFixed(1)}% vs prior day)` : ""}.` });
  }

  let alertCount = 0;
  const seasonalityHits = [];
  HEADLINE_VOLUME_CANDIDATES.concat(HEADLINE_REVENUE_CANDIDATES).forEach((m) => {
    const s = weekdaySeasonality(rows, m);
    if (!s) return;
    if (seasonalityHits.some((h) => h.dow === s.dow)) return; // same weekday already flagged via a correlated metric
    seasonalityHits.push(s);
  });
  seasonalityHits.slice(0, 2).forEach((s) => {
    alertCount++;
    const shortfall = Math.abs(s.overallAvg - s.avg);
    lines.push({
      kind: "warn",
      text: `${DOW_NAMES[s.dow]}s run ${Math.abs(s.dev).toFixed(0)}% ${s.dev < 0 ? "below" : "above"} the weekly average for ${metricLabel(s.metric)} — consistently, across ${s.n} occurrence${s.n === 1 ? "" : "s"} in this data (about ${fmt(Math.round(shortfall))} ${s.dev < 0 ? "fewer" : "more"} than a typical day). Worth confirming whether that's expected or a gap worth closing.`,
    });
  });
  if (volMetric) {
    const anomaly = latestPointAnomaly(rows, volMetric);
    const latestDow = parseLocalDate(rows[rows.length - 1].date).getDay();
    const alreadyFlagged = seasonalityHits.some((s) => s.metric === volMetric && s.dow === latestDow);
    if (anomaly && !alreadyFlagged) {
      alertCount++;
      lines.push({ kind: "warn", text: `${metricLabel(volMetric)} on ${formatDate(anomaly.date)} is ${anomaly.dev >= 0 ? "up" : "down"} ${Math.abs(anomaly.dev).toFixed(0)}% vs. the trailing week's typical day — outside the usual range.` });
    }
  }
  if (alertCount === 0) lines.push({ kind: "good", text: "No unusual day-to-day swings detected in the metrics currently loaded." });

  return lines;
}

export const ALERT_ICON = { warn: "!", good: "\u2713", info: "\u2022", neutral: "\u2022" };

// Plain-text version of the Executive Snapshot, used by the "Copy summary"
// button — built from the exact same lines so the two never drift apart.
export function buildSummaryText(rows, currencyLabel) {
  const lines = buildExecutiveInsights(rows, currencyLabel);
  const latest = rows.length ? formatDate(rows[rows.length - 1].date) : null;
  const header = `Vezeeta Daily Snapshot${latest ? " — data as of " + latest : ""}`;
  return [header, ...lines.map((l) => `${ALERT_ICON[l.kind] || "-"} ${l.text}`)].join("\n");
}
