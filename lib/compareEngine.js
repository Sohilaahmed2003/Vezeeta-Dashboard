import { pctDelta } from "./format";
import { unitFor } from "./units";

export function sumMetric(rows, metricOrList) {
  const list = Array.isArray(metricOrList) ? metricOrList : [metricOrList];
  return rows.reduce((sum, r) => sum + list.reduce((a, m) => a + (Number(r.values[m]) || 0), 0), 0);
}

export function buildCompareRows(defs, current, prior, priorComplete) {
  return defs.map((def) => {
    let curr, priorVal;
    if (def.ratioNum) {
      const cn = sumMetric(current, def.ratioNum);
      const cd = sumMetric(current, def.ratioDen);
      const pn = sumMetric(prior, def.ratioNum);
      const pd = sumMetric(prior, def.ratioDen);
      curr = cd ? (cn / cd) * 100 : null;
      priorVal = pd ? (pn / pd) * 100 : null;
    } else {
      curr = current.length ? sumMetric(current, def.metric) : null;
      priorVal = prior.length ? sumMetric(prior, def.metric) : null;
    }
    // A delta against a partially-covered prior period (fewer days of data
    // than the window calls for) would compare unequal-length periods and
    // overstate the swing — suppress it, but still show the actual prior sum.
    const delta = priorComplete === false ? null : pctDelta(curr, priorVal);
    const unit = def.unit || unitFor(def.metric);
    return { label: def.label, curr, prior: priorVal, delta, unit, bold: !!def.bold, grand: !!def.grand };
  });
}

export function monthLabel(month1, year) {
  return new Date(year, month1 - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// Inclusive range check over canonical "YYYY-MM-DD" strings — plain string
// comparison sorts/compares correctly for this format, no Date math needed.
export function inRange(dateStr, startStr, endStr) {
  if (!startStr || !endStr) return false;
  return dateStr >= startStr && dateStr <= endStr;
}

export function daysInMonth(month1, year) {
  return new Date(year, month1, 0).getDate();
}

// scope state shape: { preset: "7"|"30"|"month"|"custom", custom: {aStart,aEnd,bStart,bEnd}|null }
export function getPeriodWindow(rows, preset, custom) {
  const n = rows.length;
  if (preset === "7" || preset === "30") {
    const days = preset === "7" ? 7 : 30;
    const current = rows.slice(Math.max(0, n - days), n);
    const prior = rows.slice(Math.max(0, n - 2 * days), Math.max(0, n - days));
    const priorComplete = prior.length === days;
    const priorLabel = priorComplete ? `Prior ${days} Days` : prior.length === 0 ? `Prior ${days} Days` : `Prior ${prior.length} Days (partial)`;
    return { current, prior, currentLabel: `Last ${days} Days`, priorLabel, priorComplete };
  }
  if (preset === "month") {
    if (n === 0) return { current: [], prior: [], currentLabel: "This Month", priorLabel: "Last Month", priorComplete: true };
    const latest = rows[n - 1].date;
    const [yStr, mStr] = latest.split("-");
    const y = Number(yStr), m = Number(mStr); // m is 1-based
    const current = rows.filter((r) => r.date.slice(0, 7) === `${yStr}-${mStr}`);
    let py = y, pm = m - 1;
    if (pm < 1) { pm = 12; py -= 1; }
    const priorKey = `${py}-${String(pm).padStart(2, "0")}`;
    const prior = rows.filter((r) => r.date.slice(0, 7) === priorKey);
    const priorComplete = prior.length === 0 || prior.length === daysInMonth(pm, py);
    const priorLabel = priorComplete || prior.length === 0 ? monthLabel(pm, py) : `${monthLabel(pm, py)} (partial)`;
    return { current, prior, currentLabel: monthLabel(m, y), priorLabel, priorComplete };
  }
  // custom
  const c = custom || {};
  const current = rows.filter((r) => inRange(r.date, c.aStart, c.aEnd));
  const prior = rows.filter((r) => inRange(r.date, c.bStart, c.bEnd));
  return { current, prior, currentLabel: "Period A", priorLabel: "Period B", priorComplete: true };
}

// Sensible starting values for the custom-range inputs: the last 7 days as
// Period A, and the 7 days immediately before that as Period B.
export function defaultCustomRange(rows) {
  if (rows.length === 0) return { aStart: "", aEnd: "", bStart: "", bEnd: "" };
  const latest = rows[rows.length - 1].date;
  const shiftDate = (dateStr, days) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d + days);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  };
  const aStart = shiftDate(latest, -6);
  const bEnd = shiftDate(aStart, -1);
  const bStart = shiftDate(bEnd, -6);
  return { aStart, aEnd: latest, bStart, bEnd };
}

// Metrics shown on the Overview MTD/YTD table — the volume/subscription
// counters (no revenue, which already has its own Revenue tab). The two
// "Accumulative" fields are running totals as of each day rather than a
// daily count, so they're shown as a point-in-time value (latest day in
// the window) instead of being summed like the rest.
export const MTD_YTD_ROWS = [
  { label: "MP Egypt Book Transactions", metric: "MP Egypt Book Transactions" },
  { label: "MP Saudi Book Transactions", metric: "MP Saudi Book Transactions" },
  { label: "MP Other Book Transactions", metric: "MP Other Book Transactions" },
  { label: "MP Pharmacy Orders", metric: "MP Pharmacy Orders" },
  { label: "Shamel Accumulative Subscriptions", metric: "Shamel Accumulative Subscriptions", cumulative: true },
  { label: "Shamel Accumulative Users", metric: "Shamel Accumulative Users", cumulative: true },
  { label: "Shamel B2B Subscriptions", metric: "Shamel B2B Subscriptions" },
  { label: "Shamel B2B2C Subscriptions", metric: "Shamel B2B2C Subscriptions" },
  { label: "Shamel B2C Subscriptions", metric: "Shamel B2C Subscriptions" },
  { label: "Shamel Book Transactions", metric: "Shamel Book Transactions" },
  { label: "Shamel Pharmacy Orders", metric: "Shamel Pharmacy Orders" },
  { label: "Shamel Total Transactions", metric: "Shamel Total Transactions", bold: true },
];

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Month-to-date and year-to-date totals, both windows ending on the latest
// loaded day (not necessarily today) so this stays correct for data that
// lags a few days behind. With no rows loaded, falls back to the current
// month/year so the table still shows every metric row (as "—") instead of
// disappearing.
export function buildMtdYtdRows(rows) {
  const latest = rows.length ? rows[rows.length - 1].date : todayISODate();
  const [yStr, mStr] = latest.split("-");
  const mtdRows = rows.filter((r) => r.date.slice(0, 7) === `${yStr}-${mStr}`);
  const ytdRows = rows.filter((r) => r.date.slice(0, 4) === yStr);

  const tableRows = MTD_YTD_ROWS.map((def) => {
    const unit = def.unit || unitFor(def.metric);
    if (def.cumulative) {
      return {
        label: def.label,
        mtd: mtdRows.length ? mtdRows[mtdRows.length - 1].values[def.metric] : null,
        ytd: ytdRows.length ? ytdRows[ytdRows.length - 1].values[def.metric] : null,
        unit,
        bold: !!def.bold,
      };
    }
    return {
      label: def.label,
      mtd: mtdRows.length ? sumMetric(mtdRows, def.metric) : null,
      ytd: ytdRows.length ? sumMetric(ytdRows, def.metric) : null,
      unit,
      bold: !!def.bold,
    };
  });

  return {
    rows: tableRows,
    mtdLabel: `MTD — ${monthLabel(Number(mStr), Number(yStr))}`,
    ytdLabel: `YTD — ${yStr}`,
  };
}

// Row definitions for each tab's comparison table. Display unit (currency,
// percent, count) is looked up automatically from lib/units.js via each
// row's `metric` — only rows with no single source metric (e.g. a ratio of
// two sums) need an explicit `unit` override.
export const MP_COMPARE_ROWS = [
  { label: "Total Bookings", metric: "MP Total Bookings" },
  { label: "Booking Revenue", metric: "MP Booking Revenue" },
  { label: "MP Pharmacy Orders", metric: "MP Pharmacy Orders" },
  { label: "Organic Bookings %", ratioNum: ["MP Organic Bookings"], ratioDen: ["MP Organic Bookings", "MP Paid Bookings", "MP Referral Bookings"], unit: { type: "percent" } },
];

export const PHARMACY_COMPARE_ROWS = [
  { label: "Total Orders", metric: "Total Pharmacy Orders" },
  { label: "MP Orders", metric: "MP Pharmacy Orders" },
  { label: "Shamel Orders", metric: "Shamel Pharmacy Orders" },
  { label: "Total Revenue", metric: "Total Pharmacy Revenue" },
];

export const REVENUE_COMPARE_ROWS = [
  { label: "MP Egypt Booking Revenue", metric: "MP Egypt Booking Revenue" },
  { label: "MP Saudi Booking Revenue", metric: "MP Saudi Booking Revenue" },
  { label: "MP Other Booking Revenue", metric: "MP Other Booking Revenue" },
  { label: "MP Pharmacy Revenue", metric: "MP Pharmacy Revenue" },
  { label: "MP Revenue — Subtotal", metric: "MP Revenue Total", bold: true },
  { label: "Shamel Booking Revenue", metric: "Shamel Book Revenue" },
  { label: "Shamel Pharmacy Revenue", metric: "Shamel Pharmacy Revenue" },
  { label: "Shamel Lab Revenue", metric: "Shamel Lab Revenue" },
  { label: "Shamel Scan Revenue", metric: "Shamel Scan Revenue" },
  { label: "Shamel Revenue — Subtotal", metric: "Shamel Total Revenue", bold: true },
  { label: "Grand Total Revenue", metric: "Total Revenue", bold: true, grand: true },
];

export function renderRevenueInsightLines(current, prior, priorComplete) {
  const lines = [];
  const totalCurr = sumMetric(current, "Total Revenue");
  const totalPrior = sumMetric(prior, "Total Revenue");
  const totalDelta = priorComplete === false ? null : pctDelta(totalCurr, totalPrior);
  if (totalDelta !== null) {
    lines.push(`Grand total revenue is ${totalDelta >= 0 ? "up" : "down"} <strong>${Math.abs(totalDelta).toFixed(1)}%</strong> vs the prior period.`);
  } else if (priorComplete === false && prior.length > 0) {
    lines.push(`Prior period is only partially covered by your data (${prior.length} day${prior.length === 1 ? "" : "s"}) — growth % hidden until a full comparison period is available.`);
  }
  const productMetrics = [
    { label: "MP Egypt booking", metric: "MP Egypt Booking Revenue" },
    { label: "MP Saudi booking", metric: "MP Saudi Booking Revenue" },
    { label: "MP Other booking", metric: "MP Other Booking Revenue" },
    { label: "MP pharmacy", metric: "MP Pharmacy Revenue" },
    { label: "Shamel booking", metric: "Shamel Book Revenue" },
    { label: "Shamel pharmacy", metric: "Shamel Pharmacy Revenue" },
    { label: "Shamel lab", metric: "Shamel Lab Revenue" },
    { label: "Shamel scan", metric: "Shamel Scan Revenue" },
  ];
  let best = null, worst = null, biggest = null;
  if (priorComplete !== false) {
    productMetrics.forEach((p) => {
      const c = sumMetric(current, p.metric);
      const pr = sumMetric(prior, p.metric);
      const d = pctDelta(c, pr);
      if (d !== null) {
        if (!best || d > best.d) best = { label: p.label, d };
        if (!worst || d < worst.d) worst = { label: p.label, d };
      }
    });
  }
  productMetrics.forEach((p) => {
    const c = sumMetric(current, p.metric);
    if (!biggest || c > biggest.c) biggest = { label: p.label, c };
  });
  if (best) lines.push(`Fastest growing: <strong>${best.label} revenue</strong> (${best.d >= 0 ? "+" : ""}${best.d.toFixed(1)}%).`);
  if (worst && worst.d < 0) lines.push(`Needs attention: <strong>${worst.label} revenue</strong> is down ${Math.abs(worst.d).toFixed(1)}%.`);
  if (biggest && totalCurr) lines.push(`Largest contributor: <strong>${biggest.label} revenue</strong> at ${((biggest.c / totalCurr) * 100).toFixed(1)}% of total.`);
  return lines;
}
