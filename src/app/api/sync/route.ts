import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPSTREAM_COMMITS = 'https://api.github.com/repos/magicsword-io/LOLDrivers/commits?path=loldrivers.io/content/api/drivers.json&per_page=1';
const SYNC_RUNS = 'https://api.github.com/repos/didntchooseaname/loldrivers-database/actions/workflows/update-drivers-data.yml/runs?status=success&per_page=1';
const TTL = 15 * 60 * 1000;

interface SyncStatus {
  localCommit: string | null;
  upstreamCommit: string | null;
  upstreamCommittedAt: string | null;
  upToDate: boolean | null;
  lastCheckedAt: string | null;
}

let cached: { at: number; data: SyncStatus } | null = null;

async function github<T>(url: string): Promise<T | null> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'loldrivers-database' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000), cache: 'no-store' });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

function localCommit(): string | null {
  try {
    const sync = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'sync.json'), 'utf8'));
    return typeof sync?.upstream?.commit === 'string' ? sync.upstream.commit : null;
  } catch {
    return null;
  }
}

export async function GET() {
  if (!cached || Date.now() - cached.at > TTL) {
    const [commits, runs] = await Promise.all([
      github<Array<{ sha: string; commit: { committer: { date: string } } }>>(UPSTREAM_COMMITS),
      github<{ workflow_runs: Array<{ updated_at: string }> }>(SYNC_RUNS),
    ]);
    const local = localCommit();
    const upstream = commits?.[0] ?? null;
    cached = {
      at: Date.now(),
      data: {
        localCommit: local,
        upstreamCommit: upstream?.sha ?? null,
        upstreamCommittedAt: upstream?.commit.committer.date ?? null,
        upToDate: upstream && local ? upstream.sha === local : null,
        lastCheckedAt: runs?.workflow_runs[0]?.updated_at ?? null,
      },
    };
  }

  return NextResponse.json(cached.data, {
    headers: { 'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600' },
  });
}
