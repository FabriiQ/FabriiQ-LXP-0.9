/**
 * Activity Type Mapper
 *
 * This utility provides functions for mapping between LearningActivityType enum values
 * and their display representations.
 *
 * It handles mapping between:
 * 1. LearningActivityType enum values (UPPERCASE_WITH_UNDERSCORES)
 * 2. Implementation-specific activity type IDs (kebab-case) - for backward compatibility
 * 3. Human-readable display names (Title Case)
 */

import { ActivityPurpose as AP, LearningActivityType as LAT } from '@/server/api/constants';

/**
 * Map LearningActivityType enum values to kebab-case IDs
 * This is maintained for backward compatibility with components that expect kebab-case IDs
 *
 * @param learningType The LearningActivityType enum value (e.g., MULTIPLE_CHOICE)
 * @param purpose The purpose of the activity (LEARNING or ASSESSMENT)
 * @returns The kebab-case representation of the activity type
 */
export function mapActivityTypeToId(learningType: string, purpose: AP | string): string {
  // Default mapping for learning activities
  const learningTypeMapping: Record<string, string> = {
    // Learning content types
    'READING': 'reading',
    'VIDEO': 'video',
    'H5P': 'h5p',
    'FLASH_CARDS': 'flash-cards',
    'BOOK': 'book',

    // Assessment types
    'MULTIPLE_CHOICE': 'multiple-choice',
    'MULTIPLE_RESPONSE': 'multiple-response',
    'TRUE_FALSE': 'true-false',
    'FILL_IN_THE_BLANKS': 'fill-in-the-blanks',
    'MATCHING': 'matching',
    'SEQUENCE': 'sequence',
    'DRAG_AND_DROP': 'drag-and-drop',
    'DRAG_THE_WORDS': 'drag-the-words',
    'NUMERIC': 'numeric',
    'QUIZ': 'quiz',

    // Delivery formats
    'LECTURE': 'reading',
    'TUTORIAL': 'reading',
    'WORKSHOP': 'reading',
    'DISCUSSION': 'discussion',
    'DEMONSTRATION': 'video',
    'GROUP_WORK': 'reading',
    'SELF_STUDY': 'multiple-choice',
    'OTHER': 'reading',

    // Alternative spellings and formats
    'DRAG_DROP': 'drag-and-drop',
    'FILL_IN_BLANKS': 'fill-in-the-blanks',
    'INTERACTIVE': 'fill-in-the-blanks'
  };

  // Mapping for assessment activities
  const assessmentTypeMapping: Record<string, string> = {
    // Assessment types
    'QUIZ': 'quiz',
    'TEST': 'quiz',
    'EXAM': 'quiz',
    'ASSESSMENT': 'quiz',
    'ASSIGNMENT': 'reading',
    'PROJECT': 'reading',
    'PRACTICAL_TEST': 'quiz',
    'PRESENTATION': 'reading',
    'PORTFOLIO': 'reading',
    'PARTICIPATION': 'reading',
    'HOMEWORK': 'quiz',
    'PRACTICE': 'quiz',
    'MULTIPLE_CHOICE': 'multiple-choice',
    'FILL_IN_BLANKS': 'fill-in-the-blanks',
    'FILL_IN_THE_BLANKS': 'fill-in-the-blanks',
    'TRUE_FALSE': 'true-false',
    'MATCHING': 'matching',
    'SEQUENCE': 'sequence',
    'DRAG_DROP': 'drag-and-drop',
    'DRAG_AND_DROP': 'drag-and-drop',
    'DRAG_THE_WORDS': 'drag-the-words',
    'NUMERIC': 'numeric',
    'MULTIPLE_RESPONSE': 'multiple-response'
  };

  // Choose the appropriate mapping based on purpose
  const mapping = purpose === AP.ASSESSMENT ? assessmentTypeMapping : learningTypeMapping;

  // Return the mapped ID or the original type if no mapping exists
  const mappedType = mapping[learningType] || learningType.toLowerCase().replace(/_/g, '-');

  // Log the mapping for debugging
  console.log(`Mapped learning type ${learningType} to ${mappedType} for purpose ${purpose}`);

  return mappedType;
}

/**
 * Get a display name for a learning activity type
 *
 * @param learningType The LearningActivityType enum value or kebab-case ID (for backward compatibility)
 * @returns The human-readable display name for the activity type
 */
export function getActivityTypeDisplayName(learningType: string): string {
  // First, check if it's a kebab-case ID (for backward compatibility)
  const kebabCaseDisplayNames: Record<string, string> = {
    'multiple-choice': 'Multiple Choice',
    'fill-in-the-blanks': 'Fill in the Blanks',
    'true-false': 'True/False',
    'matching': 'Matching',
    'sequence': 'Sequence',
    'drag-drop': 'Drag and Drop',
    'drag-and-drop': 'Drag and Drop',
    'drag-the-words': 'Drag the Words',
    'reading': 'Reading',
    'video': 'Video',
    'discussion': 'Discussion',
    'quiz': 'Quiz',
    'flash-cards': 'Flash Cards',
    'numeric': 'Numeric',
    'multiple-response': 'Multiple Response',
    'h5p': 'H5P',
    'book': 'Book'
  };

  // If it's a kebab-case ID, return the corresponding display name
  if (kebabCaseDisplayNames[learningType]) {
    return kebabCaseDisplayNames[learningType];
  }

  // If it's an enum value (UPPERCASE_WITH_UNDERSCORES), convert it to a display name
  const enumDisplayNames: Record<string, string> = {
    'MULTIPLE_CHOICE': 'Multiple Choice',
    'FILL_IN_THE_BLANKS': 'Fill in the Blanks',
    'TRUE_FALSE': 'True/False',
    'MATCHING': 'Matching',
    'SEQUENCE': 'Sequence',
    'DRAG_AND_DROP': 'Drag and Drop',
    'DRAG_THE_WORDS': 'Drag the Words',
    'READING': 'Reading',
    'VIDEO': 'Video',
    'QUIZ': 'Quiz',
    'FLASH_CARDS': 'Flash Cards',
    'NUMERIC': 'Numeric',
    'MULTIPLE_RESPONSE': 'Multiple Response',
    'H5P': 'H5P',
    'BOOK': 'Book',
    'OTHER': 'Other'
  };

  return enumDisplayNames[learningType] ||
         // If not found, convert from SNAKE_CASE to Title Case
         learningType.split('_').map(word =>
           word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
         ).join(' ');
}

/**
 * Map from implementation type ID to LearningActivityType enum
 * This is the reverse of mapActivityTypeToId
 *
 * @param typeId The implementation-specific type ID (e.g., 'multiple-choice')
 * @returns The corresponding LearningActivityType enum value or null if not found
 */
export function mapTypeIdToEnum(typeId: string): LAT | null {
  // Create a reverse mapping from the learningTypeMapping
  const reverseMapping: Record<string, LAT> = {
    'reading': LAT.READING,
    'video': LAT.VIDEO,
    'h5p': LAT.H5P,
    'flash-cards': LAT.FLASH_CARDS,
    'book': LAT.BOOK,
    'multiple-choice': LAT.MULTIPLE_CHOICE,
    'multiple-response': LAT.MULTIPLE_RESPONSE,
    'true-false': LAT.TRUE_FALSE,
    'fill-in-the-blanks': LAT.FILL_IN_THE_BLANKS,
    'matching': LAT.MATCHING,
    'sequence': LAT.SEQUENCE,
    'drag-and-drop': LAT.DRAG_AND_DROP,
    'drag-the-words': LAT.DRAG_THE_WORDS,
    'numeric': LAT.NUMERIC,
    'quiz': LAT.QUIZ,
    'discussion': LAT.OTHER // Map to OTHER as there's no direct equivalent
  };

  return reverseMapping[typeId] || null;
}

/**
 * Ensure learningType is set correctly
 * This is useful when creating or updating activities
 *
 * @param data Activity data that may have activityType (for backward compatibility)
 * @returns Updated data with learningType set correctly
 */
export function ensureActivityTypeConsistency(data: any): any {
  // Make a copy to avoid modifying the original
  const result = { ...data };

  // If activityType is provided but learningType is not (backward compatibility)
  if (result.activityType && !result.learningType) {
    const enumValue = mapTypeIdToEnum(result.activityType);
    if (enumValue) {
      result.learningType = enumValue;
    }
  }

  // Remove activityType as it's no longer used
  if ('activityType' in result) {
    delete result.activityType;
  }

  return result;
}
