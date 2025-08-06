import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple markdown to HTML conversion with help-specific styling
  const processMarkdown = (md: string): string => {
    return md
      // Add newlines before headers for proper spacing
      .replace(/^(#+\s+.*$)/gm, '\n\n$1')
      // Clean up multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim leading/trailing whitespace
      .trim()
      // Headers with automatic icons based on content - treat all levels the same
      .replace(/^###\s+(.*$)/gm, (match, title) => {
        const icon = getIconForTitle(title);
        return `</div><div class="help-section"><h4><i class="${icon}"></i> ${title}</h4>`;
      })
      .replace(/^##\s+(.*$)/gm, (match, title) => {
        const icon = getIconForTitle(title);
        return `</div><div class="help-section"><h4><i class="${icon}"></i> ${title}</h4>`;
      })
      .replace(/^#\s+(.*$)/gm, '<h2>$1</h2>')
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Images - process before links to avoid conflicts
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="/content/assets/$2" alt="$1" class="help-image" loading="lazy" />')
      // Links - process after images
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="help-link">$1</a>')
      // Code/technical terms with backticks
      .replace(/`([^`]+)`/g, '<code class="tech-term">$1</code>')
      // Special styling for disclaimer and legal content
      .replace(/(\*\*Legal & Ethical Notice:\*\*.*?)(\*\*Community:\*\*.*?)(\*\*Disclaimer:\*\*.*?)(?=\n\n|\n$|$)/gs, 
        '<div class="help-note legal-notice">$1</div><div class="help-note community-note">$2</div><div class="help-note disclaimer-note">$3</div>')
      // Convert HTML entities back to proper characters
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      // Paragraphs
      .replace(/^(?!<[hd])(.*$)/gm, '<p>$1</p>')
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      // Fix paragraph wrapping around headers and divs
      .replace(/<p>(<h[234].*?<\/h[234]>)<\/p>/g, '$1')
      .replace(/<p>(<\/div>.*?<div.*?>)<\/p>/g, '$1')
      .replace(/<p>(<div.*?>)<\/p>/g, '$1')
      // Close the last help-section
      + '</div>';
  };

  // Function to get appropriate icon based on title content
  const getIconForTitle = (title: string): string => {
    const titleLower = title.toLowerCase();
    
    // Global help icons
    if (titleLower.includes('vision') || titleLower.includes('about') || titleLower.includes('project')) return 'fas fa-eye';
    if (titleLower.includes('innovation') || titleLower.includes('feature')) return 'fas fa-lightbulb';
    if (titleLower.includes('technical') || titleLower.includes('implementation')) return 'fas fa-cogs';
    if (titleLower.includes('research') || titleLower.includes('professional')) return 'fas fa-graduation-cap';
    if (titleLower.includes('reference') || titleLower.includes('terms')) return 'fas fa-book';
    if (titleLower.includes('legal') || titleLower.includes('ethical')) return 'fas fa-balance-scale';
    
    // Filter help icons
    if (titleLower.includes('information') || titleLower.includes('notice')) return 'fas fa-info-circle';
    if (titleLower.includes('hvci')) return 'fas fa-shield-alt';
    if (titleLower.includes('process killer')) return 'fas fa-skull-crossbones';
    if (titleLower.includes('behavioral') || titleLower.includes('analysis')) return 'fas fa-brain';
    if (titleLower.includes('memory')) return 'fas fa-memory';
    if (titleLower.includes('debug')) return 'fas fa-bug';
    if (titleLower.includes('registry')) return 'fas fa-edit';
    if (titleLower.includes('file')) return 'fas fa-file-alt';
    if (titleLower.includes('metadata')) return 'fas fa-tags';
    if (titleLower.includes('architecture')) return 'fas fa-microchip';
    if (titleLower.includes('certificate')) return 'fas fa-certificate';
    if (titleLower.includes('trusted')) return 'fas fa-check-shield';
    if (titleLower.includes('unknown') || titleLower.includes('untrusted')) return 'fas fa-exclamation-triangle';
    if (titleLower.includes('time') || titleLower.includes('recent') || titleLower.includes('newest') || titleLower.includes('oldest')) return 'fas fa-clock';
    if (titleLower.includes('how to') || titleLower.includes('effectively')) return 'fas fa-question-circle';
    
    // Default icon
    return 'fas fa-chevron-right';
  };

  const htmlContent = processMarkdown(content);

  return (
    <div 
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
