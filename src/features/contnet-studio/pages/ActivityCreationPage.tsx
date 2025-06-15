'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Save } from 'lucide-react';
import { useContentStudio } from '@/features/contnet-studio/contexts/ContentStudioContext';
import { AIConversationInterface } from '@/features/contnet-studio/components/AIConversationInterface';
import { ActivityTypeBridgeProvider } from '@/features/contnet-studio/ActivityTypeBridge';

/**
 * ActivityCreationPage Component
 * 
 * This component provides a page for creating activities with AI assistance.
 * It uses the AIConversationInterface component to allow users to interact with AI
 * and refine the generated content.
 */
export function ActivityCreationPage() {
  const {
    state: {
      initialContent,
      activityType,
      activityPurpose,
      onSaveContent,
      onBack
    }
  } = useContentStudio();

  // Get the activity type display name
  const getActivityTypeDisplayName = () => {
    return activityType || 'Activity';
  };

  return (
    <ActivityTypeBridgeProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Create {getActivityTypeDisplayName()}</h1>
            <p className="text-muted-foreground">
              Refine your AI-generated activity before saving
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="flex items-center">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        <Card className="w-full">
          <CardContent className="p-0">
            {initialContent ? (
              <AIConversationInterface
                initialContent={initialContent}
                onSave={onSaveContent}
                onBack={onBack}
                activityType={getActivityTypeDisplayName()}
                activityTitle={initialContent.title || ''}
                activityPurpose={activityPurpose}
              />
            ) : (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No content available. Please go back and try again.</p>
                <Button variant="outline" onClick={onBack} className="mt-4">
                  Go Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ActivityTypeBridgeProvider>
  );
}
