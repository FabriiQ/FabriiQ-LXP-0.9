'use client';

/**
 * AssessmentCreationPage
 * 
 * This page handles the creation of assessments, with support for both
 * manual creation and AI-assisted generation.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ContentCreationFlow, CreationMethod, ManualCreationParams, AICreationParams } from '../components/ContentCreationFlow';
import { ContentType } from '../components/ContentCreationFlow';
import { useContentStudio } from '../contexts/ContentStudioContext';
import { ActivityPurpose } from '@/server/api/constants';
import { ActivityTypeBridgeProvider } from '../ActivityTypeBridge';

// Define the steps in the assessment creation flow
enum AssessmentCreationStep {
  CLASS_SELECTION = 'CLASS_SELECTION',
  SUBJECT_SELECTION = 'SUBJECT_SELECTION',
  TOPIC_SELECTION = 'TOPIC_SELECTION',
  ASSESSMENT_TYPE_SELECTION = 'ASSESSMENT_TYPE_SELECTION',
  CREATION_METHOD_SELECTION = 'CREATION_METHOD_SELECTION',
  MANUAL_CREATION = 'MANUAL_CREATION',
  AI_PARAMETERS = 'AI_PARAMETERS',
  AI_GENERATION = 'AI_GENERATION',
  AI_CONVERSATION = 'AI_CONVERSATION',
  PREVIEW = 'PREVIEW'
}

export function AssessmentCreationPage() {
  const router = useRouter();
  const { 
    contentType, 
    setContentType,
    subjectId,
    selectedTopicIds,
    activityType,
    activityPurpose,
    classId
  } = useContentStudio();
  
  // Set content type if not already set
  if (!contentType) {
    setContentType(ContentType.ASSESSMENT);
  }
  
  // Local state for the current step
  const [currentStep, setCurrentStep] = useState<AssessmentCreationStep>(AssessmentCreationStep.CLASS_SELECTION);
  
  // Handle back button click
  const handleBack = () => {
    switch (currentStep) {
      case AssessmentCreationStep.CLASS_SELECTION:
        // Go back to content type selection
        router.push('/teacher/content-studio');
        break;
      case AssessmentCreationStep.SUBJECT_SELECTION:
        setCurrentStep(AssessmentCreationStep.CLASS_SELECTION);
        break;
      case AssessmentCreationStep.TOPIC_SELECTION:
        setCurrentStep(AssessmentCreationStep.SUBJECT_SELECTION);
        break;
      case AssessmentCreationStep.ASSESSMENT_TYPE_SELECTION:
        setCurrentStep(AssessmentCreationStep.TOPIC_SELECTION);
        break;
      case AssessmentCreationStep.CREATION_METHOD_SELECTION:
        setCurrentStep(AssessmentCreationStep.ASSESSMENT_TYPE_SELECTION);
        break;
      case AssessmentCreationStep.MANUAL_CREATION:
      case AssessmentCreationStep.AI_PARAMETERS:
        setCurrentStep(AssessmentCreationStep.CREATION_METHOD_SELECTION);
        break;
      case AssessmentCreationStep.AI_GENERATION:
        setCurrentStep(AssessmentCreationStep.AI_PARAMETERS);
        break;
      case AssessmentCreationStep.AI_CONVERSATION:
        setCurrentStep(AssessmentCreationStep.AI_GENERATION);
        break;
      case AssessmentCreationStep.PREVIEW:
        // Go back to either manual creation or AI conversation
        if (currentStep === AssessmentCreationStep.MANUAL_CREATION) {
          setCurrentStep(AssessmentCreationStep.MANUAL_CREATION);
        } else {
          setCurrentStep(AssessmentCreationStep.AI_CONVERSATION);
        }
        break;
      default:
        // Default to going back to content type selection
        router.push('/teacher/content-studio');
    }
  };
  
  // Handle manual creation
  const handleManualCreation = (params: ManualCreationParams) => {
    console.log('Manual creation params:', params);
    setCurrentStep(AssessmentCreationStep.MANUAL_CREATION);
    // Here we would navigate to the appropriate assessment editor
  };
  
  // Handle AI-assisted creation
  const handleAICreation = (params: AICreationParams) => {
    console.log('AI creation params:', params);
    setCurrentStep(AssessmentCreationStep.AI_PARAMETERS);
    // Here we would show the AI parameters form
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case AssessmentCreationStep.CLASS_SELECTION:
        return <div>Class Selection (To be implemented)</div>;
      case AssessmentCreationStep.SUBJECT_SELECTION:
        return <div>Subject Selection (To be implemented)</div>;
      case AssessmentCreationStep.TOPIC_SELECTION:
        return <div>Topic Selection (To be implemented)</div>;
      case AssessmentCreationStep.ASSESSMENT_TYPE_SELECTION:
        return <div>Assessment Type Selection (To be implemented)</div>;
      case AssessmentCreationStep.CREATION_METHOD_SELECTION:
        return (
          <ContentCreationFlow
            contentType={ContentType.ASSESSMENT}
            activityType={activityType || undefined}
            activityPurpose={ActivityPurpose.ASSESSMENT}
            subjectId={subjectId || undefined}
            topicIds={selectedTopicIds.length > 0 ? selectedTopicIds : undefined}
            classId={classId || undefined}
            onManualCreation={handleManualCreation}
            onAICreation={handleAICreation}
          />
        );
      case AssessmentCreationStep.MANUAL_CREATION:
        return <div>Manual Assessment Creation (To be implemented)</div>;
      case AssessmentCreationStep.AI_PARAMETERS:
        return <div>AI Parameters (To be implemented)</div>;
      case AssessmentCreationStep.AI_GENERATION:
        return <div>AI Generation (To be implemented)</div>;
      case AssessmentCreationStep.AI_CONVERSATION:
        return <div>AI Conversation (To be implemented)</div>;
      case AssessmentCreationStep.PREVIEW:
        return <div>Preview (To be implemented)</div>;
      default:
        return <div>Unknown step</div>;
    }
  };
  
  return (
    <ActivityTypeBridgeProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2"
              onClick={handleBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Create Assessment</h1>
          </div>
          
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className={currentStep === AssessmentCreationStep.CLASS_SELECTION ? 'font-bold text-primary' : ''}>Class</span>
              <span className={currentStep === AssessmentCreationStep.SUBJECT_SELECTION ? 'font-bold text-primary' : ''}>Subject</span>
              <span className={currentStep === AssessmentCreationStep.TOPIC_SELECTION ? 'font-bold text-primary' : ''}>Topics</span>
              <span className={currentStep === AssessmentCreationStep.ASSESSMENT_TYPE_SELECTION ? 'font-bold text-primary' : ''}>Assessment Type</span>
              <span className={currentStep === AssessmentCreationStep.CREATION_METHOD_SELECTION ? 'font-bold text-primary' : ''}>Method</span>
              <span className={
                [
                  AssessmentCreationStep.MANUAL_CREATION,
                  AssessmentCreationStep.AI_PARAMETERS,
                  AssessmentCreationStep.AI_GENERATION,
                  AssessmentCreationStep.AI_CONVERSATION
                ].includes(currentStep) ? 'font-bold text-primary' : ''
              }>Create</span>
              <span className={currentStep === AssessmentCreationStep.PREVIEW ? 'font-bold text-primary' : ''}>Preview</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ 
                  width: `${(Object.values(AssessmentCreationStep).indexOf(currentStep) + 1) / 
                  Object.values(AssessmentCreationStep).length * 100}%` 
                }}
              ></div>
            </div>
          </div>
          
          {/* Current step content */}
          <div className="bg-card rounded-lg border p-6">
            {renderStep()}
          </div>
        </div>
      </div>
    </ActivityTypeBridgeProvider>
  );
}
