# Centralized Grading Components - Usage Examples

This document provides examples of how to use the centralized grading components from the Bloom's Taxonomy feature in different contexts.

## Basic Usage

### Simple Grading Form

```tsx
import { GradingForm, GradingContext, GradableContentType } from '@/features/bloom';

// Example component using the grading form
function AssessmentGrading({ assessmentId, studentId }) {
  // Fetch assessment and submission data
  const { data: assessment } = api.assessment.getById.useQuery({ id: assessmentId });
  const { data: submission } = api.assessment.getSubmission.useQuery({ 
    assessmentId, 
    studentId 
  });
  
  // Create grading context
  const gradingContext: GradingContext = {
    submission: {
      id: submission?.id || '',
      studentId,
      contentId: assessmentId,
      contentType: GradableContentType.ASSESSMENT,
      status: submission?.status || 'submitted',
      content: submission?.content || {},
      submittedAt: submission?.submittedAt || new Date(),
    },
    bloomsLevels: [
      BloomsTaxonomyLevel.REMEMBER,
      BloomsTaxonomyLevel.UNDERSTAND,
      BloomsTaxonomyLevel.APPLY,
    ],
  };
  
  // Handle form submission
  const gradeMutation = api.assessment.grade.useMutation();
  const handleSubmit = (values) => {
    gradeMutation.mutate({
      submissionId: submission?.id || '',
      score: values.score,
      feedback: values.feedback,
      bloomsLevelScores: values.bloomsLevelScores,
    });
  };
  
  return (
    <GradingForm
      gradingContext={gradingContext}
      onSubmit={handleSubmit}
      isSubmitting={gradeMutation.isLoading}
      maxScore={assessment?.maxScore || 100}
      showRubricGrading={false}
    />
  );
}
```

### Rubric-Based Grading

```tsx
import { GradingForm, GradingContext, GradableContentType } from '@/features/bloom';

function RubricAssessmentGrading({ assessmentId, studentId }) {
  // Fetch assessment, submission, and rubric data
  const { data: assessment } = api.assessment.getById.useQuery({ id: assessmentId });
  const { data: submission } = api.assessment.getSubmission.useQuery({ 
    assessmentId, 
    studentId 
  });
  const { data: rubric } = api.rubric.getById.useQuery({ 
    id: assessment?.rubricId || '' 
  }, {
    enabled: !!assessment?.rubricId
  });
  
  // Create grading context with rubric
  const gradingContext: GradingContext = {
    submission: {
      id: submission?.id || '',
      studentId,
      contentId: assessmentId,
      contentType: GradableContentType.ASSESSMENT,
      status: submission?.status || 'submitted',
      content: submission?.content || {},
      submittedAt: submission?.submittedAt || new Date(),
    },
    rubric: rubric ? {
      id: rubric.id,
      type: rubric.type,
      criteria: rubric.criteria,
      performanceLevels: rubric.performanceLevels,
      maxScore: rubric.maxScore,
    } : undefined,
    bloomsLevels: [
      BloomsTaxonomyLevel.REMEMBER,
      BloomsTaxonomyLevel.UNDERSTAND,
      BloomsTaxonomyLevel.APPLY,
      BloomsTaxonomyLevel.ANALYZE,
      BloomsTaxonomyLevel.EVALUATE,
      BloomsTaxonomyLevel.CREATE,
    ],
  };
  
  // Handle form submission
  const gradeMutation = api.assessment.grade.useMutation();
  const handleSubmit = (values) => {
    gradeMutation.mutate({
      submissionId: submission?.id || '',
      score: values.score,
      feedback: values.feedback,
      bloomsLevelScores: values.bloomsLevelScores,
      criteriaGrades: values.criteriaGrades,
    });
  };
  
  return (
    <GradingForm
      gradingContext={gradingContext}
      onSubmit={handleSubmit}
      isSubmitting={gradeMutation.isLoading}
      maxScore={assessment?.maxScore || 100}
    />
  );
}
```

## Integration with Activities

```tsx
import { GradingForm, GradingContext, GradableContentType } from '@/features/bloom';

function ActivityGrading({ activityId, studentId }) {
  // Fetch activity and submission data
  const { data: activity } = api.activity.getById.useQuery({ id: activityId });
  const { data: submission } = api.activity.getSubmission.useQuery({ 
    activityId, 
    studentId 
  });
  
  // Create grading context
  const gradingContext: GradingContext = {
    submission: {
      id: submission?.id || '',
      studentId,
      contentId: activityId,
      contentType: GradableContentType.ACTIVITY,
      status: submission?.status || 'submitted',
      content: submission?.content || {},
      submittedAt: submission?.submittedAt || new Date(),
    },
    bloomsLevels: [activity?.bloomsLevel].filter(Boolean),
  };
  
  // Handle form submission
  const gradeMutation = api.activity.grade.useMutation();
  const handleSubmit = (values) => {
    gradeMutation.mutate({
      submissionId: submission?.id || '',
      score: values.score,
      feedback: values.feedback,
      bloomsLevelScores: values.bloomsLevelScores,
    });
  };
  
  return (
    <GradingForm
      gradingContext={gradingContext}
      onSubmit={handleSubmit}
      isSubmitting={gradeMutation.isLoading}
      maxScore={activity?.maxScore || 100}
      showRubricGrading={false}
    />
  );
}
```

## Using Just the RubricGrading Component

```tsx
import { RubricGrading } from '@/features/bloom';

function CustomRubricGrading({ rubric, onGradeChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Custom Rubric Grading</h2>
      
      <RubricGrading
        rubricId={rubric.id}
        rubricType={rubric.type}
        criteria={rubric.criteria}
        performanceLevels={rubric.performanceLevels}
        maxScore={rubric.maxScore}
        onGradeChange={onGradeChange}
        showBloomsLevels={true}
      />
      
      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Custom footer content can go here
        </p>
      </div>
    </div>
  );
}
```

## Integration with Class Components

```tsx
import { GradingForm, GradingContext, GradableContentType, BatchGradingEntry } from '@/features/bloom';

function ClassAssessmentGrading({ classId, assessmentId }) {
  // Fetch class, assessment, and submissions data
  const { data: assessment } = api.assessment.getById.useQuery({ id: assessmentId });
  const { data: submissions } = api.assessment.getSubmissionsByClass.useQuery({ 
    assessmentId, 
    classId 
  });
  const { data: rubric } = api.rubric.getById.useQuery({ 
    id: assessment?.rubricId || '' 
  }, {
    enabled: !!assessment?.rubricId
  });
  
  // State for selected student
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const selectedSubmission = submissions?.find(s => s.studentId === selectedStudentId);
  
  // Create batch grading entries
  const batchEntries: BatchGradingEntry[] = submissions?.map(submission => ({
    submissionId: submission.id,
    studentId: submission.studentId,
    studentName: submission.student.name || '',
    score: submission.score || 0,
    maxScore: assessment?.maxScore || 100,
    feedback: submission.feedback || '',
    status: submission.status,
  })) || [];
  
  // Create grading context for selected student
  const gradingContext: GradingContext | null = selectedSubmission ? {
    submission: {
      id: selectedSubmission.id,
      studentId: selectedSubmission.studentId,
      contentId: assessmentId,
      contentType: GradableContentType.ASSESSMENT,
      status: selectedSubmission.status,
      content: selectedSubmission.content || {},
      submittedAt: selectedSubmission.submittedAt || new Date(),
    },
    rubric: rubric ? {
      id: rubric.id,
      type: rubric.type,
      criteria: rubric.criteria,
      performanceLevels: rubric.performanceLevels,
      maxScore: rubric.maxScore,
    } : undefined,
    bloomsLevels: Object.values(BloomsTaxonomyLevel),
  } : null;
  
  // Handle form submission
  const gradeMutation = api.assessment.grade.useMutation();
  const handleSubmit = (values) => {
    if (!selectedSubmission) return;
    
    gradeMutation.mutate({
      submissionId: selectedSubmission.id,
      score: values.score,
      feedback: values.feedback,
      bloomsLevelScores: values.bloomsLevelScores,
      criteriaGrades: values.criteriaGrades,
    });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <StudentList
          students={batchEntries}
          selectedStudentId={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
        />
      </div>
      
      <div className="md:col-span-2">
        {selectedSubmission && gradingContext ? (
          <GradingForm
            gradingContext={gradingContext}
            onSubmit={handleSubmit}
            isSubmitting={gradeMutation.isLoading}
            maxScore={assessment?.maxScore || 100}
          />
        ) : (
          <p>Select a student to grade their submission</p>
        )}
      </div>
    </div>
  );
}
```
