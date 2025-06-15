import React from 'react';
// In a real implementation, you would use a markdown library like react-markdown
// import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  isPrintMode?: boolean;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isPrintMode = false,
  className = '',
}) => {
  // This is a simplified implementation
  // In a real app, you would use a proper markdown renderer
  
  const renderMarkdown = () => {
    // Simple markdown parsing for demonstration
    // Replace headers
    let html = content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
      .replace(/^###### (.*$)/gm, '<h6>$1</h6>');
    
    // Replace bold and italic
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Replace links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // Replace lists
    html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>');
    
    // Wrap lists
    html = html.replace(/<li>(.*)<\/li><li>/g, '<li>$1</li><li>');
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
    
    // Replace paragraphs
    html = html.replace(/^(?!<[a-z])(.*$)/gm, '<p>$1</p>');
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    
    return html;
  };
  
  return (
    <div 
      className={`markdown-renderer ${isPrintMode ? 'print-mode' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown() }}
    >
      {/* Content is rendered via dangerouslySetInnerHTML */}
      
      <style jsx>{`
        .markdown-renderer {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #1e293b;
        }
        
        .markdown-renderer :global(h1),
        .markdown-renderer :global(h2),
        .markdown-renderer :global(h3),
        .markdown-renderer :global(h4),
        .markdown-renderer :global(h5),
        .markdown-renderer :global(h6) {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.25;
        }
        
        .markdown-renderer :global(h1) {
          font-size: 2em;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.3em;
        }
        
        .markdown-renderer :global(h2) {
          font-size: 1.5em;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.3em;
        }
        
        .markdown-renderer :global(h3) {
          font-size: 1.25em;
        }
        
        .markdown-renderer :global(h4) {
          font-size: 1em;
        }
        
        .markdown-renderer :global(p) {
          margin-top: 0;
          margin-bottom: 1em;
        }
        
        .markdown-renderer :global(ul),
        .markdown-renderer :global(ol) {
          margin-top: 0;
          margin-bottom: 1em;
          padding-left: 2em;
        }
        
        .markdown-renderer :global(li) {
          margin-bottom: 0.25em;
        }
        
        .markdown-renderer :global(a) {
          color: #2563eb;
          text-decoration: none;
        }
        
        .markdown-renderer :global(a:hover) {
          text-decoration: underline;
        }
        
        .markdown-renderer :global(strong) {
          font-weight: 600;
        }
        
        .markdown-renderer :global(em) {
          font-style: italic;
        }
        
        .print-mode {
          font-size: 12pt;
        }
        
        .print-mode :global(h1) {
          font-size: 18pt;
        }
        
        .print-mode :global(h2) {
          font-size: 16pt;
        }
        
        .print-mode :global(h3) {
          font-size: 14pt;
        }
        
        @media print {
          .markdown-renderer {
            font-size: 12pt;
          }
          
          .markdown-renderer :global(h1) {
            font-size: 18pt;
          }
          
          .markdown-renderer :global(h2) {
            font-size: 16pt;
          }
          
          .markdown-renderer :global(h3) {
            font-size: 14pt;
          }
        }
      `}</style>
    </div>
  );
};
