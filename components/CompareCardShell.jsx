"use client";

const PRESETS = [
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "month", label: "Month vs month" },
  { key: "custom", label: "Custom range" },
];

// Renders the shared compare-card chrome (title + preset chips + the custom
// date-range form when that preset is active) and drops whatever body
// content each tab needs (table, donuts, callouts...) in as children.
export default function CompareCardShell({ title, preset, setPreset, draft, updateDraft, applyCustom, children }) {
  return (
    <div className="compare-card">
      <div className="compare-head">
        <h3>{title}</h3>
        <div className="compare-presets">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`chip ${preset === p.key ? "active" : ""}`}
              onClick={() => setPreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {preset === "custom" && (
        <div className="compare-custom">
          <div className="compare-custom-row">
            <span>Period A</span>
            <input type="date" className="date-input" value={draft.aStart} onChange={(e) => updateDraft("aStart", e.target.value)} />
            <span>to</span>
            <input type="date" className="date-input" value={draft.aEnd} onChange={(e) => updateDraft("aEnd", e.target.value)} />
          </div>
          <div className="compare-custom-row">
            <span>Period B</span>
            <input type="date" className="date-input" value={draft.bStart} onChange={(e) => updateDraft("bStart", e.target.value)} />
            <span>to</span>
            <input type="date" className="date-input" value={draft.bEnd} onChange={(e) => updateDraft("bEnd", e.target.value)} />
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={applyCustom}>Apply</button>
        </div>
      )}
      {children}
    </div>
  );
}
