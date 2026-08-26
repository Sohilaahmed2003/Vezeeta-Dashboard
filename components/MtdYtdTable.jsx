import { formatByUnit } from "@/lib/format";

// `rows` is the array returned by lib/compareEngine.js's buildMtdYtdRows().
export default function MtdYtdTable({ rows, mtdLabel, ytdLabel, currency }) {
  return (
    <table className="compare-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>{mtdLabel}</th>
          <th>{ytdLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={r.bold ? "cmp-total" : ""}>
            <td>{r.label}</td>
            <td>{formatByUnit(r.mtd, r.unit, currency)}</td>
            <td>{formatByUnit(r.ytd, r.unit, currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
