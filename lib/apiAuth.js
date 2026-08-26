import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Shared guard for every /api/* route: checks the bearer token in
// Authorization against API_TOKEN, then applies a per-client rate limit.
// Call this first thing in a route handler and return its result if it's
// non-null.
//
// Rate limiting here is a simple in-memory fixed window — correct for this
// app's single long-running `next start` process. If this ever runs across
// multiple instances (e.g. serverless), swap `hits` for a shared store like
// Upstash Redis, since in-memory state wouldn't be shared between them.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const hits = new Map();

function isRateLimited(key) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(key, { count: 1, start: now });
    return false;
  }
  entry.count++;
  return entry.count > MAX_REQUESTS;
}

function tokensMatch(provided, expected) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch rather than returning false,
  // and lengths differing is itself not secret, so compare that first.
  return a.length === b.length && timingSafeEqual(a, b);
}

function clientKey(request) {
  const auth = request.headers.get("authorization");
  if (auth) return auth;
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export function guardApiRequest(request) {
  const expected = process.env.API_TOKEN;
  const provided = request.headers.get("authorization") || "";
  if (!expected || !tokensMatch(provided, `Bearer ${expected}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  return null;
}
