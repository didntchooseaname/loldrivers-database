'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay between consecutive items, in ms. */
  delay?: number;
}

/**
 * Magic UI — AnimatedList.
 * Reveals its children one after another with a staggered blur + slide-up.
 * CSS-driven (no framer-motion); honours prefers-reduced-motion via `.blur-fade`.
 */
export function AnimatedList({ delay = 90, className, children, ...props }: AnimatedListProps) {
  const items = React.Children.toArray(children);
  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {items.map((item, i) => (
        <div
          key={i}
          className="blur-fade"
          style={{ ['--bf-delay' as string]: `${i * delay}ms` } as React.CSSProperties}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
