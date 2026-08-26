import { formatByUnit } from "@/lib/format";

function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined || isNaN(delta)) return <span className="kpi-delta flat">—</span>;
  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "•";
  return <span className={`kpi-delta ${dir}`}>{arrow} {Math.abs(delta).toFixed(1)}%</span>;
}

// `rows` is the array returned by lib/compareEngine.js's buildCompareRows().
export default function CompareTable({ rows, currentLabel, priorLabel, currency }) {
  return (
    <table className="compare-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>{currentLabel}</th>
          <th>{priorLabel}</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((d, i) => (
          <tr key={i} className={`${d.bold ? "cmp-total" : ""}${d.grand ? " cmp-grand" : ""}`}>
            <td>{d.label}</td>
            <td>{formatByUnit(d.curr, d.unit, currency)}</td>
            <td>{formatByUnit(d.prior, d.unit, currency)}</td>
            <td><DeltaBadge delta={d.delta} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
