'use client';

import Link from 'next/link';
import { History, HelpCircle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';
import { GithubIcon } from '@/components/icons/github';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

interface SiteHeaderProps {
  search?: React.ReactNode;
  showSearch: boolean;
  busy?: boolean;
  onChangelog: () => void;
  onShare: () => void;
  onHelp: () => void;
}

function IconAction({ label, children, onClick, href }: { label: string; children: React.ReactNode; onClick?: () => void; href?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>{children}</a>
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" onClick={onClick} aria-label={label}>{children}</Button>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function SiteHeader({ search, showSearch, busy, onChangelog, onShare, onHelp }: SiteHeaderProps) {
  return (
    <header className={cn('site-header sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl backdrop-saturate-150 transition-colors', showSearch ? 'border-border' : 'border-transparent')}>
      <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="LOLDrivers Database home">
          <Logo className="size-7" />
          <span className="hidden text-[0.9375rem] font-semibold tracking-tight sm:inline">
            LOLDrivers <span className="font-mono text-xs font-medium text-muted-foreground">db</span>
          </span>
        </Link>

        <div
          className={cn(
            'mx-auto min-w-0 max-w-md flex-1 transition-[opacity,transform] duration-200',
            showSearch ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
          )}
          aria-hidden={!showSearch}
          inert={!showSearch}
        >
          {search}
        </div>

          <div className="header-controls flex shrink-0 items-center gap-0.5">
            <span className={cn('contents', showSearch && 'max-sm:hidden')}>
              <IconAction label="View changelog" onClick={onChangelog}><History /></IconAction>
              <IconAction label="Copy link to this view" onClick={onShare}><Link2 /></IconAction>
            </span>
            <IconAction label="Help" onClick={onHelp}><HelpCircle /></IconAction>
            <span className="hidden sm:contents">
              <IconAction label="Source on GitHub" href="https://github.com/didntchooseaname/loldrivers-database"><GithubIcon /></IconAction>
            </span>
            <AnimatedThemeToggler className="size-9" />
          </div>
      </div>
      {busy && <div className="progress-bar" aria-hidden />}
    </header>
  );
}
