import React from 'react';

interface CodeRendererProps {
  content: string;
  language?: string;
  isPrintMode?: boolean;
  className?: string;
}

export const CodeRenderer: React.FC<CodeRendererProps> = ({
  content,
  language = 'javascript',
  isPrintMode = false,
  className = '',
}) => {
  return (
    <div className={`code-renderer ${isPrintMode ? 'print-mode' : ''} ${className}`}>
      <pre className={`language-${language}`}>
        <code>{content}</code>
      </pre>
      
      <style jsx>{`
        .code-renderer {
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          background-color: #f8f9fa;
          border-radius: 0.375rem;
          overflow: auto;
        }
        
        .code-renderer pre {
          margin: 0;
          padding: 1rem;
          overflow-x: auto;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .code-renderer code {
          font-family: inherit;
          color: #1e293b;
        }
        
        .print-mode {
          border: 1px solid #e2e8f0;
          font-size: 10pt;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        @media print {
          .code-renderer {
            break-inside: avoid;
            border: 1px solid #e2e8f0;
            font-size: 10pt;
          }
          
          .code-renderer pre {
            white-space: pre-wrap;
            word-break: break-word;
          }
        }
      `}</style>
    </div>
  );
};
