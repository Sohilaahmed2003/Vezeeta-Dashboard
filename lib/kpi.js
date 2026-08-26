import { pctDelta } from "./format";
import { seriesFor, valueStepsBack, aggregateCoverage } from "./insights";
import { parseLocalDate } from "./format";
import { unitFor } from "./units";

// Builds a full KPI card's data straight from a metric name: looks up the
// latest value, the day-over-day and week-over-week deltas, a 14-day
// sparkline series, and whether the figure is a composite with some inputs
// still missing. Pure data — the presentational <KpiCard> component just
// renders whatever this returns, so it can be produced entirely on the
// server with zero client JS.
//
// The display unit (currency/percent/count/custom) comes from lib/units.js's
// registry by default — pass `opts.type` for a one-off override (shorthand
// for `{ type }`) or `opts.unit` for a full override (e.g. a pinned
// currency), but most metrics need neither.
export function buildKpi(rows, metric, label, opts) {
  opts = opts || {};
  const unit = opts.unit || (opts.type ? { type: opts.type } : unitFor(metric));
  const curr = valueStepsBack(rows, metric, 0);
  const dayDelta = pctDelta(curr, valueStepsBack(rows, metric, 1));
  const weekVal = valueStepsBack(rows, metric, 7);
  const weekDelta = pctDelta(curr, weekVal);
  const latestRow = rows.length ? rows[rows.length - 1] : null;
  let weekLabel = null;
  if (latestRow && weekVal !== null) {
    const latestDate = parseLocalDate(latestRow.date);
    const prior = new Date(latestDate);
    prior.setDate(prior.getDate() - 7);
    weekLabel = prior.toLocaleDateString("en-US", { weekday: "short" });
  }
  const showsNumber = curr !== null && curr !== undefined && !isNaN(curr);
  const partial = showsNumber && aggregateCoverage(metric, latestRow ? latestRow.values : null) !== "full";
  return {
    label,
    value: curr,
    dayDelta,
    weekDelta,
    weekLabel,
    partial,
    spark: seriesFor(rows, metric, opts.sparkDays || 14),
    unit,
    accent: !!opts.accent,
  };
}
