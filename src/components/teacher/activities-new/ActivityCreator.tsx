'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Save, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { ActivityTypeSelector } from './ActivityTypeSelector';
import { ActivityPurpose } from '@/server/api/constants';
import { cn } from '@/lib/utils';
import ThemeWrapper from '@/features/activties/components/ui/ThemeWrapper';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { ActionVerbSuggestions } from '@/features/bloom/components/taxonomy/ActionVerbSuggestions';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { LessonPlanSelector } from './LessonPlanSelector';
import { TopicLearningOutcomeSelector } from './TopicLearningOutcomeSelector';
import { EnhancedRubricSelector } from './EnhancedRubricSelector';

// Import all activity editors from the new architecture
import {
  MultipleChoiceEditor,
  TrueFalseEditor,
  MultipleResponseEditor,
  FillInTheBlanksEditor,
  MatchingEditor,
  SequenceEditor,
  DragAndDropEditor,
  DragTheWordsEditor,
  FlashCardsEditor,
  NumericEditor,
  QuizEditor,
  ReadingEditor,
  VideoEditor,

  // Import activity creators
  createDefaultMultipleChoiceActivity,
  createDefaultTrueFalseActivity,
  createDefaultMultipleResponseActivity,
  createDefaultFillInTheBlanksActivity,
  createDefaultMatchingActivity,
  createDefaultSequenceActivity,
  createDefaultDragAndDropActivity,
  createDefaultDragTheWordsActivity,
  createDefaultFlashCardsActivity,
  createDefaultNumericActivity,
  createDefaultQuizActivity,
  createDefaultReadingActivity,
  createDefaultVideoActivity,

  // Import viewer components for preview
  MultipleChoiceViewer,
  TrueFalseViewer,
  MultipleResponseViewer,
  FillInTheBlanksViewer,
  MatchingViewer,
  SequenceViewer,
  DragAndDropViewer,
  DragTheWordsViewer,
  FlashCardsViewer,
  NumericViewer,
  QuizViewer,
  ReadingViewer,
  VideoViewer,
} from '@/features/activties';

interface ActivityCreatorProps {
  classId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ActivityCreator({ classId, onSuccess, onCancel, className }: ActivityCreatorProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State for the activity creation flow
  const [step, setStep] = useState<'select' | 'create' | 'preview'>('select');
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);
  const [activity, setActivity] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [purpose, setPurpose] = useState<ActivityPurpose>(ActivityPurpose.LEARNING);
  const [isGradable, setIsGradable] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedLessonPlanId, setSelectedLessonPlanId] = useState<string>('');
  const [selectedLearningOutcomeIds, setSelectedLearningOutcomeIds] = useState<string[]>([]);
  const [bloomsLevel, setBloomsLevel] = useState<BloomsTaxonomyLevel>(BloomsTaxonomyLevel.UNDERSTAND);
  const [selectedRubricId, setSelectedRubricId] = useState<string>('');
  const [showRubricSelector, setShowRubricSelector] = useState<boolean>(false);

  // Activity configuration is now handled directly in the activity object

  // Get class details
  const { data: classDetails } = api.class.getById.useQuery(
    {
      id: classId, // Use 'id' instead of 'classId' to match the API schema
      include: {
        students: false,
        teachers: false
      }
    },
    {
      enabled: !!classId,
      retry: 3, // Retry 3 times if the query fails
      retryDelay: 1000, // Wait 1 second between retries
      onError: (error) => {
        console.error("Error loading class details:", error, "classId:", classId);
        toast({
          title: "Error",
          description: `Failed to load class details: ${error.message}`,
          variant: "error",
        });
      },
    }
  );

  // Get subjects for the class
  const { data: subjects, isLoading: isLoadingSubjects } = api.class.getSubjectsForClass.useQuery({
    classId,
  }, {
    enabled: !!classId,
  });

  // Get topics for the selected subject
  const { data: topics, isLoading: isLoadingTopics } = api.subject.getTopics.useQuery(
    { subjectId: selectedSubjectId },
    { enabled: !!selectedSubjectId }
  );

  // Get lesson plans for the class
  const { data: lessonPlansData, isLoading: isLoadingLessonPlans } = api.lessonPlan.getByClass.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Extract the lesson plans array from the response
  const lessonPlans = lessonPlansData?.lessonPlans || [];

  // Create activity mutation
  const createActivity = api.activity.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Activity created successfully",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/teacher/classes/${classId}/activities/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create activity: ${error.message}`,
        variant: "error",
      });
    },
  });

  // Handle lesson plan selection
  const handleLessonPlanChange = (lessonPlanId: string, lessonPlanData: any) => {
    setSelectedLessonPlanId(lessonPlanId);

    if (lessonPlanId && lessonPlanData) {
      // Set subject ID from lesson plan
      if (lessonPlanData.subjectId) {
        setSelectedSubjectId(lessonPlanData.subjectId);
      }

      // Extract topics from lesson plan content
      if (lessonPlanData.content?.topics?.length > 0) {
        // Set the first topic as selected
        setSelectedTopicId(lessonPlanData.content.topics[0]);
      }

      // Extract Bloom's taxonomy level from lesson plan content
      if (lessonPlanData.content?.bloomsDistribution) {
        // Find the highest percentage level in the distribution
        const distribution = lessonPlanData.content.bloomsDistribution;
        let highestLevel: string | undefined = undefined;
        let highestPercentage = 0;

        Object.entries(distribution).forEach(([level, percentage]) => {
          const percentageValue = typeof percentage === 'number' ? percentage : 0;
          if (percentageValue > highestPercentage) {
            highestPercentage = percentageValue;
            highestLevel = level;
          }
        });

        if (highestLevel !== undefined) {
          setBloomsLevel(highestLevel as BloomsTaxonomyLevel);
        }
      }

      // Extract learning outcomes from lesson plan content
      if (lessonPlanData.content?.learningOutcomeIds?.length > 0) {
        setSelectedLearningOutcomeIds(lessonPlanData.content.learningOutcomeIds);
      }
    }
  };

  // Initialize activity when type is selected
  useEffect(() => {
    if (!selectedActivityType) return;

    let newActivity;

    switch (selectedActivityType) {
      case 'multiple-choice':
        newActivity = createDefaultMultipleChoiceActivity();
        break;
      case 'true-false':
        newActivity = createDefaultTrueFalseActivity();
        break;
      case 'multiple-response':
        newActivity = createDefaultMultipleResponseActivity();
        break;
      case 'fill-in-the-blanks':
        newActivity = createDefaultFillInTheBlanksActivity();
        break;
      case 'matching':
        newActivity = createDefaultMatchingActivity();
        break;
      case 'sequence':
        newActivity = createDefaultSequenceActivity();
        break;
      case 'drag-and-drop':
        newActivity = createDefaultDragAndDropActivity();
        break;
      case 'drag-the-words':
        newActivity = createDefaultDragTheWordsActivity();
        break;
      case 'flash-cards':
        newActivity = createDefaultFlashCardsActivity();
        break;
      case 'numeric':
        newActivity = createDefaultNumericActivity();
        break;
      case 'quiz':
        newActivity = createDefaultQuizActivity();
        break;
      case 'reading':
        newActivity = createDefaultReadingActivity();
        break;
      case 'video':
        newActivity = createDefaultVideoActivity();
        break;
      default:
        return;
    }

    setActivity(newActivity);
    setTitle(newActivity.title);
    setDescription(newActivity.description || '');
    setInstructions(newActivity.instructions || '');

    // Set purpose and gradable based on activity type
    if (['multiple-choice', 'true-false', 'multiple-response', 'fill-in-the-blanks', 'matching', 'sequence', 'numeric', 'quiz'].includes(selectedActivityType)) {
      setPurpose(ActivityPurpose.ASSESSMENT);
      setIsGradable(true);
      // Set Bloom's level based on activity type
      if (['multiple-choice', 'true-false'].includes(selectedActivityType)) {
        setBloomsLevel(BloomsTaxonomyLevel.REMEMBER);
      } else if (['multiple-response', 'fill-in-the-blanks'].includes(selectedActivityType)) {
        setBloomsLevel(BloomsTaxonomyLevel.UNDERSTAND);
      } else if (['matching', 'sequence'].includes(selectedActivityType)) {
        setBloomsLevel(BloomsTaxonomyLevel.APPLY);
      } else {
        setBloomsLevel(BloomsTaxonomyLevel.ANALYZE);
      }
      // Show rubric selector for assessment activities
      setShowRubricSelector(true);
    } else {
      setPurpose(ActivityPurpose.LEARNING);
      setIsGradable(false);
      setBloomsLevel(BloomsTaxonomyLevel.UNDERSTAND);
      setShowRubricSelector(false);
    }

  }, [selectedActivityType]);

  // Handle activity type selection
  const handleActivityTypeSelect = (typeId: string) => {
    setSelectedActivityType(typeId);
    setStep('create');
  };

  // Handle back to type selection
  const handleBackToSelect = () => {
    setStep('select');
    setSelectedActivityType(null);
    setActivity(null);
  };

  // Handle preview
  const handlePreview = () => {
    if (!activity) return;

    // Update activity with form values
    const updatedActivity = {
      ...activity,
      title,
      description,
      instructions,
    };

    setActivity(updatedActivity);
    setStep('preview');
  };

  // Handle back to create
  const handleBackToCreate = () => {
    setStep('create');
  };

  // Handle action verb selection
  const handleVerbSelect = (verb: string) => {
    // Insert the verb into the instructions at the cursor position or at the beginning
    const newInstructions = instructions ?
      (instructions.startsWith(verb) ? instructions : `${verb} ${instructions}`) :
      verb;
    setInstructions(newInstructions);
  };

  // Handle rubric selection
  const handleRubricSelect = (rubricId: string) => {
    setSelectedRubricId(rubricId);
  };

  // Handle learning outcomes change
  const handleLearningOutcomesChange = (outcomeIds: string[]) => {
    setSelectedLearningOutcomeIds(outcomeIds);
  };

  // Handle save activity
  const handleSaveActivity = () => {
    if (!classId || !selectedSubjectId) {
      toast({
        title: "Error",
        description: "Missing required data. Please select a subject for this activity.",
        variant: "error",
      });
      return;
    }

    if (!activity) {
      toast({
        title: "Error",
        description: "Activity data is missing. Please select an activity type and try again.",
        variant: "error",
      });
      return;
    }

    // Prepare the activity data
    const activityData = {
      title,
      description,
      classId,
      purpose,
      isGradable,
      activityType: selectedActivityType as string,
      subjectId: selectedSubjectId,
      topicId: selectedTopicId || undefined, // Use selected topic if available
      lessonPlanId: selectedLessonPlanId || undefined, // Use selected lesson plan if available
      maxScore: isGradable ? (activity?.maxScore || 100) : undefined,
      passingScore: isGradable ? (activity?.passingScore || 60) : undefined,
      startDate: activity?.startDate ? new Date(activity.startDate) : undefined,
      endDate: activity?.endDate ? new Date(activity.endDate) : undefined,
      // Add Bloom's taxonomy level
      bloomsLevel: bloomsLevel,
      // Add rubric ID if selected
      rubricId: selectedRubricId || undefined,
      // Add learning outcome IDs
      learningOutcomeIds: selectedLearningOutcomeIds,
      content: activity ? {
        ...activity,
        version: 1, // Add the required version field
        bloomsLevel: bloomsLevel, // Also include in content for consistency
        instructions: instructions, // Ensure instructions are included
        learningOutcomeIds: selectedLearningOutcomeIds, // Include learning outcomes in content
      } : {
        version: 1,
        bloomsLevel: bloomsLevel,
        instructions: instructions,
        learningOutcomeIds: selectedLearningOutcomeIds,
      },
    };

    // Create the activity
    createActivity.mutate(activityData);
  };

  // Render the appropriate editor component based on activity type
  const renderEditor = () => {
    if (!activity || !selectedActivityType) return null;

    const commonProps = {
      activity,
      onChange: setActivity,
    };

    // Create the editor component based on activity type
    const editorComponent = (() => {
      switch (selectedActivityType) {
        case 'multiple-choice':
          return <MultipleChoiceEditor {...commonProps} />;
        case 'true-false':
          return <TrueFalseEditor {...commonProps} />;
        case 'multiple-response':
          return <MultipleResponseEditor {...commonProps} />;
        case 'fill-in-the-blanks':
          return <FillInTheBlanksEditor {...commonProps} />;
        case 'matching':
          return <MatchingEditor {...commonProps} />;
        case 'sequence':
          return <SequenceEditor {...commonProps} />;
        case 'drag-and-drop':
          return <DragAndDropEditor {...commonProps} />;
        case 'drag-the-words':
          return <DragTheWordsEditor {...commonProps} />;
        case 'flash-cards':
          return <FlashCardsEditor {...commonProps} />;
        case 'numeric':
          return <NumericEditor {...commonProps} />;
        case 'quiz':
          return <QuizEditor {...commonProps} />;
        case 'reading':
          return <ReadingEditor {...commonProps} />;
        case 'video':
          return <VideoEditor {...commonProps} />;
        default:
          return <div>No editor available for this activity type</div>;
      }
    })();

    // Wrap the editor component with ThemeWrapper to ensure it respects the theme
    return <ThemeWrapper>{editorComponent}</ThemeWrapper>;
  };

  // Render the appropriate viewer component based on activity type
  const renderViewer = () => {
    if (!activity || !selectedActivityType) return null;

    const commonProps = {
      activity,
      mode: 'teacher' as const,
    };

    // Create the viewer component based on activity type
    const viewerComponent = (() => {
      switch (selectedActivityType) {
        case 'multiple-choice':
          return <MultipleChoiceViewer {...commonProps} />;
        case 'true-false':
          return <TrueFalseViewer {...commonProps} />;
        case 'multiple-response':
          return <MultipleResponseViewer {...commonProps} />;
        case 'fill-in-the-blanks':
          return <FillInTheBlanksViewer {...commonProps} />;
        case 'matching':
          return <MatchingViewer {...commonProps} />;
        case 'sequence':
          return <SequenceViewer {...commonProps} />;
        case 'drag-and-drop':
          return <DragAndDropViewer {...commonProps} />;
        case 'drag-the-words':
          return <DragTheWordsViewer {...commonProps} />;
        case 'flash-cards':
          return <FlashCardsViewer {...commonProps} />;
        case 'numeric':
          return <NumericViewer {...commonProps} />;
        case 'quiz':
          return <QuizViewer {...commonProps} />;
        case 'reading':
          return <ReadingViewer {...commonProps} />;
        case 'video':
          return <VideoViewer {...commonProps} />;
        default:
          return <div>No viewer available for this activity type</div>;
      }
    })();

    // Wrap the viewer component with ThemeWrapper to ensure it respects the theme
    return <ThemeWrapper>{viewerComponent}</ThemeWrapper>;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {step === 'select' && (
        <ActivityTypeSelector onSelect={handleActivityTypeSelect} />
      )}

      {step === 'create' && selectedActivityType && (
        <>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleBackToSelect}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h2 className="text-2xl font-bold">Create {selectedActivityType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Activity</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity Details</CardTitle>
              <CardDescription>
                Enter the basic information for your activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter activity title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter activity description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter activity instructions"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <select
                    id="subject"
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedTopicId(''); // Reset topic when subject changes
                    }}
                    className="w-full p-2 border rounded-md"
                    disabled={isLoadingSubjects || !subjects?.length}
                  >
                    <option value="">Select a subject</option>
                    {subjects?.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingSubjects && <div className="text-sm text-muted-foreground mt-1">Loading subjects...</div>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Topic (Optional)</Label>
                  <select
                    id="topic"
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    disabled={isLoadingTopics || !selectedSubjectId || !topics?.length}
                  >
                    <option value="">Select a topic (optional)</option>
                    {topics?.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                  {isLoadingTopics && <div className="text-sm text-muted-foreground mt-1">Loading topics...</div>}
                  {!isLoadingTopics && selectedSubjectId && topics?.length === 0 && (
                    <div className="text-sm text-muted-foreground mt-1">No topics available for this subject</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <div className="flex items-center space-x-2">
                  <select
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as ActivityPurpose)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={ActivityPurpose.LEARNING}>Learning</option>
                    <option value={ActivityPurpose.ASSESSMENT}>Assessment</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isGradable"
                  checked={isGradable}
                  onCheckedChange={setIsGradable}
                />
                <Label htmlFor="isGradable">Gradable</Label>
              </div>

              {/* Bloom's Taxonomy Integration */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Bloom's Taxonomy Integration</h3>

                <div className="space-y-2">
                  <Label htmlFor="bloomsLevel">Cognitive Level</Label>
                  <BloomsTaxonomySelector
                    value={bloomsLevel}
                    onChange={setBloomsLevel}
                    variant="buttons"
                    showDescription={true}
                  />
                </div>

                <div className="mt-4">
                  <Label>Action Verb Suggestions</Label>
                  <ActionVerbSuggestions
                    bloomsLevel={bloomsLevel}
                    onSelect={handleVerbSelect}
                    count={8}
                    showExamples={true}
                  />
                </div>
              </div>

              {/* Rubric Integration */}
              {showRubricSelector && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Rubric Integration</h3>

                  <div className="space-y-2">
                    <EnhancedRubricSelector
                      value={selectedRubricId}
                      onChange={handleRubricSelect}
                      bloomsLevel={bloomsLevel}
                      subjectId={selectedSubjectId}
                      topicId={selectedTopicId}
                    />
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-3">Activity Configuration</h3>
                <div className="space-y-4">
                  {isGradable && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxScore">Max Score</Label>
                        <Input
                          id="maxScore"
                          type="number"
                          min="1"
                          max="100"
                          value={activity?.maxScore || 100}
                          onChange={(e) => {
                            if (activity) {
                              const value = parseInt(e.target.value) || 100;
                              setActivity({
                                ...activity,
                                maxScore: value
                              });
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passingScore">Passing Score</Label>
                        <Input
                          id="passingScore"
                          type="number"
                          min="0"
                          max={activity?.maxScore || 100}
                          value={activity?.passingScore || 60}
                          onChange={(e) => {
                            if (activity) {
                              const value = parseInt(e.target.value) || 60;
                              setActivity({
                                ...activity,
                                passingScore: value
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={activity?.startDate || ''}
                        onChange={(e) => {
                          if (activity) {
                            setActivity({
                              ...activity,
                              startDate: e.target.value
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={activity?.endDate || ''}
                        onChange={(e) => {
                          if (activity) {
                            setActivity({
                              ...activity,
                              endDate: e.target.value
                            });
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <LessonPlanSelector
                      classId={classId}
                      value={selectedLessonPlanId}
                      onChange={handleLessonPlanChange}
                    />
                  </div>

                  {/* Learning Outcomes Selector - Always show this section */}
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-lg font-medium mb-3">Learning Outcomes</h3>
                    {selectedSubjectId ? (
                      <TopicLearningOutcomeSelector
                        subjectId={selectedSubjectId}
                        topicId={selectedTopicId}
                        bloomsLevel={bloomsLevel}
                        selectedOutcomeIds={selectedLearningOutcomeIds}
                        onOutcomesChange={handleLearningOutcomesChange}
                      />
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground border rounded-md">
                        Please select a subject to view learning outcomes
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Content</CardTitle>
                  <CardDescription>
                    Configure the content for your activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderEditor()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Preview</CardTitle>
                  <CardDescription>
                    Preview how your activity will appear to students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderViewer()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBackToSelect}>
              Cancel
            </Button>
            <Button onClick={handleSaveActivity}>
              <Save className="h-4 w-4 mr-2" />
              Save Activity
            </Button>
          </div>
        </>
      )}

      {step === 'preview' && activity && (
        <>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleBackToCreate}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Edit
            </Button>
            <h2 className="text-2xl font-bold">Preview Activity</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
              {instructions && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <strong>Instructions:</strong> {instructions}
                </div>
              )}

              {renderViewer()}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={handleBackToCreate}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Edit
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
