'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BorderBeamProps {
  className?: string;
  /** Full rotation duration in seconds. */
  duration?: number;
  /** Beam color (any CSS color, e.g. "var(--destructive)"). */
  color?: string;
  /** Stroke width in pixels. */
  width?: number;
}

/**
 * Magic UI - BorderBeam.
 * A rotating gradient stroke that travels around the parent's rounded border.
 * Pure CSS via a masked conic-gradient (see `.border-beam` in globals.css).
 * The parent must be `position: relative` (and ideally `overflow: hidden`).
 */
export function BorderBeam({ className, duration = 6, color, width = 1.5 }: BorderBeamProps) {
  return (
    <span
      aria-hidden
      className={cn('border-beam', className)}
      style={
        {
          '--beam-duration': `${duration}s`,
          '--beam-width': `${width}px`,
          ...(color ? { '--beam-color': color } : {}),
        } as React.CSSProperties
      }
    />
  );
}
