# Activities and Rubrics Integration Analysis

This document analyzes how activities in the system are aligned with Bloom's Taxonomy and integrated with rubrics to support comprehensive assessment and learning outcomes.

## Overview

The activities implementation in `features/activities` is designed to work seamlessly with the Bloom's Taxonomy framework implemented in `features/bloom`. This integration enables a pedagogically sound approach to creating, assessing, and tracking student progress across different cognitive levels.

## Database Schema Integration

### Activity Model

The Activity model has been extended to include Bloom's Taxonomy fields:

```prisma
model Activity {
  id                  String                @id @default(cuid())
  title               String
  purpose             ActivityPurpose
  learningType        LearningActivityType?
  assessmentType      AssessmentType?
  status              SystemStatus          @default(ACTIVE)
  subjectId           String
  topicId             String?
  classId             String
  content             Json
  h5pContentId        String?
  isGradable          Boolean               @default(false)
  maxScore            Float?
  passingScore        Float?
  weightage           Float?
  gradingConfig       Json?
  startDate           DateTime?
  endDate             DateTime?
  duration            Int?
  bloomsLevel         BloomsTaxonomyLevel?  // Bloom's Taxonomy level
  rubricId            String?               // Reference to associated rubric
  lessonPlanId        String?               // Reference to associated lesson plan

  // Relationships
  bloomsRubric        Rubric?               @relation(fields: [rubricId], references: [id])
  lessonPlan          LessonPlan?           @relation(fields: [lessonPlanId], references: [id])
  learningOutcomes    ActivityOutcome[]     // Many-to-many relationship with learning outcomes
}
```

### Rubric Model

The Rubric model is designed to support Bloom's Taxonomy-aligned assessment:

```prisma
model Rubric {
  id                String           @id @default(cuid())
  title             String
  description       String?
  type              RubricType
  maxScore          Float
  bloomsDistribution Json?            // Distribution across Bloom's levels
  createdById       String
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  criteria          RubricCriteria[]
  performanceLevels PerformanceLevel[]
  learningOutcomes  RubricOutcome[]
  assessments       Assessment[]
  activities        Activity[]       // Activities using this rubric
  createdBy         User             @relation(fields: [createdById], references: [id])
}
```

## Component Architecture

### Activity Components

The activities system is built using a component-based architecture that supports different activity types:

1. **Base Activity Interface**:
   ```typescript
   export interface BaseActivity {
     id: string;
     title: string;
     description?: string;
     instructions?: string;
     activityType: string;
     isGradable?: boolean;
     createdAt?: Date;
     updatedAt?: Date;
     metadata?: ActivityMetadata;
     bloomsLevel?: BloomsTaxonomyLevel;
     learningOutcomeIds?: string[];
     rubricId?: string;
   }
   ```

2. **Activity Registry**:
   The system uses an activity registry to manage different activity types:
   ```typescript
   activityRegistry.register({
     id: 'activity-type',
     name: 'Activity Type',
     description: 'Description of the activity type',
     category: ActivityPurpose.LEARNING,
     configSchema: activityConfigSchema,
     defaultConfig: defaultConfig,
     capabilities: {
       isGradable: true,
       hasSubmission: true,
       hasInteraction: true,
       hasRealTimeComponents: false,
     },
     components: {
       editor: ActivityEditor,
       viewer: ActivityViewer,
     },
   });
   ```

### Rubric Components

The rubric system includes components for creating, editing, and applying rubrics to activities:

1. **Rubric Criteria**:
   Each criterion in a rubric is aligned with a specific Bloom's Taxonomy level:
   ```typescript
   export interface RubricCriteria {
     id: string;
     name: string;
     description?: string;
     bloomsLevel: BloomsTaxonomyLevel;
     weight: number;
     rubricId: string;
     criteriaLevels?: CriteriaLevel[];
   }
   ```

2. **Performance Levels**:
   Rubrics include performance levels for assessment:
   ```typescript
   export interface PerformanceLevel {
     id: string;
     name: string;
     description?: string;
     minScore: number;
     maxScore: number;
     color?: string;
     rubricId: string;
   }
   ```

## Gap Analysis and Implementation Recommendations

Based on a review of the current codebase, the following gaps have been identified in the activities-rubrics integration:

### 1. Activity Creation with Lesson Plan Selection

**Current State:**
- The `ComponentActivityService` has a `lessonPlanId` field in the `CreateActivityInput` type, but it's not fully implemented in the UI.
- The activity creation form doesn't have a lesson plan selector component.
- The Bloom's Taxonomy distribution is not being fetched from the lesson plan during activity creation.

**Gaps:**
- Missing UI component for lesson plan selection during activity creation
- No logic to fetch and use Bloom's distribution from the selected lesson plan
- No connection between lesson plan's cognitive balance and activity creation

### 2. Grading Options (Score vs. Rubrics)

**Current State:**
- The system currently supports both score-based grading and rubric-based grading.
- The `ActivityGrade` model has fields for both score and rubric-related data.
- The `RubricGrading` component exists in the bloom folder but isn't fully integrated with all activity types.

**Gaps:**
- No UI option for teachers to select between score-based or rubric-based grading
- Inconsistent implementation across different activity types
- Missing integration between activity grading and Bloom's Taxonomy levels

### 3. Bloom's Taxonomy Distribution in Activities

**Current State:**
- The `Activity` model has a `bloomsLevel` field for a single level.
- The lesson plan has a `bloomsDistribution` field for distribution across levels.
- There's no mechanism to transfer the distribution from lesson plan to activities.

**Gaps:**
- No way to associate multiple Bloom's levels with a single activity
- Missing UI to visualize Bloom's distribution in activities
- No validation to ensure activities align with lesson plan's cognitive balance

### 4. Student View of Graded Activities

**Current State:**
- Students can see their graded activities, but the Bloom's Taxonomy integration is limited.
- The `ActivityGrade` model stores grading data but doesn't fully expose Bloom's data to students.
- The reward system is integrated with activities but doesn't fully leverage Bloom's data.

**Gaps:**
- Limited student-facing UI for Bloom's Taxonomy integration
- No visualization of student progress across Bloom's levels
- Missing feedback mechanism that explains performance in terms of cognitive levels

## Implementation Recommendations

### 1. Lesson Plan Selection in Activity Creation

```typescript
// Update the activity creation form to include lesson plan selection
export function ActivityCreationForm() {
  // Add lesson plan selector
  const [selectedLessonPlanId, setSelectedLessonPlanId] = useState<string | null>(null);

  // Fetch lesson plans for the class
  const { data: lessonPlans } = api.lessonPlan.getByClass.useQuery({
    classId: classId
  });

  // Fetch Bloom's distribution when lesson plan is selected
  const { data: lessonPlanDetails } = api.lessonPlan.getById.useQuery(
    { id: selectedLessonPlanId! },
    { enabled: !!selectedLessonPlanId }
  );

  // Update form state when lesson plan is selected
  useEffect(() => {
    if (lessonPlanDetails?.bloomsDistribution) {
      setFormData(prev => ({
        ...prev,
        bloomsLevel: getHighestBloomsLevel(lessonPlanDetails.bloomsDistribution),
        lessonPlanId: selectedLessonPlanId
      }));
    }
  }, [lessonPlanDetails, selectedLessonPlanId]);

  return (
    <Form>
      {/* Existing form fields */}

      {/* Lesson Plan Selector */}
      <FormField
        control={form.control}
        name="lessonPlanId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lesson Plan</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                setSelectedLessonPlanId(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a lesson plan" />
              </SelectTrigger>
              <SelectContent>
                {lessonPlans?.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Selecting a lesson plan will automatically set the Bloom's level
              based on the lesson plan's cognitive distribution.
            </FormDescription>
          </FormItem>
        )}
      />

      {/* Show Bloom's distribution from lesson plan if selected */}
      {lessonPlanDetails?.bloomsDistribution && (
        <div className="mt-4">
          <Label>Lesson Plan Bloom's Distribution</Label>
          <BloomsDistributionChart
            distribution={lessonPlanDetails.bloomsDistribution}
            showLegend={true}
          />
        </div>
      )}
    </Form>
  );
}
```

### 2. Grading Option Selection (Score vs. Rubrics)

```typescript
// Update the ActivityGrading component to support both grading methods
export function ActivityGrading({ activityId, studentId }: ActivityGradingProps) {
  // State for selected grading method
  const [gradingMethod, setGradingMethod] = useState<'score' | 'rubric'>('score');

  // Fetch activity and submission data
  const { data: activity } = api.activity.getById.useQuery({ id: activityId });
  const { data: submission } = api.activity.getSubmission.useQuery({
    activityId,
    studentId
  });

  // Grading mutation
  const gradeMutation = api.activityGrade.grade.useMutation();

  // Handle score-based grading
  const handleScoreGrading = (data: { score: number, feedback?: string }) => {
    gradeMutation.mutate({
      activityId,
      studentId,
      score: data.score,
      feedback: data.feedback,
      bloomsLevelScores: activity?.bloomsLevel ? {
        [activity.bloomsLevel]: data.score
      } : undefined
    });
  };

  // Handle rubric-based grading
  const handleRubricGrading = (result: {
    score: number;
    criteriaGrades: Array<{
      criterionId: string;
      levelId: string;
      score: number;
      feedback?: string;
    }>;
    bloomsLevelScores: Record<BloomsTaxonomyLevel, number>;
  }) => {
    gradeMutation.mutate({
      activityId,
      studentId,
      score: result.score,
      bloomsLevelScores: result.bloomsLevelScores,
      rubricResults: result.criteriaGrades,
      gradingMethod: 'rubric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Grading method selector */}
      <div className="flex items-center space-x-4">
        <Label>Grading Method:</Label>
        <RadioGroup
          value={gradingMethod}
          onValueChange={(value) => setGradingMethod(value as 'score' | 'rubric')}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="score" id="score" />
            <Label htmlFor="score">Score-based</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rubric" id="rubric" />
            <Label htmlFor="rubric">Rubric-based</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Render appropriate grading component based on selection */}
      {gradingMethod === 'score' ? (
        <ScoreGradingForm
          initialScore={submission?.score}
          initialFeedback={submission?.feedback}
          maxScore={activity?.maxScore || 100}
          onSubmit={handleScoreGrading}
        />
      ) : (
        activity?.rubricId ? (
          <RubricGrading
            rubricId={activity.rubricId}
            initialValues={submission?.attachments?.gradingDetails?.criteriaResults}
            onGradeChange={handleRubricGrading}
          />
        ) : (
          <CognitiveGrading
            bloomsLevels={activity?.bloomsLevel ? [activity.bloomsLevel] : []}
            onGradeChange={handleRubricGrading}
          />
        )
      )}
    </div>
  );
}
```

### 3. Bloom's Distribution from Lesson Plan

```typescript
// Update the activity service to fetch and use Bloom's distribution from lesson plan
export class ActivityService {
  // Existing methods...

  async createActivityFromLessonPlan(input: CreateActivityInput): Promise<Activity> {
    try {
      // Validate input
      this.validateActivityInput(input);

      // If lessonPlanId is provided, fetch the lesson plan
      let bloomsLevel = input.bloomsLevel;
      let bloomsDistribution = null;

      if (input.lessonPlanId) {
        const lessonPlan = await this.prisma.lessonPlan.findUnique({
          where: { id: input.lessonPlanId },
          select: { bloomsDistribution: true }
        });

        if (lessonPlan?.bloomsDistribution) {
          // Store the distribution in the activity's gradingConfig
          bloomsDistribution = lessonPlan.bloomsDistribution;

          // If no bloomsLevel is provided, use the highest level from the distribution
          if (!bloomsLevel) {
            bloomsLevel = this.getHighestBloomsLevel(lessonPlan.bloomsDistribution);
          }
        }
      }

      // Create the activity with Bloom's data from lesson plan
      return await this.prisma.activity.create({
        data: {
          // Basic fields
          title: input.title,
          purpose: input.purpose,
          learningType: input.learningType,
          assessmentType: input.assessmentType,
          subjectId: input.subjectId,
          topicId: input.topicId,
          classId: input.classId,
          content: input.content,
          isGradable: input.isGradable || false,
          maxScore: input.maxScore,
          passingScore: input.passingScore,

          // Bloom's fields
          bloomsLevel: bloomsLevel,
          lessonPlanId: input.lessonPlanId,

          // Store Bloom's distribution in gradingConfig
          gradingConfig: {
            ...(input.gradingConfig || {}),
            bloomsDistribution: bloomsDistribution
          }
        }
      });
    } catch (error) {
      // Error handling...
    }
  }

  // Helper method to get the highest Bloom's level from a distribution
  private getHighestBloomsLevel(distribution: Record<BloomsTaxonomyLevel, number>): BloomsTaxonomyLevel {
    let highestLevel = BloomsTaxonomyLevel.REMEMBER;
    let highestValue = 0;

    Object.entries(distribution).forEach(([level, value]) => {
      if (value > highestValue) {
        highestValue = value;
        highestLevel = level as BloomsTaxonomyLevel;
      }
    });

    return highestLevel;
  }
}
```

### 4. Student View of Graded Activities

```typescript
// Create a student-facing component for viewing graded activities with Bloom's data
export function StudentActivityGradeView({ activityGradeId }: { activityGradeId: string }) {
  // Fetch activity grade data
  const { data: activityGrade } = api.activityGrade.getById.useQuery({ id: activityGradeId });

  // Extract Bloom's data from the grade
  const bloomsLevelScores = activityGrade?.attachments?.gradingDetails?.bloomsLevelScores;
  const bloomsLevel = activityGrade?.activity?.bloomsLevel;

  return (
    <div className="space-y-6">
      {/* Basic grade information */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">{activityGrade?.activity?.title}</h2>
        <div className="mt-2 flex items-center">
          <span className="text-sm text-gray-500">Score:</span>
          <span className="ml-2 text-lg font-medium">
            {activityGrade?.score} / {activityGrade?.activity?.maxScore}
          </span>
        </div>

        {/* Feedback section */}
        {activityGrade?.feedback && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Feedback</h3>
            <p className="mt-1 text-gray-700">{activityGrade.feedback}</p>
          </div>
        )}
      </div>

      {/* Bloom's Taxonomy section */}
      {(bloomsLevel || bloomsLevelScores) && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Cognitive Skills Assessment</h3>

          {/* Single Bloom's level */}
          {bloomsLevel && !bloomsLevelScores && (
            <div className="mt-4">
              <div className="flex items-center">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: BLOOMS_LEVEL_METADATA[bloomsLevel].color }}
                />
                <span className="ml-2 font-medium">
                  {BLOOMS_LEVEL_METADATA[bloomsLevel].name}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {BLOOMS_LEVEL_METADATA[bloomsLevel].description}
              </p>
            </div>
          )}

          {/* Multiple Bloom's levels */}
          {bloomsLevelScores && (
            <div className="mt-4">
              <BloomsRadarChart data={bloomsLevelScores} size={200} />
              <div className="mt-4 space-y-2">
                {Object.entries(bloomsLevelScores).map(([level, score]) => (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel].color }}
                      />
                      <span className="ml-2 text-sm">
                        {BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel].name}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Implementation Plan

Here's a minimalist implementation plan to address the requirements:

### Phase 1: Lesson Plan Integration

1. **Update Activity Creation Form**
   - Add lesson plan selector component
   - Fetch and display Bloom's distribution from selected lesson plan
   - Auto-select Bloom's level based on distribution

2. **Update Activity Service**
   - Enhance `createActivity` method to use lesson plan data
   - Store Bloom's distribution in activity's `gradingConfig`
   - Add helper methods for working with Bloom's distribution

### Phase 2: Grading Options

1. **Update Activity Grading Component**
   - Add radio buttons for selecting grading method (score vs. rubric)
   - Implement conditional rendering of appropriate grading component
   - Ensure both methods update the same `ActivityGrade` model

2. **Enhance Grading Service**
   - Update `gradeActivity` method to handle both grading methods
   - Store Bloom's level scores in the `attachments.gradingDetails` field
   - Ensure consistent data structure for both methods

### Phase 3: Student View

1. **Create Student Activity Grade View**
   - Implement component for viewing graded activities
   - Display Bloom's level information and performance
   - Add visualizations for cognitive skills assessment

2. **Update Reward System Integration**
   - Enhance reward calculation to consider Bloom's levels
   - Award bonus points for mastery of higher cognitive levels
   - Update achievement system to recognize cognitive skill development

## Conclusion

This implementation approach focuses on:

1. **Simplicity**: Using existing components and data structures where possible
2. **Minimalism**: Adding only what's necessary to meet the requirements
3. **Consistency**: Ensuring a uniform approach across the system
4. **Extensibility**: Designing for future enhancements

The plan leverages the existing Bloom's Taxonomy implementation and integrates it with activities, grading, and student views in a straightforward manner. By focusing on the core functionality first, we can deliver a working solution quickly while laying the groundwork for more advanced features in the future.

The implementation reuses existing components from the `features/bloom` folder, particularly the grading components for rubrics, which are already well-developed. This approach minimizes duplication and ensures consistency across the application.