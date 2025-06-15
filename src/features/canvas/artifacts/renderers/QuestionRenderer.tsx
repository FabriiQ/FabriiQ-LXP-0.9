import React, { useState } from 'react';

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  type: string;
  text: string;
  options?: QuestionOption[];
  answer?: string;
  explanation?: string;
}

interface QuestionRendererProps {
  question: Question;
  isPrintMode?: boolean;
  showAnswer?: boolean;
  className?: string;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  isPrintMode = false,
  showAnswer = false,
  className = '',
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const handleOptionSelect = (optionId: string) => {
    if (isPrintMode) return;
    setSelectedOption(optionId);
  };
  
  const isCorrect = selectedOption === question.answer;
  
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="question-options">
            {question.options?.map((option) => (
              <div
                key={option.id}
                className={`question-option ${selectedOption === option.id ? 'selected' : ''} ${
                  showAnswer && option.id === question.answer ? 'correct' : ''
                }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <div className="option-marker">{option.id.toUpperCase()}</div>
                <div className="option-text">{option.text}</div>
              </div>
            ))}
          </div>
        );
      
      case 'true-false':
        return (
          <div className="question-options">
            <div
              className={`question-option ${selectedOption === 'true' ? 'selected' : ''} ${
                showAnswer && question.answer === 'true' ? 'correct' : ''
              }`}
              onClick={() => handleOptionSelect('true')}
            >
              <div className="option-marker">T</div>
              <div className="option-text">True</div>
            </div>
            <div
              className={`question-option ${selectedOption === 'false' ? 'selected' : ''} ${
                showAnswer && question.answer === 'false' ? 'correct' : ''
              }`}
              onClick={() => handleOptionSelect('false')}
            >
              <div className="option-marker">F</div>
              <div className="option-text">False</div>
            </div>
          </div>
        );
      
      case 'short-answer':
        return (
          <div className="short-answer">
            {isPrintMode ? (
              <div className="answer-space"></div>
            ) : (
              <textarea
                className="answer-input"
                placeholder="Type your answer here..."
                rows={3}
              />
            )}
            {showAnswer && (
              <div className="model-answer">
                <div className="answer-label">Model Answer:</div>
                <div className="answer-text">{question.answer}</div>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="unknown-question-type">
            Unknown question type: {question.type}
          </div>
        );
    }
  };
  
  return (
    <div className={`question-renderer ${isPrintMode ? 'print-mode' : ''} ${className}`}>
      <div className="question-text">{question.text}</div>
      
      {renderQuestionContent()}
      
      {!isPrintMode && selectedOption && (
        <div className="question-feedback">
          {isCorrect ? (
            <div className="correct-feedback">Correct!</div>
          ) : (
            <div className="incorrect-feedback">
              Incorrect. {showAnswer && `The correct answer is ${question.answer?.toUpperCase()}.`}
            </div>
          )}
        </div>
      )}
      
      {!isPrintMode && question.explanation && (
        <div className="explanation-section">
          <button
            className="explanation-toggle"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
          </button>
          
          {showExplanation && (
            <div className="explanation-content">{question.explanation}</div>
          )}
        </div>
      )}
      
      {isPrintMode && showAnswer && question.explanation && (
        <div className="print-explanation">
          <div className="explanation-label">Explanation:</div>
          <div className="explanation-content">{question.explanation}</div>
        </div>
      )}
      
      <style jsx>{`
        .question-renderer {
          margin-bottom: 1.5rem;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          background-color: white;
        }
        
        .question-text {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        
        .question-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .question-option {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background-color 0.15s ease-in-out;
        }
        
        .question-option:hover:not(.print-mode .question-option) {
          background-color: #f1f5f9;
        }
        
        .option-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          background-color: #e2e8f0;
          font-weight: 600;
          margin-right: 0.75rem;
        }
        
        .option-text {
          flex: 1;
        }
        
        .selected {
          background-color: #dbeafe;
          border-color: #93c5fd;
        }
        
        .selected .option-marker {
          background-color: #3b82f6;
          color: white;
        }
        
        .correct {
          background-color: #dcfce7;
          border-color: #86efac;
        }
        
        .correct .option-marker {
          background-color: #22c55e;
          color: white;
        }
        
        .question-feedback {
          margin-top: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        
        .correct-feedback {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .incorrect-feedback {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .explanation-section {
          margin-top: 1rem;
        }
        
        .explanation-toggle {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          cursor: pointer;
        }
        
        .explanation-content {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background-color: #f8fafc;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .short-answer .answer-space {
          height: 5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          margin-bottom: 1rem;
        }
        
        .short-answer .answer-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          resize: vertical;
        }
        
        .model-answer {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background-color: #f8fafc;
          border-radius: 0.25rem;
        }
        
        .answer-label {
          font-weight: 600;
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
          color: #475569;
        }
        
        .print-explanation {
          margin-top: 1rem;
          padding-top: 0.5rem;
          border-top: 1px dashed #e2e8f0;
        }
        
        .explanation-label {
          font-weight: 600;
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
          color: #475569;
        }
        
        .print-mode {
          break-inside: avoid;
        }
        
        .print-mode .question-text {
          font-size: 11pt;
        }
        
        .print-mode .question-option {
          cursor: default;
        }
        
        .print-mode .option-text {
          font-size: 10pt;
        }
        
        @media print {
          .question-renderer {
            break-inside: avoid;
            border: 1px solid #e2e8f0;
            padding: 0.5rem;
            margin-bottom: 1rem;
          }
          
          .question-text {
            font-size: 11pt;
          }
          
          .option-text {
            font-size: 10pt;
          }
          
          .explanation-toggle {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
