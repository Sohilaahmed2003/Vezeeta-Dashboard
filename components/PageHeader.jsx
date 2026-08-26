import { freshnessInfo, buildSummaryText } from "@/lib/insights";
import { formatDate } from "@/lib/format";
import TopActions from "./TopActions";

// Server-rendered header shared by every tab: title, a status line, the
// freshness badge, and the copy/print actions. Only TopActions needs
// client JS — everything else here is plain HTML computed on the server.
export default function PageHeader({ title, rows, currency }) {
  const fresh = freshnessInfo(rows);
  const statusText =
    rows.length === 0
      ? "No data loaded yet."
      : `${rows.length} day${rows.length === 1 ? "" : "s"} loaded, latest ${formatDate(rows[rows.length - 1].date)}.`;
  const summary = buildSummaryText(rows, currency);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h2>{title}</h2>
        <p className="status-line">{statusText}</p>
      </div>
      <div className="topbar-actions">
        {fresh && (
          <span className={`freshness-badge ${fresh.level}`}>
            {fresh.gapDays <= 0
              ? `Data as of ${formatDate(fresh.latest)} — current`
              : `Data as of ${formatDate(fresh.latest)} — ${fresh.gapDays} day${fresh.gapDays === 1 ? "" : "s"} old`}
          </span>
        )}
        <TopActions summaryText={summary} disabled={rows.length === 0} />
      </div>
    </div>
  );
}
