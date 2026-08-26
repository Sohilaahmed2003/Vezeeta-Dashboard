"use client";

import { useState } from "react";

// Just the two buttons that need real browser APIs (clipboard, print) — kept
// as a tiny client island so the rest of PageHeader can stay a Server
// Component.
export default function TopActions({ summaryText, disabled }) {
  const [label, setLabel] = useState("Copy summary");

  async function handleCopy() {
    if (disabled) return;
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setLabel("Clipboard unavailable");
      setTimeout(() => setLabel("Copy summary"), 1600);
      return;
    }
    try {
      await navigator.clipboard.writeText(summaryText);
      setLabel("Copied!");
    } catch {
      setLabel("Could not copy");
    }
    setTimeout(() => setLabel("Copy summary"), 1600);
  }

  function handlePrint() {
    if (disabled) return;
    window.print();
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy} disabled={disabled}>
        {label}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={handlePrint} disabled={disabled}>
        Print
      </button>
    </>
  );
}
