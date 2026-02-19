'use client';

import React from 'react';

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {

  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      {children}
    </main>
  );
};
