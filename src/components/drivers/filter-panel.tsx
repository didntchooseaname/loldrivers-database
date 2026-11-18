'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Term } from '@/components/term';
import type { Stats } from '@/types';
import { FILTER_GROUPS, countFacetFilters } from './filters-config';

interface FilterPanelProps {
  active: Set<string>;
  stats?: Stats;
  onToggle: (key: string) => void;
  onReset: () => void;
  className?: string;
}

const TONE_DOT: Record<string, string> = {
  danger: 'bg-destructive',
  positive: 'bg-success',
  caution: 'bg-warning',
};

export function FilterPanel({ active, stats, onToggle, onReset, className }: FilterPanelProps) {
  const activeCount = countFacetFilters(active);

  return (
    <nav aria-label="Filters" className={cn('filter-panel flex flex-col gap-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          disabled={activeCount === 0}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      {FILTER_GROUPS.map((group) => (
        <fieldset
          key={group.id}
          role={group.exclusive ? 'radiogroup' : undefined}
          aria-label={group.label}
          className={cn('filter-group flex flex-col gap-0.5', `filter-group--${group.id}`)}>
          <legend className="mb-1.5 px-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {group.label}
          </legend>
          {group.options.map((option) => {
            const selected = active.has(option.key);
            const count = option.count?.(stats);
            const Icon = option.icon;
            return (
              <FacetTooltip key={option.key} glossary={option.glossary}>
                <button
                  type="button"
                  role={group.exclusive ? 'radio' : 'checkbox'}
                  aria-checked={selected}
                  onClick={() => onToggle(option.key)}
                  data-filter={option.key}
                  className={cn(
                    'facet group/facet flex h-10 w-full lg:h-8 items-center gap-2.5 rounded-md px-2 text-left text-[0.8125rem] transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center border transition-colors',
                      group.exclusive ? 'rounded-full' : 'rounded-[4px]',
                      selected ? 'border-foreground bg-foreground text-background' : 'border-border bg-background group-hover/facet:border-muted-foreground/60',
                    )}
                  >
                    {selected && (group.exclusive
                      ? <span className="size-1.5 rounded-full bg-background" />
                      : <Check className="size-3" strokeWidth={3} />)}
                  </span>
                  <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.tone && <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', TONE_DOT[option.tone])} />}
                  {typeof count === 'number' && (
                    <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-muted-foreground/80">
                      {count.toLocaleString('en-US')}
                    </span>
                  )}
                </button>
              </FacetTooltip>
            );
          })}
        </fieldset>
      ))}
    </nav>
  );
}

function FacetTooltip({ glossary, children }: { glossary?: Parameters<typeof Term>[0]['id']; children: React.ReactElement }) {
  if (!glossary) return children;
  return <Term id={glossary} asChild side="right">{children}</Term>;
}
