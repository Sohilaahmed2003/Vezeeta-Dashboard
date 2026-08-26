import { fetchDataset } from "@/lib/apiClient";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function LabsPage() {
  const { rows, currency } = await fetchDataset("/api/scans");

  return (
    <>
      <PageHeader title="Scan" rows={rows} currency={currency} />
      <div className="empty-state">
        <h3>Scan isn&apos;t a standalone tab yet</h3>
      </div>
    </>
  );
}
