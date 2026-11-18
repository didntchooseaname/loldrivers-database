'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppDialog({ open, onOpenChange, icon, title, description, footer, children, className }: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true });
        }}
        className={cn(
          'app-dialog flex outline-none max-h-[min(44rem,calc(100dvh-2rem))] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0',
          className,
        )}
      >
        <header className="flex shrink-0 items-start gap-3.5 border-b px-6 pb-4 pt-5 pr-14">
          {icon && (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-foreground/80 [&>svg]:size-4">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight tracking-tight">{title}</DialogTitle>
            {description
              ? <DialogDescription className="mt-1 text-[0.8125rem] text-muted-foreground">{description}</DialogDescription>
              : <DialogDescription className="sr-only">{title}</DialogDescription>}
          </div>
        </header>
        <div className="app-dialog__body help-dialog-content min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>
        {footer && (
          <footer className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/30 px-6 py-3 text-sm">
            {footer}
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
