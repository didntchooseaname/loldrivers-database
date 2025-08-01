'use client';

import React, { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TermsPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TermsPopup: React.FC<TermsPopupProps> = ({ isVisible, onClose }) => {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    if (isVisible && !content) {
      // Fetch le contenu markdown depuis l'API help-content
      fetch('/api/help-content?type=terms')
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setContent(data.content);
          } else {
            setContent('# Terms of Service\n\nContent not available.');
          }
        })
        .catch(() => {
          setContent('# Terms of Service\n\nContent not available.');
        });
    }
  }, [isVisible, content]);

  if (!isVisible) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-container help-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>
            <i className="fas fa-file-contract"></i>
            Terms of Service
          </h2>
          <button className="popup-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="popup-content">
          <div className="help-content">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>
    </div>
  );
};
