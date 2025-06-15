'use client';

/**
 * ContentCreationFlow Component
 * 
 * This component provides a unified flow for content creation, supporting both
 * manual creation and AI-assisted creation.
 */

import React, { useState } from 'react';
import { ActivityPurpose } from '@/server/api/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkle } from '@/components/ui/icons/sparkle';
import { Edit } from 'lucide-react';

// Define the content types
export enum ContentType {
  ACTIVITY = 'ACTIVITY',
  ASSESSMENT = 'ASSESSMENT',
  WORKSHEET = 'WORKSHEET',
  LESSON_PLAN = 'LESSON_PLAN'
}

// Define the creation methods
export enum CreationMethod {
  MANUAL = 'MANUAL',
  AI_ASSISTED = 'AI_ASSISTED'
}

interface ContentCreationFlowProps {
  contentType: ContentType;
  activityType?: string;
  activityPurpose?: ActivityPurpose;
  subjectId?: string;
  topicIds?: string[];
  classId?: string;
  onManualCreation: (params: ManualCreationParams) => void;
  onAICreation: (params: AICreationParams) => void;
}

export interface ManualCreationParams {
  contentType: ContentType;
  activityType?: string;
  activityPurpose?: ActivityPurpose;
  subjectId?: string;
  topicIds?: string[];
  classId?: string;
}

export interface AICreationParams {
  contentType: ContentType;
  activityType?: string;
  activityPurpose?: ActivityPurpose;
  subjectId?: string;
  topicIds?: string[];
  classId?: string;
}

export function ContentCreationFlow({
  contentType,
  activityType,
  activityPurpose,
  subjectId,
  topicIds,
  classId,
  onManualCreation,
  onAICreation
}: ContentCreationFlowProps) {
  const [creationMethod, setCreationMethod] = useState<CreationMethod | null>(null);

  // Handle method selection
  const handleMethodSelect = (method: CreationMethod) => {
    setCreationMethod(method);

    // Call the appropriate handler based on the selected method
    if (method === CreationMethod.MANUAL) {
      onManualCreation({
        contentType,
        activityType,
        activityPurpose,
        subjectId,
        topicIds,
        classId
      });
    } else if (method === CreationMethod.AI_ASSISTED) {
      onAICreation({
        contentType,
        activityType,
        activityPurpose,
        subjectId,
        topicIds,
        classId
      });
    }
  };

  // Get content type display name
  const getContentTypeDisplayName = (type: ContentType): string => {
    switch (type) {
      case ContentType.ACTIVITY:
        return 'Activity';
      case ContentType.ASSESSMENT:
        return 'Assessment';
      case ContentType.WORKSHEET:
        return 'Worksheet';
      case ContentType.LESSON_PLAN:
        return 'Lesson Plan';
      default:
        return 'Content';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Choose Creation Method</h2>
        <p className="text-muted-foreground mt-1">
          How would you like to create this {getContentTypeDisplayName(contentType).toLowerCase()}?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted border-2 hover:border-primary"
          onClick={() => handleMethodSelect(CreationMethod.AI_ASSISTED)}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Sparkle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Assisted</h3>
              <p className="text-muted-foreground">
                Let AI help you create your {getContentTypeDisplayName(contentType).toLowerCase()} based on your parameters. You can refine the content afterward.
              </p>
              <ul className="mt-4 text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Quick content generation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Curriculum-aligned suggestions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Customizable after generation</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-muted border-2 hover:border-primary"
          onClick={() => handleMethodSelect(CreationMethod.MANUAL)}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Edit className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Manual Creation</h3>
              <p className="text-muted-foreground">
                Create your {getContentTypeDisplayName(contentType).toLowerCase()} from scratch with full control over all content and settings.
              </p>
              <ul className="mt-4 text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Complete creative control</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Detailed customization options</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Perfect for specific requirements</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
