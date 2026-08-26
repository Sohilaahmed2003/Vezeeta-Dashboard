import { fmtCurrencyCompact, formatByUnit } from "@/lib/format";
import { COLORS } from "@/lib/metrics";

// Compact inline trend line for a KPI card — a glance at shape, not a
// precise chart. Skips gaps rather than drawing a false flat line, and
// renders nothing if fewer than 2 real points are available.
function Sparkline({ values }) {
  const nums = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
  if (nums.length < 2) return null;
  const w = 56, h = 22;
  const min = Math.min(...nums), max = Math.max(...nums);
  const range = max - min || 1;
  const step = w / (nums.length - 1);
  const pts = nums.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * (h - 4) - 2).toFixed(1)}`);
  const color = nums[nums.length - 1] >= nums[0] ? COLORS.up : COLORS.down;
  const area = `0,${h} ${pts.join(" ")} ${w},${h}`;
  return (
    <svg className="kpi-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={area} fill={color} opacity="0.14" stroke="none" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeltaLine({ delta, suffix }) {
  if (delta === null || delta === undefined || isNaN(delta)) return null;
  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "•";
  return <p className={`kpi-delta ${dir}`}>{arrow} {Math.abs(delta).toFixed(1)}% {suffix}</p>;
}

// `kpi` is the plain data object returned by lib/kpi.js's buildKpi().
export default function KpiCard({ kpi, currency }) {
  const { label, value, dayDelta, weekDelta, weekLabel, partial, spark, unit, accent } = kpi;
  // Currency KPIs use the compact form (e.g. "3.9k SAR") — everything else
  // (percent/count/custom) goes through the shared formatter.
  const displayVal =
    unit && unit.type === "currency"
      ? fmtCurrencyCompact(value, unit.currency || currency)
      : formatByUnit(value, unit, currency);
  const weekSuffix = weekLabel ? `vs last ${weekLabel}` : "vs 7d ago";

  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <p className="kpi-label">
          {label}
          {partial && (
            <span
              className="partial-tag"
              title="Not every input for this figure is loaded yet, so it may be understated (even showing 0) rather than the full company-wide number. See Data coverage below."
            >
              partial
            </span>
          )}
        </p>
        <Sparkline values={spark} />
      </div>
      <p className={`kpi-value${accent ? " accent" : ""}`}>{displayVal}</p>
      <DeltaLine delta={dayDelta} suffix="vs prior day" />
      <DeltaLine delta={weekDelta} suffix={weekSuffix} />
    </div>
  );
}
