'use client';

import { useEffect } from 'react';

export default function ThemeToggle() {
  useEffect(() => {
    // Fonction pour initialiser le thème (identique à l'original)
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = savedTheme || (prefersDark ? 'dark' : 'light');
      
      document.documentElement.setAttribute('data-color-scheme', theme);
      updateThemeToggle(theme);
    };

    // Fonction pour mettre à jour l'apparence du toggle (identique à l'original)
    const updateThemeToggle = (theme: string) => {
      const toggle = document.getElementById('themeToggle');
      if (toggle) {
        toggle.setAttribute('data-color-scheme', theme);
        toggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
      }
    };

    // Fonction pour basculer le thème (identique à l'original)
    const toggleTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-color-scheme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-color-scheme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeToggle(newTheme);
    };

    // Initialiser le thème
    initializeTheme();

    // Ajouter l'événement click au toggle
    const themeToggleButton = document.getElementById('themeToggle');
    if (themeToggleButton) {
      themeToggleButton.addEventListener('click', toggleTheme);
    }

    // Écouter les changements de préférence système
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
  }, []);

  return null; // Ce composant n'a pas de rendu visuel
}
