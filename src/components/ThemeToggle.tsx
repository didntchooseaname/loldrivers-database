'use client';

import { useEffect } from 'react';
import { useIsHydrated } from '@/hooks/useHydration';

export default function ThemeToggle() {
  const isHydrated = useIsHydrated();

  useEffect(() => {
    // Only execute code after hydration
    if (!isHydrated) return;
    // Function to initialize theme (identical to original)
    const initializeTheme = () => {
      // Check if theme is already defined by inline script
      const currentTheme = document.documentElement.getAttribute('data-color-scheme');
      if (currentTheme) {
        updateThemeToggle(currentTheme);
        return;
      }
      
      // Sinon, initialiser normalement
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = savedTheme || (prefersDark ? 'dark' : 'light');
      
      document.documentElement.setAttribute('data-color-scheme', theme);
      updateThemeToggle(theme);
    };

    // Function to update toggle appearance (identical to original)
    const updateThemeToggle = (theme: string) => {
      const toggle = document.getElementById('themeToggle');
      if (toggle) {
        toggle.setAttribute('data-color-scheme', theme);
        toggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
      }
    };

    // Function to toggle theme (identical to original)
    const toggleTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-color-scheme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-color-scheme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeToggle(newTheme);
    };

    // Initialize theme
    initializeTheme();

    // Add click event to toggle
    const themeToggleButton = document.getElementById('themeToggle');
    if (themeToggleButton) {
      themeToggleButton.addEventListener('click', toggleTheme);
    }

    // Listen to system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const theme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', theme);
        updateThemeToggle(theme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Cleanup
    return () => {
      if (themeToggleButton) {
        themeToggleButton.removeEventListener('click', toggleTheme);
      }
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [isHydrated]); // Dependency on isHydrated

  return null; // Ce composant n'a pas de rendu visuel
}
