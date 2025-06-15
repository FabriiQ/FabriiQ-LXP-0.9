/**
 * Helper functions for working with activity objects
 */

/**
 * Gets a property from an activity, checking both direct properties and content properties
 * @param activity The activity object
 * @param propertyName The name of the property to get
 * @param defaultValue The default value to return if the property is not found
 * @returns The property value or the default value
 */
export function getActivityProperty<T, K extends keyof T>(
  activity: T & { content?: Partial<T> },
  propertyName: K,
  defaultValue?: T[K]
): T[K] | undefined {
  // Check if the property exists directly on the activity
  if (activity && propertyName in activity) {
    return activity[propertyName];
  }
  
  // Check if the property exists in the content object
  if (activity?.content && propertyName in activity.content) {
    return activity.content[propertyName] as T[K];
  }
  
  // Return the default value if provided
  return defaultValue;
}

/**
 * Gets the questions array from an activity, checking both direct properties and content properties
 * @param activity The activity object
 * @returns The questions array or an empty array
 */
export function getActivityQuestions<T>(
  activity: T & { questions?: any[]; content?: { questions?: any[] } }
): any[] {
  return activity?.content?.questions || activity?.questions || [];
}
