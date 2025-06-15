'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { cn } from '@/lib/utils';

/**
 * Skeleton UI components for progressive loading in the AI Content Studio
 */

/**
 * Base skeleton component with consistent styling
 */
const BaseSkeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <Skeleton className={cn("animate-pulse", className)} {...props} />;
};

/**
 * Skeleton for the class selector
 */
export const ClassSelectorSkeleton = () => {
  return (
    <div className="space-y-4">
      <BaseSkeleton className="h-8 w-3/4" />
      <BaseSkeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <BaseSkeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for the subject selector
 */
export const SubjectSelectorSkeleton = () => {
  return (
    <div className="space-y-4">
      <BaseSkeleton className="h-8 w-3/4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <BaseSkeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for the topic selector
 */
export const TopicSelectorSkeleton = () => {
  return (
    <div className="space-y-4">
      <BaseSkeleton className="h-8 w-3/4" />
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <BaseSkeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for the activity type selector
 */
export const ActivityTypeSelectorSkeleton = () => {
  return (
    <div className="space-y-4">
      <BaseSkeleton className="h-8 w-3/4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <BaseSkeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for the activity parameters form
 */
export const ActivityParametersFormSkeleton = () => {
  return (
    <div className="space-y-6">
      <BaseSkeleton className="h-8 w-3/4" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <BaseSkeleton className="h-4 w-1/4" />
            <BaseSkeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for the prompt refinement form
 */
export const PromptRefinementFormSkeleton = () => {
  return (
    <div className="space-y-6">
      <BaseSkeleton className="h-8 w-3/4" />
      <BaseSkeleton className="h-32 w-full" />
      <BaseSkeleton className="h-10 w-1/4" />
    </div>
  );
};

/**
 * Skeleton for the AI conversation interface
 */
export const AIConversationInterfaceSkeleton = () => {
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>
          <BaseSkeleton className="h-6 w-1/3" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <BaseSkeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <BaseSkeleton className="h-24 rounded-lg" />
            </div>
          </div>
          <div className="flex items-start space-x-2 justify-end">
            <div className="flex-1">
              <BaseSkeleton className="h-16 rounded-lg" />
            </div>
            <BaseSkeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex items-start space-x-2">
            <BaseSkeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <BaseSkeleton className="h-32 rounded-lg" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton for the content preview
 */
export const ContentPreviewSkeleton = () => {
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>
          <BaseSkeleton className="h-6 w-1/2" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <BaseSkeleton className="h-8 w-3/4" />
          <BaseSkeleton className="h-4 w-full" />
          <BaseSkeleton className="h-4 w-full" />
          <BaseSkeleton className="h-4 w-3/4" />
          <BaseSkeleton className="h-32 w-full" />
          <BaseSkeleton className="h-4 w-full" />
          <BaseSkeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton for the generating content state
 */
export const GeneratingContentSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="h-16 w-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      <BaseSkeleton className="h-6 w-1/2" />
      <BaseSkeleton className="h-4 w-1/3" />
      <div className="w-full max-w-md mt-8">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-2 bg-primary rounded-full animate-progress" style={{ width: '0%' }}></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for the generation method selector
 */
export const GenerationMethodSelectorSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <BaseSkeleton className="h-8 w-48 mx-auto" />
        <BaseSkeleton className="h-4 w-64 mx-auto mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BaseSkeleton className="h-64 rounded-lg" />
        <BaseSkeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Combined skeleton for the AI Studio Dialog
 */
export const AIStudioDialogSkeleton = ({ step = 'subject' }: { step?: string }) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <BaseSkeleton className="h-8 w-1/4" />
        <BaseSkeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="flex justify-between mb-8">
        <div className="flex space-x-2">
          {['subject', 'topic', 'activity', 'generationMethod', 'parameters', 'prompt', 'generating', 'conversation'].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full ${step === s ? 'bg-primary' : 'bg-muted'} ${step !== s ? 'animate-pulse' : ''}`}
            ></div>
          ))}
        </div>
      </div>

      {step === 'subject' && <SubjectSelectorSkeleton />}
      {step === 'topic' && <TopicSelectorSkeleton />}
      {step === 'activity' && <ActivityTypeSelectorSkeleton />}
      {step === 'generationMethod' && <GenerationMethodSelectorSkeleton />}
      {step === 'parameters' && <ActivityParametersFormSkeleton />}
      {step === 'prompt' && <PromptRefinementFormSkeleton />}
      {step === 'generating' && <GeneratingContentSkeleton />}
      {step === 'conversation' && <AIConversationInterfaceSkeleton />}
    </div>
  );
};

// Add a custom animation for the progress bar
const styles = `
@keyframes progress {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}
.animate-progress {
  animation: progress 3s ease-in-out infinite;
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
