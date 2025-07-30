'use client';

import { useState, useEffect } from 'react';
import { formatDateLocale } from '../lib/dateUtils';

interface SafeDateProps {
  date: string | Date | null;
  fallback?: string;
  prefix?: string;
}

export default function SafeDate({ date, fallback = 'Loading...', prefix = '' }: SafeDateProps) {
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState(fallback);

  useEffect(() => {
    setMounted(true);
    
    if (date) {
      try {
        setFormattedDate(formatDateLocale(date));
      } catch (error) {
        setFormattedDate(fallback);
      }
    } else {
      setFormattedDate(fallback);
    }
  }, [date, fallback]);

  // Afficher le fallback jusqu'à ce que le composant soit monté côté client
  if (!mounted) {
    return <>{prefix}{fallback}</>;
  }

  return <>{prefix}{formattedDate}</>;
}
