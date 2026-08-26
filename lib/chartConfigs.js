import { formatDate, fmtCurrency, compactNumber } from "./format";

export function trendConfig(rows, metric, color, isCurrency, currencyLabel) {
  const dataArr = rows.map((r) => (r.values[metric] === undefined ? null : r.values[metric]));
  return {
    type: "line",
    data: {
      labels: rows.map((r) => formatDate(r.date)),
      datasets: [{ data: dataArr, borderColor: color, backgroundColor: color + "22", fill: true, tension: 0.3, pointRadius: 3 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => (isCurrency ? fmtCurrency(c.parsed.y, currencyLabel) : c.parsed.y.toLocaleString()) } },
      },
      scales: { y: { ticks: { callback: (v) => compactNumber(v) } }, x: { grid: { display: false } } },
    },
  };
}

// seriesDefs: [{label, metric, color}]
export function multiSeriesConfig(rows, seriesDefs, opts) {
  opts = opts || {};
  const tooltipCallbacks = {
    label: (c) => `${c.dataset.label}: ${opts.currency ? fmtCurrency(c.parsed.y, opts.currencyLabel) : Number(c.parsed.y).toLocaleString()}`,
  };
  if (opts.footerTotal) {
    tooltipCallbacks.footer = (items) => {
      const sum = items.reduce((s, it) => s + it.parsed.y, 0);
      return "Total: " + (opts.currency ? fmtCurrency(sum, opts.currencyLabel) : sum.toLocaleString());
    };
  }
  return {
    type: "line",
    data: {
      labels: rows.map((r) => formatDate(r.date)),
      datasets: seriesDefs.map((s) => ({
        label: s.label,
        data: rows.map((r) => (r.values[s.metric] === undefined ? null : r.values[s.metric])),
        borderColor: s.color,
        backgroundColor: opts.stacked ? s.color + "cc" : "transparent",
        fill: !!opts.stacked,
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true, position: "bottom", labels: { boxWidth: 9, boxHeight: 9, font: { size: 10.5 }, color: "#152b27" } },
        tooltip: { callbacks: tooltipCallbacks },
      },
      scales: {
        y: { stacked: !!opts.stacked, ticks: { callback: (v) => compactNumber(v) } },
        x: { grid: { display: false } },
      },
    },
  };
}

// labels: string[], values: number[] — a ranked, single-hue horizontal bar
// (most → least). This is one series (the metric itself) shown per
// category, not several series being told apart, so every bar takes the
// same hue and there's no legend — the axis labels carry identity, the
// sorted length carries the ranking.
export function rankedBarConfig(labels, values, color) {
  const ranked = labels
    .map((label, i) => ({ label, value: values[i] }))
    .sort((a, b) => b.value - a.value);
  return {
    type: "bar",
    data: {
      labels: ranked.map((r) => r.label),
      datasets: [{ data: ranked.map((r) => r.value), backgroundColor: color, borderRadius: 4, maxBarThickness: 24 }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => Number(c.parsed.x).toLocaleString() } },
      },
      scales: {
        x: { ticks: { callback: (v) => compactNumber(v) }, grid: { display: false } },
        y: { grid: { display: false } },
      },
    },
  };
}

// labels: string[], values: number[], colors: string[]
export function donutConfig(labels, values, colors, opts) {
  opts = opts || {};
  return {
    type: "doughnut",
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 9, boxHeight: 9, font: { size: opts.legendFontSize || 10.5 }, color: "#152b27" } },
        tooltip: {
          callbacks: {
            label: (c) => `${c.label}${opts.suffix || ""}: ${opts.currency ? fmtCurrency(c.parsed, opts.currencyLabel) : Number(c.parsed).toLocaleString()}`,
          },
        },
      },
    },
  };
}
