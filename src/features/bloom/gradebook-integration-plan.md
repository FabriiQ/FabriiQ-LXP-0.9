# Gradebook and Activity Grading Integration with Bloom's Taxonomy

This document outlines the implementation plan for integrating Bloom's Taxonomy and rubrics with the existing gradebook and activity grading components, aligned with the current system implementation.

## Current Status Analysis

### Gradebook System
- The current gradebook implementation uses a `GradeBook` model with `calculationRules` as a JSON field
- Student grades are stored in the `StudentGrade` model with `assessmentGrades` and `activityGrades` as JSON fields
- The `ActivityGrade` model already has fields for score, feedback, and status
- The Bloom's feature includes `CognitiveGrading` and `RubricGrading` components that are ready to use

### Activity Grading
- Activity grading is implemented through the `activity-grading-registry.ts` service with type-specific grading functions
- The `BloomsTaxonomyLevel` enum is already defined and used in the `Activity` model
- The `GradingResult` interface in the Bloom's feature already includes `bloomsLevelScores`
- The `bloom-grading.ts` router already handles activity grading with Bloom's integration

## Implementation Plan

### Phase 1: Complete Gradebook Schema and Service Integration

#### 1.1 Update Gradebook Calculation Rules
- [ ] Extend the existing `calculationRules` JSON structure to include Bloom's Taxonomy settings:
  ```typescript
  interface GradebookCalculationRules {
    // Existing fields
    weights: {
      attendance: number;
      activities: number;
      assessments: number;
    };
    passingGrade?: number;
    customWeights?: Record<string, number>;

    // New Bloom's Taxonomy fields
    bloomsWeights?: Record<BloomsTaxonomyLevel, number>;
    enableBloomsAnalytics?: boolean;
    showBloomsDistribution?: boolean;
  }
  ```

#### 1.2 Update Gradebook Service
- [ ] Enhance the existing `GradebookService` to use Bloom's level data:
  ```typescript
  // Add method to calculate Bloom's level scores from existing data
  async calculateBloomsLevelScores(
    studentId: string,
    gradeBookId: string
  ): Promise<Record<BloomsTaxonomyLevel, number>> {
    // Implementation to aggregate scores from existing activity and assessment grades
    // that already have bloomsLevelScores
  }
  ```

#### 1.3 Connect with Existing Activity Grades
- [ ] Update the gradebook service to extract Bloom's data from activity grades:
  ```typescript
  // Update method to use existing attachments field in ActivityGrade
  async updateGradebookWithActivityGrade(
    gradeBookId: string,
    studentId: string,
    activityGradeId: string
  ): Promise<StudentGrade> {
    // Get the activity grade with its attachments field
    const activityGrade = await this.prisma.activityGrade.findUnique({
      where: { id: activityGradeId }
    });

    // Extract bloomsLevelScores from attachments.gradingDetails
    const bloomsLevelScores = activityGrade?.attachments?.gradingDetails?.bloomsLevelScores;

    // Update the student grade record
    // ...
  }
  ```

### Phase 2: Standardize Activity Grading Integration

#### 2.1 Align with Existing Grading Interface
- [ ] Update the activity grading registry to use the existing `GradingResult` interface:
  ```typescript
  // Update the existing grading registry to consistently include bloomsLevelScores
  export function gradeActivity(
    activityType: string,
    activity: any,
    answers: any
  ): GradingResult {
    // Use existing grading function
    const result = gradingFunctions[activityType](activity, answers);

    // Ensure bloomsLevelScores is included
    if (activity.bloomsLevel && !result.bloomsLevelScores) {
      result.bloomsLevelScores = {
        [activity.bloomsLevel]: result.score
      };
    }

    return result;
  }
  ```

#### 2.2 Update Activity Grading Functions
- [ ] Enhance existing activity grading functions to consistently include Bloom's Taxonomy:
  ```typescript
  // Update the existing multiple choice grading function
  export function gradeMultipleChoiceActivity(
    activity: MultipleChoiceActivity,
    submission: any
  ): GradingResult {
    // Existing grading logic

    // Add Bloom's level scoring using the existing GradingResult interface
    const bloomsLevelScores: Record<BloomsTaxonomyLevel, number> = {};
    if (activity.bloomsLevel) {
      bloomsLevelScores[activity.bloomsLevel] = result.score;
    }

    return {
      ...result,
      bloomsLevelScores
    };
  }
  ```

#### 2.3 Connect with Existing Rubric Grading
- [ ] Use the existing `RubricGrading` component for activity grading:
  ```typescript
  // In ActivityGrading component
  const handleRubricGradeChange = (rubricResult: {
    score: number;
    criteriaGrades: Array<{
      criterionId: string;
      levelId: string;
      score: number;
      feedback?: string;
    }>;
    bloomsLevelScores: Record<BloomsTaxonomyLevel, number>;
  }) => {
    // Use the existing bloom-grading.ts router to submit grades
    submitGradesMutation.mutate({
      submissionId: activityGradeId,
      contentType: GradableContentType.ACTIVITY,
      score: rubricResult.score,
      bloomsLevelScores: rubricResult.bloomsLevelScores,
      criteriaResults: rubricResult.criteriaGrades
    });
  };
  ```

### Phase 3: UI Components for Bloom's-Enhanced Gradebook

#### 3.1 Gradebook Overview Component
- [ ] Create a gradebook overview component using existing Bloom's visualization components:
  ```tsx
  export function BloomsGradebookOverview({
    classId,
    termId
  }: BloomsGradebookOverviewProps) {
    // Fetch data using existing API
    const { data: gradebook } = api.gradebook.getByClassAndTerm.useQuery({
      classId,
      termId
    });

    // Use existing BloomsDistributionChart component
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cognitive Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <BloomsDistributionChart
            distribution={calculateClassDistribution(gradebook)}
            showLegend={true}
          />
        </CardContent>
      </Card>
    );
  }
  ```

#### 3.2 Student Performance Component
- [ ] Create a student performance component using existing analytics components:
  ```tsx
  export function StudentBloomsPerformance({
    studentId,
    classId
  }: StudentBloomsPerformanceProps) {
    // Use existing analytics API
    const { data } = api.bloomsAnalytics.getStudentPerformance.useQuery({
      studentId,
      classId
    });

    // Use existing visualization components
    return (
      <div className="space-y-4">
        <StudentBloomsPerformanceChart data={data?.performanceByLevel} />
        <MasteryHeatmap data={data?.masteryByTopic} />
      </div>
    );
  }
  ```

#### 3.3 Activity Grading Interface Enhancement
- [ ] Update the activity grading interface to use existing Bloom's components:
  ```tsx
  export function ActivityGrading({
    activityId,
    studentId
  }: ActivityGradingProps) {
    // Fetch data using existing API
    const { data: activity } = api.activity.getById.useQuery({ id: activityId });
    const { data: submission } = api.activity.getSubmission.useQuery({
      activityId,
      studentId
    });

    // Use existing grading context
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

    // Use existing RubricGrading component if rubric is available
    if (activity?.rubricId) {
      return <RubricGrading rubricId={activity.rubricId} />;
    }

    // Use existing CognitiveGrading component
    return <CognitiveGrading bloomsLevels={gradingContext.bloomsLevels} />;
  }
  ```

### Phase 4: Gradebook Analytics and Reporting

#### 4.1 Cognitive Level Analytics
- [ ] Implement analytics using existing Bloom's analytics components:
  ```tsx
  export function CognitiveDistributionAnalytics({
    classId,
    termId
  }: CognitiveDistributionAnalyticsProps) {
    // Use existing analytics API
    const { data } = api.bloomsAnalytics.getClassPerformance.useQuery({
      classId,
      termId
    });

    return (
      <div className="space-y-6">
        <BloomsDistributionChart distribution={data?.distribution} />
        <CognitiveBalanceAnalysis
          actual={data?.distribution}
          target={data?.targetDistribution}
        />
      </div>
    );
  }
  ```

#### 4.2 Mastery Tracking Integration
- [ ] Connect with existing topic mastery tracking:
  ```typescript
  // Use existing API endpoints
  export async function updateTopicMasteryFromGradebook(
    studentId: string,
    classId: string,
    topicId: string
  ): Promise<void> {
    // Get all activity grades for this student, class, and topic
    const activityGrades = await prisma.activityGrade.findMany({
      where: {
        studentId,
        activity: {
          classId,
          topicId
        },
        status: 'GRADED'
      },
      include: {
        activity: true
      }
    });

    // Calculate mastery levels using existing logic
    const bloomsLevelScores = calculateBloomsLevelScores(activityGrades);

    // Update topic mastery using existing API
    await prisma.topicMastery.upsert({
      where: {
        studentId_topicId: {
          studentId,
          topicId
        }
      },
      update: {
        rememberLevel: bloomsLevelScores[BloomsTaxonomyLevel.REMEMBER] || 0,
        understandLevel: bloomsLevelScores[BloomsTaxonomyLevel.UNDERSTAND] || 0,
        applyLevel: bloomsLevelScores[BloomsTaxonomyLevel.APPLY] || 0,
        analyzeLevel: bloomsLevelScores[BloomsTaxonomyLevel.ANALYZE] || 0,
        evaluateLevel: bloomsLevelScores[BloomsTaxonomyLevel.EVALUATE] || 0,
        createLevel: bloomsLevelScores[BloomsTaxonomyLevel.CREATE] || 0,
        updatedAt: new Date()
      },
      create: {
        studentId,
        topicId,
        rememberLevel: bloomsLevelScores[BloomsTaxonomyLevel.REMEMBER] || 0,
        understandLevel: bloomsLevelScores[BloomsTaxonomyLevel.UNDERSTAND] || 0,
        applyLevel: bloomsLevelScores[BloomsTaxonomyLevel.APPLY] || 0,
        analyzeLevel: bloomsLevelScores[BloomsTaxonomyLevel.ANALYZE] || 0,
        evaluateLevel: bloomsLevelScores[BloomsTaxonomyLevel.EVALUATE] || 0,
        createLevel: bloomsLevelScores[BloomsTaxonomyLevel.CREATE] || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
  ```

#### 4.3 Reporting Enhancement
- [ ] Create enhanced reports using existing components:
  ```tsx
  export function BloomsGradebookReport({
    classId,
    termId
  }: BloomsGradebookReportProps) {
    // Use existing data fetching
    const { data: gradebook } = api.gradebook.getByClassAndTerm.useQuery({
      classId,
      termId
    });

    const { data: bloomsAnalytics } = api.bloomsAnalytics.getClassPerformance.useQuery({
      classId,
      termId
    });

    // Generate report using existing components
    return (
      <div className="space-y-8 print:space-y-6">
        <GradebookSummary data={gradebook} />
        <BloomsDistributionChart distribution={bloomsAnalytics?.distribution} />
        <TopicMasteryHeatmap data={bloomsAnalytics?.topicMastery} />
        <StudentPerformanceTable
          students={gradebook?.studentGrades}
          showBloomsLevels={true}
        />
      </div>
    );
  }
  ```

## Integration Points

### With Existing Bloom's Feature
- Use the existing `RubricGrading` component from `src/features/bloom/components/grading/RubricGrading.tsx`
- Use the existing `CognitiveGrading` component from `src/features/bloom/components/grading/CognitiveGrading.tsx`
- Use the existing `BloomsDistributionChart` from `src/features/bloom/components/visualization/BloomsDistributionChart.tsx`
- Use the existing `bloom-grading.ts` router for submitting grades with Bloom's data

### With Existing Assessment Feature
- Connect with the existing assessment grading that already includes `bloomsLevelScores`
- Use the existing `BloomsAssessmentGrading` component as a reference
- Share analytics between assessments and gradebook using the existing analytics API

### With Existing Activity Feature
- Use the existing `ActivityGrade` model that already has an `attachments` field for storing Bloom's data
- Use the existing activity grading registry in `src/server/api/services/activity-grading-registry.ts`
- Enhance the existing activity grading functions to consistently include Bloom's level scores

## Implementation Guidelines

### Code Organization
- Place new gradebook components in `src/features/bloom/components/gradebook/`
- Update existing activity grading functions in `src/features/activties/grading/`
- Extend existing API endpoints in `src/server/api/routers/gradebook.ts`
- Add integration services in `src/server/api/services/gradebook-bloom-integration.service.ts`

### Testing Strategy
- Create unit tests for enhanced grading functions
- Implement integration tests for gradebook calculations
- Add end-to-end tests for the complete grading workflow

### Documentation
- Update API documentation for enhanced endpoints
- Create user guides for teachers on using Bloom's-enhanced gradebook
- Add examples of effective grading practices using Bloom's Taxonomy
