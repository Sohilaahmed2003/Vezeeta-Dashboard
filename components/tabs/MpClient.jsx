"use client";

import { useMemo } from "react";
import CompareCardShell from "@/components/CompareCardShell";
import CompareTable from "@/components/CompareTable";
import ChartCanvas from "@/components/ChartCanvas";
import { useCompareState } from "@/lib/useCompareState";
import { MP_COMPARE_ROWS, sumMetric } from "@/lib/compareEngine";
import { donutConfig, multiSeriesConfig } from "@/lib/chartConfigs";
import { COLORS } from "@/lib/metrics";
import { fmt, fmtCurrency } from "@/lib/format";

const REGIONS = [
  { name: "Egypt", txn: "MP Egypt Book Transactions", rev: "MP Egypt Booking Revenue" },
  { name: "Saudi", txn: "MP Saudi Book Transactions", rev: "MP Saudi Booking Revenue" },
  { name: "Other", txn: "MP Other Book Transactions", rev: "MP Other Booking Revenue" },
];

export default function MpClient({ rows, currency }) {
  const { preset, setPreset, draft, updateDraft, applyCustom, window, tableRows } = useCompareState(rows, MP_COMPARE_ROWS);
  const { current, currentLabel, priorLabel } = window;

  const organicPct = useMemo(() => {
    const organic = sumMetric(current, "MP Organic Bookings");
    const paid = sumMetric(current, "MP Paid Bookings");
    const referral = sumMetric(current, "MP Referral Bookings");
    const total = organic + paid + referral;
    return { organic, paid, referral, pct: total ? (organic / total) * 100 : null };
  }, [current]);

  const sourceDonutCfg = useMemo(
    () => donutConfig(["Organic", "Paid", "Referral"], [organicPct.organic, organicPct.paid, organicPct.referral], [COLORS.teal, COLORS.amber, COLORS.slate]),
    [organicPct]
  );

  const regionRows = useMemo(() => {
    const data = REGIONS.map((r) => {
      const bookings = current.length ? sumMetric(current, r.txn) : null;
      const revenue = current.length ? sumMetric(current, r.rev) : null;
      return { name: r.name, bookings, revenue, avg: bookings ? revenue / bookings : null };
    });
    const totalRevenue = data.reduce((s, r) => s + (r.revenue || 0), 0);
    return { data, totalRevenue };
  }, [current]);

  const regionTrendCfg = useMemo(
    () =>
      multiSeriesConfig(rows, [
        { label: "Egypt", metric: "MP Egypt Book Transactions", color: COLORS.teal },
        { label: "Saudi", metric: "MP Saudi Book Transactions", color: COLORS.navy },
        { label: "Other", metric: "MP Other Book Transactions", color: COLORS.coral },
      ]),
    [rows]
  );

  const regionRevenueTrendCfg = useMemo(
    () =>
      multiSeriesConfig(
        rows,
        [
          { label: "Egypt", metric: "MP Egypt Booking Revenue", color: COLORS.teal },
          { label: "Saudi", metric: "MP Saudi Booking Revenue", color: COLORS.navy },
          { label: "Other", metric: "MP Other Booking Revenue", color: COLORS.coral },
        ],
        { currency: true, currencyLabel: currency }
      ),
    [rows, currency]
  );

  return (
    <>
      <CompareCardShell
        title="Booking & revenue comparison"
        preset={preset}
        setPreset={setPreset}
        draft={draft}
        updateDraft={updateDraft}
        applyCustom={applyCustom}
      >
        <div className="compare-body">
          <div className="compare-table-wrap">
            <CompareTable rows={tableRows} currentLabel={currentLabel} priorLabel={priorLabel} currency={currency} />
          </div>
          <div className="compare-side">
            <div className="organic-callout">
              <p className="kpi-label">Organic bookings — current period</p>
              <p className="organic-big">{organicPct.pct === null ? "—" : organicPct.pct.toFixed(1) + "%"}</p>
            </div>
            <ChartCanvas config={sourceDonutCfg} className="chart-wrap-sm" empty={rows.length === 0} />
          </div>
        </div>
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Bookings</th>
                <th>Revenue</th>
                <th>Avg Rev / Booking</th>
                <th>% of MP Revenue</th>
              </tr>
            </thead>
            <tbody>
              {regionRows.data.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{fmt(r.bookings)}</td>
                  <td>{fmtCurrency(r.revenue, currency)}</td>
                  <td>{r.avg === null ? "—" : fmtCurrency(r.avg, currency)}</td>
                  <td>{regionRows.totalRevenue ? ((r.revenue / regionRows.totalRevenue) * 100).toFixed(1) + "%" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CompareCardShell>

      <div className="panels">
        <div className="panel">
          <h3>Bookings by region — trend</h3>
          <ChartCanvas config={regionTrendCfg} empty={rows.length === 0} />
        </div>
        <div className="panel">
          <h3>Booking revenue by region — trend</h3>
          <ChartCanvas config={regionRevenueTrendCfg} empty={rows.length === 0} />
        </div>
      </div>
    </>
  );
}
