# Vezeeta Analytics Suite — Next.js (SSR, full-stack)

A full-stack Next.js port of the original single-file HTML dashboard. Every
tab is a real server-rendered route with its own URL, backed by a small
server-side store.

This build is **UI/design only**: there is no demo data, no hardcoded
dataset, and no Excel upload path. The dataset starts empty and every page
renders its empty state until `lib/store.js`'s `setDatasetRows()` is wired
up to a real data source.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000, with hot reload
```

For a production-style run:

```bash
npm run build
npm run start
```

Until AWS S3 credentials are configured (see `.env.local`), the dataset
stays empty — every tab shows its "No data yet" state until a real source
is connected.

## Folder structure

```
app/
  layout.js              Root shell — sidebar + <main>, reads the dataset once per request
  page.js                Overview (/)
  revenue/  mp/  shamel/  pharmacy/  labs/  Scans/
                          One route per tab (page.js), each a Server Component
  api/
    currency/route.js    POST — persists the currency label shown on revenue figures
  globals.css            All styling, ported from the original <style> block

components/
  Sidebar.jsx, PageHeader.jsx, TopActions.jsx, KpiCard.jsx, ChartCanvas.jsx,
  CompareCardShell.jsx, CompareTable.jsx, MtdYtdTable.jsx
  tabs/                  One client component per tab for its charts/compare-state

lib/
  metrics.js             Canonical metric list, header normalization, parseRows/deriveComputed
  format.js               Number/date/currency formatting helpers
  insights.js             Executive Snapshot: coverage, weekday seasonality, anomaly detection
  compareEngine.js         Last 7/30 days, month-vs-month, and custom-range comparison logic
  kpi.js / chartConfigs.js Data → KPI card / Chart.js config builders
  useCompareState.js       Client-side compare-period state machine
  store.js                The persistence layer (see below) — starts empty, no seed data

data/store.json           Created automatically — the persisted dataset + currency label
```

## How the "full stack" / "SSR" parts work

- **Every page is a Server Component.** It calls `getDataset()` directly
  (a local function, not a fetch) and renders real numbers — KPI values,
  the executive snapshot text, comparison tables, the raw data table — into
  the HTML before it reaches the browser. Charts still need a `<canvas>`
  and Chart.js, so those (and the compare-period chips) are the only
  client-rendered pieces.
- **`export const dynamic = "force-dynamic"`** is set on the layout and
  every page. Without it, Next.js could render the dashboard once at build
  time and cache that HTML forever, since nothing about reading a file
  looks "dynamic" to the framework by default — this line is what keeps
  every request reading the live store.
- **Currency changes go through an API route** (`/api/currency`), which
  writes to `data/store.json` so the next server render picks up the
  change. Nothing is held in client-only state that a page refresh would
  lose. Once a real data source is wired up, populating the dataset should
  follow the same pattern: write to the store, then let the next request
  re-render with fresh data.
- **Navigation is real routing** (`/revenue`, `/mp`, `/shamel`, …), not a
  client-side tab switcher — each one is bookmarkable and works on a hard
  refresh, while Next.js still does soft client-side transitions between
  them so it feels instant.

## Notable adaptations from the original file

- **No upload/demo-data path.** The original file shipped with a hardcoded
  seed dataset plus "Upload Excel" and "Load sample data" features. This
  build removes all of that (`lib/sampleData.js`, `lib/preloadedData.js`,
  `lib/templateData.js`, `lib/xlsxParse.js`, `lib/xlsxTemplate.js`, and the
  `/api/sample` and `/api/template` routes are gone) so the dashboard is
  pure UI/design against an empty dataset. `lib/metrics.js`'s `parseRows`/
  `deriveComputed`/`toISODateString` are kept since they're schema-shaping
  logic, not demo data — reuse them when wiring in a real source.
- **Storage is a single JSON file** (`data/store.json`) for simplicity.
  That's fine for local use or a normal persistent server/VPS/container,
  but it won't work as-is on a serverless platform with an ephemeral/
  read-only filesystem (e.g. Vercel's default runtime) — swap `lib/store.js`
  for a real database (Postgres, SQLite on a mounted volume, etc.) if you
  deploy there.
- **Currency label is now a server-persisted setting** (via
  `/api/currency`) rather than a page-local JS variable, since it needs to
  be available to every route's server render, including after a fresh
  navigation.
- **The freshness badge and Executive Snapshot's "current through"
  calculation now use the server's clock** at request time, rather than
  the viewer's browser clock. For a self-hosted dashboard these are
  normally the same thing; they'd only disagree if the server ran in a
  materially different timezone than the person viewing it.
