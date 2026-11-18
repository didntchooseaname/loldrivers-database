// Enriches data/virustotal.json with VirusTotal detection ratios for catalog samples.
// Spends at most the remaining daily and monthly quota, at 4 requests per minute.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const API = 'https://www.virustotal.com/api/v3';
const KEY = process.env.VT_API_KEY;
const CATALOG = 'data/drv.json';
const OUTPUT = 'data/virustotal.json';
const INTERVAL_MS = 15_500;
const RESERVE = 10;
const MAX_LOOKUPS = Number(process.env.VT_MAX_LOOKUPS || 490);
const STALE_DAYS = 30;
const NOT_FOUND_RETRY_DAYS = 7;
const SAVE_EVERY = 20;
const DAY_MS = 86_400_000;

if (!KEY) {
  console.error('VT_API_KEY is not set');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();

async function vt(path) {
  const res = await fetch(`${API}${path}`, { headers: { 'x-apikey': KEY }, signal: AbortSignal.timeout(30_000) });
  return { status: res.status, body: res.status === 204 ? null : await res.json().catch(() => null) };
}

async function remainingBudget() {
  const { status, body } = await vt(`/users/${KEY}/overall_quotas`);
  if (status !== 200 || !body?.data) {
    console.warn(`Quota endpoint returned ${status}; falling back to the configured cap`);
    return MAX_LOOKUPS;
  }
  const left = (quota) => (quota?.user ? quota.user.allowed - quota.user.used : Infinity);
  const daily = left(body.data.api_requests_daily);
  const monthly = left(body.data.api_requests_monthly);
  console.log(`Quota left: daily ${daily}, monthly ${monthly}`);
  return Math.max(0, Math.min(daily, monthly, MAX_LOOKUPS + RESERVE) - RESERVE);
}

function catalogHashes() {
  const drivers = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const seen = new Map();
  for (const driver of drivers) {
    const created = Date.parse(driver.Created ?? '') || 0;
    for (const sample of driver.KnownVulnerableSamples ?? []) {
      const sha256 = typeof sample.SHA256 === 'string' ? sample.SHA256.trim().toLowerCase() : '';
      if (!/^[a-f0-9]{64}$/.test(sha256)) continue;
      seen.set(sha256, Math.max(seen.get(sha256) ?? 0, created));
    }
  }
  return seen;
}

function loadStore() {
  if (!existsSync(OUTPUT)) return { updated_at: null, entries: {} };
  return JSON.parse(readFileSync(OUTPUT, 'utf8'));
}

function saveStore(store) {
  const entries = Object.fromEntries(Object.entries(store.entries).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(OUTPUT, `${JSON.stringify({ updated_at: now(), entries }, null, 1)}\n`);
}

function buildQueue(hashes, store) {
  const fresh = [];
  const retry = [];
  const stale = [];
  const t = Date.now();
  for (const [sha256, created] of hashes) {
    const entry = store.entries[sha256];
    if (!entry) fresh.push([sha256, created]);
    else if (entry.nf && t - Date.parse(entry.f) > NOT_FOUND_RETRY_DAYS * DAY_MS) retry.push([sha256, Date.parse(entry.f)]);
    else if (!entry.nf && t - Date.parse(entry.f) > STALE_DAYS * DAY_MS) stale.push([sha256, Date.parse(entry.f)]);
  }
  fresh.sort((a, b) => b[1] - a[1]);
  retry.sort((a, b) => a[1] - b[1]);
  stale.sort((a, b) => a[1] - b[1]);
  console.log(`Queue: ${fresh.length} never scanned, ${retry.length} not-found retries, ${stale.length} stale`);
  return [...fresh, ...retry, ...stale].map(([sha256]) => sha256);
}

const store = loadStore();
const hashes = catalogHashes();
for (const sha256 of Object.keys(store.entries)) {
  if (!hashes.has(sha256)) delete store.entries[sha256];
}

const queue = buildQueue(hashes, store);
const budget = await remainingBudget();
console.log(`Catalog: ${hashes.size} unique SHA256, cached: ${Object.keys(store.entries).length}, budget: ${budget}`);

let done = 0;
for (const sha256 of queue.slice(0, budget)) {
  const started = Date.now();
  const { status, body } = await vt(`/files/${sha256}`);

  if (status === 429) {
    console.warn('Quota exhausted (429); stopping early');
    break;
  }
  if (status === 200) {
    const s = body?.data?.attributes?.last_analysis_stats ?? {};
    const malicious = s.malicious ?? 0;
    const suspicious = s.suspicious ?? 0;
    store.entries[sha256] = {
      m: malicious,
      s: suspicious,
      t: malicious + suspicious + (s.undetected ?? 0) + (s.harmless ?? 0),
      d: body?.data?.attributes?.last_analysis_date
        ? new Date(body.data.attributes.last_analysis_date * 1000).toISOString()
        : null,
      f: now(),
    };
  } else if (status === 404) {
    store.entries[sha256] = { nf: true, f: now() };
  } else {
    console.warn(`${sha256}: HTTP ${status}, will retry on a later run`);
  }

  done += 1;
  if (done % SAVE_EVERY === 0) {
    saveStore(store);
    console.log(`${done} lookups done`);
  }
  const wait = INTERVAL_MS - (Date.now() - started);
  if (wait > 0) await sleep(wait);
}

saveStore(store);
const scanned = Object.values(store.entries).filter((e) => !e.nf).length;
console.log(`Finished: ${done} lookups this run, ${scanned}/${hashes.size} samples with results`);
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `lookups=${done}\nscanned=${scanned}\ntotal=${hashes.size}\n`, { flag: 'a' });
}
