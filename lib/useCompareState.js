"use client";

import { useMemo, useState } from "react";
import { getPeriodWindow, defaultCustomRange, buildCompareRows } from "./compareEngine";

// Shared state machine behind every "Last 7 days / Last 30 days / Month vs
// month / Custom range" comparison card. `rowDefs` is optional — pass it to
// get back ready-made table rows, or omit it and just use `window` directly
// (e.g. for a donut chart that needs the current/prior split but not a
// table).
export function useCompareState(rows, rowDefs) {
  const [preset, setPreset] = useState("7");
  const [custom, setCustom] = useState(() => defaultCustomRange(rows));
  const [draft, setDraft] = useState(() => defaultCustomRange(rows));

  function updateDraft(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function applyCustom() {
    setCustom(draft);
  }

  const window = useMemo(() => getPeriodWindow(rows, preset, custom), [rows, preset, custom]);
  const tableRows = useMemo(
    () => (rowDefs ? buildCompareRows(rowDefs, window.current, window.prior, window.priorComplete) : null),
    [rowDefs, window]
  );

  return { preset, setPreset, draft, updateDraft, applyCustom, window, tableRows };
}
