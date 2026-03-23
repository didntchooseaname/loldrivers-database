'use client';

import React from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
        <DialogHeader className="shrink-0 px-6 py-5 bg-muted/30">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold tracking-tight">
            <History className="h-5 w-5 text-muted-foreground" />
            Changelog
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5">
            {isLoading && !data ? (
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading changelog...
                </div>
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
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
              <div className="space-y-3">
                {commits.map((commit) => (
                  <div
                    key={commit.sha}
                    className="commit-card flex gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground transition-colors duration-smooth ease-apple hover:bg-muted/30"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-medium text-sm">
                      {commit.title.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="font-medium leading-tight text-sm">{commit.title}</h4>
                        <span className="text-xs text-muted-foreground shrink-0">{formatDate(commit.author.date)}</span>
                      </div>
                      {commit.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{commit.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
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
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {commit.shortSha}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
