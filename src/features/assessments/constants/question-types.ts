import { QuestionType, QuestionDifficulty } from '../types/question';

/**
 * Question type definitions and metadata
 */

// Question type metadata
export const QUESTION_TYPE_METADATA: Record<QuestionType, {
  label: string;
  description: string;
  icon: string;
  color: string;
  autoGradable: boolean;
  supportsBloomsLevels: string[]; // Bloom's taxonomy levels this question type supports
}> = {
  [QuestionType.MULTIPLE_CHOICE]: {
    label: 'Multiple Choice',
    description: 'Select one correct answer from multiple options',
    icon: 'MultipleChoiceIcon',
    color: 'blue',
    autoGradable: true,
    supportsBloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'],
  },
  [QuestionType.MULTIPLE_RESPONSE]: {
    label: 'Multiple Response',
    description: 'Select all correct answers from multiple options',
    icon: 'MultipleResponseIcon',
    color: 'green',
    autoGradable: true,
    supportsBloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'],
  },
  [QuestionType.TRUE_FALSE]: {
    label: 'True/False',
    description: 'Determine whether a statement is true or false',
    icon: 'TrueFalseIcon',
    color: 'red',
    autoGradable: true,
    supportsBloomsLevels: ['REMEMBER', 'UNDERSTAND'],
  },
  [QuestionType.SHORT_ANSWER]: {
    label: 'Short Answer',
    description: 'Provide a brief text response',
    icon: 'ShortAnswerIcon',
    color: 'purple',
    autoGradable: true,
    supportsBloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
  },
  [QuestionType.ESSAY]: {
    label: 'Essay',
    description: 'Write an extended response to a prompt',
    icon: 'EssayIcon',
    color: 'orange',
    autoGradable: false,
    supportsBloomsLevels: ['ANALYZE', 'EVALUATE', 'CREATE'],
  },
  [QuestionType.FILL_IN_THE_BLANK]: {
    label: 'Fill in the Blank',
    description: 'Complete a sentence by filling in missing words',
    icon: 'FillInTheBlankIcon',
    color: 'teal',
    autoGradable: true,
    supportsBloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
  },
  [QuestionType.MATCHING]: {
    label: 'Matching',
    description: 'Match items in one column to items in another column',
    icon: 'MatchingIcon',
    color: 'yellow',
    autoGradable: true,
    supportsBloomsLevels: ['REMEMBER', 'UNDERSTAND', 'ANALYZE'],
  },
  [QuestionType.ORDERING]: {
    label: 'Ordering',
    description: 'Arrange items in the correct sequence',
    icon: 'OrderingIcon',
    color: 'pink',
    autoGradable: true,
    supportsBloomsLevels: ['UNDERSTAND', 'ANALYZE', 'EVALUATE'],
  },
  [QuestionType.NUMERIC]: {
    label: 'Numeric',
    description: 'Provide a numeric answer to a question',
    icon: 'NumericIcon',
    color: 'indigo',
    autoGradable: true,
    supportsBloomsLevels: ['APPLY', 'ANALYZE'],
  },
};

// Question type options for dropdowns
export const QUESTION_TYPE_OPTIONS = Object.entries(QUESTION_TYPE_METADATA).map(
  ([value, { label }]) => ({
    value,
    label,
  })
);

// Question difficulty metadata
export const QUESTION_DIFFICULTY_METADATA: Record<QuestionDifficulty, {
  label: string;
  description: string;
  color: string;
}> = {
  [QuestionDifficulty.EASY]: {
    label: 'Easy',
    description: 'Basic recall and understanding',
    color: 'green',
  },
  [QuestionDifficulty.MEDIUM]: {
    label: 'Medium',
    description: 'Application and analysis',
    color: 'yellow',
  },
  [QuestionDifficulty.HARD]: {
    label: 'Hard',
    description: 'Evaluation and creation',
    color: 'red',
  },
};

// Question difficulty options for dropdowns
export const QUESTION_DIFFICULTY_OPTIONS = Object.entries(QUESTION_DIFFICULTY_METADATA).map(
  ([value, { label }]) => ({
    value,
    label,
  })
);

// Auto-gradable question types
export const AUTO_GRADABLE_QUESTION_TYPES = Object.entries(QUESTION_TYPE_METADATA)
  .filter(([_, metadata]) => metadata.autoGradable)
  .map(([type]) => type as QuestionType);

// Question types by Bloom's level
export const QUESTION_TYPES_BY_BLOOMS_LEVEL: Record<string, QuestionType[]> = {
  REMEMBER: [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.MULTIPLE_RESPONSE,
    QuestionType.TRUE_FALSE,
    QuestionType.SHORT_ANSWER,
    QuestionType.FILL_IN_THE_BLANK,
    QuestionType.MATCHING,
  ],
  UNDERSTAND: [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.MULTIPLE_RESPONSE,
    QuestionType.TRUE_FALSE,
    QuestionType.SHORT_ANSWER,
    QuestionType.FILL_IN_THE_BLANK,
    QuestionType.MATCHING,
    QuestionType.ORDERING,
  ],
  APPLY: [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.MULTIPLE_RESPONSE,
    QuestionType.SHORT_ANSWER,
    QuestionType.FILL_IN_THE_BLANK,
    QuestionType.NUMERIC,
  ],
  ANALYZE: [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.MULTIPLE_RESPONSE,
    QuestionType.MATCHING,
    QuestionType.ORDERING,
    QuestionType.NUMERIC,
    QuestionType.ESSAY,
  ],
  EVALUATE: [
    QuestionType.ORDERING,
    QuestionType.ESSAY,
  ],
  CREATE: [
    QuestionType.ESSAY,
  ],
};
