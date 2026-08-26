"use client";

import { useMemo } from "react";
import ChartCanvas from "@/components/ChartCanvas";
import { trendConfig, rankedBarConfig } from "@/lib/chartConfigs";
import { sumMetric } from "@/lib/compareEngine";
import { COLORS } from "@/lib/metrics";

// All-time transaction categories, ranked most → least in the bar chart
// below. Deliberately the raw per-product counts, not aggregates like
// "Overall Transactions" or "Shamel Total Transactions" — those would be
// sums of these same categories and would always rank first.
const TRANSACTION_CATEGORIES = [
  { label: "MP Egypt", metric: "MP Egypt Book Transactions" },
  { label: "MP Saudi", metric: "MP Saudi Book Transactions" },
  { label: "MP Other", metric: "MP Other Book Transactions" },
  { label: "MP Pharmacy", metric: "MP Pharmacy Orders" },
  { label: "Shamel Book", metric: "Shamel Book Transactions" },
  { label: "Shamel Pharmacy", metric: "Shamel Pharmacy Orders" },
  { label: "Shamel Lab", metric: "Shamel Lab Transactions" },
  { label: "Shamel Scan", metric: "Shamel Scan Transactions" },
];

export default function OverviewCharts({ rows }) {
  const trendCfg = useMemo(() => trendConfig(rows, "Overall Transactions", COLORS.teal, false), [rows]);
  const rankedCfg = useMemo(
    () =>
      rankedBarConfig(
        TRANSACTION_CATEGORIES.map((c) => c.label),
        TRANSACTION_CATEGORIES.map((c) => sumMetric(rows, c.metric)),
        COLORS.teal
      ),
    [rows]
  );

  return (
    <div className="panels">
      <div className="panel">
        <h3>Overall transactions — trend</h3>
        <ChartCanvas config={trendCfg} empty={rows.length === 0} />
      </div>
      <div className="panel">
        <h3>Transactions by category — most to least</h3>
        <ChartCanvas config={rankedCfg} empty={rows.length === 0} />
      </div>
    </div>
  );
}
