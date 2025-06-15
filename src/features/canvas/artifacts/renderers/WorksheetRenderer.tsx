import React from 'react';
import { QuestionRenderer } from './QuestionRenderer';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TableRenderer } from './TableRenderer';
import { ImageRenderer } from './ImageRenderer';

interface WorksheetSection {
  id: string;
  title: string;
  content: any;
  type: string;
}

interface Worksheet {
  title: string;
  instructions?: string;
  sections: WorksheetSection[];
  metadata?: Record<string, any>;
}

interface WorksheetRendererProps {
  worksheet: Worksheet;
  isPrintMode?: boolean;
  showAnswers?: boolean;
  className?: string;
}

export const WorksheetRenderer: React.FC<WorksheetRendererProps> = ({
  worksheet,
  isPrintMode = false,
  showAnswers = false,
  className = '',
}) => {
  const renderSectionContent = (section: WorksheetSection) => {
    switch (section.type) {
      case 'markdown':
        return <MarkdownRenderer content={section.content} isPrintMode={isPrintMode} />;
      
      case 'question':
        return (
          <QuestionRenderer
            question={section.content}
            isPrintMode={isPrintMode}
            showAnswer={showAnswers}
          />
        );
      
      case 'table':
        return <TableRenderer data={section.content} isPrintMode={isPrintMode} />;
      
      case 'image':
        return (
          <ImageRenderer
            src={section.content}
            alt={section.title}
            isPrintMode={isPrintMode}
          />
        );
      
      default:
        return (
          <div className="unknown-section-type">
            <p>Unknown section type: {section.type}</p>
            <pre>{JSON.stringify(section.content, null, 2)}</pre>
          </div>
        );
    }
  };
  
  return (
    <div className={`worksheet-renderer ${isPrintMode ? 'print-mode' : ''} ${className}`}>
      <div className="worksheet-header">
        <h1 className="worksheet-title">{worksheet.title}</h1>
        
        {worksheet.metadata?.subject && (
          <div className="worksheet-subject">
            Subject: {worksheet.metadata.subject}
          </div>
        )}
        
        {worksheet.metadata?.grade && (
          <div className="worksheet-grade">
            Grade: {worksheet.metadata.grade}
          </div>
        )}
        
        {worksheet.metadata?.author && (
          <div className="worksheet-author">
            Created by: {worksheet.metadata.author}
          </div>
        )}
      </div>
      
      {worksheet.instructions && (
        <div className="worksheet-instructions">
          <div className="instructions-label">Instructions:</div>
          <div className="instructions-content">{worksheet.instructions}</div>
        </div>
      )}
      
      <div className="worksheet-sections">
        {worksheet.sections.map((section) => (
          <div key={section.id} className="worksheet-section">
            {section.title && (
              <h2 className="section-title">{section.title}</h2>
            )}
            <div className="section-content">{renderSectionContent(section)}</div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .worksheet-renderer {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.5;
          color: #1e293b;
        }
        
        .worksheet-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .worksheet-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }
        
        .worksheet-subject,
        .worksheet-grade,
        .worksheet-author {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }
        
        .worksheet-instructions {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
        }
        
        .instructions-label {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .worksheet-sections {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .worksheet-section {
          margin-bottom: 1rem;
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .unknown-section-type {
          padding: 1rem;
          background-color: #fee2e2;
          color: #b91c1c;
          border-radius: 0.25rem;
        }
        
        .print-mode {
          font-size: 12pt;
        }
        
        .print-mode .worksheet-title {
          font-size: 18pt;
        }
        
        .print-mode .section-title {
          font-size: 14pt;
        }
        
        @media print {
          .worksheet-renderer {
            font-size: 12pt;
          }
          
          .worksheet-title {
            font-size: 18pt;
          }
          
          .section-title {
            font-size: 14pt;
          }
          
          .worksheet-section {
            break-inside: avoid-start;
          }
        }
      `}</style>
    </div>
  );
};
