"use client";

import { useMemo } from "react";
import CompareCardShell from "@/components/CompareCardShell";
import CompareTable from "@/components/CompareTable";
import ChartCanvas from "@/components/ChartCanvas";
import { useCompareState } from "@/lib/useCompareState";
import { PHARMACY_COMPARE_ROWS, sumMetric } from "@/lib/compareEngine";
import { donutConfig, multiSeriesConfig } from "@/lib/chartConfigs";
import { COLORS } from "@/lib/metrics";

export default function PharmacyClient({ rows, currency }) {
  const { preset, setPreset, draft, updateDraft, applyCustom, window, tableRows } = useCompareState(rows, PHARMACY_COMPARE_ROWS);
  const { current, currentLabel, priorLabel } = window;

  const shareOrdersCfg = useMemo(() => {
    const mpOrders = sumMetric(current, "MP Pharmacy Orders");
    const shamelOrders = sumMetric(current, "Shamel Pharmacy Orders");
    return donutConfig(["MP", "Shamel"], [mpOrders, shamelOrders], [COLORS.teal, COLORS.navy], { suffix: " orders", legendFontSize: 10 });
  }, [current]);

  const shareRevenueCfg = useMemo(() => {
    const mpRev = sumMetric(current, "MP Pharmacy Revenue");
    const shamelRev = sumMetric(current, "Shamel Pharmacy Revenue");
    return donutConfig(["MP", "Shamel"], [mpRev, shamelRev], [COLORS.teal, COLORS.navy], { suffix: " revenue", currency: true, currencyLabel: currency, legendFontSize: 10 });
  }, [current, currency]);

  const ordersTrendCfg = useMemo(
    () =>
      multiSeriesConfig(rows, [
        { label: "MP", metric: "MP Pharmacy Orders", color: COLORS.teal },
        { label: "Shamel", metric: "Shamel Pharmacy Orders", color: COLORS.navy },
      ]),
    [rows]
  );

  const revenueTrendCfg = useMemo(
    () =>
      multiSeriesConfig(
        rows,
        [
          { label: "MP", metric: "MP Pharmacy Revenue", color: COLORS.teal },
          { label: "Shamel", metric: "Shamel Pharmacy Revenue", color: COLORS.navy },
        ],
        { currency: true, currencyLabel: currency }
      ),
    [rows, currency]
  );

  return (
    <>
      <CompareCardShell
        title="Orders & revenue comparison"
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
            <ChartCanvas config={shareOrdersCfg} className="chart-wrap-sm" empty={rows.length === 0} />
            <ChartCanvas config={shareRevenueCfg} className="chart-wrap-sm" empty={rows.length === 0} />
          </div>
        </div>
      </CompareCardShell>

      <div className="panels">
        <div className="panel">
          <h3>Pharmacy orders — MP vs Shamel</h3>
          <ChartCanvas config={ordersTrendCfg} empty={rows.length === 0} />
        </div>
        <div className="panel">
          <h3>Pharmacy revenue — MP vs Shamel</h3>
          <ChartCanvas config={revenueTrendCfg} empty={rows.length === 0} />
        </div>
      </div>
    </>
  );
}
