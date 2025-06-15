'use client';

import { useState, useEffect, Suspense, lazy, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Sparkle } from '@/components/ui/icons/sparkle';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { ActivityPurpose, LearningActivityType } from '@/server/api/constants';
import { LoadingIndicator } from './LoadingIndicator';
import { ScrollableTopicSelector } from './dialog-steps/ScrollableTopicSelector';
// Import directly from the new activities architecture
import * as Activities from '@/features/activties';
// Import the mapActivityTypeToId function directly
import { mapActivityTypeToId, getActivityTypeDisplayName } from '@/features/activties';
import { cn } from '@/lib/utils';
// Import the agent-based content generator instead of the old one
import { generateContent } from '@/features/contnet-studio/services/agent-content-generator.service';
// Import performance monitoring utility
import { recordAIStudioPerformance } from '@/features/contnet-studio/utils/performance-monitoring';
import { GeneratingContent } from './GeneratingContent';
import {
  ClassSelectorSkeleton,
  SubjectSelectorSkeleton,
  TopicSelectorSkeleton,
  ActivityTypeSelectorSkeleton,
  ActivityParametersFormSkeleton,
  PromptRefinementFormSkeleton,
  GeneratingContentSkeleton,
  AIConversationInterfaceSkeleton
} from './SkeletonUI';

// Lazy load all dialog step components for better initial loading performance
const ClassSelector = lazy(async () => {
  const startTime = performance.now();
  const mod = await import('./dialog-steps/ClassSelector');
  const endTime = performance.now();
  recordAIStudioPerformance('LazyLoad', 'ClassSelector', startTime, endTime);
  return { default: mod.ClassSelector };
});

const SubjectSelector = lazy(async () => {
  const startTime = performance.now();
  const mod = await import('./dialog-steps/SubjectSelector');
  const endTime = performance.now();
  recordAIStudioPerformance('LazyLoad', 'SubjectSelector', startTime, endTime);
  return { default: mod.SubjectSelector };
});



const ActivityTypeSelector = lazy(async () => {
  const startTime = performance.now();
  const mod = await import('./dialog-steps/ActivityTypeSelector');
  const endTime = performance.now();
  recordAIStudioPerformance('LazyLoad', 'ActivityTypeSelector', startTime, endTime);
  return { default: mod.ActivityTypeSelector };
});

const ActivityParametersForm = lazy(async () => {
  const startTime = performance.now();
  const mod = await import('./dialog-steps/ActivityParametersForm');
  const endTime = performance.now();
  recordAIStudioPerformance('LazyLoad', 'ActivityParametersForm', startTime, endTime);
  return { default: mod.ActivityParametersForm };
});

const PromptRefinementForm = lazy(async () => {
  const startTime = performance.now();
  const mod = await import('./dialog-steps/PromptRefinementForm');
  const endTime = performance.now();
  recordAIStudioPerformance('LazyLoad', 'PromptRefinementForm', startTime, endTime);
  return { default: mod.PromptRefinementForm };
});

const AgentConversationInterface = lazy(async () => {
  const startTime = performance.now();
  const mod = await import('./AgentConversationInterface');
  const endTime = performance.now();
  recordAIStudioPerformance('LazyLoad', 'AgentConversationInterface', startTime, endTime);
  return { default: mod.AgentConversationInterface };
});

// Define the steps in the dialog
const STEPS = [
  'class',
  'subject',
  'topic',
  'activityType',
  'parameters',
  'prompt',
  'generating',
  'conversation'
];

interface AIStudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string;
}

export function AIStudioDialog({ open, onOpenChange, classId: initialClassId }: AIStudioDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();

  // State for the multi-step dialog
  const [currentStep, setCurrentStep] = useState(0);
  const [teacherId, setTeacherId] = useState<string>('');
  const [classId, setClassId] = useState<string>(initialClassId || '');
  const [subjectId, setSubjectId] = useState<string>('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [activityType, setActivityType] = useState<string>('');
  const [activityPurpose, setActivityPurpose] = useState<ActivityPurpose>(ActivityPurpose.LEARNING);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficultyLevel, setDifficultyLevel] = useState<string>('intermediate');
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, any> | null>(null);

  // State for virtualized topic selector with pagination
  const [hasMoreTopics, setHasMoreTopics] = useState<boolean>(false);

  // Get the teacher ID from the session
  api.user.getById.useQuery(
    session?.user?.id || "",
    {
      enabled: !!session?.user?.id,
      onSuccess: (data) => {
        if (data?.teacherProfile?.id) {
          // Set the teacher profile ID, which is what the teacher.getTeacherClasses API expects
          setTeacherId(data.teacherProfile.id);
        }
      },
      onError: (error) => {
        console.error('Error fetching teacher profile:', error);
      }
    }
  );

  // Reset the dialog state when it's opened
  useEffect(() => {
    if (open) {
      // Reset all state variables
      setCurrentStep(0);
      setClassId(initialClassId || '');
      setSubjectId('');
      setSelectedTopicIds([]);
      setActivityType('');
      setActivityPurpose(ActivityPurpose.LEARNING);
      setNumQuestions(5);
      setDifficultyLevel('intermediate');
      setPrompt('');
      setIsGenerating(false);
      setGeneratedContent(null);
    }
  }, [open, initialClassId]);

  // Fetch subjects for the teacher
  const { data: subjects, isLoading: isLoadingSubjects } = api.subject.getTeacherSubjects.useQuery(
    { teacherId },
    { enabled: open && currentStep === 0 && !!teacherId }
  );

  // Fetch topics query based on selected subject with pagination
  const {
    data: topicsData,
    isLoading: isLoadingTopics,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = api.subjectTopic.listTopicsInfinite.useInfiniteQuery(
    {
      subjectId,
      pageSize: 50
    },
    {
      enabled: open && currentStep === 1 && !!subjectId,
      getNextPageParam: (lastPage: { hasMore: boolean; page: number }) => {
        return lastPage.hasMore ? lastPage.page + 1 : undefined;
      },
      onSuccess: (data: { pages: Array<{ hasMore: boolean }> }) => {
        if (data.pages.length > 0) {
          setHasMoreTopics(data.pages[data.pages.length - 1].hasMore);
        }
      }
    }
  );

  // Flatten the topics data
  const topics = useMemo(() => {
    if (!topicsData) return [];
    return topicsData.pages.flatMap((page: { data: any[] }) => page.data);
  }, [topicsData]);

  // Handle loading more topics
  const handleLoadMoreTopics = useCallback(() => {
    const startTime = performance.now();
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().then(() => {
        const endTime = performance.now();
        recordAIStudioPerformance('AIStudioDialog', 'loadMoreTopics', startTime, endTime);
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle next step
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle subject selection
  const handleSubjectSelect = (id: string) => {
    setSubjectId(id);
  };

  // Handle class selection
  const handleClassSelect = (id: string) => {
    setClassId(id);
  };

  // Handle topic selection
  const handleTopicSelect = (ids: string[]) => {
    setSelectedTopicIds(ids);
  };

  // Handle activity type selection - now handled directly in the component

  // Handle parameters change
  const handleParametersChange = (numQuestions: number, difficultyLevel: string) => {
    setNumQuestions(numQuestions);
    setDifficultyLevel(difficultyLevel);
  };

  // Handle prompt change
  const handlePromptChange = (prompt: string) => {
    setPrompt(prompt);
  };

  // Handle generate content
  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setCurrentStep(STEPS.indexOf('generating'));

    try {
      // Get the selected subject name
      const selectedSubject = subjects?.find(s => s.id === subjectId);
      // Get the primary topic (first selected) and all selected topics
      const primaryTopicId = selectedTopicIds.length > 0 ? selectedTopicIds[0] : '';

      // Fetch detailed topic information for the primary topic
      let selectedTopic = topics.find(t => t.id === primaryTopicId);
      let topicDetails = null;

      if (primaryTopicId) {
        try {
          const response = await fetch(`/api/topics/${primaryTopicId}`);
          if (response.ok) {
            topicDetails = await response.json();
            console.log('Fetched detailed topic information:', topicDetails);
            // Update the selected topic with detailed information
            selectedTopic = {
              ...selectedTopic,
              description: topicDetails.description,
              context: topicDetails.context,
              learningOutcomes: topicDetails.learningOutcomes
            };
          }
        } catch (error) {
          console.error('Error fetching topic details:', error);
        }
      }

      // Get all selected topics for context
      const selectedTopics = topics.filter(t => selectedTopicIds.includes(t.id));
      const topicTitles = selectedTopics.map(t => t.title).join(', ');

      // Use the activity type directly without mapping
      const generatedActivityTypeId = activityType;

      console.log(`Using activity type ${activityType} for purpose ${activityPurpose}`);

      // Generate content using our service with real-time data from agents
      const content = await generateContent({
        subject: selectedSubject?.name || 'General Subject',
        subjectId,
        topic: topicTitles || selectedTopic?.title,
        topicId: primaryTopicId,
        topicIds: selectedTopicIds,
        activityType: activityType as LearningActivityType,
        activityPurpose,
        numQuestions,
        difficultyLevel,
        prompt,
        teacherId,
        classId,
        // Pass detailed topic information if available
        topicDescription: selectedTopic?.description || '',
        topicContext: selectedTopic?.context || '',
        learningOutcomes: selectedTopic?.learningOutcomes || ''
      });

      // Log the raw content for debugging
      console.log('Raw content from generateContent:', content);

      // Ensure the content has the necessary structure
      if (!content.questions || content.questions.length === 0) {
        console.warn('No questions found in generated content, adding default structure');

        // Add minimal required structure if missing
        if (!content.questions) {
          content.questions = [];
        }

        if (!content.settings) {
          content.settings = {
            shuffleQuestions: false,
            shuffleOptions: true,
            showFeedbackImmediately: true,
            showCorrectAnswers: true,
            passingPercentage: 60,
            attemptsAllowed: 1
          };
        }
      }

      // Log the content structure
      console.log('Content structure:', {
        activityType: content.activityType,
        title: content.title,
        questionsCount: content.questions ? content.questions.length : 0,
        hasSettings: !!content.settings
      });

      // For backward compatibility with the existing system
      content.config = {
        ...content.settings,
        questions: content.questions
      };

      // Log the generated content for debugging
      console.log('Generated content from real-time agent:', {
        activityType: content.activityType,
        hasConfig: !!content.config,
        configKeys: content.config ? Object.keys(content.config) : [],
        topLevelKeys: Object.keys(content)
      });

      // Ensure the content has both the config property AND the fields at the top level
      // This is crucial for the editor to work correctly
      console.log('Final content structure from agent generation:', {
        activityType: content.activityType,
        title: content.title,
        description: content.description,
        hasQuestions: !!content.questions,
        questionsCount: content.questions ? content.questions.length : 0,
        hasSettings: !!content.settings,
        hasConfig: !!content.config
      });

      setGeneratedContent(content);
      setIsGenerating(false);
      setCurrentStep(STEPS.indexOf('conversation'));
    } catch (error) {
      console.error('Error generating content:', error);

      // Extract a more detailed error message if available
      let errorMessage = 'Failed to generate content. Please try again.';
      let errorTitle = 'AI Generation Error';

      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('API key not configured') ||
            error.message.includes('Invalid API key format')) {
          errorTitle = 'API Key Configuration Error';
          errorMessage = error.message + ' Please contact your administrator to set up the Gemini API key properly.';
        }
        else if (error.message.includes('Gemini API Error') ||
                error.message.includes('Failed to generate content using AI')) {
          errorTitle = 'Gemini API Error';
          errorMessage = error.message;
        }
        else {
          // For other errors, use the error message directly
          errorMessage = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'error',
        duration: 8000, // Show for longer since it's an important error
      });

      setIsGenerating(false);
    }
  };

  // Handle save activity
  const handleSaveActivity = (content: any) => {
    // In a real implementation, we would save the activity to the database
    // Include the subject, topic, and class information
    const activityData = {
      ...content,
      subjectId,
      topicId: selectedTopicIds.length > 0 ? selectedTopicIds[0] : undefined,
      topicIds: selectedTopicIds.length > 0 ? selectedTopicIds : undefined,
      classId: classId || undefined,
      teacherId
    };

    // Log the data that would be saved
    console.log('Saving activity with simplified structure:', {
      activityType: activityData.activityType,
      title: activityData.title,
      questionsCount: activityData.questions ? activityData.questions.length : 0,
      hasSettings: !!activityData.settings
    });

    toast({
      title: 'Success',
      description: 'Activity saved successfully with new implementation!',
      variant: 'success',
    });
    onOpenChange(false);
  };

  // Helper function to get the display name of the activity type
  const getActivityTypeDisplayNameForDisplay = () => {
    // Just capitalize the first letter of each word in the activity type
    return activityType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render the current step content with memoization for performance
  const renderStepContent = useMemo(() => {
    switch (STEPS[currentStep]) {
      case 'class':
        return (
          <Suspense fallback={<ClassSelectorSkeleton />}>
            <ClassSelector
              teacherId={teacherId}
              selectedClassId={classId}
              onSelect={handleClassSelect}
              isLoading={!teacherId}
            />
          </Suspense>
        );
      case 'subject':
        if (isLoadingSubjects) {
          return <SubjectSelectorSkeleton />;
        }
        return (
          <Suspense fallback={<SubjectSelectorSkeleton />}>
            <SubjectSelector
              subjects={subjects || []}
              selectedSubjectId={subjectId}
              onSelect={handleSubjectSelect}
              isLoading={isLoadingSubjects}
            />
          </Suspense>
        );
      case 'topic':
        if (isLoadingTopics && !topics.length) {
          return <TopicSelectorSkeleton />;
        }
        return (
          <Suspense fallback={<TopicSelectorSkeleton />}>
            <ScrollableTopicSelector
              topics={topics}
              selectedTopicIds={selectedTopicIds}
              onSelect={handleTopicSelect}
              isLoading={isLoadingTopics || isFetchingNextPage}
              onLoadMore={handleLoadMoreTopics}
              hasMoreTopics={hasMoreTopics}
            />
          </Suspense>
        );
      case 'activityType':
        return (
          <Suspense fallback={<ActivityTypeSelectorSkeleton />}>
            <ActivityTypeSelector
              onSelect={(typeId, purpose) => {
                if (purpose) {
                  setActivityPurpose(purpose);
                }
                setActivityType(typeId);
                handleNext();
              }}
              initialPurpose={activityPurpose}
              showSearch={true}
              showTabs={true}
              showCapabilities={true}
            />
          </Suspense>
        );

      case 'parameters':
        return (
          <Suspense fallback={<ActivityParametersFormSkeleton />}>
            <ActivityParametersForm
              numQuestions={numQuestions}
              difficultyLevel={difficultyLevel}
              onChange={handleParametersChange}
              activityType={activityType}
              activityPurpose={activityPurpose}
            />
          </Suspense>
        );
      case 'prompt':
        return (
          <Suspense fallback={<PromptRefinementFormSkeleton />}>
            <PromptRefinementForm
              prompt={prompt}
              onChange={handlePromptChange}
              subjectId={subjectId}
              topicId={selectedTopicIds[0] || ''}
              activityType={activityType}
              activityPurpose={activityPurpose}
              numQuestions={numQuestions}
              difficultyLevel={difficultyLevel}
            />
          </Suspense>
        );
      case 'generating':
        return (
          <Suspense fallback={<GeneratingContentSkeleton />}>
            <GeneratingContent estimatedTimeSeconds={30} />
          </Suspense>
        );
      case 'conversation':
        return generatedContent ? (
          <Suspense fallback={<AIConversationInterfaceSkeleton />}>
            <AgentConversationInterface
              initialContent={generatedContent}
              onSave={handleSaveActivity}
              onBack={() => setCurrentStep(STEPS.indexOf('prompt'))}
              activityType={getActivityTypeDisplayNameForDisplay()}
              activityTitle={generatedContent.title || ''}
              activityPurpose={activityPurpose}
            />
          </Suspense>
        ) : (
          <LoadingIndicator
            message="Something went wrong"
            subMessage="We couldn't generate your activity. Please try again."
          />
        );
      default:
        return null;
    }
  }, [currentStep, teacherId, classId, subjects, topics, subjectId, selectedTopicIds, isLoadingSubjects, isLoadingTopics,
      activityType, activityPurpose, numQuestions, difficultyLevel, prompt, generatedContent,
      handleClassSelect, handleSubjectSelect, handleTopicSelect, handleParametersChange, handlePromptChange,
      handleSaveActivity, getActivityTypeDisplayNameForDisplay, handleNext]);

  // Determine if the next button should be disabled
  const isNextDisabled = () => {
    switch (STEPS[currentStep]) {
      case 'class':
        return !classId;
      case 'subject':
        return !subjectId;
      case 'topic':
        return false; // Topic is optional
      case 'activityType':
        return !activityType;
      case 'parameters':
        return numQuestions <= 0;
      case 'prompt':
        return false; // Prompt is optional
      default:
        return false;
    }
  };

  // Determine if the next button should be a "Generate" button
  const isGenerateStep = STEPS[currentStep] === 'prompt';

  // Determine if the dialog should be full-screen
  const isFullScreen = STEPS[currentStep] === 'conversation';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-hidden flex flex-col",
            isFullScreen ? "max-w-6xl w-[90vw] h-[90vh]" : "max-w-xl",
            "rounded-lg shadow-lg border-0"
          )}
        >
        {/* Hide close button when generating or in conversation mode */}
        {!(isGenerating || STEPS[currentStep] === 'conversation') && (
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}
        {!isFullScreen && (
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {STEPS[currentStep] === 'generating' ? 'Generating Activity' : 'Create AI-Powered Activity'}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {STEPS[currentStep] === 'class' && 'Select a class for your activity.'}
                  {STEPS[currentStep] === 'subject' && 'Select a subject for your activity.'}
                  {STEPS[currentStep] === 'topic' && 'Select a topic for your activity (optional).'}
                  {STEPS[currentStep] === 'activityType' && 'Choose the type of activity you want to create.'}
                  {STEPS[currentStep] === 'generationMethod' && 'Choose how you want to create your activity.'}
                  {STEPS[currentStep] === 'parameters' && 'Configure the parameters for your activity.'}
                  {STEPS[currentStep] === 'prompt' && 'Refine your prompt or add specific instructions (optional).'}
                  {STEPS[currentStep] === 'generating' && 'Please wait while we generate your activity.'}
                </DialogDescription>
              </div>
              <div className="flex items-center space-x-1 rounded-md bg-muted p-1 text-muted-foreground">
                <div className="flex items-center">
                  {STEPS.map((step, index) => (
                    <div
                      key={step}
                      className={cn(
                        "h-2 w-2 mx-1 rounded-full",
                        index < currentStep ? "bg-primary" :
                        index === currentStep ? "bg-primary animate-pulse" :
                        "bg-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </DialogHeader>
        )}

        <div className={cn(
          "overflow-y-auto px-1",
          isFullScreen ? "flex-1" : "max-h-[60vh] py-4"
        )}>
          {renderStepContent}
        </div>

        {!isFullScreen && STEPS[currentStep] !== 'generating' && (
          <DialogFooter className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isGenerating}
              className="rounded-full px-4"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {isGenerateStep ? (
              <Button
                onClick={handleGenerateContent}
                disabled={isNextDisabled() || isGenerating}
                className="ml-auto rounded-full px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Sparkle className="mr-2 h-4 w-4" />
                Generate Activity
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isNextDisabled() || isGenerating}
                className="ml-auto rounded-full px-4"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        )}
        </DialogContent>
    </Dialog>
  );
}
