/**
 * Excel Parser for Question Bank
 *
 * This utility provides functions for parsing Excel files into question objects
 * that can be imported into the question bank.
 */

// @ts-ignore - xlsx types will be installed later
import * as XLSX from 'xlsx';
import {
  CreateQuestionInput,
  QuestionType,
  DifficultyLevel
} from '../models/types';
import { convertRowToQuestion } from './parser-utils';

// Define the interface for validation errors
interface ValidationError {
  row: number;
  errors: string[];
}

// Define the interface for parse result
interface ParseResult {
  questions: CreateQuestionInput[];
  errors: ValidationError[];
  totalRows: number;
  successfulRows: number;
}

/**
 * Parse an Excel file into question objects
 * @param file The Excel file to parse
 * @param questionBankId The ID of the question bank to import into
 * @returns A promise that resolves to the parse result
 */
export async function parseExcel(file: File, questionBankId: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const questions: CreateQuestionInput[] = [];
        const errors: ValidationError[] = [];
        const totalRows = rows.length;

        rows.forEach((row: any, index: number) => {
          try {
            const question = convertRowToQuestion(row, questionBankId, index + 1);
            if (question) {
              questions.push(question);
            }
          } catch (error) {
            errors.push({
              row: index + 1,
              errors: [(error as Error).message]
            });
          }
        });

        resolve({
          questions,
          errors,
          totalRows,
          successfulRows: questions.length
        });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate an Excel template for a specific question type
 * @param questionType The type of question
 * @returns The Excel workbook
 */
export function generateExcelTemplate(questionType: QuestionType): XLSX.WorkBook {
  // Import the headers and sample row from the CSV parser
  const { COMMON_HEADERS, QUESTION_TYPE_HEADERS, generateSampleCSVRow } = require('./csv-parser');

  const headers = [...COMMON_HEADERS, ...QUESTION_TYPE_HEADERS[questionType]];
  const sampleRow = generateSampleCSVRow(questionType);

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);

  // Add sample row
  const rowData = headers.map(header => sampleRow[header] || '');
  XLSX.utils.sheet_add_aoa(worksheet, [rowData], { origin: 1 });

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${questionType} Template`);

  return workbook;
}

/**
 * Generate a sample Excel file for a specific question type
 * @param questionType The type of question
 * @returns The Excel file as a Blob
 */
export function generateSampleExcel(questionType: QuestionType): Blob {
  const workbook = generateExcelTemplate(questionType);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
