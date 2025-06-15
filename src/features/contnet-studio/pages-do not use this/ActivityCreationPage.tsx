'use client';

/**
 * ActivityCreationPage
 *
 * This page handles the creation of activities, with support for both
 * manual creation and AI-assisted generation. It uses the StepBasedFlow
 * component for step-based navigation and the ContentCreationLayout
 * for consistent layout.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '@/server/api/root';
import { parseTRPCError } from '@/utils/trpc-error-handler';
import { ContentCreationLayout } from '../components/layout/ContentCreationLayout';
import { StepBasedFlow, Step } from '../components/flow/StepBasedFlow';
import { ContentCreationFlow, ContentType, CreationMethod, ManualCreationParams, AICreationParams } from '../components/ContentCreationFlow';
import { AIParametersForm, AIParametersFormValues } from '../components/forms/AIParametersForm';
import { ContentPreview } from '../components/preview/ContentPreview';
import { ActivityTypeSelector } from '@/features/activities/components/activity-creators/ActivityTypeSelector';
import { SubjectSelector } from '../components/SubjectSelector';
import { HierarchicalTopicSelector } from '../components/HierarchicalTopicSelector';
import { useContentStudio } from '../contexts/ContentStudioContext';
import { ActivityPurpose } from '@/server/api/constants';
import { ActivityTypeBridgeProvider } from '../ActivityTypeBridge';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentOrchestratorProvider, useAgentOrchestrator, AgentType } from '@/features/agents';

// Define the steps in the activity creation flow
enum ActivityCreationStepId {
  SELECT_CREATION_METHOD = 'SELECT_CREATION_METHOD',
  SELECT_ACTIVITY_TYPE = 'SELECT_ACTIVITY_TYPE',
  SELECT_SUBJECT = 'SELECT_SUBJECT',
  SELECT_TOPICS = 'SELECT_TOPICS',
  CONFIGURE_AI = 'CONFIGURE_AI',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  PREVIEW_CONTENT = 'PREVIEW_CONTENT',
  MANUAL_CREATION = 'MANUAL_CREATION'
}

// Define the activity creation state
interface ActivityCreationState {
  creationMethod?: CreationMethod;
  activityType?: string;
  activityPurpose?: ActivityPurpose;
  aiParameters?: AIParametersFormValues;
  generatedContent?: any;
  isGenerating?: boolean;
  generationError?: string;
}

export function ActivityCreationPage() {
  const router = useRouter();
  const {
    contentType,
    setContentType,
    subjectId,
    selectedTopicIds,
    activityType,
    setActivityType,
    activityPurpose,
    setActivityPurpose,
    classId
  } = useContentStudio();

  // Set content type if not already set
  useEffect(() => {
    if (!contentType || contentType !== ContentType.ACTIVITY) {
      setContentType(ContentType.ACTIVITY);
    }
  }, [contentType, setContentType]);

  // State for the activity creation flow
  const [state, setState] = useState<ActivityCreationState>({
    creationMethod: undefined,
    activityType: activityType || undefined,
    activityPurpose: activityPurpose || ActivityPurpose.LEARNING,
    aiParameters: undefined,
    generatedContent: undefined,
    isGenerating: false,
    generationError: undefined
  });

  // State for the current step - start with appropriate step based on creation method
  const [currentStepId, setCurrentStepId] = useState<ActivityCreationStepId>(() => {
    // If we're coming from the method page with AI-Assisted selected, skip to CONFIGURE_AI
    if (state.creationMethod === CreationMethod.AI_ASSISTED) {
      // If we have all required data, go to AI parameters
      if (subjectId && selectedTopicIds.length > 0 && activityType) {
        return ActivityCreationStepId.CONFIGURE_AI;
      }
      // Otherwise, start with activity type selection if needed
      else if (!activityType) {
        return ActivityCreationStepId.SELECT_ACTIVITY_TYPE;
      }
      // Or subject selection if needed
      else if (!subjectId) {
        return ActivityCreationStepId.SELECT_SUBJECT;
      }
      // Or topic selection if needed
      else {
        return ActivityCreationStepId.SELECT_TOPICS;
      }
    }
    // If manual creation is selected, go to manual creation
    else if (state.creationMethod === CreationMethod.MANUAL) {
      return ActivityCreationStepId.MANUAL_CREATION;
    }
    // Default to method selection if no method is specified
    return ActivityCreationStepId.SELECT_CREATION_METHOD;
  });

  // This function is used internally by handleManualCreation and handleAICreation

  // Handle activity type selection
  const handleActivityTypeSelect = useCallback((type: string, purpose: ActivityPurpose) => {
    setState(prev => ({ ...prev, activityType: type, activityPurpose: purpose }));
    setActivityType(type);
    setActivityPurpose(purpose);

    // Move to next step
    if (!subjectId) {
      setCurrentStepId(ActivityCreationStepId.SELECT_SUBJECT);
    } else if (selectedTopicIds.length === 0) {
      setCurrentStepId(ActivityCreationStepId.SELECT_TOPICS);
    } else {
      setCurrentStepId(ActivityCreationStepId.CONFIGURE_AI);
    }
  }, [subjectId, selectedTopicIds, setActivityType, setActivityPurpose]);

  // Get the agent orchestrator
  const orchestrator = useAgentOrchestrator();

  // Handle AI parameters submission
  const handleAIParametersSubmit = useCallback(async (values: AIParametersFormValues) => {
    setState(prev => ({
      ...prev,
      aiParameters: values,
      isGenerating: true,
      generationError: undefined
    }));
    setCurrentStepId(ActivityCreationStepId.GENERATING_CONTENT);

    try {
      // Register a content refinement agent
      const agentId = orchestrator.registerAgent({
        type: AgentType.CONTENT_REFINEMENT,
        name: 'Activity Generator',
        description: 'Generates activities based on parameters',
        systemPrompt: `You are an AI assistant that specializes in creating educational activities.
          Create a ${state.activityType} activity about ${selectedTopicIds.join(', ')} with the following parameters:
          - Title: ${values.title}
          - Complexity: ${values.complexity}
          - Tone: ${values.tone}
          - Include Examples: ${values.includeExamples ? 'Yes' : 'No'}
          - Include Explanations: ${values.includeExplanations ? 'Yes' : 'No'}
          - Maximum Length: ${values.maxLength} tokens

          ${values.prompt}`,
        tools: [],
        metadata: {
          activityType: state.activityType,
          activityPurpose: state.activityPurpose,
          complexity: values.complexity,
          tone: values.tone,
        }
      });

      // Send a message to the agent to generate content
      const response = await orchestrator.sendMessage(
        agentId,
        `Generate a ${state.activityType} activity about ${selectedTopicIds.join(', ')}`,
        {
          activityType: state.activityType,
          activityPurpose: state.activityPurpose,
        }
      );

      // Parse the response and update state
      const generatedContent = JSON.parse(response.message.content);

      setState(prev => ({
        ...prev,
        generatedContent,
        isGenerating: false
      }));
      setCurrentStepId(ActivityCreationStepId.PREVIEW_CONTENT);
    } catch (error) {
      console.error('Error generating content:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationError: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [state.activityType, state.activityPurpose, selectedTopicIds, orchestrator]);

  // Handle manual creation
  const handleManualCreation = useCallback((params: ManualCreationParams) => {
    setState(prev => ({ ...prev, creationMethod: CreationMethod.MANUAL }));
    setCurrentStepId(ActivityCreationStepId.MANUAL_CREATION);

    // This would typically navigate to the manual activity creation page
    console.log('Manual creation with params:', params);
  }, []);

  // Handle AI-assisted creation
  const handleAICreation = useCallback((params: AICreationParams) => {
    setState(prev => ({ ...prev, creationMethod: CreationMethod.AI_ASSISTED }));

    // If we have all the context, go straight to AI parameters
    if (params.activityType && params.subjectId && params.topicIds && params.topicIds.length > 0) {
      setCurrentStepId(ActivityCreationStepId.CONFIGURE_AI);
    } else if (!params.activityType) {
      setCurrentStepId(ActivityCreationStepId.SELECT_ACTIVITY_TYPE);
    } else if (!params.subjectId) {
      setCurrentStepId(ActivityCreationStepId.SELECT_SUBJECT);
    } else {
      setCurrentStepId(ActivityCreationStepId.SELECT_TOPICS);
    }
  }, []);

  // Use the API to create an activity
  const createActivity = api.activity.create.useMutation({
    onSuccess: () => {
      // Navigate to the activities page on success
      router.push(`/teacher/classes/${classId}/activities`);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      console.error('Error creating activity:', error);
      // Parse the error and show a user-friendly message
      const errorMessage = parseTRPCError(error, "Failed to create activity");
      // Show error state
      setState(prev => ({
        ...prev,
        generationError: errorMessage
      }));
    }
  });

  // Handle save content
  const handleSaveContent = useCallback(() => {
    if (!state.generatedContent || !classId || !subjectId) {
      console.error('Missing required data for saving activity');
      return;
    }

    // Prepare the activity data
    const activityData = {
      title: state.generatedContent.title,
      classId,
      subjectId,
      topicIds: selectedTopicIds,
      activityType: state.activityType || 'multiple-choice',
      purpose: state.activityPurpose || ActivityPurpose.LEARNING,
      content: {
        ...state.generatedContent,
        version: 1,
        activityType: state.activityType || 'multiple-choice'
      }
    };

    // Create the activity
    createActivity.mutate(activityData);
  }, [state.generatedContent, state.activityType, state.activityPurpose, classId, subjectId, selectedTopicIds, createActivity]);

  // Define the steps for the flow
  const steps: Step<ActivityCreationStepId>[] = [
    // Method selection step is removed since it's already selected in the previous page
    {
      id: ActivityCreationStepId.SELECT_ACTIVITY_TYPE,
      title: 'Activity Type',
      component: () => (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Activity Type</h2>
          <p className="text-muted-foreground mb-6">
            Choose the type of activity you want to create.
          </p>
          <ActivityTypeSelector onSelect={handleActivityTypeSelect} />
        </div>
      )
    },
    {
      id: ActivityCreationStepId.SELECT_SUBJECT,
      title: 'Subject',
      component: () => (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Subject</h2>
          <p className="text-muted-foreground mb-6">
            Choose the subject for your activity.
          </p>
          <SubjectSelector
            selectedSubjectId={subjectId || undefined}
            classId={classId || undefined}
            onSelect={(id) => {
              // Set subject ID in context
              useContentStudio().setSubjectId(id);
              // Move to next step
              setCurrentStepId(ActivityCreationStepId.SELECT_TOPICS);
            }}
          />
        </div>
      )
    },
    {
      id: ActivityCreationStepId.SELECT_TOPICS,
      title: 'Topics',
      component: () => (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Topics</h2>
          <p className="text-muted-foreground mb-6">
            Choose the topics for your activity.
          </p>
          {subjectId ? (
            <HierarchicalTopicSelector
              subjectId={subjectId}
              selectedTopicIds={selectedTopicIds}
              onTopicsChange={(topicIds) => {
                // Update selected topics in context
                const { clearTopicIds, addTopicId } = useContentStudio();
                clearTopicIds();
                topicIds.forEach(id => addTopicId(id));

                // If at least one topic is selected, enable the next button
                if (topicIds.length > 0) {
                  // Move to next step
                  setCurrentStepId(ActivityCreationStepId.CONFIGURE_AI);
                }
              }}
            />
          ) : (
            <div className="text-center p-8 text-gray-500">
              Please select a subject first to view topics
            </div>
          )}
        </div>
      )
    },
    {
      id: ActivityCreationStepId.CONFIGURE_AI,
      title: 'AI Parameters',
      component: () => (
        <AIParametersForm
          onSubmit={handleAIParametersSubmit}
          contentType="activity"
          defaultValues={{
            title: `${state.activityType} Activity`,
            prompt: `Create a ${state.activityType} activity about ${selectedTopicIds.join(', ')}`,
            complexity: 'intermediate',
            tone: 'professional',
            includeExamples: true,
            includeExplanations: true,
            maxLength: 1000
          }}
        />
      )
    },
    {
      id: ActivityCreationStepId.GENERATING_CONTENT,
      title: 'Generating',
      component: () => (
        <div className="flex flex-col items-center justify-center py-12">
          {state.generationError ? (
            <div className="text-center">
              <div className="text-red-500 text-xl mb-4">Error Generating Content</div>
              <p className="text-muted-foreground mb-6">{state.generationError}</p>
              <Button onClick={() => setCurrentStepId(ActivityCreationStepId.CONFIGURE_AI)}>
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Generating Your Activity</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Our AI is creating your activity based on your parameters. This may take a moment...
              </p>
            </>
          )}
        </div>
      )
    },
    {
      id: ActivityCreationStepId.PREVIEW_CONTENT,
      title: 'Preview',
      component: () => (
        <div className="space-y-6">
          <ContentPreview
            title={state.generatedContent?.title || 'Generated Activity'}
            content={state.generatedContent}
            contentType="activity"
            onSave={handleSaveContent}
            onEdit={() => setCurrentStepId(ActivityCreationStepId.CONFIGURE_AI)}
          />
          <div className="flex justify-end space-x-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStepId(ActivityCreationStepId.CONFIGURE_AI)}
              disabled={createActivity.isLoading}
            >
              Edit Parameters
            </Button>
            <Button
              onClick={handleSaveContent}
              disabled={createActivity.isLoading}
            >
              {createActivity.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Activity'
              )}
            </Button>
          </div>
        </div>
      )
    },
    {
      id: ActivityCreationStepId.MANUAL_CREATION,
      title: 'Manual Creation',
      component: () => (
        <div>
          <h2 className="text-xl font-semibold mb-4">Manual Activity Creation</h2>
          <p className="text-muted-foreground mb-6">
            Create your activity manually using the form below.
          </p>
          <div className="space-y-4">
            {/* This would be replaced with the actual manual activity creation form */}
            <p>Manual activity creation form would go here.</p>
            <p>This would typically use the existing activity editor components.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <ActivityTypeBridgeProvider>
      <ContentCreationLayout
        title="Create Activity"
        description="Create a new activity for your class"
        backHref="/teacher/content-studio"
      >
        <StepBasedFlow
          steps={steps}
          initialStepId={currentStepId}
          onStepChange={setCurrentStepId as (id: string) => void}
          showProgressBar={state.creationMethod === CreationMethod.AI_ASSISTED}
          showStepTitles={state.creationMethod === CreationMethod.AI_ASSISTED}
        />
      </ContentCreationLayout>
    </ActivityTypeBridgeProvider>
  );
}
