'use client';

/**
 * Type Guards for Activity Data
 *
 * This file contains type guards for activity data to ensure type safety
 * when working with activity data from different sources.
 */

import { ActivityPurpose } from '@/server/api/constants';
import {
  ActivityData,
  MultipleChoiceActivityData,
  TrueFalseActivityData,
  FillInTheBlanksActivityData,
  MultipleChoiceQuestion,
  MultipleChoiceOption,
  TrueFalseQuestion,
  FillInTheBlanksQuestion
} from '../types/activity-data';

/**
 * Type guard for ActivityData
 *
 * @param data The data to check
 * @returns Whether the data is ActivityData
 */
export function isActivityData(data: any): data is ActivityData {
  return (
    data !== null &&
    typeof data === 'object' &&
    typeof data.title === 'string' &&
    typeof data.activityType === 'string'
  );
}

/**
 * Type guard for MultipleChoiceActivityData
 *
 * @param data The data to check
 * @returns Whether the data is MultipleChoiceActivityData
 */
export function isMultipleChoiceActivity(data: any): data is MultipleChoiceActivityData {
  return (
    isActivityData(data) &&
    data.activityType === 'multiple-choice' &&
    Array.isArray(data.questions) &&
    data.questions.every(isMultipleChoiceQuestion)
  );
}

/**
 * Type guard for MultipleChoiceQuestion
 *
 * @param question The question to check
 * @returns Whether the question is a MultipleChoiceQuestion
 */
export function isMultipleChoiceQuestion(question: any): question is MultipleChoiceQuestion {
  return (
    question !== null &&
    typeof question === 'object' &&
    typeof question.id === 'string' &&
    typeof question.text === 'string' &&
    Array.isArray(question.options) &&
    question.options.every(isMultipleChoiceOption)
  );
}

/**
 * Type guard for MultipleChoiceOption
 *
 * @param option The option to check
 * @returns Whether the option is a MultipleChoiceOption
 */
export function isMultipleChoiceOption(option: any): option is MultipleChoiceOption {
  return (
    option !== null &&
    typeof option === 'object' &&
    typeof option.id === 'string' &&
    typeof option.text === 'string' &&
    typeof option.isCorrect === 'boolean'
  );
}

/**
 * Type guard for TrueFalseActivityData
 *
 * @param data The data to check
 * @returns Whether the data is TrueFalseActivityData
 */
export function isTrueFalseActivity(data: any): data is TrueFalseActivityData {
  return (
    isActivityData(data) &&
    data.activityType === 'true-false' &&
    Array.isArray(data.questions) &&
    data.questions.every(isTrueFalseQuestion)
  );
}

/**
 * Type guard for TrueFalseQuestion
 *
 * @param question The question to check
 * @returns Whether the question is a TrueFalseQuestion
 */
export function isTrueFalseQuestion(question: any): question is TrueFalseQuestion {
  return (
    question !== null &&
    typeof question === 'object' &&
    typeof question.id === 'string' &&
    typeof question.statement === 'string' &&
    typeof question.isTrue === 'boolean'
  );
}

/**
 * Type guard for FillInTheBlanksActivityData
 *
 * @param data The data to check
 * @returns Whether the data is FillInTheBlanksActivityData
 */
export function isFillInTheBlanksActivity(data: any): data is FillInTheBlanksActivityData {
  return (
    isActivityData(data) &&
    (data.activityType === 'fill-in-the-blanks' || data.activityType === 'fill-in-blanks') &&
    Array.isArray(data.questions) &&
    data.questions.every(isFillInTheBlanksQuestion)
  );
}

/**
 * Type guard for FillInTheBlanksQuestion
 *
 * @param question The question to check
 * @returns Whether the question is a FillInTheBlanksQuestion
 */
export function isFillInTheBlanksQuestion(question: any): question is FillInTheBlanksQuestion {
  return (
    question !== null &&
    typeof question === 'object' &&
    typeof question.id === 'string' &&
    typeof question.text === 'string' &&
    Array.isArray(question.blanks) &&
    question.blanks.every((blank: any) =>
      typeof blank === 'object' &&
      typeof blank.id === 'string' &&
      Array.isArray(blank.acceptableAnswers)
    )
  );
}

/**
 * Check if an activity is using the component system
 *
 * @param activity Activity data
 * @returns Whether the activity is using the component system
 */
export function isComponentBasedActivity(activity: any): boolean {
  return (
    activity &&
    activity.content &&
    typeof activity.content === 'object' &&
    'activityType' in activity.content
  );
}

/**
 * Check if an activity is AI-generated
 *
 * @param activity Activity data
 * @returns Whether the activity is AI-generated
 */
export function isAIGeneratedActivity(activity: any): boolean {
  return (
    activity &&
    (activity.generatedBy === 'ai' ||
     activity.metadata?.generatedBy === 'ai' ||
     activity.content?.metadata?.generatedBy === 'ai')
  );
}

/**
 * Get the activity type from an activity
 *
 * @param activity Activity data
 * @returns Activity type or null if not found
 */
export function getActivityType(activity: any): string | null {
  if (!activity) return null;

  // First check for learningType (preferred)
  if (activity.learningType) {
    // Convert enum value to string and make it lowercase for consistency
    return activity.learningType.toString().toLowerCase().replace(/_/g, '-');
  }

  // Then check all other possible locations
  return activity.activityType ||
         activity.content?.activityType ||
         activity.type ||
         activity.content?.type ||
         null;
}

/**
 * Get the activity purpose from an activity
 *
 * @param activity Activity data
 * @returns Activity purpose or default if not found
 */
export function getActivityPurpose(activity: any): ActivityPurpose {
  if (!activity) return ActivityPurpose.LEARNING;

  // Check all possible locations
  const purpose = activity.purpose ||
                 activity.content?.purpose ||
                 activity.config?.purpose ||
                 activity.content?.config?.purpose;

  // Validate that it's a valid ActivityPurpose
  if (purpose && Object.values(ActivityPurpose).includes(purpose)) {
    return purpose as ActivityPurpose;
  }

  return ActivityPurpose.LEARNING;
}

/**
 * Convert a string option to an object option
 *
 * @param text The option text
 * @param id Optional ID for the option
 * @param isCorrect Whether the option is correct
 * @returns A MultipleChoiceOption
 */
export function convertToObjectOption(
  text: string,
  id: string = `option-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  isCorrect: boolean = false
): MultipleChoiceOption {
  return {
    id,
    text,
    isCorrect
  };
}

/**
 * Check if options are in string format
 *
 * @param options The options to check
 * @returns Whether the options are in string format
 */
export function areStringOptions(options: any[]): options is string[] {
  return Array.isArray(options) && options.every(option => typeof option === 'string');
}

/**
 * Convert string options to object options
 *
 * @param options The string options
 * @param correctIndex The index of the correct option
 * @returns An array of MultipleChoiceOption
 */
export function convertStringOptionsToObjectOptions(
  options: string[],
  correctIndex: number = -1
): MultipleChoiceOption[] {
  return options.map((text, index) => ({
    id: `option-${index}`,
    text,
    isCorrect: index === correctIndex
  }));
}
