"use client";

import { useMemo } from "react";
import ChartCanvas from "@/components/ChartCanvas";
import { donutConfig, trendConfig } from "@/lib/chartConfigs";
import { COLORS } from "@/lib/metrics";

export default function ShamelCharts({ rows }) {
  const txnDonutCfg = useMemo(() => {
    const latest = rows.length ? rows[rows.length - 1].values : {};
    return donutConfig(
      ["Book", "Pharmacy", "Lab", "Scan"],
      [latest["Shamel Book Transactions"] || 0, latest["Shamel Pharmacy Orders"] || 0, latest["Shamel Lab Transactions"] || 0, latest["Shamel Scan Transactions"] || 0],
      [COLORS.navy, COLORS.coral, COLORS.green, COLORS.plum]
    );
  }, [rows]);

  const typeDonutCfg = useMemo(() => {
    const latest = rows.length ? rows[rows.length - 1].values : {};
    return donutConfig(
      ["B2B", "B2B2C", "B2C"],
      [latest["Shamel B2B Subscriptions"] || 0, latest["Shamel B2B2C Subscriptions"] || 0, latest["Shamel B2C Subscriptions"] || 0],
      [COLORS.teal, COLORS.navy, COLORS.coral]
    );
  }, [rows]);

  const trendCfg = useMemo(() => trendConfig(rows, "Shamel Total Transactions", COLORS.navy, false), [rows]);

  return (
    <>
      <div className="panels">
        <div className="panel">
          <h3>Transactions by product — latest day</h3>
          <ChartCanvas config={txnDonutCfg} empty={rows.length === 0} />
        </div>
        <div className="panel">
          <h3>Subscriptions by type — latest day</h3>
          <ChartCanvas config={typeDonutCfg} empty={rows.length === 0} />
        </div>
      </div>
      <div className="panels">
        <div className="panel panel-wide">
          <h3>Total transactions — trend</h3>
          <ChartCanvas config={trendCfg} empty={rows.length === 0} />
        </div>
      </div>
    </>
  );
}
