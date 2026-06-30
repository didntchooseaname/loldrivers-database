'use client';

import * as React from 'react';

/**
 * Magic UI - cursor spotlight (Magic Card).
 * Returns an `onMouseMove` handler that writes the pointer position into
 * `--mx` / `--my` CSS variables. Pair with the `.magic-card` class, whose
 * `::before` renders a radial highlight following the cursor.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const onMouseMove = React.useCallback((e: React.MouseEvent<T>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);

  return { onMouseMove };
}
