'use client';

import React, { useState } from 'react';
import { Assessment, AssessmentPrintFormat } from '../../types/assessment';
import { QuestionPreview } from '../preview/QuestionPreview';
import { convertToPrintFormat } from '../../utils/assessment-helpers';
import { PrintPreview } from '../preview/PrintPreview';

interface AssessmentPreviewProps {
  assessment: Assessment;
  showPrintControls?: boolean;
}

/**
 * AssessmentPreview component for previewing assessments
 *
 * This component provides a preview of an assessment with options
 * for print preview and answer key display.
 */
export function AssessmentPreview({
  assessment,
  showPrintControls = true,
}: AssessmentPreviewProps) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Convert assessment to print format
  const printFormat = convertToPrintFormat(assessment);

  // Toggle show answers
  const toggleShowAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  // Toggle print preview
  const togglePrintPreview = () => {
    setShowPrintPreview(!showPrintPreview);
  };

  // If showing print preview, render the PrintPreview component
  if (showPrintPreview) {
    return (
      <PrintPreview
        assessment={printFormat}
        showAnswers={showAnswers}
        onClose={togglePrintPreview}
      />
    );
  }

  return (
    <div className="assessment-preview">
      {/* Preview Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Assessment Preview</h3>

        <div className="flex space-x-2">
          {/* Show Answers Toggle */}
          <button
            type="button"
            onClick={toggleShowAnswers}
            className={`px-3 py-1 rounded text-sm ${
              showAnswers
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            {showAnswers ? 'Hide Answers' : 'Show Answers'}
          </button>

          {/* Print Preview Button */}
          {showPrintControls && (
            <button
              type="button"
              onClick={togglePrintPreview}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded border border-blue-300 text-sm"
            >
              Print Preview
            </button>
          )}
        </div>
      </div>

      {/* Assessment Title and Instructions */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{assessment.title || 'Untitled Assessment'}</h1>
        {assessment.instructions && (
          <div className="bg-gray-50 p-3 rounded italic text-gray-700">
            {assessment.instructions}
          </div>
        )}
      </div>

      {/* Assessment Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
        <div>
          <span className="font-medium">Max Score:</span> {assessment.maxScore || 100}
        </div>
        <div>
          <span className="font-medium">Passing Score:</span> {assessment.passingScore || 60}
        </div>
        <div>
          <span className="font-medium">Category:</span> {assessment.category || 'Quiz'}
        </div>
        {assessment.dueDate && (
          <div>
            <span className="font-medium">Due Date:</span>{' '}
            {new Date(assessment.dueDate.toString()).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {assessment.questions && Array.isArray(assessment.questions) && assessment.questions.length > 0 ? (
          assessment.questions.map((question, index) => (
            <QuestionPreview
              key={question.id || index}
              question={question}
              index={index + 1}
              showAnswer={showAnswers}
            />
          ))
        ) : (
          <div className="p-4 bg-gray-50 rounded text-center">
            No questions added to this assessment.
          </div>
        )}
      </div>
    </div>
  );
}
