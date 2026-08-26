import { fetchDataset } from "@/lib/apiClient";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function LabsPage() {
  const { rows, currency } = await fetchDataset("/api/labs");

  return (
    <>
      <PageHeader title="Labs" rows={rows} currency={currency} />
      <div className="empty-state">
        <h3>Labs isn&apos;t a standalone tab yet</h3>
      </div>
    </>
  );
}
