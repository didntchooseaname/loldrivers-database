import {
  ArrowDownWideNarrow, Bug, CalendarClock, Cpu, Database, FileCode2,
  MemoryStick, ShieldCheck, ShieldOff, ShieldX, Skull, type LucideIcon,
} from 'lucide-react';
import type { Stats } from '@/types';
import type { GlossaryKey } from '@/lib/glossary';

export interface FilterOption {
  key: string;
  label: string;
  icon: LucideIcon;
  count?: (stats: Stats | undefined) => number | undefined;
  tone?: 'danger' | 'positive' | 'caution';
  glossary?: GlossaryKey;
}

export interface FilterGroup {
  id: string;
  label: string;
  exclusive?: boolean;
  options: FilterOption[];
}

export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { key: 'hvci', label: 'MVDB passed', icon: ShieldCheck, count: (s) => s?.hvciCompatible, tone: 'positive', glossary: 'mvdb-passed' },
      { key: 'recent', label: 'Added in last 12 months', icon: CalendarClock, count: (s) => s?.recentDrivers },
    ],
  },
  {
    id: 'behavior',
    label: 'Behavior',
    options: [
      { key: 'process-killer', label: 'Process killer', icon: Skull, count: (s) => s?.processKillerDrivers, tone: 'danger', glossary: 'process-killer' },
      { key: 'memory-manipulator', label: 'Memory manipulation', icon: MemoryStick, count: (s) => s?.memoryManipulatorDrivers, glossary: 'memory-manipulator' },
      { key: 'debug-bypass', label: 'Debug bypass', icon: Bug, count: (s) => s?.debugBypassDrivers, glossary: 'debug-bypass' },
      { key: 'registry-manipulator', label: 'Registry access', icon: Database, count: (s) => s?.registryManipulatorDrivers, glossary: 'registry-manipulator' },
      { key: 'file-manipulator', label: 'File system access', icon: FileCode2, count: (s) => s?.fileManipulatorDrivers, glossary: 'file-manipulator' },
    ],
  },
  {
    id: 'certificate',
    label: 'Certificate',
    exclusive: true,
    options: [
      { key: 'cert-valid', label: 'Valid', icon: ShieldCheck, count: (s) => s?.certValidDrivers, tone: 'positive', glossary: 'cert-valid' },
      { key: 'cert-expired', label: 'Expired', icon: ShieldX, count: (s) => s?.certExpiredDrivers, tone: 'caution', glossary: 'cert-expired' },
      { key: 'cert-missing', label: 'No signature data', icon: ShieldOff, count: (s) => s?.certMissingDrivers, glossary: 'cert-missing' },
    ],
  },
  {
    id: 'architecture',
    label: 'Architecture',
    exclusive: true,
    options: [
      { key: 'architecture-AMD64', label: 'x64', icon: Cpu, count: (s) => s?.amd64Drivers, glossary: 'x64' },
      { key: 'architecture-I386', label: 'x86', icon: Cpu, count: (s) => s?.i386Drivers, glossary: 'x86' },
      { key: 'architecture-ARM64', label: 'ARM64', icon: Cpu, count: (s) => s?.arm64Drivers, glossary: 'arm64' },
    ],
  },
];

export const SORT_OPTIONS = [
  { key: '', label: 'Default order' },
  { key: 'newest-first', label: 'Newest first' },
  { key: 'oldest-first', label: 'Oldest first' },
] as const;

export const SORT_ICON = ArrowDownWideNarrow;

const SORT_KEYS = new Set(['newest-first', 'oldest-first']);
const LEGACY_EQUIVALENTS: Record<string, string> = {
  'trusted-cert': 'cert-valid',
  'untrusted-cert': 'cert-expired',
  killer: 'process-killer',
};

const OPTION_INDEX = new Map(
  FILTER_GROUPS.flatMap((group) => group.options.map((option) => [option.key, { group, option }] as const)),
);

export function findFilter(key: string) {
  return OPTION_INDEX.get(LEGACY_EQUIVALENTS[key] ?? key);
}

export function normalizeFilters(filters: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const key of filters) out.add(LEGACY_EQUIVALENTS[key] ?? key);
  return out;
}

export function toggleFilter(current: Set<string>, key: string): Set<string> {
  const next = new Set(current);
  if (next.has(key)) {
    next.delete(key);
    return next;
  }
  const entry = OPTION_INDEX.get(key);
  if (entry?.group.exclusive) {
    for (const option of entry.group.options) next.delete(option.key);
  }
  next.add(key);
  return next;
}

export function setSort(current: Set<string>, sort: string): Set<string> {
  const next = new Set([...current].filter((key) => !SORT_KEYS.has(key)));
  if (sort) next.add(sort);
  return next;
}

export function getSort(current: Set<string>): string {
  return [...current].find((key) => SORT_KEYS.has(key)) ?? '';
}

export function countFacetFilters(current: Set<string>): number {
  return [...current].filter((key) => !SORT_KEYS.has(key)).length;
}
