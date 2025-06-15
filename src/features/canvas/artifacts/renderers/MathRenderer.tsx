import React, { useEffect, useRef } from 'react';

interface MathRendererProps {
  content: string;
  isInline?: boolean;
  isPrintMode?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  isInline = false,
  isPrintMode = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real implementation, this would use a math rendering library like KaTeX or MathJax
    // For now, we'll just set the content as-is and assume it would be rendered by the library
    if (containerRef.current) {
      try {
        // This is a placeholder for actual math rendering
        // In production, you would use code like:
        // if (window.katex) {
        //   window.katex.render(content, containerRef.current, {
        //     displayMode: !isInline,
        //     throwOnError: false,
        //   });
        // }
        
        // For now, just set the content
        containerRef.current.textContent = content;
      } catch (error) {
        console.error('Error rendering math:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<span class="math-error">Error rendering math: ${error instanceof Error ? error.message : 'Unknown error'}</span>`;
        }
      }
    }
  }, [content, isInline]);

  return (
    <div 
      className={`math-renderer ${isInline ? 'inline' : 'block'} ${isPrintMode ? 'print-mode' : ''} ${className}`}
      ref={containerRef}
    >
      {/* Math content will be rendered here by the math library */}
      
      <style jsx>{`
        .math-renderer {
          margin: 0.5rem 0;
          overflow-x: auto;
          max-width: 100%;
        }
        
        .math-renderer.inline {
          display: inline-block;
          margin: 0;
          vertical-align: middle;
        }
        
        .math-renderer.block {
          display: block;
          text-align: center;
          padding: 0.5rem 0;
        }
        
        .math-error {
          color: #b91c1c;
          font-style: italic;
          font-size: 0.875rem;
        }
        
        .print-mode {
          font-size: 12pt;
        }
        
        @media print {
          .math-renderer {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

// Add a utility function to detect math content
export const containsMath = (text: string): boolean => {
  // Simple detection for LaTeX-style math delimiters
  return /\$(.*?)\$|\\\[(.*?)\\\]|\\\((.*?)\\\)/.test(text);
};
