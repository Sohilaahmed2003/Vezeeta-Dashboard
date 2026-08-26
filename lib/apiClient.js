import { headers } from "next/headers";

// Fetches this app's own /api/{tab} route from a Server Component. A fully
// qualified URL is required here — unlike the browser, Next.js won't
// resolve a relative path in a server-side fetch() — so the base URL is
// built from the incoming request's own headers, which works in dev, behind
// a proxy, and on any real domain without a hardcoded env var.
export async function fetchDataset(path) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || (host && host.startsWith("localhost") ? "http" : "https");
  const res = await fetch(`${proto}://${host}${path}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
  });
  if (!res.ok) return { rows: [], currency: "EG" };
  return res.json();
}
