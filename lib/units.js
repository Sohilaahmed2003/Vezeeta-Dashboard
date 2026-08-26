import { ALL_REVENUE_KEYS } from "./metrics";

// Central "what kind of value is this metric" registry — the single place
// that decides how a metric renders (currency / percent / plain count /
// custom label), instead of repeating `{ type: "currency" }`-style options
// at every KPI card and comparison-table row that touches it. Add a metric
// to one of the lists below only when it needs something other than a plain
// count; everything else defaults to "count" automatically, so new metrics
// added to lib/metrics.js's METRICS list work out of the box.
export const UNIT_TYPES = { COUNT: "count", CURRENCY: "currency", PERCENT: "percent", CUSTOM: "custom" };

// Money fields — raw inputs plus every computed revenue/AOV aggregate (see
// deriveComputed in metrics.js).
const CURRENCY_METRICS = [
  ...ALL_REVENUE_KEYS,
  "MP Booking Revenue",
  "MP Revenue Total",
  "MP Revenue Per Booking",
  "Shamel Total Revenue",
  "Total Pharmacy Revenue",
  "Total Booking Revenue",
  "Total Revenue",
  "Pharmacy AOV",
];

// Percentage fields.
const PERCENT_METRICS = ["MP Organic %"];

// Metrics pinned to one specific currency regardless of the app-wide
// currency setting (e.g. a metric that's always reported in one market's
// currency). Empty today — populate as `{ "Some Metric": "EGP" }` if that's
// ever needed.
const CURRENCY_OVERRIDES = {};

// Metrics that render as a number followed by a custom word instead of a
// currency code or a percent sign (e.g. "12 sessions"). Empty today —
// populate as `{ "Some Metric": "sessions" }` when a metric like that is
// added.
const CUSTOM_LABELS = {};

// Returns the unit descriptor for a metric: { type, currency?, label? }.
// `type` is one of UNIT_TYPES. Callers pass this straight to
// lib/format.js's formatByUnit().
export function unitFor(metric) {
  if (CURRENCY_METRICS.includes(metric)) {
    return { type: UNIT_TYPES.CURRENCY, currency: CURRENCY_OVERRIDES[metric] || null };
  }
  if (PERCENT_METRICS.includes(metric)) {
    return { type: UNIT_TYPES.PERCENT };
  }
  if (CUSTOM_LABELS[metric]) {
    return { type: UNIT_TYPES.CUSTOM, label: CUSTOM_LABELS[metric] };
  }
  return { type: UNIT_TYPES.COUNT };
}
