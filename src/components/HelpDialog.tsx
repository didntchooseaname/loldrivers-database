'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Optional short description for screen readers (improves dialog context). */
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
  const [showIndicator, setShowIndicator] = useState(showScrollIndicator);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setShowIndicator(true);
  }, [open]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    setShowIndicator(!isAtBottom);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-panel max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden sm:rounded-xl">
        <DialogHeader className="modal-header shrink-0 px-6 py-5 bg-muted/30">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold tracking-tight">
            {icon}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="sr-only">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-5 scroll-smooth help-dialog-content"
          onScroll={handleScroll}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:font-semibold prose-a:text-primary prose-p:text-muted-foreground prose-p:leading-relaxed">
            {children}
          </div>
        </div>

        {showScrollIndicator && showIndicator && (
          <div className="modal-scroll-hint shrink-0 px-6 py-3 bg-muted/20 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToBottom}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Scroll for more
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
