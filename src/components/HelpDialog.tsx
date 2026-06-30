'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ChevronDown } from 'lucide-react';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  showScrollIndicator?: boolean;
}

export function HelpDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  showScrollIndicator = true,
}: HelpDialogProps) {
  const [canScroll, setCanScroll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) {
      const check = () => setCanScroll(el.scrollHeight > el.clientHeight + 10);
      check();
      const observer = new ResizeObserver(check);
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [open, children]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setCanScroll(el.scrollHeight - el.scrollTop > el.clientHeight + 10);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-border bg-gradient-to-b from-muted/45 to-transparent px-6 pt-5 pb-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-foreground/80 shrink-0 [&>svg]:h-4 [&>svg]:w-4">
              {icon}
            </span>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="mt-1 pl-[2.625rem] text-xs text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth help-dialog-content"
          onScroll={handleScroll}
        >
          <div className="px-6 py-5">{children}</div>
        </div>

        {/* Scroll hint */}
        {showScrollIndicator && canScroll && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-10 items-end justify-center bg-gradient-to-t from-popover via-popover/80 to-transparent pb-1.5">
            <ChevronDown className="h-4 w-4 animate-bounce text-muted-foreground/70" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
