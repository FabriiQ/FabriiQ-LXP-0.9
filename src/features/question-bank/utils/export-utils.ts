/**
 * Export Utilities for Question Bank
 * 
 * This utility provides functions for exporting questions from the question bank
 * to various file formats.
 */

import * as XLSX from 'xlsx';
import { Question, QuestionType } from '../models/types';

// Define export format types
export type ExportFormat = 'csv' | 'excel' | 'json';

/**
 * Export questions to CSV format
 * @param questions The questions to export
 * @returns The CSV file as a string
 */
export function exportToCSV(questions: Question[]): string {
  // Convert questions to rows
  const rows = questions.map(questionToRow);
  
  // Get all unique headers
  const headers = Array.from(
    new Set(
      rows.flatMap(row => Object.keys(row))
    )
  );
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header];
        // Wrap strings with commas in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

/**
 * Export questions to Excel format
 * @param questions The questions to export
 * @returns The Excel file as a Blob
 */
export function exportToExcel(questions: Question[]): Blob {
  // Convert questions to rows
  const rows = questions.map(questionToRow);
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Export questions to JSON format
 * @param questions The questions to export
 * @returns The JSON file as a string
 */
export function exportToJSON(questions: Question[]): string {
  // Convert questions to rows
  const rows = questions.map(questionToRow);
  
  // Create JSON content
  return JSON.stringify(rows, null, 2);
}

/**
 * Convert a question to a row object for export
 * @param question The question to convert
 * @returns The row object
 */
function questionToRow(question: Question): Record<string, any> {
  const row: Record<string, any> = {
    id: question.id,
    title: question.title,
    questionType: question.questionType,
    difficulty: question.difficulty,
    subjectId: question.subjectId,
    courseId: question.courseId || '',
    topicId: question.topicId || '',
    gradeLevel: question.gradeLevel || '',
    year: question.year || '',
    sourceReference: question.sourceReference || '',
    status: question.status,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  };
  
  // Add content fields based on question type
  const content = question.content as any;
  
  switch (question.questionType) {
    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.MULTIPLE_RESPONSE:
      row.text = content.text || '';
      row.options = JSON.stringify(content.options || []);
      row.explanation = content.explanation || '';
      row.hint = content.hint || '';
      break;
    
    case QuestionType.TRUE_FALSE:
      row.text = content.text || '';
      row.correctAnswer = content.correctAnswer || false;
      row.explanation = content.explanation || '';
      row.hint = content.hint || '';
      break;
    
    case QuestionType.FILL_IN_THE_BLANKS:
      row.text = content.text || '';
      row.blanks = JSON.stringify(content.blanks || []);
      row.explanation = content.explanation || '';
      row.hint = content.hint || '';
      row.caseSensitive = content.caseSensitive || false;
      break;
    
    case QuestionType.MATCHING:
      row.text = content.text || '';
      row.pairs = JSON.stringify(content.pairs || []);
      row.explanation = content.explanation || '';
      row.hint = content.hint || '';
      break;
    
    case QuestionType.DRAG_AND_DROP:
      row.text = content.text || '';
      row.items = JSON.stringify(content.items || []);
      row.zones = JSON.stringify(content.zones || []);
      row.explanation = content.explanation || '';
      row.hint = content.hint || '';
      break;
    
    case QuestionType.NUMERIC:
      row.text = content.text || '';
      row.correctAnswer = content.correctAnswer || 0;
      row.tolerance = content.tolerance || 0;
      row.explanation = content.explanation || '';
      row.hint = content.hint || '';
      row.unit = content.unit || '';
      break;
    
    case QuestionType.SHORT_ANSWER:
      row.text = content.text || '';
      row.sampleAnswer = content.sampleAnswer || '';
      row.keywords = JSON.stringify(content.keywords || []);
      row.explanation = content.explanation || '';
      row.hint = content.hint || '';
      row.maxLength = content.maxLength || '';
      break;
    
    case QuestionType.ESSAY:
      row.text = content.text || '';
      row.rubric = JSON.stringify(content.rubric || []);
      row.wordLimit = content.wordLimit || '';
      row.explanation = content.explanation || '';
      row.hint = content.hint || '';
      break;
    
    default:
      // For other question types, just stringify the content
      row.content = JSON.stringify(content);
      break;
  }
  
  return row;
}

/**
 * Export questions to the specified format
 * @param questions The questions to export
 * @param format The export format
 * @returns The exported file
 */
export function exportQuestions(questions: Question[], format: ExportFormat): Blob | string {
  switch (format) {
    case 'csv':
      return exportToCSV(questions);
    case 'excel':
      return exportToExcel(questions);
    case 'json':
      return exportToJSON(questions);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Download questions in the specified format
 * @param questions The questions to download
 * @param format The export format
 * @param fileName The name of the file (without extension)
 */
export function downloadQuestions(questions: Question[], format: ExportFormat, fileName: string = 'questions'): void {
  let data: Blob | string;
  let mimeType: string;
  let extension: string;
  
  switch (format) {
    case 'csv':
      data = exportToCSV(questions);
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    case 'excel':
      data = exportToExcel(questions);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
      break;
    case 'json':
      data = exportToJSON(questions);
      mimeType = 'application/json';
      extension = 'json';
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  // Create download link
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
