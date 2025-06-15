'use client';

/**
 * Route Parameters Utility
 *
 * This utility provides functions for managing route parameters in the Content Studio.
 * It handles serializing and deserializing context data for passing between pages.
 */

import { ContentType } from '../components/ContentCreationFlow';
import { ActivityPurpose } from '@/server/api/constants';

/**
 * Context data interface for content creation
 */
export interface ContentCreationContext {
  contentType?: ContentType;
  classId?: string;
  subjectId?: string;
  topicIds?: string[];
  learningObjectives?: string[];
  activityType?: string;
  activityPurpose?: ActivityPurpose;
}

/**
 * Create a URL with context parameters
 *
 * @param baseUrl The base URL to append parameters to
 * @param context The context data to serialize
 * @returns The URL with context parameters
 */
export function createUrlWithContext(baseUrl: string, context: ContentCreationContext): string {
  const params = new URLSearchParams();

  // Add parameters if they exist
  if (context.contentType) params.append('contentType', context.contentType);
  if (context.classId) params.append('classId', context.classId);
  if (context.subjectId) params.append('subjectId', context.subjectId);
  if (context.topicIds && context.topicIds.length > 0) {
    params.append('topicIds', JSON.stringify(context.topicIds));
  }
  if (context.learningObjectives && context.learningObjectives.length > 0) {
    params.append('learningObjectives', JSON.stringify(context.learningObjectives));
  }
  if (context.activityType) params.append('activityType', context.activityType);
  if (context.activityPurpose) params.append('activityPurpose', context.activityPurpose);

  // Return the URL with parameters
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Parse context data from URL search parameters
 *
 * @param searchParams The URL search parameters
 * @returns The parsed context data
 */
export function parseContextFromUrl(searchParams: URLSearchParams): ContentCreationContext {
  const context: ContentCreationContext = {};

  // Parse content type
  const contentType = searchParams.get('contentType');
  if (contentType && Object.values(ContentType).includes(contentType as ContentType)) {
    context.contentType = contentType as ContentType;
  }

  // Parse class ID
  const classId = searchParams.get('classId');
  if (classId) context.classId = classId;

  // Parse subject ID
  const subjectId = searchParams.get('subjectId');
  if (subjectId) context.subjectId = subjectId;

  // Parse topic IDs
  const topicIdsStr = searchParams.get('topicIds');
  if (topicIdsStr) {
    try {
      const topicIds = JSON.parse(topicIdsStr);
      if (Array.isArray(topicIds)) context.topicIds = topicIds;
    } catch (error) {
      console.error('Error parsing topicIds:', error);
    }
  }

  // Parse learning objectives
  const learningObjectivesStr = searchParams.get('learningObjectives');
  if (learningObjectivesStr) {
    try {
      const learningObjectives = JSON.parse(learningObjectivesStr);
      if (Array.isArray(learningObjectives)) context.learningObjectives = learningObjectives;
    } catch (error) {
      console.error('Error parsing learningObjectives:', error);
    }
  }

  // Parse activity type
  const activityType = searchParams.get('activityType');
  if (activityType) context.activityType = activityType;

  // Parse activity purpose
  const activityPurpose = searchParams.get('activityPurpose');
  if (activityPurpose && Object.values(ActivityPurpose).includes(activityPurpose as ActivityPurpose)) {
    context.activityPurpose = activityPurpose as ActivityPurpose;
  }

  return context;
}

/**
 * Hook to use context from URL
 *
 * @param searchParams The URL search parameters
 * @param router The Next.js router instance
 * @returns The context data and a function to update the context
 */
export function useContextFromUrl(
  searchParams: URLSearchParams,
  router?: any
): {
  context: ContentCreationContext;
  updateContext: (newContext: Partial<ContentCreationContext>, baseUrl?: string) => void;
} {
  const context = parseContextFromUrl(searchParams);

  // Function to update context and navigate if router is provided
  const updateContext = (newContext: Partial<ContentCreationContext>, baseUrl?: string) => {
    // Merge the current context with the new context
    const updatedContext: ContentCreationContext = {
      ...context,
      ...newContext
    };

    // If router is provided, navigate to the new URL
    if (router && baseUrl) {
      const url = createUrlWithContext(baseUrl, updatedContext);
      router.push(url);
    }

    return updatedContext;
  };

  return { context, updateContext };
}
