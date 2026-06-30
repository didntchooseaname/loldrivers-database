'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface NumberTickerProps {
  value: number;
  className?: string;
  /** Animation duration in milliseconds. */
  duration?: number;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Magic UI - NumberTicker.
 * Counts up to `value` with an ease-out curve the first time it scrolls into
 * view, and re-animates whenever `value` changes (e.g. when live stats load).
 * SSR renders `0` so hydration stays consistent; reduced-motion jumps to value.
 */
export function NumberTicker({ value, className, duration = 1000 }: NumberTickerProps) {
  const [display, setDisplay] = React.useState(0);
  const fromRef = React.useRef(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!active) return;
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    if (prefersReducedMotion()) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const next = Math.round(from + (to - from) * ease(p));
      setDisplay(next);
      fromRef.current = next;
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value, duration]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {display.toLocaleString()}
    </span>
  );
}
