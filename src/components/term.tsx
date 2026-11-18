'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GLOSSARY, type GlossaryKey } from '@/lib/glossary';
import { cn } from '@/lib/utils';

interface TermProps {
  id: GlossaryKey;
  children?: React.ReactNode;
  /** Wrap an existing element (badge, button) instead of rendering underlined text. */
  asChild?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function Term({ id, children, asChild, side = 'top', className }: TermProps) {
  const entry = GLOSSARY[id];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {asChild ? (
          children
        ) : (
          <span
            tabIndex={0}
            className={cn(
              'cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-[3px] outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring',
              className,
            )}
          >
            {children ?? entry.term}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-72 text-pretty">
        <p className="font-medium">{entry.term}</p>
        <p className="mt-0.5 leading-relaxed opacity-80">{entry.definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
