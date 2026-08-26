import { fetchDataset } from "@/lib/apiClient";
import { buildKpi } from "@/lib/kpi";
import { sumMetric } from "@/lib/compareEngine";
import { fmt, fmtCurrency } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import ShamelCharts from "@/components/tabs/ShamelCharts";

export const dynamic = "force-dynamic";

const PRODUCTS = [
  { name: "Book", txn: "Shamel Book Transactions", rev: "Shamel Book Revenue" },
  { name: "Pharmacy", txn: "Shamel Pharmacy Orders", rev: "Shamel Pharmacy Revenue" },
  { name: "Lab", txn: "Shamel Lab Transactions", rev: "Shamel Lab Revenue" },
  { name: "Scan", txn: "Shamel Scan Transactions", rev: "Shamel Scan Revenue" },
];

export default async function ShamelPage() {
  const { rows, currency } = await fetchDataset("/api/shamel");

  const productRows = PRODUCTS.map((p) => {
    if (rows.length === 0) return { name: p.name, txn: null, rev: null, avg: null };
    const txn = sumMetric(rows, p.txn);
    const rev = sumMetric(rows, p.rev);
    return { name: p.name, txn, rev, avg: txn ? rev / txn : null };
  });
  const totalRev = productRows.reduce((s, r) => s + (r.rev || 0), 0);

  return (
    <>
      <PageHeader title="Shamel" rows={rows} currency={currency} />
      {rows.length === 0 && (
        <div className="empty-banner">
          <p><strong>No data connected yet.</strong> Connect a data source to see Shamel metrics.</p>
        </div>
      )}
      <div className="kpi-row">
        <KpiCard currency={currency} kpi={buildKpi(rows, "Shamel Total Transactions", "Total Transactions", { accent: true })} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "Shamel Accumulative Subscriptions", "Accumulative Subscriptions", {})} />
        <KpiCard currency={currency} kpi={buildKpi(rows, "Shamel Accumulative Users", "Accumulative Users", {})} />
      </div>

      <ShamelCharts rows={rows} currency={currency} />

      <div className="panel">
        <h3>Product performance — all time</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Transactions (All-Time)</th>
                <th>Revenue (All-Time)</th>
                <th>Avg Rev / Transaction</th>
                <th>% of Shamel Revenue</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{fmt(r.txn)}</td>
                  <td>{fmtCurrency(r.rev, currency)}</td>
                  <td>{r.avg === null ? "—" : fmtCurrency(r.avg, currency)}</td>
                  <td>{totalRev ? ((r.rev / totalRev) * 100).toFixed(1) + "%" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
