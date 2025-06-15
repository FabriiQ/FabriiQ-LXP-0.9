/**
 * Bloom's Taxonomy Grading Components Usage Examples
 * 
 * This file provides usage examples for the grading components in the Bloom's Taxonomy feature.
 * These examples demonstrate how to use the components in different contexts.
 * 
 * Note: This file is for documentation purposes only and is not meant to be imported or used directly.
 */

import React, { useState } from 'react';
import { api } from '@/trpc/react';
import {
  BloomsTaxonomyLevel,
  RubricType
} from '../types';
import {
  GradableContentType,
  SubmissionStatus,
  GradingFormValues,
  BatchGradingEntry
} from '../types/grading';
import {
  RubricGrading,
  CognitiveGrading,
  GradingInterface,
  GradingForm,
  FeedbackGenerator,
  BatchGrading,
  GradingResult,
  BloomsLevelFeedback
} from '../components/grading';

/**
 * Example 1: Using GradingInterface for Assessment Grading
 */
export function AssessmentGradingExample() {
  const [submissionId, setSubmissionId] = useState<string>('submission-1');
  
  // Fetch grading context
  const { data: gradingContext, isLoading } = api.bloomGrading.getGradingContext.useQuery({
    submissionId,
    contentType: GradableContentType.ASSESSMENT
  });
  
  // Submit grades
  const submitGrades = api.bloomGrading.submitGrades.useMutation();
  
  // Handle submit
  const handleSubmit = async (values: GradingFormValues) => {
    try {
      await submitGrades.mutateAsync({
        submissionId,
        contentType: GradableContentType.ASSESSMENT,
        score: values.score,
        feedback: values.feedback,
        bloomsLevelScores: values.bloomsLevelScores,
        criteriaResults: values.criteriaResults
      });
      
      // Show success message or redirect
      console.log('Grades submitted successfully');
    } catch (error) {
      // Handle error
      console.error('Error submitting grades', error);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    // Navigate back or close modal
    console.log('Grading cancelled');
  };
  
  if (isLoading || !gradingContext) {
    return <div>Loading...</div>;
  }
  
  return (
    <GradingInterface
      gradingContext={gradingContext}
      contentType={GradableContentType.ASSESSMENT}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      showRubricGrading={true}
      showCognitiveGrading={true}
      showSimpleGrading={true}
    />
  );
}

/**
 * Example 2: Using BatchGrading for Class Assessments
 */
export function BatchGradingExample() {
  const [classId, setClassId] = useState<string>('class-1');
  const [assessmentId, setAssessmentId] = useState<string>('assessment-1');
  
  // Fetch batch grading entries
  const { data, isLoading } = api.bloomGrading.getBatchGradingEntries.useQuery({
    classId,
    contentType: GradableContentType.ASSESSMENT,
    contentId: assessmentId
  });
  
  // Submit batch grades
  const submitBatchGrades = api.bloomGrading.submitBatchGrades.useMutation();
  
  // Handle grade submit
  const handleGradeSubmit = async (entries: BatchGradingEntry[]) => {
    try {
      await submitBatchGrades.mutateAsync({
        entries: entries.map(entry => ({
          submissionId: entry.submissionId,
          score: entry.score,
          feedback: entry.feedback || '',
          status: entry.status
        }))
      });
      
      // Show success message
      console.log('Batch grades submitted successfully');
    } catch (error) {
      // Handle error
      console.error('Error submitting batch grades', error);
    }
  };
  
  // Handle view submission
  const handleViewSubmission = (submissionId: string) => {
    // Navigate to submission view
    console.log('Viewing submission', submissionId);
  };
  
  // Handle edit grading
  const handleEditGrading = (submissionId: string) => {
    // Navigate to grading interface
    console.log('Editing grading for submission', submissionId);
  };
  
  if (isLoading || !data) {
    return <div>Loading...</div>;
  }
  
  return (
    <BatchGrading
      entries={data.entries}
      contentType={GradableContentType.ASSESSMENT}
      onGradeSubmit={handleGradeSubmit}
      onViewSubmission={handleViewSubmission}
      onEditGrading={handleEditGrading}
    />
  );
}

/**
 * Example 3: Using FeedbackGenerator for AI-Assisted Feedback
 */
export function FeedbackGeneratorExample() {
  const [feedback, setFeedback] = useState<string>('');
  
  // Handle feedback selection
  const handleFeedbackSelect = (selectedFeedback: string, bloomsLevel?: BloomsTaxonomyLevel) => {
    setFeedback(selectedFeedback);
    console.log('Selected feedback for level', bloomsLevel);
  };
  
  return (
    <div>
      <FeedbackGenerator
        bloomsLevels={[
          BloomsTaxonomyLevel.REMEMBER,
          BloomsTaxonomyLevel.UNDERSTAND,
          BloomsTaxonomyLevel.APPLY,
          BloomsTaxonomyLevel.ANALYZE,
          BloomsTaxonomyLevel.EVALUATE
        ]}
        studentName="John Doe"
        submissionContent="This is a sample submission content."
        onFeedbackSelect={handleFeedbackSelect}
      />
      
      <div className="mt-4">
        <h3>Selected Feedback</h3>
        <p>{feedback || 'No feedback selected yet'}</p>
      </div>
    </div>
  );
}

/**
 * Example 4: Using GradingResult to Display Grading Results
 */
export function GradingResultExample() {
  const [submissionId, setSubmissionId] = useState<string>('submission-1');
  
  // Fetch grading result
  const { data: result, isLoading } = api.bloomGrading.getGradingResult.useQuery({
    submissionId,
    contentType: GradableContentType.ASSESSMENT
  });
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Handle download
  const handleDownload = () => {
    // Implement download logic
    console.log('Downloading result');
  };
  
  // Handle share
  const handleShare = () => {
    // Implement share logic
    console.log('Sharing result');
  };
  
  if (isLoading || !result) {
    return <div>Loading...</div>;
  }
  
  return (
    <GradingResult
      result={result}
      contentType={GradableContentType.ASSESSMENT}
      studentName="John Doe"
      criteria={[]} // Add criteria if available
      showBloomsLevels={true}
      onPrint={handlePrint}
      onDownload={handleDownload}
      onShare={handleShare}
    />
  );
}

/**
 * Example 5: Using BloomsLevelFeedback for Level-Specific Feedback
 */
export function BloomsLevelFeedbackExample() {
  const [feedback, setFeedback] = useState<string>('');
  
  // Handle feedback selection
  const handleFeedbackSelect = (selectedFeedback: string) => {
    setFeedback(selectedFeedback);
  };
  
  return (
    <div>
      <BloomsLevelFeedback
        bloomsLevel={BloomsTaxonomyLevel.ANALYZE}
        studentName="John Doe"
        onFeedbackSelect={handleFeedbackSelect}
      />
      
      <div className="mt-4">
        <h3>Selected Feedback</h3>
        <p>{feedback || 'No feedback selected yet'}</p>
      </div>
    </div>
  );
}

/**
 * Example 6: Using CognitiveGrading for Bloom's Level-Specific Grading
 */
export function CognitiveGradingExample() {
  const [gradingValues, setGradingValues] = useState<GradingFormValues>({
    score: 0,
    feedback: '',
    bloomsLevelScores: {
      [BloomsTaxonomyLevel.REMEMBER]: 0,
      [BloomsTaxonomyLevel.UNDERSTAND]: 0,
      [BloomsTaxonomyLevel.APPLY]: 0,
      [BloomsTaxonomyLevel.ANALYZE]: 0,
      [BloomsTaxonomyLevel.EVALUATE]: 0
    }
  });
  
  // Handle grade change
  const handleGradeChange = (values: GradingFormValues) => {
    setGradingValues(values);
  };
  
  // Calculate max score per level
  const maxScorePerLevel: Record<BloomsTaxonomyLevel, number> = {
    [BloomsTaxonomyLevel.REMEMBER]: 20,
    [BloomsTaxonomyLevel.UNDERSTAND]: 20,
    [BloomsTaxonomyLevel.APPLY]: 20,
    [BloomsTaxonomyLevel.ANALYZE]: 20,
    [BloomsTaxonomyLevel.EVALUATE]: 20,
    [BloomsTaxonomyLevel.CREATE]: 0 // Not used in this example
  };
  
  return (
    <div>
      <CognitiveGrading
        bloomsLevels={[
          BloomsTaxonomyLevel.REMEMBER,
          BloomsTaxonomyLevel.UNDERSTAND,
          BloomsTaxonomyLevel.APPLY,
          BloomsTaxonomyLevel.ANALYZE,
          BloomsTaxonomyLevel.EVALUATE
        ]}
        maxScorePerLevel={maxScorePerLevel}
        initialValues={gradingValues}
        onGradeChange={handleGradeChange}
        showAnalysis={true}
      />
      
      <div className="mt-4">
        <h3>Grading Values</h3>
        <pre>{JSON.stringify(gradingValues, null, 2)}</pre>
      </div>
    </div>
  );
}

/**
 * Example 7: Using RubricGrading for Rubric-Based Grading
 */
export function RubricGradingExample() {
  const [gradingValues, setGradingValues] = useState<GradingFormValues>({
    score: 0,
    feedback: '',
    criteriaResults: []
  });
  
  // Handle grade change
  const handleGradeChange = (values: GradingFormValues) => {
    setGradingValues(values);
  };
  
  // Sample criteria
  const criteria = [
    {
      id: 'criterion-1',
      name: 'Understanding of Concepts',
      description: 'Demonstrates understanding of key concepts',
      weight: 25,
      bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND
    },
    {
      id: 'criterion-2',
      name: 'Application of Knowledge',
      description: 'Applies knowledge to solve problems',
      weight: 25,
      bloomsLevel: BloomsTaxonomyLevel.APPLY
    },
    {
      id: 'criterion-3',
      name: 'Analysis of Information',
      description: 'Analyzes information effectively',
      weight: 25,
      bloomsLevel: BloomsTaxonomyLevel.ANALYZE
    },
    {
      id: 'criterion-4',
      name: 'Evaluation of Ideas',
      description: 'Evaluates ideas critically',
      weight: 25,
      bloomsLevel: BloomsTaxonomyLevel.EVALUATE
    }
  ];
  
  // Sample performance levels
  const performanceLevels = [
    {
      id: 'level-1',
      name: 'Excellent',
      description: 'Exceeds expectations',
      scoreMultiplier: 1.0
    },
    {
      id: 'level-2',
      name: 'Good',
      description: 'Meets expectations',
      scoreMultiplier: 0.8
    },
    {
      id: 'level-3',
      name: 'Satisfactory',
      description: 'Partially meets expectations',
      scoreMultiplier: 0.6
    },
    {
      id: 'level-4',
      name: 'Needs Improvement',
      description: 'Does not meet expectations',
      scoreMultiplier: 0.4
    }
  ];
  
  return (
    <div>
      <RubricGrading
        rubricId="rubric-1"
        rubricType={RubricType.ANALYTIC}
        criteria={criteria}
        performanceLevels={performanceLevels}
        maxScore={100}
        initialValues={gradingValues}
        onGradeChange={handleGradeChange}
        showBloomsLevels={true}
      />
      
      <div className="mt-4">
        <h3>Grading Values</h3>
        <pre>{JSON.stringify(gradingValues, null, 2)}</pre>
      </div>
    </div>
  );
}
