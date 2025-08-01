'use client';

import React from 'react';

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {

  return (
    <>
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
};
