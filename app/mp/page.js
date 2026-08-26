import { fetchDataset } from "@/lib/apiClient";
import { buildKpi } from "@/lib/kpi";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import MpClient from "@/components/tabs/MpClient";

export const dynamic = "force-dynamic";

export default async function MpPage() {
  const { rows, currency } = await fetchDataset("/api/mp");

  return (
    <>
      <PageHeader title="Bookings" rows={rows} currency={currency} />
      {rows.length === 0 && (
        <div className="empty-banner">
          <p><strong>No data connected yet.</strong> Connect a data source to see Marketplace metrics.</p>
        </div>
      )}
      <div className="kpi-row">
        <KpiCard currency={currency} kpi={buildKpi(rows, "MP Total Bookings", "Total Bookings", { accent: true })} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "MP Booking Revenue", "Booking Revenue")} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "MP Organic %", "Organic Bookings")} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "MP Revenue Per Booking", "Avg Revenue / Booking")} />
      </div>
      <MpClient rows={rows} currency={currency} />
    </>
  );
}
