import { fetchDataset } from "@/lib/apiClient";
import { buildKpi } from "@/lib/kpi";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import PharmacyClient from "@/components/tabs/PharmacyClient";

export const dynamic = "force-dynamic";

export default async function PharmacyPage() {
  const { rows, currency } = await fetchDataset("/api/pharmacy");

  return (
    <>
      <PageHeader title="Pharmacy" rows={rows} currency={currency} />
      {rows.length === 0 && (
        <div className="empty-banner">
          <p><strong>No data connected yet.</strong> Connect a data source to see pharmacy metrics from both MP and Shamel.</p>
        </div>
      )}
      <div className="kpi-row">
        <KpiCard currency={currency} kpi={buildKpi(rows, "Total Pharmacy Orders", "Total Orders", { accent: true })} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "Total Pharmacy Revenue", "Total Revenue")} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "MP Pharmacy Orders", "MP Orders")} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "Shamel Pharmacy Orders", "Shamel Orders")} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "Pharmacy AOV", "Avg Order Value")} />
      </div>
      <PharmacyClient rows={rows} currency={currency} />
    </>
  );
}
