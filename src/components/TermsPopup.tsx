'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Scale } from 'lucide-react';

interface TermsPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TermsPopup: React.FC<TermsPopupProps> = ({ isVisible, onClose }) => {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    if (isVisible && !content) {
      fetch('/api/help-content?type=terms')
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setContent(data.content);
          } else {
            setContent('# Terms of Service\n\nContent not available.');
          }
        })
        .catch(() => {
          setContent('# Terms of Service\n\nContent not available.');
        });
    }
  }, [isVisible, content]);

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-panel max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden sm:rounded-xl">
        <DialogHeader className="shrink-0 border-b border-border bg-gradient-to-b from-muted/45 to-transparent px-6 pt-5 pb-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-foreground/80 shrink-0">
              <Scale className="h-4 w-4" />
            </span>
            Terms &amp; License
          </DialogTitle>
          <DialogDescription className="mt-1 pl-[2.625rem] text-xs text-muted-foreground">
            Usage terms, license, and disclaimer for this database.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 help-dialog-content">
            <MarkdownRenderer content={content} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
