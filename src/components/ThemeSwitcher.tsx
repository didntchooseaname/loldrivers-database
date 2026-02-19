'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useIsHydrated } from '@/hooks/useHydration';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system' || typeof window === 'undefined') return theme === 'dark' ? 'dark' : 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeSwitcher() {
  const isHydrated = useIsHydrated();
  const { theme, setTheme: setNextTheme, resolvedTheme: nextResolved } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  const currentTheme = (theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'dark') as Theme;

  useEffect(() => {
    if (!isHydrated || !nextResolved) return;
    const resolved = nextResolved as 'light' | 'dark';
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-color-scheme', resolved);
  }, [isHydrated, nextResolved]);

  useEffect(() => {
    if (!isHydrated || currentTheme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handle = () => setResolvedTheme(mq.matches ? 'dark' : 'light');
    handle();
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, [isHydrated, currentTheme]);

  const handleSelect = (value: Theme) => {
    setNextTheme(value);
    setResolvedTheme(getResolvedTheme(value));
    document.documentElement.setAttribute('data-color-scheme', getResolvedTheme(value));
  };

  if (!isHydrated) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Theme">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const resolved = nextResolved ?? resolvedTheme;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Switch theme"
        >
          {resolved === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">Theme: {resolved}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => handleSelect('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
