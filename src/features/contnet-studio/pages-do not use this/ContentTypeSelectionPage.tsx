'use client';

/**
 * ContentTypeSelectionPage
 *
 * This is the landing page for the Content Studio, where users select
 * the type of content they want to create (Activity, Assessment, Worksheet, Lesson Plan).
 */

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ContentTypeSelector } from '../components/ContentTypeSelector';
import { ContentType } from '../components/ContentCreationFlow';
import { useContentStudio } from '../contexts/ContentStudioContext';
import { useContextFromUrl } from '../utils/route-params';

export function ContentTypeSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setContentType, classId, setClassId } = useContentStudio();
  const { context, updateContext } = useContextFromUrl(searchParams, router);

  // Sync context from URL with ContentStudioContext on mount
  useEffect(() => {
    if (context.contentType) {
      setContentType(context.contentType);
    }
    if (context.classId) {
      setClassId(context.classId);
    }
  }, [context, setContentType, setClassId]);

  // Handle content type selection
  const handleContentTypeSelect = (contentType: ContentType) => {
    // Set the content type in the context
    setContentType(contentType);

    // Update URL context and navigate
    const baseUrl = getBaseUrlForContentType(contentType);
    updateContext({ contentType, classId }, baseUrl);
  };

  // Get the base URL for the selected content type
  const getBaseUrlForContentType = (contentType: ContentType): string => {
    switch (contentType) {
      case ContentType.ACTIVITY:
        return '/teacher/content-studio/activity';
      case ContentType.ASSESSMENT:
        return '/teacher/content-studio/assessment';
      case ContentType.WORKSHEET:
        return '/teacher/content-studio/worksheet';
      case ContentType.LESSON_PLAN:
        return '/teacher/content-studio/lesson-plan';
      default:
        return '/teacher/content-studio/activity';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Content Studio</h1>
          <p className="text-muted-foreground">
            Create educational content for your students with or without AI assistance
          </p>
        </div>

        <ContentTypeSelector onSelect={handleContentTypeSelect} />
      </div>
    </div>
  );
}
