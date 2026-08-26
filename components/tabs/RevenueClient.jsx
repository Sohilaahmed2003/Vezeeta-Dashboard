"use client";

import { useMemo } from "react";
import CompareCardShell from "@/components/CompareCardShell";
import CompareTable from "@/components/CompareTable";
import ChartCanvas from "@/components/ChartCanvas";
import { useCompareState } from "@/lib/useCompareState";
import { REVENUE_COMPARE_ROWS, sumMetric, renderRevenueInsightLines } from "@/lib/compareEngine";
import { donutConfig, multiSeriesConfig } from "@/lib/chartConfigs";
import { COLORS } from "@/lib/metrics";

const MIX_METRICS = ["MP Booking Revenue", "MP Pharmacy Revenue", "Shamel Book Revenue", "Shamel Pharmacy Revenue", "Shamel Lab Revenue", "Shamel Scan Revenue"];
const MIX_LABELS = ["MP Booking", "MP Pharmacy", "Shamel Book", "Shamel Pharmacy", "Shamel Lab", "Shamel Scan"];
const MIX_COLORS = [COLORS.teal, COLORS.amber, COLORS.navy, COLORS.coral, COLORS.green, COLORS.plum];

const STACKED_SERIES = [
  { label: "MP Booking", metric: "MP Booking Revenue", color: COLORS.teal },
  { label: "MP Pharmacy", metric: "MP Pharmacy Revenue", color: COLORS.amber },
  { label: "Shamel Book", metric: "Shamel Book Revenue", color: COLORS.navy },
  { label: "Shamel Pharmacy", metric: "Shamel Pharmacy Revenue", color: COLORS.coral },
  { label: "Shamel Lab", metric: "Shamel Lab Revenue", color: COLORS.green },
  { label: "Shamel Scan", metric: "Shamel Scan Revenue", color: COLORS.plum },
];

export default function RevenueClient({ rows, currency }) {
  const { preset, setPreset, draft, updateDraft, applyCustom, window, tableRows } = useCompareState(rows, REVENUE_COMPARE_ROWS);
  const { current, prior, currentLabel, priorLabel, priorComplete } = window;

  const donutCfg = useMemo(() => {
    const data = MIX_METRICS.map((m) => sumMetric(current, m));
    return donutConfig(MIX_LABELS, data, MIX_COLORS, { currency: true, currencyLabel: currency });
  }, [current, currency]);

  const insightLines = useMemo(
    () => renderRevenueInsightLines(current, prior, priorComplete),
    [current, prior, priorComplete]
  );

  const stackedCfg = useMemo(
    () => multiSeriesConfig(rows, STACKED_SERIES, { stacked: true, currency: true, currencyLabel: currency, footerTotal: true }),
    [rows, currency]
  );

  return (
    <>
      <CompareCardShell
        title="Revenue comparison — all products"
        preset={preset}
        setPreset={setPreset}
        draft={draft}
        updateDraft={updateDraft}
        applyCustom={applyCustom}
      >
        <div className="compare-table-wrap">
          <CompareTable rows={tableRows} currentLabel={currentLabel} priorLabel={priorLabel} currency={currency} />
        </div>
      </CompareCardShell>

      <div className="panels">
        <div className="panel panel-wide">
          <h3>Revenue by product — trend</h3>
          <ChartCanvas config={stackedCfg} empty={rows.length === 0} />
        </div>
      </div>
      <div className="panels">
        <div className="panel">
          <h3>Revenue mix — current period</h3>
          <ChartCanvas config={donutCfg} empty={rows.length === 0} />
        </div>
        <div className="panel">
          <h3>Highlights</h3>
          {insightLines.length === 0 ? (
            <p className="kpi-label">Not enough data yet for highlights — load a few more days.</p>
          ) : (
            <ul className="insight-list">
              {insightLines.map((l, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: l }} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
