'use client';

import React from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnimatedList } from '@/components/magicui/animated-list';
import { History, ExternalLink, Loader2, AlertTriangle, RotateCw, Github } from 'lucide-react';

interface ProcessedCommit {
  sha: string;
  shortSha: string;
  title: string;
  description: string;
  author: {
    name: string;
    email: string;
    date: string;
    github?: {
      login: string;
      avatar_url: string;
      html_url: string;
    } | null;
  };
  html_url: string;
  timestamp: number;
}

interface CommitsResponse {
  success: boolean;
  data: ProcessedCommit[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    last_updated: string;
  };
}

interface ChangelogPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const commitsFetcher = (url: string) => fetch(url).then(r => r.json());

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(date);
};

// Conventional-commit prefixes → human label + badge tone, mirroring the
// "Feature / Bug Fix" tags of the Magic UI changelog template.
const COMMIT_TAGS: Record<string, { label: string; variant: BadgeVariant }> = {
  feat: { label: 'Feature', variant: 'default' },
  fix: { label: 'Bug Fix', variant: 'secondary' },
  perf: { label: 'Performance', variant: 'secondary' },
  refactor: { label: 'Refactor', variant: 'secondary' },
  revert: { label: 'Revert', variant: 'destructive' },
  docs: { label: 'Docs', variant: 'outline' },
  chore: { label: 'Chore', variant: 'outline' },
  style: { label: 'Style', variant: 'outline' },
  test: { label: 'Test', variant: 'outline' },
  build: { label: 'Build', variant: 'outline' },
  ci: { label: 'CI', variant: 'outline' },
};

const parseCommit = (title: string): { tag: { label: string; variant: BadgeVariant } | null; subject: string } => {
  const match = title.match(/^(\w+)(?:\([^)]*\))?!?:\s*(.+)$/);
  if (match) {
    const tag = COMMIT_TAGS[match[1].toLowerCase()] ?? null;
    if (tag) {
      const subject = match[2];
      return { tag, subject: subject.charAt(0).toUpperCase() + subject.slice(1) };
    }
  }
  return { tag: null, subject: title };
};

const sanitizeGitHubUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'github.com' && urlObj.protocol === 'https:') {
      const pathPattern = /^\/[^/]+\/[^/]+\/commit\/[a-f0-9]+$/;
      if (pathPattern.test(urlObj.pathname)) {
        return `https://github.com${urlObj.pathname}`;
      }
    }
  } catch {
    // Invalid URL
  }
  return '#';
};

export const ChangelogPopup: React.FC<ChangelogPopupProps> = ({ isVisible, onClose }) => {
  // SWR: auto-fetches when visible, refreshes every 5 minutes, cached across open/close
  const { data, error, isLoading, mutate } = useSWR<CommitsResponse>(
    isVisible ? '/api/commits?per_page=20' : null,
    commitsFetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 300000, // Auto-refresh every 5 minutes while open
      dedupingInterval: 60000, // Don't re-fetch within 1 minute
      errorRetryCount: 2,
    }
  );

  const commits = data?.data || [];

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-panel max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden sm:rounded-xl">
        <DialogHeader className="shrink-0 border-b border-border bg-gradient-to-b from-muted/45 to-transparent px-6 pt-5 pb-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-foreground/80 shrink-0">
              <History className="h-4 w-4" />
            </span>
            Changelog
          </DialogTitle>
          <DialogDescription className="mt-1 pl-[2.625rem] text-xs text-muted-foreground">
            Recent updates to the database, pulled live from GitHub.
          </DialogDescription>
        </DialogHeader>

        {/* Native scroll container — reliable inside a flex dialog, and lets the
            sticky date column anchor to it. */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-6 py-6">
            {isLoading && !data ? (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading changelog...
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : error ? (
              <Alert variant="destructive" className="rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load changelog. Please try again later.</AlertDescription>
                <AlertAction>
                  <Button variant="outline" size="sm" onClick={() => mutate()}>
                    <RotateCw className="h-3 w-3 mr-2" />
                    Retry
                  </Button>
                </AlertAction>
              </Alert>
            ) : (
              <AnimatedList delay={70}>
                {commits.map((commit) => {
                  const { tag, subject } = parseCommit(commit.title);
                  return (
                    <div key={commit.sha} className="flex flex-col gap-y-1 md:flex-row">
                      {/* Date column — sticky on desktop, mirrors the Magic UI timeline */}
                      <div className="shrink-0 self-start pb-2 md:w-28 md:pb-8 md:pt-px md:sticky md:top-4">
                        <time className="text-xs font-medium text-muted-foreground" dateTime={commit.author.date}>
                          {formatDate(commit.author.date)}
                        </time>
                      </div>

                      {/* Content column — timeline line + dot, then commit details */}
                      <div className="relative flex-1 pb-8 md:pl-7">
                        <div className="hidden md:block absolute left-0 top-0 h-full w-px bg-border" aria-hidden />
                        <div className="hidden md:block absolute left-0 top-[5px] size-2.5 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background z-10" aria-hidden />

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {tag && (
                              <Badge variant={tag.variant} className="px-2 py-0 text-[0.65rem] uppercase tracking-wide">
                                {tag.label}
                              </Badge>
                            )}
                            <h4 className="font-medium leading-snug text-sm text-foreground">{subject}</h4>
                          </div>

                          {commit.description && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {commit.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs">
                            {commit.author.github && (
                              <div className="flex items-center gap-1.5">
                                <Image
                                  src={commit.author.github.avatar_url}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="rounded-full"
                                />
                                <span className="text-muted-foreground">{commit.author.github.login}</span>
                              </div>
                            )}
                            <a
                              href={sanitizeGitHubUrl(commit.html_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-muted-foreground transition-colors hover:text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {commit.shortSha}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </AnimatedList>
            )}

            <div className="mt-2 border-t border-border pt-5">
              <a
                href="https://github.com/didntchooseaname/loldrivers-database/commits/main"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Github className="h-4 w-4" />
                View all commits on GitHub
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
