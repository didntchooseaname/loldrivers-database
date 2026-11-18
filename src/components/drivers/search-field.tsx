'use client';

import { forwardRef } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  busy?: boolean;
  size?: 'hero' | 'compact';
  id?: string;
  className?: string;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onChange, onSubmit, onClear, busy, size = 'hero', id, className },
  ref,
) {
  const hero = size === 'hero';
  return (
    <form
      role="search"
      onSubmit={(event) => { event.preventDefault(); onSubmit(); }}
      className={cn(
        'search-shell relative flex items-center border bg-card',
        hero ? 'h-14 rounded-2xl pl-5 pr-2 sm:h-16' : 'h-9 rounded-lg pl-3 pr-1.5',
        className,
      )}
    >
      {busy
        ? <Loader2 className={cn('shrink-0 animate-spin text-signal', hero ? 'size-5' : 'size-4')} aria-hidden />
        : <Search className={cn('shrink-0 text-muted-foreground', hero ? 'size-5' : 'size-4')} aria-hidden />}
      <label htmlFor={id} className="sr-only">Search drivers by name, hash, vendor or imported function</label>
      <input
        ref={ref}
        id={id}
        name="q"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault();
            onClear();
          }
        }}
        placeholder={hero ? 'Search by name, SHA256, MD5, vendor, imported function…' : 'Search drivers…'}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className={cn(
          'min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/80',
          hero ? 'px-4 text-base sm:text-[1.0625rem]' : 'px-2.5 text-sm',
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className={cn('flex shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground', hero ? 'size-10' : 'size-7')}
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : (
        <kbd className={cn('pointer-events-none hidden shrink-0 select-none items-center rounded border bg-muted px-1.5 font-mono text-[0.6875rem] text-muted-foreground sm:inline-flex', hero ? 'mr-2 h-6' : 'h-5')}>
          /
        </kbd>
      )}
    </form>
  );
});
