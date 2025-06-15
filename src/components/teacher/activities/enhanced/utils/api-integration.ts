/**
 * API Integration Utilities
 *
 * This file contains utilities for integrating with the activity API
 * to ensure proper use of the component system.
 */

/**
 * Prepare activity data for creation
 *
 * @param data Activity data from the form
 * @returns Prepared activity data for the API
 */
export function prepareActivityCreateData(data: any) {
  // Make a copy of the data to avoid modifying the original
  const preparedData = { ...data };

  // Remove activityTypeId from the top level as it's not part of the API schema
  const activityTypeId = preparedData.activityTypeId;
  delete preparedData.activityTypeId;

  // Ensure the content has the activityType field
  const content = {
    ...preparedData.content,
    activityType: activityTypeId || preparedData.content?.activityType,
  };

  // Also set the learningType field if activityType is available
  // Convert kebab-case to UPPER_SNAKE_CASE for the enum
  if (activityTypeId) {
    preparedData.learningType = activityTypeId.toUpperCase().replace(/-/g, '_');
  }

  // Add required fields if they're missing
  if (!preparedData.purpose) {
    console.warn('Activity purpose is missing, defaulting to LEARNING');
    preparedData.purpose = 'LEARNING';
  }

  // Ensure subjectId is present
  if (!preparedData.subjectId) {
    console.error('Subject ID is required for activity creation');
  }

  // Ensure classId is present
  if (!preparedData.classId) {
    console.error('Class ID is required for activity creation');
  }

  // Log the prepared data for debugging
  console.log('Prepared activity data for creation:', {
    ...preparedData,
    content,
    useComponentSystem: true,
  });

  // Return the prepared data with the useComponentSystem flag
  return {
    ...preparedData,
    content,
    useComponentSystem: true,
  };
}

/**
 * Prepare activity data for update
 *
 * @param data Activity data from the form
 * @returns Prepared activity data for the API
 */
export function prepareActivityUpdateData(data: any) {
  // Ensure the content has the activityType field if it exists
  const content = data.content ? {
    ...data.content,
    activityType: data.activityTypeId || data.content.activityType,
  } : undefined;

  // Also set the learningType field if activityTypeId is available
  // Convert kebab-case to UPPER_SNAKE_CASE for the enum
  if (data.activityTypeId) {
    data.learningType = data.activityTypeId.toUpperCase().replace(/-/g, '_');
  }

  // Return the prepared data with the useComponentSystem flag
  return {
    ...data,
    content,
    useComponentSystem: true,
  };
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
    (
      // Check if learningType is available (preferred)
      (activity.learningType !== undefined) ||
      // Check if activityType is directly on the activity
      (typeof activity.activityType === 'string') ||
      // Check if activityType is in the content object
      (activity.content &&
       typeof activity.content === 'object' &&
       'activityType' in activity.content)
    )
  );
}

/**
 * Extract activity type ID from an activity
 *
 * @param activity Activity data
 * @returns Activity type ID or null if not found
 */
export function getActivityTypeId(activity: any): string | null {
  if (!activity) return null;

  // First check for learningType (preferred)
  if (activity.learningType) {
    // Convert enum value to string and make it lowercase for consistency
    return activity.learningType.toString().toLowerCase().replace(/_/g, '-');
  }

  // Check if activityType is directly on the activity
  if (typeof activity.activityType === 'string') {
    return activity.activityType;
  }

  // Check if activityType is in the content object
  if (activity.content && typeof activity.content === 'object' && 'activityType' in activity.content) {
    return activity.content.activityType;
  }

  // For legacy activities, try to infer from other properties
  if (activity.content && typeof activity.content === 'object') {
    // Check for common properties of specific activity types
    if ('questions' in activity.content && Array.isArray(activity.content.questions)) {
      if ('options' in (activity.content.questions[0] || {})) {
        return 'multiple-choice';
      }
    }
  }

  return null;
}

/**
 * Validate activity data before submission
 *
 * @param data Activity data
 * @param activityTypeId Activity type ID
 * @returns Validation result
 */
export function validateActivityData(data: any, activityTypeId: string): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!data.title) {
    errors.push('Title is required');
  }

  if (!activityTypeId) {
    errors.push('Activity type is required');
  }

  // Ensure content exists, even if empty
  if (!data.content) {
    console.warn('Activity content is missing, creating empty content object');
    data.content = { activityType: activityTypeId };
  }

  // Ensure content has activityType
  if (!data.content.activityType) {
    console.warn('Activity content is missing activityType, adding it');
    data.content.activityType = activityTypeId;
  }

  // If the activity is gradable, check for required grading fields
  if (data.isGradable) {
    if (data.maxScore === undefined || data.maxScore === null) {
      errors.push('Maximum score is required for gradable activities');
    }
  }

  // Log the validated data for debugging
  console.log('Validated activity data:', data);

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
