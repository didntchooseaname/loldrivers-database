'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  onIntent?: (page: number) => void;
}

function pageWindow(page: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

export function Pagination({ page, totalPages, onChange, onIntent }: PaginationProps) {
  if (totalPages <= 1) return null;
  const item = 'flex h-9 min-w-9 items-center justify-center rounded-md px-2 font-mono text-[0.8125rem] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label="Pagination" className="pagination mt-10 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1">
        <button type="button" className={cn(item, 'gap-1 pr-3 font-sans text-muted-foreground hover:bg-accent hover:text-foreground')} onClick={() => onChange(page - 1)} onMouseEnter={() => onIntent?.(page - 1)} disabled={page === 1} aria-label="Previous page">
          <ChevronLeft className="size-4" aria-hidden /><span className="hidden sm:inline">Prev</span>
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="w-6 text-center text-muted-foreground" aria-hidden>…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              onMouseEnter={() => onIntent?.(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              className={cn(item, 'pagination-number', p === page ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent hover:text-foreground', Math.abs(p - page) > 1 && p !== 1 && p !== totalPages && 'hidden sm:flex')}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className={cn(item, 'gap-1 pl-3 font-sans text-muted-foreground hover:bg-accent hover:text-foreground')} onClick={() => onChange(page + 1)} onMouseEnter={() => onIntent?.(page + 1)} disabled={page === totalPages} aria-label="Next page">
          <span className="hidden sm:inline">Next</span><ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
      <p className="pagination-indicator font-mono text-xs text-muted-foreground">Page {page} of {totalPages.toLocaleString('en-US')}</p>
    </nav>
  );
}
