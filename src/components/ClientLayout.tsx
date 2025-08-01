'use client';

import React, { useState } from 'react';
import { ChangelogPopup } from './ChangelogPopup';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChangelogVisible, setIsChangelogVisible] = useState(false);

  return (
    <>
      {children}
      
      {/* Footer */}
      <footer className="bg-[color:var(--color-surface)] border-t border-[color:var(--color-border)] mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-[color:var(--color-text-secondary)]">
              <span>© 2025 LOLDrivers Database</span>
              <button 
                onClick={() => setIsChangelogVisible(true)}
                className="hover:text-[color:var(--color-primary)] transition-colors inline-flex items-center gap-1 bg-transparent border-none cursor-pointer text-sm text-[color:var(--color-text-secondary)]"
              >
                📝 Changelog
              </button>
              <a 
                href="/terms" 
                className="hover:text-[color:var(--color-primary)] transition-colors"
              >
                Terms
              </a>
            </div>
            
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/didntchooseaname/loldrivers-database"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[color:var(--color-secondary)] hover:bg-[color:var(--color-secondary-hover)] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)] transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </a>
              
              <span className="text-xs text-[color:var(--color-text-secondary)]">
                Built with ❤️ for security research
              </span>
            </div>
          </div>
        </div>
      </footer>
      
      <ChangelogPopup 
        isVisible={isChangelogVisible}
        onClose={() => setIsChangelogVisible(false)}
      />
    </>
  );
};
