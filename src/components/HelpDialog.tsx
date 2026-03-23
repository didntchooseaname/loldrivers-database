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
    // Check if content is scrollable after render
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
      <DialogContent className="max-w-[36rem] max-h-[82vh] flex flex-col gap-0 p-0 overflow-hidden border-border/60 rounded-lg">
        {/* Clean minimal header */}
        <DialogHeader className="shrink-0 px-5 pt-4 pb-3 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex items-center justify-center h-6 w-6 rounded bg-muted text-muted-foreground shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">
              {icon}
            </span>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-[0.6875rem] text-muted-foreground mt-0.5 pl-8">{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth help-dialog-content"
          onScroll={handleScroll}
        >
          <div className="px-5 py-4">
            {children}
          </div>
        </div>

        {/* Scroll fade hint */}
        {showScrollIndicator && canScroll && (
          <div className="shrink-0 flex justify-center py-1.5 border-t border-border/30 bg-gradient-to-t from-card to-transparent">
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 animate-bounce" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
