import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  function convertListBlocks(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^[-*]\s+/, ''));
          i++;
        }
        result.push('<ul>' + items.map(t => '<li>' + t + '</li>').join('') + '</ul>');
        continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\.\s+/, ''));
          i++;
        }
        result.push('<ol>' + items.map(t => '<li>' + t + '</li>').join('') + '</ol>');
        continue;
      }
      result.push(line);
      i++;
    }
    return result.join('\n');
  }

  const processMarkdown = (md: string): string => {
    let out = md
      .replace(/^(#+\s+.*$)/gm, '\n\n$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Sections with ## or ### become clean section blocks
    out = out
      .replace(/^###\s+(.*$)/gm, (_m, title) =>
        `</div><div class="help-section"><h4>${title}</h4>`)
      .replace(/^##\s+(.*$)/gm, (_m, title) =>
        `</div><div class="help-section"><h4>${title}</h4>`)
      .replace(/^#\s+(.*$)/gm, '<h2>$1</h2>');

    out = convertListBlocks(out);

    out = out
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="/content/assets/$2" alt="$1" class="help-image" loading="lazy" />')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/---/g, '')
      // Legal/disclaimer blocks
      .replace(/(\*\*Legal & Ethical Notice:\*\*.*?)(\*\*Community:\*\*.*?)(\*\*Disclaimer:\*\*.*?)(?=\n\n|\n$|$)/gs,
        '<div class="help-note">$1</div><div class="help-note">$2</div><div class="help-note">$3</div>')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      // Paragraphs (skip lines starting with HTML tags)
      .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[234].*?<\/h[234]>)<\/p>/g, '$1')
      .replace(/<p>(<\/div>.*?<div.*?>)<\/p>/g, '$1')
      .replace(/<p>(<div.*?>)<\/p>/g, '$1')
      .replace(/<p>(<ul>.*?<\/ul>)<\/p>/gs, '$1')
      .replace(/<p>(<ol>.*?<\/ol>)<\/p>/gs, '$1')
      + '</div>';

    return out;
  };

  const htmlContent = processMarkdown(content);

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
