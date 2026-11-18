'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { Stats } from '@/types';
import { FilterPanel } from './filter-panel';

interface MobileFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: Set<string>;
  stats?: Stats;
  total: string;
  onToggle: (key: string) => void;
  onReset: () => void;
}

export default function MobileFilters({ open, onOpenChange, active, stats, total, onToggle, onReset }: MobileFiltersProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[19rem] overflow-y-auto" onOpenAutoFocus={(event) => event.preventDefault()}>
        <SheetTitle className="sr-only">Filters</SheetTitle>
        <SheetDescription className="sr-only">Narrow the driver list. Changes apply immediately.</SheetDescription>
        <FilterPanel active={active} stats={stats} onToggle={onToggle} onReset={onReset} className="pt-2 [&>div:first-child]:pr-10" />
        <Button className="mt-6 w-full" onClick={() => onOpenChange(false)}>
          Show {total} results
        </Button>
      </SheetContent>
    </Sheet>
  );
}
