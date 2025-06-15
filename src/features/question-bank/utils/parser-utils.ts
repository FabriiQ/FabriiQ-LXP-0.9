/**
 * Parser Utilities for Question Bank
 *
 * This utility provides shared functions for parsing files into question objects
 * that can be imported into the question bank.
 */

import {
  CreateQuestionInput,
  QuestionType,
  DifficultyLevel,
  MultipleChoiceContent,
  TrueFalseContent,
  MultipleResponseContent,
  FillInTheBlanksContent,
  MatchingContent,
  DragAndDropContent,
  NumericContent,
  ShortAnswerContent,
  EssayContent
} from '../models/types';

// Define the expected column headers for different question types
export const COMMON_HEADERS = [
  'title',
  'questionType',
  'difficulty',
  'subjectId',
  'courseId',
  'topicId',
  'gradeLevel',
  'year',
  'sourceReference'
];

export const QUESTION_TYPE_HEADERS: Record<QuestionType, string[]> = {
  [QuestionType.MULTIPLE_CHOICE]: ['text', 'options', 'explanation', 'hint'],
  [QuestionType.TRUE_FALSE]: ['text', 'correctAnswer', 'explanation', 'hint'],
  [QuestionType.MULTIPLE_RESPONSE]: ['text', 'options', 'explanation', 'hint'],
  [QuestionType.FILL_IN_THE_BLANKS]: ['text', 'blanks', 'explanation', 'hint'],
  [QuestionType.MATCHING]: ['text', 'pairs', 'explanation', 'hint'],
  [QuestionType.DRAG_AND_DROP]: ['text', 'items', 'zones', 'explanation', 'hint'],
  [QuestionType.DRAG_THE_WORDS]: ['text', 'explanation', 'hint'],
  [QuestionType.NUMERIC]: ['text', 'correctAnswer', 'tolerance', 'explanation', 'hint'],
  [QuestionType.SEQUENCE]: ['text', 'items', 'explanation', 'hint'],
  [QuestionType.FLASH_CARDS]: ['cards'],
  [QuestionType.READING]: ['passage', 'questions'],
  [QuestionType.VIDEO]: ['videoUrl', 'questions'],
  [QuestionType.SHORT_ANSWER]: ['text', 'sampleAnswer', 'keywords', 'explanation', 'hint'],
  [QuestionType.ESSAY]: ['text', 'rubric', 'wordLimit', 'explanation', 'hint'],
  [QuestionType.HOTSPOT]: ['text', 'image', 'hotspots', 'explanation', 'hint'],
  [QuestionType.LIKERT_SCALE]: ['text', 'statements', 'scale', 'explanation', 'hint']
};

// Define the interface for row data
interface RowData {
  [key: string]: any;
}

/**
 * Convert a row to a question object
 * @param row The row data
 * @param questionBankId The ID of the question bank
 * @param rowIndex The index of the row (for error reporting)
 * @returns The question object or null if validation fails
 */
export function convertRowToQuestion(row: RowData, questionBankId: string, rowIndex: number): CreateQuestionInput | null {
  // Validate required fields
  const requiredFields = ['title', 'questionType', 'difficulty', 'subjectId'];
  const missingFields = requiredFields.filter(field => !row[field]);

  if (missingFields.length > 0) {
    throw new Error(`Row ${rowIndex}: Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate question type
  const questionType = row.questionType as QuestionType;
  if (!Object.values(QuestionType).includes(questionType)) {
    throw new Error(`Row ${rowIndex}: Invalid question type: ${questionType}`);
  }

  // Validate difficulty
  const difficulty = row.difficulty as DifficultyLevel;
  if (!Object.values(DifficultyLevel).includes(difficulty)) {
    throw new Error(`Row ${rowIndex}: Invalid difficulty: ${difficulty}`);
  }

  // Create the base question object
  const question: CreateQuestionInput = {
    questionBankId,
    title: row.title,
    questionType,
    difficulty,
    subjectId: row.subjectId,
    content: createQuestionContent(row, questionType, rowIndex),
    metadata: {}
  };

  // Add optional fields if present
  if (row.courseId) question.courseId = row.courseId;
  if (row.topicId) question.topicId = row.topicId;
  if (row.gradeLevel) question.gradeLevel = Number(row.gradeLevel);
  if (row.year) question.year = Number(row.year);
  if (row.sourceReference) question.sourceReference = row.sourceReference;

  return question;
}

/**
 * Create the question content based on the question type
 * @param row The row data
 * @param questionType The type of question
 * @param rowIndex The index of the row (for error reporting)
 * @returns The question content object
 */
export function createQuestionContent(row: RowData, questionType: QuestionType, rowIndex: number): any {
  switch (questionType) {
    case QuestionType.MULTIPLE_CHOICE:
      return createMultipleChoiceContent(row, rowIndex);
    case QuestionType.TRUE_FALSE:
      return createTrueFalseContent(row, rowIndex);
    case QuestionType.MULTIPLE_RESPONSE:
      return createMultipleResponseContent(row, rowIndex);
    case QuestionType.FILL_IN_THE_BLANKS:
      return createFillInTheBlanksContent(row, rowIndex);
    case QuestionType.MATCHING:
      return createMatchingContent(row, rowIndex);
    case QuestionType.DRAG_AND_DROP:
      return createDragAndDropContent(row, rowIndex);
    case QuestionType.NUMERIC:
      return createNumericContent(row, rowIndex);
    case QuestionType.SHORT_ANSWER:
      return createShortAnswerContent(row, rowIndex);
    case QuestionType.ESSAY:
      return createEssayContent(row, rowIndex);
    default:
      throw new Error(`Row ${rowIndex}: Question type ${questionType} is not supported for import`);
  }
}

/**
 * Create multiple choice content from row
 * @param row The row data
 * @param rowIndex The index of the row (for error reporting)
 * @returns The multiple choice content object
 */
export function createMultipleChoiceContent(row: RowData, rowIndex: number): MultipleChoiceContent {
  if (!row.text) {
    throw new Error(`Row ${rowIndex}: Missing required field 'text' for multiple choice question`);
  }

  if (!row.options) {
    throw new Error(`Row ${rowIndex}: Missing required field 'options' for multiple choice question`);
  }

  try {
    // Parse options from JSON string if it's a string
    const options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;

    if (!Array.isArray(options) || options.length === 0) {
      throw new Error(`Row ${rowIndex}: Options must be a non-empty array`);
    }

    // Validate options
    options.forEach((option: any, index: number) => {
      if (!option.text) {
        throw new Error(`Row ${rowIndex}: Option ${index + 1} is missing 'text'`);
      }

      if (typeof option.isCorrect !== 'boolean') {
        throw new Error(`Row ${rowIndex}: Option ${index + 1} is missing 'isCorrect' or it's not a boolean`);
      }
    });

    // Check if at least one option is correct
    const hasCorrectOption = options.some((option: any) => option.isCorrect);
    if (!hasCorrectOption) {
      throw new Error(`Row ${rowIndex}: At least one option must be marked as correct`);
    }

    return {
      text: row.text,
      options: options.map((option: any, index: number) => ({
        id: `option-${index + 1}`,
        text: option.text,
        isCorrect: option.isCorrect,
        feedback: option.feedback || undefined
      })),
      explanation: row.explanation || undefined,
      hint: row.hint || undefined
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Row ${rowIndex}: Invalid JSON format for options: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Create true/false content from row
 * @param row The row data
 * @param rowIndex The index of the row (for error reporting)
 * @returns The true/false content object
 */
export function createTrueFalseContent(row: RowData, rowIndex: number): TrueFalseContent {
  if (!row.text) {
    throw new Error(`Row ${rowIndex}: Missing required field 'text' for true/false question`);
  }

  if (row.correctAnswer === undefined) {
    throw new Error(`Row ${rowIndex}: Missing required field 'correctAnswer' for true/false question`);
  }

  const correctAnswer = typeof row.correctAnswer === 'string'
    ? row.correctAnswer.toLowerCase() === 'true'
    : Boolean(row.correctAnswer);

  return {
    text: row.text,
    isTrue: correctAnswer,
    explanation: row.explanation || undefined,
    hint: row.hint || undefined
  };
}

/**
 * Create multiple response content from row
 * @param row The row data
 * @param rowIndex The index of the row (for error reporting)
 * @returns The multiple response content object
 */
export function createMultipleResponseContent(row: RowData, rowIndex: number): MultipleResponseContent {
  if (!row.text) {
    throw new Error(`Row ${rowIndex}: Missing required field 'text' for multiple response question`);
  }

  if (!row.options) {
    throw new Error(`Row ${rowIndex}: Missing required field 'options' for multiple response question`);
  }

  try {
    // Parse options from JSON string if it's a string
    const options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;

    if (!Array.isArray(options) || options.length === 0) {
      throw new Error(`Row ${rowIndex}: Options must be a non-empty array`);
    }

    // Validate options
    options.forEach((option: any, index: number) => {
      if (!option.text) {
        throw new Error(`Row ${rowIndex}: Option ${index + 1} is missing 'text'`);
      }

      if (typeof option.isCorrect !== 'boolean') {
        throw new Error(`Row ${rowIndex}: Option ${index + 1} is missing 'isCorrect' or it's not a boolean`);
      }
    });

    // Check if at least one option is correct
    const hasCorrectOption = options.some((option: any) => option.isCorrect);
    if (!hasCorrectOption) {
      throw new Error(`Row ${rowIndex}: At least one option must be marked as correct`);
    }

    return {
      text: row.text,
      options: options.map((option: any, index: number) => ({
        id: `option-${index + 1}`,
        text: option.text,
        isCorrect: option.isCorrect,
        feedback: option.feedback || undefined
      })),
      explanation: row.explanation || undefined,
      hint: row.hint || undefined,
      partialCredit: row.partialCredit === 'true' || Boolean(row.partialCredit)
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Row ${rowIndex}: Invalid JSON format for options: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Create fill in the blanks content from row
 * @param row The row data
 * @param rowIndex The index of the row (for error reporting)
 * @returns The fill in the blanks content object
 */
export function createFillInTheBlanksContent(row: RowData, rowIndex: number): FillInTheBlanksContent {
  if (!row.text) {
    throw new Error(`Row ${rowIndex}: Missing required field 'text' for fill in the blanks question`);
  }

  if (!row.blanks) {
    throw new Error(`Row ${rowIndex}: Missing required field 'blanks' for fill in the blanks question`);
  }

  try {
    // Parse blanks from JSON string if it's a string
    const blanks = typeof row.blanks === 'string' ? JSON.parse(row.blanks) : row.blanks;

    if (!Array.isArray(blanks) || blanks.length === 0) {
      throw new Error(`Row ${rowIndex}: Blanks must be a non-empty array`);
    }

    // Validate blanks
    blanks.forEach((blank: any, index: number) => {
      if (!blank.id) {
        throw new Error(`Row ${rowIndex}: Blank ${index + 1} is missing 'id'`);
      }

      if (!Array.isArray(blank.correctAnswers) || blank.correctAnswers.length === 0) {
        throw new Error(`Row ${rowIndex}: Blank ${index + 1} must have at least one correct answer`);
      }
    });

    return {
      text: row.text,
      blanks: blanks.map((blank: any) => ({
        id: blank.id,
        correctAnswers: blank.correctAnswers,
        feedback: blank.feedback || undefined
      })),
      explanation: row.explanation || undefined,
      hint: row.hint || undefined,
      caseSensitive: row.caseSensitive === 'true' || row.caseSensitive === true
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Row ${rowIndex}: Invalid JSON format for blanks: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Create matching content from row
 * @param row The row data
 * @param rowIndex The index of the row (for error reporting)
 * @returns The matching content object
 */
export function createMatchingContent(row: RowData, rowIndex: number): MatchingContent {
  if (!row.text) {
    throw new Error(`Row ${rowIndex}: Missing required field 'text' for matching question`);
  }

  if (!row.pairs) {
    throw new Error(`Row ${rowIndex}: Missing required field 'pairs' for matching question`);
  }

  try {
    // Parse pairs from JSON string if it's a string
    const pairs = typeof row.pairs === 'string' ? JSON.parse(row.pairs) : row.pairs;

    if (!Array.isArray(pairs) || pairs.length === 0) {
      throw new Error(`Row ${rowIndex}: Pairs must be a non-empty array`);
    }

    // Validate pairs
    pairs.forEach((pair: any, index: number) => {
      if (!pair.id) {
        throw new Error(`Row ${rowIndex}: Pair ${index + 1} is missing 'id'`);
      }

      if (!pair.left) {
        throw new Error(`Row ${rowIndex}: Pair ${index + 1} is missing 'left'`);
      }

      if (!pair.right) {
        throw new Error(`Row ${rowIndex}: Pair ${index + 1} is missing 'right'`);
      }
    });

    return {
      text: row.text,
      pairs: pairs.map((pair: any) => ({
        id: pair.id,
        left: pair.left,
        right: pair.right
      })),
      explanation: row.explanation || undefined,
      hint: row.hint || undefined
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Row ${rowIndex}: Invalid JSON format for pairs: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Create drag and drop content from row
 * @param row The row data
 * @param rowIndex The index of the row (for error reporting)
 * @returns The drag and drop content object
 */
export function createDragAndDropContent(row: RowData, rowIndex: number): DragAndDropContent {
  if (!row.text) {
    throw new Error(`Row ${rowIndex}: Missing required field 'text' for drag and drop question`);
  }

  if (!row.items) {
    throw new Error(`Row ${rowIndex}: Missing required field 'items' for drag and drop question`);
  }

  if (!row.zones) {
    throw new Error(`Row ${rowIndex}: Missing required field 'zones' for drag and drop question`);
  }

  try {
    // Parse items from JSON string if it's a string
    const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error(`Row ${rowIndex}: Items must be a non-empty array`);
    }

    // Parse zones from JSON string if it's a string
    const zones = typeof row.zones === 'string' ? JSON.parse(row.zones) : row.zones;

    if (!Array.isArray(zones) || zones.length === 0) {
      throw new Error(`Row ${rowIndex}: Zones must be a non-empty array`);
    }

    // Validate items
    items.forEach((item: any, index: number) => {
      if (!item.id) {
        throw new Error(`Row ${rowIndex}: Item ${index + 1} is missing 'id'`);
      }

      if (!item.text) {
        throw new Error(`Row ${rowIndex}: Item ${index + 1} is missing 'text'`);
      }

      if (!item.correctZoneId) {
        throw new Error(`Row ${rowIndex}: Item ${index + 1} is missing 'correctZoneId'`);
      }

      // Check if the correctZoneId exists in zones
      const zoneExists = zones.some((zone: any) => zone.id === item.correctZoneId);
      if (!zoneExists) {
        throw new Error(`Row ${rowIndex}: Item ${index + 1} has a correctZoneId that doesn't exist in zones`);
      }
    });

    // Validate zones
    zones.forEach((zone: any, index: number) => {
      if (!zone.id) {
        throw new Error(`Row ${rowIndex}: Zone ${index + 1} is missing 'id'`);
      }

      if (!zone.text) {
        throw new Error(`Row ${rowIndex}: Zone ${index + 1} is missing 'text'`);
      }
    });

    return {
      text: row.text,
      items: items.map((item: any) => ({
        id: item.id,
        text: item.text,
        correctZoneId: item.correctZoneId,
        feedback: item.feedback || undefined
      })),
      zones: zones.map((zone: any) => ({
        id: zone.id,
        text: zone.text,
        x: zone.x || 0,
        y: zone.y || 0,
        width: zone.width || 100,
        height: zone.height || 100
      })),
      explanation: row.explanation || undefined,
      hint: row.hint || undefined
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Row ${rowIndex}: Invalid JSON format for items or zones: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Create numeric content from row
 * @param row The row data
 * @param rowIndex The index of the row (for error reporting)
 * @returns The numeric content object
 */
export function createNumericContent(row: RowData, rowIndex: number): NumericContent {
  if (!row.text) {
    throw new Error(`Row ${rowIndex}: Missing required field 'text' for numeric question`);
  }

  if (row.correctAnswer === undefined) {
    throw new Error(`Row ${rowIndex}: Missing required field 'correctAnswer' for numeric question`);
  }

  const correctAnswer = Number(row.correctAnswer);
  if (isNaN(correctAnswer)) {
    throw new Error(`Row ${rowIndex}: 'correctAnswer' must be a number for numeric question`);
  }

  const tolerance = row.tolerance ? Number(row.tolerance) : 0;
  if (isNaN(tolerance)) {
    throw new Error(`Row ${rowIndex}: 'tolerance' must be a number for numeric question`);
  }

  return {
    text: row.text,
    correctAnswer,
    acceptableRange: tolerance ? { min: correctAnswer - tolerance, max: correctAnswer + tolerance } : undefined,
    explanation: row.explanation || undefined,
    hint: row.hint || undefined,
    unit: row.unit || undefined
  };
}

/**
 * Create short answer content from row
 * @param row The row data
 * @param rowIndex The index of the row (for error reporting)
 * @returns The short answer content object
 */
export function createShortAnswerContent(row: RowData, rowIndex: number): ShortAnswerContent {
  if (!row.text) {
    throw new Error(`Row ${rowIndex}: Missing required field 'text' for short answer question`);
  }

  let keywords: string[] = [];
  if (row.keywords) {
    try {
      keywords = typeof row.keywords === 'string' ? JSON.parse(row.keywords) : row.keywords;
      if (!Array.isArray(keywords)) {
        throw new Error(`Row ${rowIndex}: 'keywords' must be an array for short answer question`);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Row ${rowIndex}: Invalid JSON format for keywords: ${error.message}`);
      }
      throw error;
    }
  }

  return {
    text: row.text,
    correctAnswers: keywords,
    explanation: row.explanation || undefined,
    hint: row.hint || undefined,
    // maxLength is not in the type, but we'll keep it as a comment for reference
    // maxLength: row.maxLength ? Number(row.maxLength) : undefined
  };
}

/**
 * Create essay content from row
 * @param row The row data
 * @param rowIndex The index of the row (for error reporting)
 * @returns The essay content object
 */
export function createEssayContent(row: RowData, rowIndex: number): EssayContent {
  if (!row.text) {
    throw new Error(`Row ${rowIndex}: Missing required field 'text' for essay question`);
  }

  let rubric: any[] = [];
  if (row.rubric) {
    try {
      rubric = typeof row.rubric === 'string' ? JSON.parse(row.rubric) : row.rubric;
      if (!Array.isArray(rubric)) {
        throw new Error(`Row ${rowIndex}: 'rubric' must be an array for essay question`);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Row ${rowIndex}: Invalid JSON format for rubric: ${error.message}`);
      }
      throw error;
    }
  }

  return {
    text: row.text,
    rubric: rubric.length > 0 ? {
      criteria: rubric.map((r: any) => ({
        id: r.id || `criterion-${Math.random().toString(36).substring(2, 9)}`,
        name: r.name || 'Criterion',
        description: r.description || '',
        points: r.points || 0,
        levels: r.levels || []
      })),
      totalPoints: rubric.reduce((sum: number, r: any) => sum + (r.points || 0), 0)
    } : undefined,
    wordCountMax: row.wordLimit ? Number(row.wordLimit) : undefined,
    explanation: row.explanation || undefined,
    hint: row.hint || undefined
  };
}
