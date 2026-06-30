'use client';

import * as React from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useIsHydrated } from '@/hooks/useHydration';
import { Button } from '@/components/ui/button';

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Magic UI — AnimatedThemeToggler.
 * Light/dark toggle that reveals the new theme with a circular clip-path
 * expanding from the button, using the View Transitions API. Falls back to an
 * instant switch when View Transitions or motion are unavailable. Stays in sync
 * with next-themes for persistence.
 */
export function AnimatedThemeToggler({ className }: { className?: string }) {
  const isHydrated = useIsHydrated();
  const { resolvedTheme, setTheme } = useTheme();
  const ref = React.useRef<HTMLButtonElement>(null);

  const isDark = (resolvedTheme ?? 'dark') === 'dark';

  const applyTheme = React.useCallback(
    (target: 'light' | 'dark') => {
      const root = document.documentElement;
      root.classList.toggle('dark', target === 'dark');
      root.setAttribute('data-color-scheme', target);
      setTheme(target);
    },
    [setTheme],
  );

  const toggle = React.useCallback(async () => {
    const target: 'light' | 'dark' = isDark ? 'light' : 'dark';
    const doc = document as DocWithVT;

    if (!ref.current || typeof doc.startViewTransition !== 'function' || prefersReducedMotion()) {
      applyTheme(target);
      return;
    }

    await doc.startViewTransition(() => {
      flushSync(() => applyTheme(target));
    }).ready;

    const { top, left, width, height } = ref.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top),
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 600,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    );
  }, [isDark, applyTheme]);

  if (!isHydrated) {
    return (
      <Button variant="ghost" size="icon" className={className} aria-label="Toggle theme">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
