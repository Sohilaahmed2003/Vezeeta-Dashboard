import { fetchDataset } from "@/lib/apiClient";
import { buildKpi } from "@/lib/kpi";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import RevenueClient from "@/components/tabs/RevenueClient";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const { rows, currency } = await fetchDataset("/api/revenue");

  return (
    <>
      <PageHeader title="Revenue" rows={rows} currency={currency} />
      {rows.length === 0 && (
        <div className="empty-banner">
          <p><strong>No data connected yet.</strong> Connect a data source to see financial analysis across every product.</p>
        </div>
      )}
      <div className="kpi-row">
        <KpiCard currency={currency} kpi={buildKpi(rows, "Total Revenue", "Total Revenue", { accent: true })} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "MP Revenue Total", "MP Revenue")} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "Shamel Total Revenue", "Shamel Revenue")} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "Total Booking Revenue", "Total Booking Revenue")} />
      </div>
      <RevenueClient rows={rows} currency={currency} />
    </>
  );
}
