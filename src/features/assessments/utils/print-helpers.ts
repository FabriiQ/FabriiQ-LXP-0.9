import { AssessmentPrintFormat } from '../types/assessment';
import { Question, QuestionType } from '../types/question';

/**
 * Helper functions for printing assessments
 */

// Paper size dimensions in mm
export const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 215.9, height: 279.4 },
  LEGAL: { width: 215.9, height: 355.6 },
};

// Default margins in mm
export const DEFAULT_MARGINS = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};

/**
 * Generate HTML for printing an assessment
 * @param assessment The assessment in print format
 * @param showAnswers Whether to show answers
 * @param paperSize The paper size to use
 * @param orientation The page orientation
 * @returns HTML string for printing
 */
export function generatePrintHTML(
  assessment: AssessmentPrintFormat,
  showAnswers: boolean = false,
  paperSize: 'A4' | 'LETTER' | 'LEGAL' = 'A4',
  orientation: 'PORTRAIT' | 'LANDSCAPE' = 'PORTRAIT'
): string {
  const { title, instructions, sections, metadata } = assessment;

  // Generate HTML for the assessment header
  const headerHTML = `
    <div class="assessment-header">
      <h1 class="assessment-title">${title}</h1>
      ${metadata ? generateMetadataHTML(metadata) : ''}
      ${instructions ? `<div class="assessment-instructions">${instructions}</div>` : ''}
    </div>
  `;

  // Generate HTML for each section
  const sectionsHTML = sections.map((section, index) => `
    <div class="assessment-section">
      <h2 class="section-title">Section ${index + 1}: ${section.title}</h2>
      ${section.instructions ? `<div class="section-instructions">${section.instructions}</div>` : ''}
      <div class="section-questions">
        ${section.questions.map((question, qIndex) =>
          generateQuestionHTML(question, qIndex + 1, showAnswers)
        ).join('')}
      </div>
    </div>
  `).join('');

  // Generate the complete HTML document
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: ${paperSize} ${orientation.toLowerCase()};
          margin: ${DEFAULT_MARGINS.top}mm ${DEFAULT_MARGINS.right}mm ${DEFAULT_MARGINS.bottom}mm ${DEFAULT_MARGINS.left}mm;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.5;
          font-size: 12pt;
        }
        .assessment-header {
          margin-bottom: 20px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 10px;
        }
        .assessment-title {
          font-size: 18pt;
          margin: 0 0 10px 0;
        }
        .assessment-metadata {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 10px;
          font-size: 10pt;
        }
        .assessment-instructions {
          margin-top: 10px;
          font-style: italic;
        }
        .assessment-section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 14pt;
          margin: 0 0 10px 0;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        .section-instructions {
          margin-bottom: 10px;
          font-style: italic;
        }
        .question {
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        .question-header {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .question-points {
          float: right;
          font-weight: normal;
          font-style: italic;
        }
        .choices {
          margin-left: 20px;
        }
        .choice {
          margin-bottom: 5px;
        }
        .answer {
          color: green;
          font-weight: bold;
          display: ${showAnswers ? 'block' : 'none'};
        }
        .page-break {
          page-break-after: always;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      ${headerHTML}
      ${sectionsHTML}
    </body>
    </html>
  `;
}

/**
 * Generate HTML for assessment metadata
 * @param metadata The assessment metadata
 * @returns HTML string for metadata
 */
function generateMetadataHTML(metadata: Record<string, any>): string {
  const metadataItems: string[] = [];

  if (metadata.subject) {
    metadataItems.push(`<div><strong>Subject:</strong> ${metadata.subject}</div>`);
  }

  if (metadata.class) {
    metadataItems.push(`<div><strong>Class:</strong> ${metadata.class}</div>`);
  }

  if (metadata.topic) {
    metadataItems.push(`<div><strong>Topic:</strong> ${metadata.topic}</div>`);
  }

  if (metadata.maxScore) {
    metadataItems.push(`<div><strong>Max Score:</strong> ${metadata.maxScore}</div>`);
  }

  if (metadata.duration) {
    metadataItems.push(`<div><strong>Duration:</strong> ${metadata.duration} minutes</div>`);
  }

  if (metadata.dueDate) {
    const date = new Date(metadata.dueDate.toString());
    metadataItems.push(`<div><strong>Due Date:</strong> ${date.toLocaleDateString()}</div>`);
  }

  if (metadata.teacher) {
    metadataItems.push(`<div><strong>Teacher:</strong> ${metadata.teacher}</div>`);
  }

  return metadataItems.length > 0
    ? `<div class="assessment-metadata">${metadataItems.join('')}</div>`
    : '';
}

/**
 * Generate HTML for a question
 * @param question The question object
 * @param index The question number
 * @param showAnswers Whether to show answers
 * @returns HTML string for the question
 */
function generateQuestionHTML(question: Question, index: number, showAnswers: boolean): string {
  const { type, text, points } = question;

  // Question header with points
  const headerHTML = `
    <div class="question-header">
      ${index}. ${text}
      <span class="question-points">(${points || 1} ${points === 1 ? 'point' : 'points'})</span>
    </div>
  `;

  // Generate content based on question type
  let contentHTML = '';
  let answerHTML = '';

  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      if ('choices' in question && Array.isArray(question.choices)) {
        contentHTML = generateMultipleChoiceHTML(question);
        if (showAnswers) {
          const correctChoice = question.choices.find(c => c.isCorrect);
          answerHTML = correctChoice
            ? `<div class="answer">Answer: ${correctChoice.text}</div>`
            : '';
        }
      } else {
        contentHTML = '<div class="choices">(Invalid question format)</div>';
      }
      break;

    case QuestionType.TRUE_FALSE:
      contentHTML = `
        <div class="choices">
          <div class="choice">
            <input type="radio" disabled> True
          </div>
          <div class="choice">
            <input type="radio" disabled> False
          </div>
        </div>
      `;
      if (showAnswers && 'correctAnswer' in question) {
        answerHTML = `<div class="answer">Answer: ${question.correctAnswer ? 'True' : 'False'}</div>`;
      }
      break;

    // Add other question types as needed

    default:
      contentHTML = '<div class="choices">(Answer space)</div>';
  }

  return `
    <div class="question">
      ${headerHTML}
      ${contentHTML}
      ${answerHTML}
    </div>
  `;
}

/**
 * Generate HTML for a multiple choice question
 * @param question The multiple choice question
 * @returns HTML string for the question
 */
function generateMultipleChoiceHTML(question: Question & { choices: Array<{ text: string, isCorrect?: boolean, id?: string }> }): string {
  if (!question.choices || question.choices.length === 0) {
    return '<div class="choices">(No choices provided)</div>';
  }

  const choicesHTML = question.choices.map((choice) => `
    <div class="choice">
      <input type="radio" disabled> ${choice.text}
    </div>
  `).join('');

  return `<div class="choices">${choicesHTML}</div>`;
}

/**
 * Convert an assessment to PDF format
 * This is a placeholder for PDF generation functionality
 * In a real implementation, this would use a PDF generation library
 */
export function convertToPDF(html: string): Blob {
  // This is a placeholder - in a real implementation, this would use a PDF library
  console.log('Converting to PDF:', html.substring(0, 100) + '...');

  // Return a placeholder Blob
  return new Blob([html], { type: 'application/pdf' });
}
