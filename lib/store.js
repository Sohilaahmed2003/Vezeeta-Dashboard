import { fetchRowsFromS3, isConfigured as isS3Configured } from "./s3";

// ---------------------------------------------------------------------------
// This is what makes the app "full stack" rather than a client-side-only
// SPA: every page is a Server Component that reads this store at request
// time (see `dynamic = "force-dynamic"` in the route files) and renders
// real numbers into the HTML before it ever reaches the browser.
//
// Rows come from S3 (lib/s3.js) whenever it's configured (real AWS
// credentials present) — otherwise the dataset stays empty, which is what
// lets the dashboard run and show its full design with placeholder values
// before any data source is connected. Either way, callers only ever see
// {rows, currency}; they don't know or care where the rows came from.
//
// Currency is fixed — this dashboard doesn't offer a currency switcher.
// ---------------------------------------------------------------------------

const CURRENCY = "EG";

export async function getDataset() {
  if (isS3Configured()) {
    try {
      return { rows: await fetchRowsFromS3(), currency: CURRENCY };
    } catch (err) {
      console.error("[store] Failed to read dataset from S3:", err);
      return { rows: [], currency: CURRENCY };
    }
  }
  return { rows: [], currency: CURRENCY };
}
