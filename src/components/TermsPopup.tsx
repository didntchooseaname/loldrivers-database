'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FileText } from 'lucide-react';

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
        <DialogHeader className="shrink-0 px-6 py-5 bg-muted/30">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold tracking-tight">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Terms of Service
          </DialogTitle>
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
