import { fetchDataset } from "@/lib/apiClient";
import { buildKpi } from "@/lib/kpi";
import { buildMtdYtdRows, MTD_YTD_ROWS } from "@/lib/compareEngine";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import MtdYtdTable from "@/components/MtdYtdTable";
import OverviewCharts from "@/components/tabs/OverviewCharts";
export const dynamic = "force-dynamic";
export default async function OverviewPage() {
  const { rows, currency } = await fetchDataset("/api/overview");
  const mtdYtd = buildMtdYtdRows(rows);
  return (
    <>
      <PageHeader title="Overview" rows={rows} currency={currency} />
      {rows.length === 0 && (
        <div className="empty-banner">
          <p><strong>No data connected yet.</strong> Connect a data source to populate every KPI, chart, and table below automatically.</p>
        </div>
      )}
      <div className="kpi-row">
        {MTD_YTD_ROWS.map((def) => (
          <KpiCard
            key={def.metric}
            currency={currency}
            kpi={buildKpi(rows, def.metric, def.label, { accent: def.metric === "Overall Transactions" })}
          />
        ))}
      </div>
      <div className="panel">
        <h3>MTD / YTD totals</h3>
        <div className="compare-table-wrap">
          <MtdYtdTable rows={mtdYtd.rows} mtdLabel={mtdYtd.mtdLabel} ytdLabel={mtdYtd.ytdLabel} currency={currency} />
        </div>
      </div>
      <OverviewCharts rows={rows} currency={currency} />
    </>
  );
}
