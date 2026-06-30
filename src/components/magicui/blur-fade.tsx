'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BlurFadeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Entrance delay in milliseconds (used for staggered grids). */
  delay?: number;
  /** Element/component to render as the animated wrapper. */
  as?: React.ElementType;
}

/**
 * Magic UI - BlurFade.
 * A lightweight, CSS-driven blur + slide-up entrance. No framer-motion.
 * The animation is defined in globals.css (`.blur-fade`) and is disabled
 * automatically when the user prefers reduced motion.
 */
export function BlurFade({
  delay = 0,
  as: Comp = 'div',
  className,
  style,
  children,
  ...props
}: BlurFadeProps) {
  return (
    <Comp
      className={cn('blur-fade', className)}
      style={{ ...style, ['--bf-delay' as string]: `${delay}ms` } as React.CSSProperties}
      {...props}
    >
      {children}
    </Comp>
  );
}
