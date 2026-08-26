import { NextResponse } from "next/server";
import { getDataset } from "./store";
import { guardApiRequest } from "./apiAuth";

// Shared GET handler behind every /api/{tab} dataset endpoint (overview,
// revenue, mp, shamel, pharmacy, labs, scans) — they all serve the same
// underlying dataset today (one unified daily-metrics table), so there's a
// single implementation reused across the 7 route files instead of
// repeating it. A tab that ever needs a narrower response (e.g. only its
// own metrics) can give that route its own GET instead of importing this.
export async function GET(request) {
  const denied = guardApiRequest(request);
  if (denied) return denied;
  return NextResponse.json(await getDataset());
}
