import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  html_url: string;
}

interface ProcessedCommit {
  sha: string;
  title: string;
  description: string;
  author: {
    name: string;
    email: string;
    date: string;
    github?: {
      login: string;
      avatar_url: string;
      html_url: string;
    } | null;
  };
}

interface ChangelogPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ChangelogPopup: React.FC<ChangelogPopupProps> = ({ isVisible, onClose }) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && commits.length === 0) {
      fetchCommits();
    }
  }, [isVisible, commits.length]);

  const fetchCommits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/commits?per_page=20');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setCommits(data.data.map((commit: ProcessedCommit) => ({
          sha: commit.sha,
          commit: {
            message: `${commit.title}\n${commit.description}`,
            author: {
              name: commit.author.name,
              email: commit.author.email,
              date: commit.author.date,
            }
          },
          author: commit.author.github,
          html_url: `https://github.com/didntchooseaname/loldrivers-database/commit/${commit.sha}`,
        })));
      } else {
        throw new Error(data.error || 'Failed to fetch commits');
      }
    } catch (err) {
      console.error('Failed to fetch commits:', err);
      setError('Failed to load changelog. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCommitMessage = (message: string): { title: string; description: string } => {
    const lines = message.split('\n').filter(line => line.trim());
    const title = lines[0] || 'No commit message';
    const description = lines.slice(1).join('\n').trim();
    
    return { title, description };
  };

  const getCommitIcon = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('feat') || lowerMessage.includes('feature')) return 'fas fa-star';
    if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) return 'fas fa-bug';
    if (lowerMessage.includes('docs') || lowerMessage.includes('documentation')) return 'fas fa-book';
    if (lowerMessage.includes('style') || lowerMessage.includes('ui')) return 'fas fa-paint-brush';
    if (lowerMessage.includes('refactor')) return 'fas fa-recycle';
    if (lowerMessage.includes('perf') || lowerMessage.includes('performance')) return 'fas fa-bolt';
    if (lowerMessage.includes('test')) return 'fas fa-check-square';
    if (lowerMessage.includes('build') || lowerMessage.includes('ci')) return 'fas fa-tools';
    if (lowerMessage.includes('security')) return 'fas fa-shield-alt';
    if (lowerMessage.includes('initial') || lowerMessage.includes('init')) return 'fas fa-flag';
    
    return 'fas fa-edit';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(date);
  };

  const sanitizeGitHubUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      // Only allow GitHub URLs with HTTPS protocol
      if (urlObj.hostname === 'github.com' && urlObj.protocol === 'https:') {
        // Additional check to ensure the path matches expected GitHub commit URL pattern
        const pathPattern = /^\/[^\/]+\/[^\/]+\/commit\/[a-f0-9]+$/;
        if (pathPattern.test(urlObj.pathname)) {
          // Return a new clean URL to prevent any potential XSS
          return `https://github.com${urlObj.pathname}`;
        }
      }
    } catch {
      // Invalid URL
    }
    return '#';
  };

  if (!isVisible) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-container changelog-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>
            <i className="fas fa-history"></i>
            Changelog
          </h2>
          <button className="popup-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="popup-content">
          {loading ? (
            <div className="changelog-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Loading changelog...</span>
            </div>
          ) : error ? (
            <div className="changelog-error">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
              <button onClick={fetchCommits} className="retry-button">
                <i className="fas fa-redo"></i>
                Retry
              </button>
            </div>
          ) : (
            <div className="changelog-timeline">
              {commits.map((commit) => {
                const { title, description } = formatCommitMessage(commit.commit.message);
                const icon = getCommitIcon(commit.commit.message);
                
                return (
                  <div key={commit.sha} className="changelog-item">
                    <div className="commit-icon">
                      <i className={icon}></i>
                    </div>
                    <div className="commit-content">
                      <div className="commit-header">
                        <h4 className="commit-title">{title}</h4>
                        <span className="commit-date">{formatDate(commit.commit.author.date)}</span>
                      </div>
                      
                      {description && (
                        <p className="commit-description">{description}</p>
                      )}
                      
                      <div className="commit-meta">
                        {commit.author && (
                          <div className="commit-author">
                            <Image 
                              src={commit.author.avatar_url} 
                              alt={`${commit.author.login}'s avatar`}
                              width={16} 
                              height={16}
                              className="author-avatar"
                            />
                            <span className="author-name">{commit.author.login}</span>
                          </div>
                        )}
                        
                        <div className="commit-actions">
                          <a
                            href={sanitizeGitHubUrl(commit.html_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="commit-link"
                          >
                            <i className="fas fa-external-link-alt"></i>
                            {commit.sha.substring(0, 7)}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="changelog-footer">
            <a 
              href="https://github.com/didntchooseaname/loldrivers-database/commits/main"
              target="_blank"
              rel="noopener noreferrer"
              className="view-all-link"
            >
              <i className="fab fa-github"></i>
              View all commits on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
