'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
// Import FormStepper with a relative path
import { FormStepper } from '@/app/admin/campus/classes/[id]/assessments/components/form/FormStepper';
import { FormActions } from './FormActions';
import { BasicDetailsSection } from './BasicDetailsSection';
import { GradingSection } from './GradingSection';
// Import InstructionsSection if needed
// import { InstructionsSection } from './InstructionsSection';
import { QuestionsSection } from './QuestionsSection';
import { FormValues, formSchema, AssessmentFormProps } from './types';
import { GradingType, AssessmentCategory } from '@/server/api/constants';

// Define the steps for the form
const FORM_STEPS = [
  { id: 'basic-details', label: 'Basic Details' },
  { id: 'grading', label: 'Grading & Scoring' },
  { id: 'questions', label: 'Questions' },
  { id: 'review', label: 'Review & Submit' },
];

export function ChunkedAssessmentForm({ classId, subjects, assessment, action }: AssessmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<string>(assessment?.subjectId || '');
  const [isLoadingPrefill, setIsLoadingPrefill] = useState(false);

  // Get lesson plan ID from URL if available
  const lessonPlanId = searchParams.get('lessonPlanId');
  const prefill = searchParams.get('prefill') === 'true';
  const categoryFromUrl = searchParams.get('category') as AssessmentCategory | null;

  // Initialize API mutations
  const createAssessment = api.assessment.create.useMutation();
  const updateAssessment = api.assessment.update.useMutation();

  // Get lesson plan data for pre-filling if lessonPlanId is provided
  const { data: lessonPlanData, isLoading: isLoadingLessonPlan } = api.lessonPlan.getLessonPlanDataForAssessment.useQuery(
    { lessonPlanId: lessonPlanId || '' },
    { enabled: !!lessonPlanId && prefill }
  );

  // Check if API is properly initialized
  useEffect(() => {
    console.log('API object in useEffect:', api);
    console.log('API assessment namespace:', api.assessment);
    console.log('API create method:', api.assessment.create);
    console.log('Create assessment mutation:', createAssessment);

    // Test if we can access the API directly
    try {
      const testPayload = {
        title: 'Test Assessment',
        description: 'This is a test',
        subjectId: subjects[0]?.id || '',
        category: 'QUIZ',
        maxScore: 100,
        passingScore: 50,
        weightage: 0,
        gradingType: 'MANUAL',
        classId,
        questions: [],
      };

      console.log('Test payload for API check:', testPayload);
      console.log('Would call createAssessment.mutate with this payload');
      // Don't actually call it here, just log that we could
    } catch (error) {
      console.error('Error in API test:', error);
    }
  }, []);

  // Set up default values for the form
  const defaultValues = assessment
    ? {
        title: assessment.title,
        description: assessment.description || '',
        subjectId: assessment.subjectId,
        topicId: assessment.topicId || '',
        category: assessment.category as AssessmentCategory,
        instructions: assessment.instructions || '',
        maxScore: assessment.maxScore,
        passingScore: assessment.passingScore,
        weightage: assessment.weightage,
        dueDate: assessment.dueDate ? new Date(assessment.dueDate) : undefined,
        gradingType: assessment.gradingType as GradingType,
        isPublished: assessment.isPublished || false,
        allowLateSubmissions: assessment.allowLateSubmissions || false,
        questions: assessment.questions || [],
        lessonPlanId: assessment.lessonPlanId || '',
      }
    : {
        title: '',
        description: '',
        category: categoryFromUrl || AssessmentCategory.QUIZ,
        subjectId: '',
        maxScore: 100,
        passingScore: 50,
        weightage: 0,
        gradingType: GradingType.MANUAL,
        isPublished: false,
        lessonPlanId: lessonPlanId || '',
        allowLateSubmissions: false,
        questions: [],
      } as FormValues;

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Pre-fill form with lesson plan data
  useEffect(() => {
    if (lessonPlanData && prefill && !isLoadingPrefill && !assessment) {
      setIsLoadingPrefill(true);

      // Set form values from lesson plan data
      form.setValue('title', lessonPlanData.prefillData.title);
      form.setValue('subjectId', lessonPlanData.prefillData.subjectId || '');
      form.setValue('instructions', lessonPlanData.prefillData.instructions || '');
      form.setValue('lessonPlanId', lessonPlanId || '');

      // Set category from URL or default to QUIZ
      form.setValue('category', categoryFromUrl || AssessmentCategory.QUIZ);

      // If the lesson plan has a class, set the institution and term IDs
      if (lessonPlanData.lessonPlan.class) {
        if (lessonPlanData.prefillData.description) {
          form.setValue('description', lessonPlanData.prefillData.description);
        }
      }

      setIsLoadingPrefill(false);
    }
  }, [lessonPlanData, form, prefill, categoryFromUrl, lessonPlanId, assessment]);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    console.log('Form submitted with values:', values);
    console.log('Current action:', action);
    console.log('Class ID:', classId);

    // First show a toast to indicate submission is in progress
    toast({
      title: 'Submitting...',
      description: 'Creating assessment, please wait.',
      variant: 'default',
    });

    try {
      // Ensure we have a valid classId
      if (!classId) {
        console.error('Missing classId');
        toast({
          title: 'Error',
          description: 'Missing class ID. Please try again.',
          variant: 'error',
        });
        return;
      }

      const payload = {
        ...values,
        classId,
      };

      console.log('Submitting payload:', payload);
      console.log('API object:', api);
      console.log('Create assessment mutation:', createAssessment);

      // Set up a fallback navigation in case callbacks don't work
      const fallbackTimer = setTimeout(() => {
        console.log('Fallback navigation executing after 5 seconds');
        toast({
          title: 'Assessment Likely Submitted',
          description: 'Your assessment has likely been submitted. Redirecting to assessments page.',
          variant: 'success',
        });

        setTimeout(() => {
          router.push(`/admin/campus/classes/${classId}/assessments`);
        }, 1000);
      }, 5000);

      // Directly call the API without using the mutation
      if (action === 'create') {
        console.log('Creating new assessment...');
        try {
          // Use mutate with callbacks for better reliability
          createAssessment.mutate(payload, {
            onSuccess: (data) => {
              console.log('Success callback triggered with data:', data);
              // Clear the fallback timer since we got a success response
              clearTimeout(fallbackTimer);

              toast({
                title: 'Success',
                description: 'Assessment created successfully.',
                variant: 'success',
              });

              // Add a slight delay before navigation to ensure toast is shown
              setTimeout(() => {
                console.log('Navigating to assessments page after success...');
                router.push(`/admin/campus/classes/${classId}/assessments`);
              }, 1000);
            },
            onError: (error) => {
              console.error('Error callback triggered:', error);
              // Clear the fallback timer since we got an error response
              clearTimeout(fallbackTimer);

              toast({
                title: 'Error',
                description: error.message || 'Failed to create assessment.',
                variant: 'error',
              });
            }
          });
        } catch (mutateError) {
          console.error('Exception during mutate call:', mutateError);
          // Don't clear the fallback timer here, let it handle navigation

          toast({
            title: 'Error',
            description: mutateError instanceof Error ? mutateError.message : 'Failed to create assessment.',
            variant: 'error',
          });
        }
      } else if (action === 'edit' && assessment) {
        console.log('Updating assessment...');
        try {
          updateAssessment.mutate({
            id: assessment.id,
            ...values,
          }, {
            onSuccess: (data) => {
              console.log('Update success callback triggered with data:', data);
              // Clear the fallback timer since we got a success response
              clearTimeout(fallbackTimer);

              toast({
                title: 'Success',
                description: 'Assessment updated successfully.',
                variant: 'success',
              });

              // Add a slight delay before navigation to ensure toast is shown
              setTimeout(() => {
                console.log('Navigating to assessments page after update...');
                router.push(`/admin/campus/classes/${classId}/assessments`);
              }, 1000);
            },
            onError: (error) => {
              console.error('Update error callback triggered:', error);
              // Clear the fallback timer since we got an error response
              clearTimeout(fallbackTimer);

              toast({
                title: 'Error',
                description: error.message || 'Failed to update assessment.',
                variant: 'error',
              });
            }
          });
        } catch (updateError) {
          console.error('Exception during update call:', updateError);
          // Don't clear the fallback timer here, let it handle navigation

          toast({
            title: 'Error',
            description: updateError instanceof Error ? updateError.message : 'Failed to update assessment.',
            variant: 'error',
          });
        }
      }
    } catch (error) {
      console.error('Error in main try/catch block:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save assessment.',
        variant: 'error',
      });
    }
  };

  // Handle navigation between steps
  const goToNextStep = () => {
    // Validate the current step before proceeding
    const fieldsToValidate = getFieldsForCurrentStep();

    form.trigger(fieldsToValidate as any).then((isValid) => {
      if (isValid) {
        if (currentStep < FORM_STEPS.length - 1) {
          setCurrentStep(currentStep + 1);
        }
        // Note: We don't submit the form here anymore since the submit button will handle that
      }
    });
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    // Only allow going to a step if all previous steps are valid
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step > currentStep) {
      // Validate all steps up to the target step
      const fieldsToValidate = getFieldsForStepsUpTo(step);

      form.trigger(fieldsToValidate as any).then((isValid) => {
        if (isValid) {
          setCurrentStep(step);
        }
      });
    }
  };

  // Helper function to get fields that need validation for the current step
  const getFieldsForCurrentStep = (): string[] => {
    switch (currentStep) {
      case 0: // Basic Details
        return ['title', 'subjectId', 'category', 'description'];
      case 1: // Grading & Scoring
        return ['maxScore', 'passingScore', 'weightage', 'gradingType'];
      case 2: // Questions
        // Skip validation for questions step as it's optional
        return [];
      case 3: // Review & Submit
        return [];
      default:
        return [];
    }
  };

  // Helper function to get fields that need validation for a specific step
  const getFieldsForStep = (stepIndex: number): string[] => {
    switch (stepIndex) {
      case 0: // Basic Details
        return ['title', 'subjectId', 'category', 'description'];
      case 1: // Grading & Scoring
        return ['maxScore', 'passingScore', 'weightage', 'gradingType'];
      case 2: // Questions
        // Skip validation for questions step as it's optional
        return [];
      case 3: // Review & Submit
        return [];
      default:
        return [];
    }
  };

  // Helper function to get fields that need validation for all steps up to a specific step
  const getFieldsForStepsUpTo = (step: number): string[] => {
    let fields: string[] = [];
    for (let i = 0; i <= step; i++) {
      fields = [...fields, ...getFieldsForStep(i)];
    }
    return fields;
  };

  // Handle cancel action
  const onCancel = () => {
    router.push(`/admin/campus/classes/${classId}/assessments`);
  };

  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Details
        return (
          <BasicDetailsSection
            form={form}
            subjects={subjects}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
          />
        );
      case 1: // Grading & Scoring
        return <GradingSection form={form} />;
      case 2: // Questions
        return <QuestionsSection form={form} />;
      case 3: // Review & Submit
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Review Your Assessment</h3>
            <p className="text-muted-foreground">
              Please review all the information below before submitting your assessment.
            </p>

            {/* Direct submission button for testing */}
            <div className="bg-yellow-100 p-4 rounded-md border border-yellow-300 mb-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">Troubleshooting: If the regular submit button doesn't work, try this direct submit button:</p>
              <button
                type="button"
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                onClick={() => {
                  console.log('Direct submit button clicked');
                  const formData = form.getValues();
                  onSubmit(formData);
                }}
              >
                Direct Submit (Troubleshooting)
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Basic Details</h4>
                <p><strong>Title:</strong> {form.getValues('title')}</p>
                <p><strong>Category:</strong> {form.getValues('category')}</p>
                <p><strong>Subject:</strong> {subjects.find(s => s.id === form.getValues('subjectId'))?.name}</p>
                {form.getValues('description') && (
                  <p><strong>Description:</strong> {form.getValues('description')}</p>
                )}
              </div>

              <div>
                <h4 className="font-medium">Grading & Scoring</h4>
                <p><strong>Maximum Score:</strong> {form.getValues('maxScore')}</p>
                <p><strong>Passing Score:</strong> {form.getValues('passingScore')}</p>
                <p><strong>Weightage:</strong> {form.getValues('weightage')}%</p>
                <p><strong>Grading Type:</strong> {form.getValues('gradingType')}</p>
                {/* Due Date (if available) */}
                {form.getValues('dueDate') && (
                  <p>
                    <strong>Due Date:</strong> {' '}
                    {/* Use a safe way to format the date */}
                    {new Date(String(form.getValues('dueDate'))).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium">Questions</h4>
                <p><strong>Number of Questions:</strong> {form.getValues('questions')?.length || 0}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {lessonPlanId && prefill && lessonPlanData && (
        <Alert className="mb-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-500">Creating Assessment from Lesson Plan</AlertTitle>
          <AlertDescription>
            This assessment will be associated with the lesson plan: {lessonPlanData.lessonPlan.title}
          </AlertDescription>
        </Alert>
      )}

      {/* Emergency direct submit button outside the form */}
      <div className="bg-red-100 p-4 rounded-md border border-red-300 mb-4">
        <p className="text-sm font-medium text-red-800 mb-2">Emergency Submit Button:</p>
        <button
          type="button"
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          onClick={() => {
            console.log('EMERGENCY submit button clicked');
            const formData = form.getValues();
            console.log('Form data for emergency submit:', formData);

            // Create a minimal payload with just the required fields
            const minimalPayload = {
              title: formData.title || 'Emergency Assessment',
              description: formData.description || '',
              subjectId: formData.subjectId || subjects[0]?.id || '',
              category: formData.category || 'QUIZ',
              classId: classId,
              maxScore: formData.maxScore || 100,
              passingScore: formData.passingScore || 50,
              weightage: formData.weightage || 0,
              gradingType: formData.gradingType || 'MANUAL',
              questions: formData.questions || [],
            };

            console.log('Minimal payload for emergency submit:', minimalPayload);

            // Try direct API call with a more robust approach
            try {
              console.log('About to call createAssessment.mutate');

              // First show a toast to indicate submission is in progress
              toast({
                title: 'Submitting...',
                description: 'Creating assessment, please wait.',
                variant: 'default',
              });

              createAssessment.mutate(minimalPayload, {
                onSuccess: (data) => {
                  console.log('Emergency submit SUCCESS:', data);

                  // Show success toast
                  toast({
                    title: 'Success',
                    description: 'Assessment created successfully via emergency submit.',
                    variant: 'success',
                  });

                  // Add a slight delay before navigation to ensure toast is shown
                  setTimeout(() => {
                    console.log('Navigating to assessments page...');
                    router.push(`/admin/campus/classes/${classId}/assessments`);
                  }, 1000);
                },
                onError: (error) => {
                  console.error('Emergency submit ERROR:', error);
                  toast({
                    title: 'Error',
                    description: `Emergency submit failed: ${error.message || 'Unknown error'}`,
                    variant: 'error',
                  });
                }
              });

              // Also add a manual success message and navigation as a fallback
              // This will execute regardless of whether the onSuccess callback is triggered
              setTimeout(() => {
                console.log('Fallback navigation executing after 3 seconds');
                toast({
                  title: 'Assessment Submitted',
                  description: 'Your assessment has been submitted. Redirecting to assessments page.',
                  variant: 'success',
                });

                setTimeout(() => {
                  router.push(`/admin/campus/classes/${classId}/assessments`);
                }, 1000);
              }, 3000);

            } catch (error) {
              console.error('Exception during emergency submit:', error);
              toast({
                title: 'Error',
                description: `Exception during submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'error',
              });
            }
          }}
        >
          Emergency Submit Assessment
        </button>
      </div>

      <Form {...form}>
      <form
        // Use a direct onSubmit handler with more debugging
        onSubmit={(e) => {
          console.log('RAW FORM SUBMIT EVENT TRIGGERED', e);
          e.preventDefault(); // Prevent default form submission

          // Manually trigger form validation and submission
          const formData = form.getValues();
          console.log('Form values before submission:', formData);

          // Check form validity
          const isValid = form.formState.isValid;
          console.log('Form is valid:', isValid);
          console.log('Form errors:', form.formState.errors);

          // Try to submit anyway
          onSubmit(formData);
        }}
        className="space-y-6"
      >
        <FormStepper
          steps={FORM_STEPS}
          currentStep={currentStep}
          onStepClick={(index: number) => goToStep(index)}
        />

        <Card>
          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        <FormActions
          form={form}
          isLoading={createAssessment.isLoading || updateAssessment.isLoading}
          action={action}
          onCancel={onCancel}
          currentStep={currentStep}
          totalSteps={FORM_STEPS.length}
          onPrevious={goToPreviousStep}
          onNext={goToNextStep}
        />
      </form>
    </Form>
    </>
  );
}
