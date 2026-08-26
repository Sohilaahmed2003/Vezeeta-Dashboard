import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import ExcelJS from "exceljs";
import { parseRows, sortRows } from "./metrics";

// ---------------------------------------------------------------------------
// The data-access layer for the real data source: daily .xlsx workbooks
// sitting in an S3 bucket, one (or more) per day. This is the only file that
// knows S3 exists — lib/store.js's getDataset() calls fetchRowsFromS3() and
// hands back the same {rows, currency} shape it always has, so every page
// and component downstream stays exactly as it is today.
//
// Credentials are read from server-only env vars (never NEXT_PUBLIC_ — this
// module only ever runs on the server, never bundled to the browser).
// ---------------------------------------------------------------------------

const BUCKET = process.env.S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const PREFIX = process.env.S3_PREFIX || "";

let client = null;
function getClient() {
  if (!client) {
    client = new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

// getDataset() checks this before ever touching S3 — lets the app run (and
// show its empty state) with zero AWS setup, and start pulling real data the
// moment these env vars are filled in, with no code changes.
export function isConfigured() {
  return !!(BUCKET && REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

async function listXlsxKeys() {
  const s3 = getClient();
  const keys = [];
  let continuationToken;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX, ContinuationToken: continuationToken })
    );
    (res.Contents || []).forEach((obj) => {
      if (obj.Key && obj.Key.toLowerCase().endsWith(".xlsx")) keys.push(obj.Key);
    });
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

// Converts one worksheet into plain objects keyed by its header row (row 1)
// — the shape lib/metrics.js's parseRows() already expects. Handles either
// one data row per file (the day/file example given) or many, so a monthly
// workbook works the same way.
function worksheetToRows(sheet) {
  const headers = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = cell.value == null ? "" : String(cell.value).trim();
  });

  const rows = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    if (row.cellCount === 0) continue;
    const obj = {};
    let any = false;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      let value = cell.value;
      if (value && typeof value === "object" && "result" in value) value = value.result; // formula cell
      if (value !== null && value !== undefined && value !== "") any = true;
      obj[header] = value;
    });
    if (any) rows.push(obj);
  }
  return rows;
}

async function fetchWorkbookRows(key) {
  const s3 = getClient();
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const buffer = await streamToBuffer(res.Body);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  return sheet ? worksheetToRows(sheet) : [];
}

let cache = { rows: null, fetchedAt: 0 };
const CACHE_TTL_MS = 60_000;

// Lists every daily workbook in the bucket (under S3_PREFIX, if set), parses
// each, and combines them into the same {date, values} row shape used
// everywhere else via lib/metrics.js's parseRows/deriveComputed. Every page
// render calls this (pages are `dynamic = "force-dynamic"`), so results are
// cached briefly rather than re-listing/re-downloading/re-parsing the whole
// bucket on every request.
export async function fetchRowsFromS3() {
  const now = Date.now();
  if (cache.rows && now - cache.fetchedAt < CACHE_TTL_MS) return cache.rows;

  const keys = await listXlsxKeys();
  const rawRows = [];
  for (const key of keys) {
    rawRows.push(...(await fetchWorkbookRows(key)));
  }
  const rows = sortRows(parseRows(rawRows));
  cache = { rows, fetchedAt: now };
  return rows;
}
