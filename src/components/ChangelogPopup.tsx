'use client';

import useSWR from 'swr';
import { AlertTriangle, ArrowUpRight, History, RotateCw } from 'lucide-react';
import { AppDialog } from '@/components/app-dialog';
import { Button } from '@/components/ui/button';
import { GithubIcon } from '@/components/icons/github';
import { cn } from '@/lib/utils';
import type { Stats } from '@/types';

interface ProcessedCommit {
  sha: string;
  shortSha: string;
  title: string;
  description: string;
  author: { name: string; date: string; github?: { login: string } | null };
  html_url: string;
}

interface CommitsResponse {
  success: boolean;
  data: ProcessedCommit[];
}

interface ChangelogPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

const TAGS: Record<string, { label: string; tone: string }> = {
  feat: { label: 'New', tone: 'border-signal/40 text-signal' },
  fix: { label: 'Fix', tone: 'border-warning/40 text-warning' },
  perf: { label: 'Perf', tone: 'border-border text-foreground/80' },
  refactor: { label: 'Refactor', tone: 'border-border text-muted-foreground' },
  revert: { label: 'Revert', tone: 'border-destructive/40 text-destructive' },
  docs: { label: 'Docs', tone: 'border-border text-muted-foreground' },
  chore: { label: 'Chore', tone: 'border-border text-muted-foreground' },
  style: { label: 'Style', tone: 'border-border text-muted-foreground' },
  test: { label: 'Test', tone: 'border-border text-muted-foreground' },
  build: { label: 'Build', tone: 'border-border text-muted-foreground' },
  ci: { label: 'CI', tone: 'border-border text-muted-foreground' },
};

const MAX_ENTRIES = 5;

const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
});

function parse(title: string) {
  const match = title.match(/^(\w+)(?:\([^)]*\))?!?:\s*(.+)$/);
  const tag = match ? TAGS[match[1].toLowerCase()] : undefined;
  const subject = tag && match ? match[2] : title;
  return { tag, subject: subject.charAt(0).toUpperCase() + subject.slice(1) };
}

const isDataSync = (title: string) => /^Update LOLDrivers data/i.test(title);

function safeCommitUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && parsed.hostname === 'github.com' && /^\/[^/]+\/[^/]+\/commit\/[a-f0-9]+$/.test(parsed.pathname)) {
      return `https://github.com${parsed.pathname}`;
    }
  } catch {
    // ignore malformed URL
  }
  return 'https://github.com/didntchooseaname/loldrivers-database/commits/main';
}

function groupByDay(commits: ProcessedCommit[]) {
  const groups: Array<{ day: string; commits: ProcessedCommit[] }> = [];
  for (const commit of commits) {
    const day = DAY.format(new Date(commit.author.date));
    const last = groups.at(-1);
    if (last?.day === day) last.commits.push(commit);
    else groups.push({ day, commits: [commit] });
  }
  return groups;
}

export default function ChangelogPopup({ isVisible, onClose }: ChangelogPopupProps) {
  const { data, error, isLoading, mutate } = useSWR<CommitsResponse>(
    isVisible ? '/api/commits?per_page=60' : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000, errorRetryCount: 1 },
  );

  const commits = data?.data ?? [];
  const groups = groupByDay(commits.filter((c) => !isDataSync(c.title)).slice(0, MAX_ENTRIES));
  const { data: statsData } = useSWR<{ stats: Stats }>(isVisible ? '/api/stats' : null, fetcher, { revalidateOnFocus: false });
  const sync = statsData?.stats.catalogSync;

  return (
    <AppDialog
      open={isVisible}
      onOpenChange={(open) => !open && onClose()}
      icon={<History />}
      title="Changelog"
      description="Product updates and catalog syncs, straight from the repository."
      footer={
        <>
          <span className="text-xs text-muted-foreground">{MAX_ENTRIES} latest updates</span>
          <a
            href="https://github.com/didntchooseaname/loldrivers-database/commits/main"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/85 hover:text-foreground"
          >
            <GithubIcon className="size-3.5" /> Full history <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </>
      }
    >
      {isLoading && !data ? (
        <div className="flex flex-col gap-5" aria-label="Loading changelog">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4 text-destructive" aria-hidden /> Could not reach GitHub</p>
          <p className="text-muted-foreground">The changelog is fetched live and may be rate limited. Try again in a minute.</p>
          <Button variant="outline" size="sm" onClick={() => mutate()}><RotateCw aria-hidden /> Retry</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {sync && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3.5 py-2.5 text-[0.8125rem]">
              <span className="live-dot shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                Catalog pulled from LOLDrivers on <span className="font-medium">{DAY.format(new Date(sync.synced_at))}</span>
                <span className="text-muted-foreground"> · upstream version of {DAY.format(new Date(sync.upstream.committed_at))}</span>
              </span>
              <a
                href={`https://github.com/${sync.upstream.repository}/commit/${sync.upstream.commit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-mono text-[0.6875rem] text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`Upstream commit ${sync.upstream.commit.slice(0, 7)}`}
              >
                {sync.upstream.commit.slice(0, 7)}
              </a>
            </div>
          )}
          <ol className="changelog flex flex-col gap-7">
            {groups.map((group) => (
              <li key={group.day} className="grid gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-5">
                <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground sm:pt-1">
                  {group.day}
                </h3>
                <ul className="flex flex-col gap-3 border-l pl-4">
                  {group.commits.map((commit) => {
                    const { tag, subject } = parse(commit.title);
                    return (
                      <li key={commit.sha} className="flex flex-col gap-1">
                        <div className="flex items-start gap-2">
                          {tag && (
                            <span className={cn('mt-px shrink-0 rounded border px-1.5 font-mono text-[0.625rem] uppercase leading-5 tracking-wide', tag.tone)}>
                              {tag.label}
                            </span>
                          )}
                          <p className="min-w-0 flex-1 text-sm font-medium leading-6">{subject}</p>
                          <CommitLink commit={commit} />
                        </div>
                        {commit.description && (
                          <p className="line-clamp-3 whitespace-pre-line text-[0.8125rem] leading-relaxed text-muted-foreground">
                            {commit.description}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      )}
    </AppDialog>
  );
}

function CommitLink({ commit }: { commit: ProcessedCommit }) {
  return (
    <a
      href={safeCommitUrl(commit.html_url)}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 rounded font-mono text-[0.6875rem] leading-6 text-muted-foreground transition-colors hover:text-foreground"
      aria-label={`Commit ${commit.shortSha} on GitHub`}
    >
      {commit.shortSha}
    </a>
  );
}
