'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';
import { AssessmentCategory, GradingType, SystemStatus } from '@/server/api/constants';


// Step components
import { SubjectSelector } from './dialog-steps/SubjectSelector';
import { TopicSelector } from './dialog-steps/TopicSelector';
import { LearningOutcomeSelector } from './dialog-steps/LearningOutcomeSelector';
import { AssessmentTypeSelector } from './dialog-steps/AssessmentTypeSelector';
import { RubricSelector } from './dialog-steps/RubricSelector';
import { AssessmentDetailsForm } from './dialog-steps/AssessmentDetailsForm';
import { BloomsDistributionForm } from './dialog-steps/BloomsDistributionForm';
import { ReviewStep } from './dialog-steps/ReviewStep';

// Define the steps in the dialog - removed class step since we're already in a class
const STEPS = [
  'subject',
  'topic',
  'learningOutcomes',
  'assessmentType',
  'rubric',
  'bloomsDistribution',
  'details',
  'review'
];

interface EnhancedAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string;
  assessmentId?: string; // For editing mode
  onSuccess?: (assessmentId: string) => void;
}

export function EnhancedAssessmentDialog({
  open,
  onOpenChange,
  classId: initialClassId,
  assessmentId,
  onSuccess
}: EnhancedAssessmentDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();

  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [classId, setClassId] = useState(initialClassId || '');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState(''); // Keep for backward compatibility
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]); // New state for multiple topics
  const [selectedLearningOutcomes, setSelectedLearningOutcomes] = useState<string[]>([]);
  const [assessmentType, setAssessmentType] = useState<AssessmentCategory>(AssessmentCategory.QUIZ);
  const [selectedRubricId, setSelectedRubricId] = useState('');
  const [bloomsDistribution, setBloomsDistribution] = useState<Record<string, number>>({});
  const [assessmentDetails, setAssessmentDetails] = useState({
    title: '',
    description: '',
    instructions: '',
    maxScore: 100,
    passingScore: 60,
    weightage: 10,
    gradingType: GradingType.MANUAL,
    dueDate: undefined as Date | undefined
  });
  const [isCreating, setIsCreating] = useState(false);
  const isEditMode = !!assessmentId;

  // Fetch assessment data for editing
  const { data: assessmentData } = api.assessment.getById.useQuery(
    { id: assessmentId! },
    { enabled: !!assessmentId }
  );

  // Auto-set classId if provided and skip class selection
  useEffect(() => {
    if (initialClassId && !classId) {
      setClassId(initialClassId);
    }
  }, [initialClassId, classId]);

  // Populate form data when editing
  useEffect(() => {
    if (assessmentData && isEditMode) {
      setSubjectId(assessmentData.subjectId || '');
      setTopicId(assessmentData.topicId || '');
      setSelectedTopicIds(assessmentData.topicIds || (assessmentData.topicId ? [assessmentData.topicId] : []));
      setSelectedLearningOutcomes(assessmentData.learningOutcomeIds || []);
      setAssessmentType(assessmentData.category || AssessmentCategory.QUIZ);
      setSelectedRubricId(assessmentData.rubricId || '');
      setBloomsDistribution(assessmentData.bloomsDistribution || {});
      setAssessmentDetails({
        title: assessmentData.title || '',
        description: assessmentData.description || '',
        instructions: assessmentData.instructions || '',
        maxScore: assessmentData.maxScore || 100,
        passingScore: assessmentData.passingScore || 60,
        weightage: assessmentData.weightage || 10,
        gradingType: assessmentData.gradingType || GradingType.MANUAL,
        dueDate: assessmentData.dueDate ? new Date(assessmentData.dueDate) : undefined
      });
    }
  }, [assessmentData, isEditMode]);

  // Update grading type based on rubric selection
  useEffect(() => {
    setAssessmentDetails(prev => ({
      ...prev,
      gradingType: selectedRubricId ? GradingType.MANUAL : GradingType.MANUAL // Both are manual, but we'll differentiate by rubricId presence
    }));
  }, [selectedRubricId]);

  // Get teacher ID
  const [teacherId, setTeacherId] = useState<string | null>(null);

  api.user.getById.useQuery(
    session?.user?.id || "",
    {
      enabled: !!session?.user?.id,
      onSuccess: (data) => {
        if (data?.teacherProfile?.id) {
          setTeacherId(data.teacherProfile.id);
        }
      }
    }
  );

  // Fetch data based on selections
  const { data: subjects } = api.subject.getAllSubjects.useQuery();
  const { data: topics } = api.subject.getTopics.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );
  const { data: learningOutcomes } = api.learningOutcome.getByTopic.useQuery(
    { topicId },
    { enabled: !!topicId }
  );

  // Create assessment mutation
  const createAssessmentMutation = api.assessment.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Assessment created successfully with learning outcomes and rubric integration.",
        variant: "success",
      });
      onSuccess?.(data.id);
      onOpenChange(false);
      resetDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create assessment.",
        variant: "error",
      });
      setIsCreating(false);
    },
  });

  // Update assessment mutation
  const updateAssessmentMutation = api.assessment.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Assessment updated successfully with learning outcomes and rubric integration.",
        variant: "success",
      });
      onSuccess?.(data.id);
      onOpenChange(false);
      resetDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update assessment.",
        variant: "error",
      });
      setIsCreating(false);
    },
  });

  // Reset dialog state
  const resetDialog = () => {
    setCurrentStep(0);
    setClassId(initialClassId || '');
    setSubjectId('');
    setTopicId('');
    setSelectedTopicIds([]);
    setSelectedLearningOutcomes([]);
    setAssessmentType(AssessmentCategory.QUIZ);
    setSelectedRubricId('');
    setBloomsDistribution({});
    setAssessmentDetails({
      title: '',
      description: '',
      instructions: '',
      maxScore: 100,
      passingScore: 60,
      weightage: 10,
      gradingType: GradingType.MANUAL,
      dueDate: undefined
    });
    setIsCreating(false);
  };

  // Get missing fields for validation
  const getMissingFields = () => {
    const missing: string[] = [];

    if (!subjectId) missing.push('Subject');
    if (selectedTopicIds.length === 0 && !topicId) missing.push('Topic');
    if (selectedLearningOutcomes.length === 0) missing.push('Learning Outcomes');
    if (!assessmentType) missing.push('Assessment Type');
    if (!assessmentDetails.title) missing.push('Assessment Title');
    if (!assessmentDetails.maxScore || assessmentDetails.maxScore <= 0) missing.push('Maximum Score');

    return missing;
  };

  // Navigation functions
  const canGoNext = useMemo(() => {
    switch (STEPS[currentStep]) {
      case 'subject':
        return !!subjectId;
      case 'topic':
        return selectedTopicIds.length > 0 || !!topicId; // Support both single and multiple selection
      case 'learningOutcomes':
        return selectedLearningOutcomes.length > 0;
      case 'assessmentType':
        return !!assessmentType;
      case 'rubric':
        return true; // Optional step
      case 'bloomsDistribution':
        return true; // Optional step
      case 'details':
        return !!assessmentDetails.title && !!assessmentDetails.maxScore && assessmentDetails.maxScore > 0;
      case 'review':
        const missingFields = getMissingFields();
        const canCreate = missingFields.length === 0;
        console.log('Review step validation:', {
          title: !!assessmentDetails.title,
          subjectId: !!subjectId,
          topics: selectedTopicIds.length > 0 || !!topicId,
          learningOutcomes: selectedLearningOutcomes.length > 0,
          assessmentType: !!assessmentType,
          maxScore: !!assessmentDetails.maxScore && assessmentDetails.maxScore > 0,
          missingFields,
          canCreate
        });
        return canCreate;
      default:
        return false;
    }
  }, [currentStep, subjectId, topicId, selectedTopicIds, selectedLearningOutcomes, assessmentType, assessmentDetails.title, assessmentDetails.maxScore]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateAssessment = async () => {
    if (!teacherId) {
      toast({
        title: "Error",
        description: "Teacher profile not found.",
        variant: "error",
      });
      return;
    }

    // Validate all required fields before creating/updating
    const missingFields = getMissingFields();
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please complete the following fields: ${missingFields.join(', ')}`,
        variant: "error",
      });
      setIsCreating(false);
      return;
    }

    setIsCreating(true);

    try {
      const assessmentPayload = {
        title: assessmentDetails.title,
        description: assessmentDetails.description,
        instructions: assessmentDetails.instructions,
        category: assessmentType,
        gradingType: assessmentDetails.gradingType,
        maxScore: assessmentDetails.maxScore,
        passingScore: assessmentDetails.passingScore,
        weightage: assessmentDetails.weightage,
        dueDate: assessmentDetails.dueDate,
        classId,
        subjectId,
        topicId: selectedTopicIds.length > 0 ? selectedTopicIds[0] : topicId, // Use first selected topic as primary
        topicIds: selectedTopicIds.length > 0 ? selectedTopicIds : undefined, // Pass all selected topics
        rubricId: selectedRubricId || undefined,
        learningOutcomeIds: selectedLearningOutcomes,
        bloomsDistribution: Object.keys(bloomsDistribution).length > 0 ? bloomsDistribution : undefined,
        status: SystemStatus.ACTIVE
      };

      if (isEditMode && assessmentId) {
        console.log('Updating assessment with data:', assessmentPayload);
        await updateAssessmentMutation.mutateAsync({
          id: assessmentId,
          ...assessmentPayload
        });
      } else {
        console.log('Creating assessment with data:', assessmentPayload);
        await createAssessmentMutation.mutateAsync(assessmentPayload);
      }
    } catch (error) {
      // Error handled by mutation
      setIsCreating(false);
    }
  };

  // Get step title and description
  const getStepInfo = () => {
    const actionText = isEditMode ? 'Edit' : 'Create';
    switch (STEPS[currentStep]) {
      case 'subject':
        return { title: 'Select Subject *', description: 'Choose the subject for this assessment. This field is required.' };
      case 'topic':
        return { title: 'Select Topic *', description: 'Choose the topic for this assessment. This field is required.' };
      case 'learningOutcomes':
        return { title: 'Learning Outcomes *', description: 'Select the learning outcomes this assessment will measure. At least one is required.' };
      case 'assessmentType':
        return { title: 'Assessment Type *', description: 'Choose the type of assessment you want to create. This field is required.' };
      case 'rubric':
        return { title: 'Grading Method', description: 'Choose between simple scoring or detailed rubric-based grading. (Optional)' };
      case 'bloomsDistribution':
        return { title: "Bloom's Distribution", description: 'Set the cognitive level distribution for this assessment. (Optional)' };
      case 'details':
        return { title: 'Assessment Details *', description: 'Enter the basic details for your assessment. Title and maximum score are required.' };
      case 'review':
        return { title: `Review & ${actionText}`, description: `Review your assessment configuration and ${actionText.toLowerCase()} it.` };
      default:
        return { title: `${actionText} Assessment`, description: `${actionText} a new assessment with learning outcomes integration.` };
    }
  };

  const stepInfo = getStepInfo();

  // Render step content
  const renderStepContent = () => {
    switch (STEPS[currentStep]) {
      case 'subject':
        return (
          <SubjectSelector
            subjects={subjects || []}
            selectedSubjectId={subjectId}
            onSelect={setSubjectId}
            isLoading={!subjects}
          />
        );
      case 'topic':
        return (
          <TopicSelector
            subjectId={subjectId}
            selectedTopicId={topicId}
            selectedTopicIds={selectedTopicIds}
            onSelect={(id) => {
              setTopicId(id);
              // Also update multiple selection for backward compatibility
              if (!selectedTopicIds.includes(id)) {
                setSelectedTopicIds([id]);
              }
            }}
            onSelectMultiple={setSelectedTopicIds}
            allowMultiple={true}
            isLoading={!!subjectId && !topics}
          />
        );
      case 'learningOutcomes':
        return (
          <LearningOutcomeSelector
            subjectId={subjectId}
            topicId={topicId}
            topicIds={selectedTopicIds}
            selectedOutcomes={selectedLearningOutcomes}
            onSelect={setSelectedLearningOutcomes}
            isLoading={!!topicId && !learningOutcomes}
          />
        );
      case 'assessmentType':
        return (
          <AssessmentTypeSelector
            selectedType={assessmentType}
            onSelect={setAssessmentType}
          />
        );
      case 'rubric':
        return (
          <RubricSelector
            subjectId={subjectId}
            topicId={topicId}
            selectedRubricId={selectedRubricId}
            selectedLearningOutcomes={selectedLearningOutcomes}
            onSelect={setSelectedRubricId}
            isLoading={false} // Let RubricSelector handle its own loading
          />
        );
      case 'bloomsDistribution':
        return (
          <BloomsDistributionForm
            distribution={bloomsDistribution}
            onChange={setBloomsDistribution}
            learningOutcomes={learningOutcomes || []}
            selectedOutcomes={selectedLearningOutcomes}
          />
        );
      case 'details':
        return (
          <AssessmentDetailsForm
            details={assessmentDetails}
            onChange={(details) => setAssessmentDetails({
              ...details,
              dueDate: details.dueDate || undefined
            })}
            assessmentType={assessmentType}
          />
        );
      case 'review':
        return (
          <ReviewStep
            classId={classId}
            subjectId={subjectId}
            topicId={topicId}
            selectedLearningOutcomes={selectedLearningOutcomes}
            assessmentType={assessmentType}
            selectedRubricId={selectedRubricId}
            bloomsDistribution={bloomsDistribution}
            assessmentDetails={assessmentDetails}
            missingFields={getMissingFields()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        aria-describedby="assessment-dialog-description"
      >
        {!isCreating && (
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}

        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {stepInfo.title}
              </DialogTitle>
              <DialogDescription id="assessment-dialog-description" className="mt-1">
                {stepInfo.description}
              </DialogDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isCreating}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep === STEPS.length - 1 ? (
                <Button
                  onClick={handleCreateAssessment}
                  disabled={!canGoNext || isCreating}
                  className="flex items-center"
                >
                  {isCreating ? (
                    <>{isEditMode ? 'Updating...' : 'Creating...'}</>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Assessment' : 'Create Assessment'}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext || isCreating}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
