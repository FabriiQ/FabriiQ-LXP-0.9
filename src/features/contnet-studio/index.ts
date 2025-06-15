/**
 * Content Studio
 *
 * This module exports the components and utilities for the Content Studio,
 * which allows teachers to create educational content with or without AI assistance.
 *
 * The Content Studio provides a unified interface for creating activities, assessments,
 * worksheets, and lesson plans, with support for both manual creation and AI-assisted
 * generation.
 */

// Export the main components
export { ContentTypeSelector } from './components/ContentTypeSelector';
export { ContentCreationFlow, ContentType, CreationMethod } from './components/ContentCreationFlow';
export { ClassSelector } from './components/ClassSelector';

// Export the AIStudioDialog
export { AIStudioDialog } from './components/AIStudioDialog';

// Export the context provider and hooks
export { ContentStudioProvider, useContentStudio } from './contexts/ContentStudioContext';

// Export utility functions
export { createUrlWithContext, parseContextFromUrl, useContextFromUrl } from './utils/route-params';

// Export utility functions from the new activities architecture
export {
  mapActivityTypeToId,
  getActivityTypeDisplayName,
  SimpleActivityPreview
} from '@/features/activties';

// Re-export ActivityPurpose for convenience
export { ActivityPurpose } from '@/server/api/constants';

// Export types
export type { ManualCreationParams, AICreationParams } from './components/ContentCreationFlow';
