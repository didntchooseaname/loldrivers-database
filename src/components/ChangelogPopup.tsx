'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { History, ExternalLink, Loader2, AlertTriangle, RotateCw, Github } from 'lucide-react';

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  html_url: string;
}

interface ProcessedCommit {
  sha: string;
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
}

interface ChangelogPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ChangelogPopup: React.FC<ChangelogPopupProps> = ({ isVisible, onClose }) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && commits.length === 0) {
      fetchCommits();
    }
  }, [isVisible, commits.length]);

  const fetchCommits = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/commits?per_page=20');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setCommits(data.data.map((commit: ProcessedCommit) => ({
          sha: commit.sha,
          commit: {
            message: `${commit.title}\n${commit.description}`,
            author: {
              name: commit.author.name,
              email: commit.author.email,
              date: commit.author.date,
            }
          },
          author: commit.author.github,
          html_url: `https://github.com/didntchooseaname/loldrivers-database/commit/${commit.sha}`,
        })));
      } else {
        throw new Error(data.error || 'Failed to fetch commits');
      }
    } catch (err) {
      console.error('Failed to fetch commits:', err);
      setError('Failed to load changelog. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCommitMessage = (message: string): { title: string; description: string } => {
    const lines = message.split('\n').filter(line => line.trim());
    const title = lines[0] || 'No commit message';
    const description = lines.slice(1).join('\n').trim();

    return { title, description };
  };

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
            {loading ? (
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
                <AlertDescription className="flex flex-col gap-2">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={fetchCommits} className="w-fit">
                    <RotateCw className="h-3 w-3 mr-2" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {commits.map((commit) => {
                  const { title, description } = formatCommitMessage(commit.commit.message);
                  return (
                    <div
                      key={commit.sha}
                      className="commit-card flex gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground transition-colors duration-smooth ease-apple hover:bg-muted/30"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-medium text-sm">
                        {title.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="font-medium leading-tight text-sm">{title}</h4>
                          <span className="text-xs text-muted-foreground shrink-0">{formatDate(commit.commit.author.date)}</span>
                        </div>
                        {description && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                          {commit.author && (
                            <div className="flex items-center gap-1.5">
                              <Image
                                src={commit.author.avatar_url}
                                alt=""
                                width={16}
                                height={16}
                                className="rounded-full"
                              />
                              <span className="text-muted-foreground">{commit.author.login}</span>
                            </div>
                          )}
                          <a
                            href={sanitizeGitHubUrl(commit.html_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {commit.sha.substring(0, 7)}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
