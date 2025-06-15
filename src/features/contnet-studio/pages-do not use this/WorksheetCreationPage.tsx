'use client';

/**
 * WorksheetCreationPage
 * 
 * This page handles the creation of worksheets, with support for both
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

// Define the steps in the worksheet creation flow
enum WorksheetCreationStep {
  CLASS_SELECTION = 'CLASS_SELECTION',
  SUBJECT_SELECTION = 'SUBJECT_SELECTION',
  TOPIC_SELECTION = 'TOPIC_SELECTION',
  WORKSHEET_TYPE_SELECTION = 'WORKSHEET_TYPE_SELECTION',
  CREATION_METHOD_SELECTION = 'CREATION_METHOD_SELECTION',
  MANUAL_CREATION = 'MANUAL_CREATION',
  AI_PARAMETERS = 'AI_PARAMETERS',
  AI_GENERATION = 'AI_GENERATION',
  AI_CONVERSATION = 'AI_CONVERSATION',
  PREVIEW = 'PREVIEW',
  PRINT_OPTIONS = 'PRINT_OPTIONS'
}

export function WorksheetCreationPage() {
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
    setContentType(ContentType.WORKSHEET);
  }
  
  // Local state for the current step
  const [currentStep, setCurrentStep] = useState<WorksheetCreationStep>(WorksheetCreationStep.CLASS_SELECTION);
  
  // Handle back button click
  const handleBack = () => {
    switch (currentStep) {
      case WorksheetCreationStep.CLASS_SELECTION:
        // Go back to content type selection
        router.push('/teacher/content-studio');
        break;
      case WorksheetCreationStep.SUBJECT_SELECTION:
        setCurrentStep(WorksheetCreationStep.CLASS_SELECTION);
        break;
      case WorksheetCreationStep.TOPIC_SELECTION:
        setCurrentStep(WorksheetCreationStep.SUBJECT_SELECTION);
        break;
      case WorksheetCreationStep.WORKSHEET_TYPE_SELECTION:
        setCurrentStep(WorksheetCreationStep.TOPIC_SELECTION);
        break;
      case WorksheetCreationStep.CREATION_METHOD_SELECTION:
        setCurrentStep(WorksheetCreationStep.WORKSHEET_TYPE_SELECTION);
        break;
      case WorksheetCreationStep.MANUAL_CREATION:
      case WorksheetCreationStep.AI_PARAMETERS:
        setCurrentStep(WorksheetCreationStep.CREATION_METHOD_SELECTION);
        break;
      case WorksheetCreationStep.AI_GENERATION:
        setCurrentStep(WorksheetCreationStep.AI_PARAMETERS);
        break;
      case WorksheetCreationStep.AI_CONVERSATION:
        setCurrentStep(WorksheetCreationStep.AI_GENERATION);
        break;
      case WorksheetCreationStep.PREVIEW:
        // Go back to either manual creation or AI conversation
        if (currentStep === WorksheetCreationStep.MANUAL_CREATION) {
          setCurrentStep(WorksheetCreationStep.MANUAL_CREATION);
        } else {
          setCurrentStep(WorksheetCreationStep.AI_CONVERSATION);
        }
        break;
      case WorksheetCreationStep.PRINT_OPTIONS:
        setCurrentStep(WorksheetCreationStep.PREVIEW);
        break;
      default:
        // Default to going back to content type selection
        router.push('/teacher/content-studio');
    }
  };
  
  // Handle manual creation
  const handleManualCreation = (params: ManualCreationParams) => {
    console.log('Manual creation params:', params);
    setCurrentStep(WorksheetCreationStep.MANUAL_CREATION);
    // Here we would navigate to the appropriate worksheet editor
  };
  
  // Handle AI-assisted creation
  const handleAICreation = (params: AICreationParams) => {
    console.log('AI creation params:', params);
    setCurrentStep(WorksheetCreationStep.AI_PARAMETERS);
    // Here we would show the AI parameters form
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case WorksheetCreationStep.CLASS_SELECTION:
        return <div>Class Selection (To be implemented)</div>;
      case WorksheetCreationStep.SUBJECT_SELECTION:
        return <div>Subject Selection (To be implemented)</div>;
      case WorksheetCreationStep.TOPIC_SELECTION:
        return <div>Topic Selection (To be implemented)</div>;
      case WorksheetCreationStep.WORKSHEET_TYPE_SELECTION:
        return <div>Worksheet Type Selection (To be implemented)</div>;
      case WorksheetCreationStep.CREATION_METHOD_SELECTION:
        return (
          <ContentCreationFlow
            contentType={ContentType.WORKSHEET}
            activityType={activityType || undefined}
            activityPurpose={ActivityPurpose.ASSESSMENT}
            subjectId={subjectId || undefined}
            topicIds={selectedTopicIds.length > 0 ? selectedTopicIds : undefined}
            classId={classId || undefined}
            onManualCreation={handleManualCreation}
            onAICreation={handleAICreation}
          />
        );
      case WorksheetCreationStep.MANUAL_CREATION:
        return <div>Manual Worksheet Creation (To be implemented)</div>;
      case WorksheetCreationStep.AI_PARAMETERS:
        return <div>AI Parameters (To be implemented)</div>;
      case WorksheetCreationStep.AI_GENERATION:
        return <div>AI Generation (To be implemented)</div>;
      case WorksheetCreationStep.AI_CONVERSATION:
        return <div>AI Conversation (To be implemented)</div>;
      case WorksheetCreationStep.PREVIEW:
        return <div>Preview (To be implemented)</div>;
      case WorksheetCreationStep.PRINT_OPTIONS:
        return <div>Print Options (To be implemented)</div>;
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
            <h1 className="text-2xl font-bold">Create Worksheet</h1>
          </div>
          
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className={currentStep === WorksheetCreationStep.CLASS_SELECTION ? 'font-bold text-primary' : ''}>Class</span>
              <span className={currentStep === WorksheetCreationStep.SUBJECT_SELECTION ? 'font-bold text-primary' : ''}>Subject</span>
              <span className={currentStep === WorksheetCreationStep.TOPIC_SELECTION ? 'font-bold text-primary' : ''}>Topics</span>
              <span className={currentStep === WorksheetCreationStep.WORKSHEET_TYPE_SELECTION ? 'font-bold text-primary' : ''}>Worksheet Type</span>
              <span className={currentStep === WorksheetCreationStep.CREATION_METHOD_SELECTION ? 'font-bold text-primary' : ''}>Method</span>
              <span className={
                [
                  WorksheetCreationStep.MANUAL_CREATION,
                  WorksheetCreationStep.AI_PARAMETERS,
                  WorksheetCreationStep.AI_GENERATION,
                  WorksheetCreationStep.AI_CONVERSATION
                ].includes(currentStep) ? 'font-bold text-primary' : ''
              }>Create</span>
              <span className={currentStep === WorksheetCreationStep.PREVIEW ? 'font-bold text-primary' : ''}>Preview</span>
              <span className={currentStep === WorksheetCreationStep.PRINT_OPTIONS ? 'font-bold text-primary' : ''}>Print</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ 
                  width: `${(Object.values(WorksheetCreationStep).indexOf(currentStep) + 1) / 
                  Object.values(WorksheetCreationStep).length * 100}%` 
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
