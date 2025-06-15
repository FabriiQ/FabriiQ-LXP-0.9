import React from 'react';
import { QuestionRenderer } from './QuestionRenderer';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AssessmentSection {
  id: string;
  title: string;
  instructions?: string;
  questions: any[];
}

interface Assessment {
  title: string;
  instructions?: string;
  sections: AssessmentSection[];
  metadata?: Record<string, any>;
}

interface AssessmentRendererProps {
  assessment: Assessment;
  isPrintMode?: boolean;
  showAnswers?: boolean;
  className?: string;
}

export const AssessmentRenderer: React.FC<AssessmentRendererProps> = ({
  assessment,
  isPrintMode = false,
  showAnswers = false,
  className = '',
}) => {
  return (
    <div className={`assessment-renderer ${isPrintMode ? 'print-mode' : ''} ${className}`}>
      <div className="assessment-header">
        <h1 className="assessment-title">{assessment.title}</h1>
        
        {assessment.metadata?.subject && (
          <div className="assessment-subject">
            Subject: {assessment.metadata.subject}
          </div>
        )}
        
        {assessment.metadata?.grade && (
          <div className="assessment-grade">
            Grade: {assessment.metadata.grade}
          </div>
        )}
        
        {assessment.metadata?.duration && (
          <div className="assessment-duration">
            Duration: {assessment.metadata.duration} minutes
          </div>
        )}
        
        {assessment.metadata?.totalPoints && (
          <div className="assessment-points">
            Total Points: {assessment.metadata.totalPoints}
          </div>
        )}
      </div>
      
      {assessment.instructions && (
        <div className="assessment-instructions">
          <div className="instructions-label">Instructions:</div>
          <div className="instructions-content">
            <MarkdownRenderer content={assessment.instructions} isPrintMode={isPrintMode} />
          </div>
        </div>
      )}
      
      <div className="assessment-sections">
        {assessment.sections.map((section, sectionIndex) => (
          <div key={section.id} className="assessment-section">
            <h2 className="section-title">
              {isPrintMode ? `Section ${sectionIndex + 1}: ` : ''}
              {section.title}
            </h2>
            
            {section.instructions && (
              <div className="section-instructions">
                <MarkdownRenderer content={section.instructions} isPrintMode={isPrintMode} />
              </div>
            )}
            
            <div className="section-questions">
              {section.questions.map((question, questionIndex) => (
                <div key={question.id} className="question-container">
                  <div className="question-number">
                    {isPrintMode ? `${sectionIndex + 1}.${questionIndex + 1}` : `Q${sectionIndex + 1}.${questionIndex + 1}`}
                  </div>
                  <div className="question-content">
                    <QuestionRenderer
                      question={question}
                      isPrintMode={isPrintMode}
                      showAnswer={showAnswers}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .assessment-renderer {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.5;
          color: #1e293b;
        }
        
        .assessment-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .assessment-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }
        
        .assessment-subject,
        .assessment-grade,
        .assessment-duration,
        .assessment-points {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }
        
        .assessment-instructions {
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
        
        .assessment-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .assessment-section {
          margin-bottom: 2rem;
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .section-instructions {
          margin-bottom: 1rem;
          font-style: italic;
        }
        
        .section-questions {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .question-container {
          display: flex;
          gap: 0.75rem;
        }
        
        .question-number {
          font-weight: 600;
          min-width: 2.5rem;
          padding-top: 1rem;
        }
        
        .question-content {
          flex: 1;
        }
        
        .print-mode {
          font-size: 12pt;
        }
        
        .print-mode .assessment-title {
          font-size: 18pt;
        }
        
        .print-mode .section-title {
          font-size: 14pt;
        }
        
        @media print {
          .assessment-renderer {
            font-size: 12pt;
          }
          
          .assessment-title {
            font-size: 18pt;
          }
          
          .section-title {
            font-size: 14pt;
          }
          
          .assessment-section {
            break-inside: avoid-start;
          }
          
          .question-container {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};
