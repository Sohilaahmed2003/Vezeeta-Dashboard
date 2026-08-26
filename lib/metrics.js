// ---------------------------------------------------------------------------
// Canonical metric names — incoming column headers are matched against
// these (case and spacing are normalized before matching, so minor
// differences are fine). Grouped by product family. The last two (Shamel
// Total Transactions, Total Pharmacy Orders) are kept only for backward
// compatibility with older data — going forward they are auto-calculated,
// see deriveComputed().
//
// Ported 1:1 from the original dashboard's inline <script>.
// ---------------------------------------------------------------------------
export const METRICS = [
  "MP Egypt Book Transactions", "MP Saudi Book Transactions", "MP Other Book Transactions",
  "MP Egypt Booking Revenue", "MP Saudi Booking Revenue", "MP Other Booking Revenue",
  "MP Organic Bookings", "MP Paid Bookings", "MP Referral Bookings",
  "MP Pharmacy Orders", "MP Pharmacy Revenue",
  "Overall Transactions",
  "Shamel Accumulative Subscriptions", "Shamel Accumulative Users",
  "Shamel B2B Subscriptions", "Shamel B2B2C Subscriptions", "Shamel B2C Subscriptions",
  "Shamel Book Transactions", "Shamel Book Revenue",
  "Shamel Pharmacy Orders", "Shamel Pharmacy Revenue",
  "Shamel Lab Transactions", "Shamel Lab Revenue",
  "Shamel Scan Transactions", "Shamel Scan Revenue",
  "Shamel Total Transactions", "Total Pharmacy Orders",
];

export function normalize(s) {
  return String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, " ");
}

export const METRIC_LOOKUP = {};
METRICS.forEach((m) => { METRIC_LOOKUP[normalize(m)] = m; });

// Palette shared across charts, sparklines and KPI deltas.
export const COLORS = {
  teal: "#00a99d",
  navy: "#2a5f7a",
  coral: "#d85a30",
  amber: "#d99a1b",
  green: "#3f9142",
  plum: "#8859a3",
  slate: "#7d93a0",
  up: "#1a9c6d",
  down: "#d84343",
};

export function has(values, key) {
  return values[key] !== undefined && values[key] !== null && !isNaN(values[key]);
}

export function sumKeys(values, keys) {
  let any = false;
  let total = 0;
  keys.forEach((k) => {
    if (has(values, k)) {
      any = true;
      total += Number(values[k]);
    }
  });
  return { total, any };
}

export const ALL_REVENUE_KEYS = [
  "MP Egypt Booking Revenue", "MP Saudi Booking Revenue", "MP Other Booking Revenue", "MP Pharmacy Revenue",
  "Shamel Book Revenue", "Shamel Pharmacy Revenue", "Shamel Lab Revenue", "Shamel Scan Revenue",
];

// ---------------------------------------------------------------------------
// Computed fields — derived once per row right after parsing, so every
// downstream KPI card, chart, and comparison table can read them exactly
// like any source column. Revenue fields fall back to null (shown as "—")
// rather than 0 when nothing was provided, so "not tracked" never looks like
// "earned zero".
// ---------------------------------------------------------------------------
export function deriveComputed(values) {
  const hasRevenue = ALL_REVENUE_KEYS.some((k) => has(values, k));

  const mpBookSum = sumKeys(values, ["MP Egypt Book Transactions", "MP Saudi Book Transactions", "MP Other Book Transactions"]);
  values["MP Total Bookings"] = mpBookSum.any ? mpBookSum.total : null;

  const mpBookRevenue = sumKeys(values, ["MP Egypt Booking Revenue", "MP Saudi Booking Revenue", "MP Other Booking Revenue"]).total;
  values["MP Booking Revenue"] = hasRevenue ? mpBookRevenue : null;

  const channelSum = sumKeys(values, ["MP Organic Bookings", "MP Paid Bookings", "MP Referral Bookings"]);
  values["MP Organic %"] = channelSum.any && channelSum.total > 0 ? ((values["MP Organic Bookings"] || 0) / channelSum.total) * 100 : null;

  values["MP Revenue Per Booking"] = hasRevenue && mpBookSum.any && mpBookSum.total > 0 ? mpBookRevenue / mpBookSum.total : null;

  const mpPharmRev = values["MP Pharmacy Revenue"] || 0;
  values["MP Revenue Total"] = hasRevenue ? mpBookRevenue + mpPharmRev : null;

  const shamelTxnSum = sumKeys(values, ["Shamel Book Transactions", "Shamel Pharmacy Orders", "Shamel Lab Transactions", "Shamel Scan Transactions"]);
  values["Shamel Total Transactions"] = shamelTxnSum.any ? shamelTxnSum.total : (has(values, "Shamel Total Transactions") ? values["Shamel Total Transactions"] : null);

  const shamelRevTotal = sumKeys(values, ["Shamel Book Revenue", "Shamel Pharmacy Revenue", "Shamel Lab Revenue", "Shamel Scan Revenue"]).total;
  values["Shamel Total Revenue"] = hasRevenue ? shamelRevTotal : null;

  const pharmOrdersSum = sumKeys(values, ["MP Pharmacy Orders", "Shamel Pharmacy Orders"]);
  values["Total Pharmacy Orders"] = pharmOrdersSum.any ? pharmOrdersSum.total : (has(values, "Total Pharmacy Orders") ? values["Total Pharmacy Orders"] : null);

  const shamelPharmRev = values["Shamel Pharmacy Revenue"] || 0;
  values["Total Pharmacy Revenue"] = hasRevenue ? mpPharmRev + shamelPharmRev : null;

  values["Total Booking Revenue"] = hasRevenue ? mpBookRevenue + (values["Shamel Book Revenue"] || 0) : null;

  values["Total Revenue"] = hasRevenue ? mpBookRevenue + mpPharmRev + shamelRevTotal : null;

  values["Pharmacy AOV"] = hasRevenue && values["Total Pharmacy Orders"] ? values["Total Pharmacy Revenue"] / values["Total Pharmacy Orders"] : null;

  return values;
}

// Converts an Excel date serial number to a canonical "YYYY-MM-DD" string.
// 25569 is the number of days between the Excel epoch (1899-12-30, which
// already bakes in Excel's famous 1900-leap-year bug) and the Unix epoch
// (1970-01-01). Computed with UTC getters since the serial number is a
// timezone-less calendar day, not an instant.
function excelSerialToISODate(serial) {
  const utcMillis = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(utcMillis);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Dates are kept as plain "YYYY-MM-DD" strings everywhere in this app
// (rather than Date objects) so rows can flow straight from the server
// store to React props to JSON without any serialization loss, and so
// range/sort comparisons can just use string comparison. This function is
// the single place that normalizes whatever a data source hands us (a JS
// Date, an Excel-style date serial number, or a string) into that canonical
// form, using LOCAL date components throughout so nights near midnight
// never shift a day in either direction.
// ---------------------------------------------------------------------------
export function toISODateString(value) {
  if (value instanceof Date && !isNaN(value)) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number" && isFinite(value)) {
    return excelSerialToISODate(value);
  }
  if (typeof value === "string") {
    const isoMatch = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  const d = new Date(value);
  if (!isNaN(d)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return null;
}

// rawRows: array of plain objects keyed by column header, e.g.
// {Date, ...metric columns}. Returns [{date: "YYYY-MM-DD", values:
// {...}}], unsorted.
export function parseRows(rawRows) {
  const out = [];
  for (const row of rawRows) {
    let date = null;
    const values = {};
    for (const [header, value] of Object.entries(row)) {
      const norm = normalize(header);
      if (norm === "date") {
        date = toISODateString(value);
      } else if (METRIC_LOOKUP[norm]) {
        const num = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
        values[METRIC_LOOKUP[norm]] = isNaN(num) ? null : num;
      }
    }
    if (date) out.push({ date, values: deriveComputed(values) });
  }
  return out;
}

export function sortRows(rows) {
  return rows.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
