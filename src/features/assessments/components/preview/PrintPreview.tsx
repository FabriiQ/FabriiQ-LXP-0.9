'use client';

import React, { useState } from 'react';
import { AssessmentPrintFormat } from '../../types/assessment';
import { generatePrintHTML, convertToPDF, PAPER_SIZES } from '../../utils/print-helpers';

interface PrintPreviewProps {
  assessment: AssessmentPrintFormat;
  showAnswers?: boolean;
  onClose: () => void;
}

/**
 * PrintPreview component for previewing and printing assessments
 * 
 * This component provides a print preview of an assessment with options
 * for paper size, orientation, and answer key display.
 */
export function PrintPreview({
  assessment,
  showAnswers = false,
  onClose,
}: PrintPreviewProps) {
  // Print settings
  const [paperSize, setPaperSize] = useState<'A4' | 'LETTER' | 'LEGAL'>('A4');
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [includeAnswers, setIncludeAnswers] = useState(showAnswers);
  
  // Generate HTML for printing
  const printHTML = generatePrintHTML(
    assessment,
    includeAnswers,
    paperSize,
    orientation
  );

  // Handle print button click
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the assessment.');
      return;
    }
    
    // Write the print HTML to the new window
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Print the window
    setTimeout(() => {
      printWindow.print();
      // Close the window after printing (or if print is cancelled)
      setTimeout(() => {
        printWindow.close();
      }, 500);
    }, 500);
  };

  // Handle download as PDF
  const handleDownloadPDF = () => {
    // Convert to PDF
    const pdfBlob = convertToPDF(printHTML);
    
    // Create a download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assessment.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="print-preview">
      {/* Print Controls */}
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex flex-wrap justify-between items-center gap-4">
        <h3 className="text-xl font-semibold">Print Preview</h3>
        
        <div className="flex flex-wrap gap-3">
          {/* Paper Size */}
          <div className="flex items-center space-x-2">
            <label htmlFor="paperSize" className="text-sm font-medium">
              Paper Size:
            </label>
            <select
              id="paperSize"
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as 'A4' | 'LETTER' | 'LEGAL')}
              className="p-1 border rounded text-sm"
            >
              <option value="A4">A4</option>
              <option value="LETTER">Letter</option>
              <option value="LEGAL">Legal</option>
            </select>
          </div>
          
          {/* Orientation */}
          <div className="flex items-center space-x-2">
            <label htmlFor="orientation" className="text-sm font-medium">
              Orientation:
            </label>
            <select
              id="orientation"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as 'PORTRAIT' | 'LANDSCAPE')}
              className="p-1 border rounded text-sm"
            >
              <option value="PORTRAIT">Portrait</option>
              <option value="LANDSCAPE">Landscape</option>
            </select>
          </div>
          
          {/* Include Answers */}
          <div className="flex items-center space-x-2">
            <label htmlFor="includeAnswers" className="text-sm font-medium">
              Include Answers:
            </label>
            <input
              type="checkbox"
              id="includeAnswers"
              checked={includeAnswers}
              onChange={(e) => setIncludeAnswers(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Print
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4">
        <div
          className="mx-auto bg-white shadow-lg p-8 mb-8"
          style={{
            width: orientation === 'PORTRAIT'
              ? `${PAPER_SIZES[paperSize].width - 40}mm`
              : `${PAPER_SIZES[paperSize].height - 40}mm`,
            minHeight: orientation === 'PORTRAIT'
              ? `${PAPER_SIZES[paperSize].height - 40}mm`
              : `${PAPER_SIZES[paperSize].width - 40}mm`,
            maxWidth: '100%',
          }}
        >
          {/* Assessment Title */}
          <h1 className="text-2xl font-bold mb-4">{assessment.title}</h1>
          
          {/* Assessment Metadata */}
          {assessment.metadata && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              {assessment.metadata.subject && (
                <div><strong>Subject:</strong> {assessment.metadata.subject}</div>
              )}
              {assessment.metadata.class && (
                <div><strong>Class:</strong> {assessment.metadata.class}</div>
              )}
              {assessment.metadata.topic && (
                <div><strong>Topic:</strong> {assessment.metadata.topic}</div>
              )}
              {assessment.metadata.maxScore && (
                <div><strong>Max Score:</strong> {assessment.metadata.maxScore}</div>
              )}
              {assessment.metadata.duration && (
                <div><strong>Duration:</strong> {assessment.metadata.duration} minutes</div>
              )}
              {assessment.metadata.dueDate && (
                <div><strong>Due Date:</strong> {new Date(assessment.metadata.dueDate).toLocaleDateString()}</div>
              )}
            </div>
          )}
          
          {/* Assessment Instructions */}
          {assessment.instructions && (
            <div className="mb-6 p-3 bg-gray-50 italic">
              {assessment.instructions}
            </div>
          )}
          
          {/* Assessment Sections */}
          <div className="space-y-6">
            {assessment.sections.map((section, sectionIndex) => (
              <div key={section.id} className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  Section {sectionIndex + 1}: {section.title}
                </h2>
                
                {section.instructions && (
                  <div className="mb-4 italic">
                    {section.instructions}
                  </div>
                )}
                
                <div className="space-y-4">
                  {section.questions.map((question, questionIndex) => (
                    <div key={question.id || questionIndex} className="mb-4">
                      <div className="font-medium">
                        {sectionIndex + 1}.{questionIndex + 1}. {question.text}
                        <span className="float-right text-sm">
                          ({question.points || 1} {question.points === 1 ? 'point' : 'points'})
                        </span>
                      </div>
                      
                      {/* Question content based on type */}
                      <div className="ml-6 mt-2">
                        {/* Simplified rendering for preview */}
                        {question.type === 'MULTIPLE_CHOICE' && question.choices && (
                          <div className="space-y-1">
                            {question.choices.map((choice, choiceIndex) => (
                              <div key={choice.id || choiceIndex} className="flex items-center">
                                <span className="mr-2">○</span>
                                <span>{choice.text}</span>
                                {includeAnswers && choice.isCorrect && (
                                  <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'TRUE_FALSE' && (
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <span className="mr-2">○</span>
                              <span>True</span>
                              {includeAnswers && question.correctAnswer === true && (
                                <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <span className="mr-2">○</span>
                              <span>False</span>
                              {includeAnswers && question.correctAnswer === false && (
                                <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Add other question types as needed */}
                        
                        {/* Default for other question types */}
                        {!['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type) && (
                          <div className="p-2 border border-dashed rounded">
                            Answer space for {question.type}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
