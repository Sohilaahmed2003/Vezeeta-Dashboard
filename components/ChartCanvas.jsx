"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  DoughnutController,
  BarController,
  LineElement,
  PointElement,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler,
} from "chart.js";

Chart.register(
  LineController,
  DoughnutController,
  BarController,
  LineElement,
  PointElement,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler
);

// Generic mounter for a Chart.js config object — the React equivalent of the
// original's renderOrReplaceChart(id, config): creates a fresh Chart
// instance whenever `config` changes and destroys it on cleanup/unmount.
// `config` should come from a useMemo in the caller so identity only
// changes when the underlying data actually does.
export default function ChartCanvas({ config, className, height, empty }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !config) return;
    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [config]);

  return (
    <div className={className || "chart-wrap"} style={height ? { height } : undefined}>
      <canvas ref={canvasRef} />
      {empty && <div className="chart-empty-overlay">No data yet</div>}
    </div>
  );
}
