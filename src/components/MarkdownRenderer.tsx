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

    // Headings: # -> h2 (page title), ## -> h3 (section), ### -> h4 (subsection).
    // Plain typographic hierarchy — no boxes, no separators.
    out = out
      .replace(/^###\s+(.*$)/gm, '<h4>$1</h4>')
      .replace(/^##\s+(.*$)/gm, '<h3>$1</h3>')
      .replace(/^#\s+(.*$)/gm, '<h2>$1</h2>');

    out = convertListBlocks(out);

    out = out
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="/content/assets/$2" alt="$1" class="help-image" loading="lazy" />')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/---/g, '')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      // Paragraphs (skip lines starting with HTML tags)
      .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[234][\s\S]*?<\/h[234]>)<\/p>/g, '$1')
      .replace(/<p>(<ul>[\s\S]*?<\/ul>)<\/p>/g, '$1')
      .replace(/<p>(<ol>[\s\S]*?<\/ol>)<\/p>/g, '$1');

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
