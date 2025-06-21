# Essay Assessment Implementation Guide

## Overview

This document provides comprehensive documentation for the essay assessment feature implementation in the AIVY LXP platform. The feature includes rich text editing, manual grading, AI-powered grading, plagiarism detection, and comprehensive analytics.

## Architecture Overview

### Core Components

```
src/features/assessments/
├── types/
│   ├── essay.ts                    # Essay-specific type definitions
│   ├── enums.ts                   # Updated with ESSAY category
│   └── question.ts                # Extended essay question schema
├── services/
│   ├── essay-ai-grading.service.ts    # AI grading service
│   └── plagiarism-detection.service.ts # Plagiarism detection
├── components/
│   ├── creation/
│   │   └── EssayQuestionEditor.tsx     # Essay question creation
│   ├── student/
│   │   └── EssaySubmissionInterface.tsx # Student submission UI
│   └── grading/
│       └── EssayGradingInterface.tsx    # Teacher grading interface
└── docs/
    └── essay-assessment-implementation.md
```

### API Integration

```
src/server/api/routers/
└── essay-assessment.ts           # Essay assessment API endpoints
```

## Features

### 1. Essay Question Creation

**Component**: `EssayQuestionEditor.tsx`

**Features**:
- Rich text editor for question content
- Configurable word limits (min/max)
- Time limits with auto-submission
- Draft saving capabilities
- Rubric creation with multiple criteria and performance levels
- AI grading configuration
- Plagiarism detection settings
- Bloom's taxonomy integration

**Usage**:
```tsx
import { EssayQuestionEditor } from '@/features/assessments/components/creation/EssayQuestionEditor';

<EssayQuestionEditor
  question={questionData}
  onChange={handleQuestionChange}
  onRemove={handleRemove}
/>
```

### 2. Student Submission Interface

**Component**: `EssaySubmissionInterface.tsx`

**Features**:
- Rich text editor with formatting tools
- Real-time word count with progress indicators
- Auto-save functionality (every 60 seconds)
- Draft management
- Timer display for timed assessments
- Word limit validation
- Rubric display for students
- Submission confirmation

**Usage**:
```tsx
import { EssaySubmissionInterface } from '@/features/assessments/components/student/EssaySubmissionInterface';

<EssaySubmissionInterface
  assessmentId={assessmentId}
  questionId={questionId}
  question={questionData}
  existingSubmission={submission}
  onSave={handleSave}
  onSubmit={handleSubmit}
  readOnly={isReadOnly}
/>
```

### 3. Teacher Grading Interface

**Component**: `EssayGradingInterface.tsx`

**Features**:
- Side-by-side view of question and student response
- Rubric-based grading with performance levels
- Custom scoring options
- AI grading assistance
- Plagiarism detection results
- Comprehensive feedback tools
- Analytics dashboard
- Bloom's taxonomy analysis

**Usage**:
```tsx
import { EssayGradingInterface } from '@/features/assessments/components/grading/EssayGradingInterface';

<EssayGradingInterface
  submission={submissionData}
  aiGradingResult={aiResult}
  plagiarismResult={plagiarismResult}
  onGrade={handleGrade}
  onRequestAIAssist={handleAIAssist}
  onSaveDraft={handleSaveDraft}
  readOnly={isReadOnly}
/>
```

## AI Services

### 1. AI Grading Service

**File**: `essay-ai-grading.service.ts`

**Features**:
- Rubric-based automated grading
- Contextual feedback generation
- Bloom's taxonomy level analysis
- Confidence scoring
- Support for sample answers and keywords

**Key Methods**:
```typescript
// Grade an essay using AI
async gradeEssay(
  essayContent: string,
  question: string,
  criteria: EssayGradingCriterion[],
  sampleAnswer?: string,
  keywords?: string[]
): Promise<AIGradingResult>

// Generate feedback suggestions
async generateFeedbackSuggestions(
  essayContent: string,
  question: string,
  currentScore?: number,
  maxScore?: number
): Promise<{
  suggestions: string[];
  strengths: string[];
  improvements: string[];
}>

// Analyze Bloom's taxonomy levels
async analyzeBloomsLevels(
  essayContent: string,
  question: string
): Promise<Record<string, number>>
```

### 2. Plagiarism Detection Service

**File**: `plagiarism-detection.service.ts`

**Features**:
- Cross-submission comparison
- Database content checking
- AI-powered similarity analysis
- Configurable thresholds
- Detailed source reporting

**Key Methods**:
```typescript
// Check for plagiarism
async checkPlagiarism(
  content: string,
  assessmentId: string,
  studentId: string,
  threshold: number = 20,
  options: {
    checkDatabase?: boolean;
    checkSubmissions?: boolean;
    checkInternet?: boolean;
  } = {}
): Promise<PlagiarismResult>

// Generate plagiarism report
async generatePlagiarismReport(
  result: PlagiarismResult
): Promise<string>
```

## API Endpoints

### Essay Assessment Router

**Base Path**: `/api/trpc/essayAssessment`

**Endpoints**:

1. **Submit Essay** - `submitEssay`
   - Create or update essay submissions
   - Support for drafts and final submissions
   - Auto-save functionality

2. **Get Submission** - `getSubmission`
   - Retrieve essay submissions
   - Student and teacher views
   - Include metadata and grading

3. **Grade Submission** - `gradeSubmission`
   - Manual grading with rubric scores
   - Feedback and comments
   - Score calculation

4. **Request AI Grading** - `requestAIGrading`
   - AI-powered grading assistance
   - Multiple grading modes
   - Confidence scoring

5. **Check Plagiarism** - `checkPlagiarism`
   - Plagiarism detection
   - Similarity analysis
   - Source identification

6. **Get Submissions for Grading** - `getSubmissionsForGrading`
   - Teacher view of all submissions
   - Filtering by status
   - Batch grading support

## Type Definitions

### Core Types

```typescript
// Essay submission status
enum EssaySubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  GRADED = 'GRADED',
  RETURNED = 'RETURNED',
}

// AI grading modes
enum AIGradingMode {
  DISABLED = 'DISABLED',
  ASSIST = 'ASSIST',     // AI provides suggestions
  AUTO = 'AUTO',         // AI grades automatically
}

// Essay grading criterion
interface EssayGradingCriterion {
  id: string;
  name: string;
  description?: string;
  weight: number;
  bloomsLevel?: string;
  maxScore: number;
  levels: Array<{
    id: string;
    name: string;
    description: string;
    score: number;
    feedback?: string;
  }>;
}

// AI grading result
interface AIGradingResult {
  overallScore: number;
  maxScore: number;
  percentage: number;
  criteriaScores: Array<{
    criterionId: string;
    score: number;
    maxScore: number;
    feedback: string;
    confidence: number;
  }>;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  bloomsLevelAnalysis?: Record<string, number>;
  gradedAt: Date;
  model: string;
  confidence: number;
}

// Plagiarism result
interface PlagiarismResult {
  similarityPercentage: number;
  sources: Array<{
    text: string;
    similarity: number;
    source: string;
    studentId?: string;
    submissionId?: string;
  }>;
  flagged: boolean;
  checkedAt: Date;
}
```

## Configuration

### Environment Variables

```env
# AI Services
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key

# Alternative API keys for backward compatibility
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
GOOGLE_API_KEY=your_google_api_key
```

### Assessment Settings

```typescript
// Essay assessment settings
interface EssayAssessmentSettings {
  wordLimit?: {
    min?: number;
    max?: number;
    showCounter: boolean;
  };
  timeLimit?: {
    enabled: boolean;
    minutes?: number;
    showTimer: boolean;
    autoSubmit: boolean;
  };
  drafts?: {
    enabled: boolean;
    autoSaveInterval: number; // seconds
    maxDrafts: number;
  };
  plagiarismDetection?: {
    enabled: boolean;
    threshold: number; // percentage
    checkAgainstDatabase: boolean;
    checkAgainstInternet: boolean;
    checkAgainstSubmissions: boolean;
  };
  aiGrading?: {
    mode: AIGradingMode;
    model: string;
    temperature: number;
    requireTeacherReview: boolean;
    confidenceThreshold: number;
  };
}
```

## Integration Points

### 1. Assessment Creation Flow

The essay question editor integrates with the existing assessment creation workflow:

```typescript
// In assessment creation component
import { EssayQuestionEditor } from '@/features/assessments/components/creation/EssayQuestionEditor';

// Add to question type selector
const questionTypes = [
  // ... existing types
  {
    type: QuestionType.ESSAY,
    label: 'Essay',
    component: EssayQuestionEditor
  }
];
```

### 2. Grading Workflow Integration

Essay grading integrates with existing batch grading and rubric systems:

```typescript
// In grading interface
import { EssayGradingInterface } from '@/features/assessments/components/grading/EssayGradingInterface';

// Use in batch grading
if (question.type === QuestionType.ESSAY) {
  return (
    <EssayGradingInterface
      submission={submission}
      onGrade={handleGrade}
      // ... other props
    />
  );
}
```

### 3. Bloom's Taxonomy Integration

Essay assessments automatically integrate with the existing Bloom's taxonomy system:

```typescript
// Bloom's analysis is included in AI grading results
const aiResult = await aiGradingService.gradeEssay(
  content,
  question,
  criteria
);

// Results include Bloom's level analysis
console.log(aiResult.bloomsLevelAnalysis);
// {
//   REMEMBER: 20,
//   UNDERSTAND: 30,
//   APPLY: 25,
//   ANALYZE: 15,
//   EVALUATE: 7,
//   CREATE: 3
// }
```

## Best Practices

### 1. Rubric Design

- **Clear Criteria**: Define specific, measurable criteria
- **Performance Levels**: Use 3-5 performance levels per criterion
- **Point Distribution**: Ensure points align with assessment weight
- **Descriptive Language**: Use clear, student-friendly descriptions

### 2. AI Grading Configuration

- **Sample Answers**: Provide high-quality sample answers for better AI performance
- **Keywords**: Include key concepts and terms for content analysis
- **Confidence Thresholds**: Set appropriate confidence levels for auto-grading
- **Teacher Review**: Always require teacher review for high-stakes assessments

### 3. Plagiarism Detection

- **Appropriate Thresholds**: Set realistic similarity thresholds (15-25%)
- **Context Consideration**: Review flagged content for legitimate similarities
- **Educational Use**: Use as a teaching tool, not just enforcement
- **Privacy**: Ensure student privacy in cross-submission comparisons

### 4. Performance Optimization

- **Lazy Loading**: Load AI services only when needed
- **Caching**: Cache AI results to avoid repeated API calls
- **Batch Processing**: Process multiple submissions efficiently
- **Error Handling**: Implement robust error handling for AI services

## Testing

### Unit Tests

```typescript
// Test AI grading service
describe('EssayAIGradingService', () => {
  it('should grade essay with rubric criteria', async () => {
    const service = new EssayAIGradingService();
    const result = await service.gradeEssay(
      essayContent,
      question,
      criteria
    );
    
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.criteriaScores).toHaveLength(criteria.length);
    expect(result.confidence).toBeGreaterThan(0);
  });
});

// Test plagiarism detection
describe('PlagiarismDetectionService', () => {
  it('should detect similarity between submissions', async () => {
    const service = new PlagiarismDetectionService(prisma);
    const result = await service.checkPlagiarism(
      content,
      assessmentId,
      studentId
    );
    
    expect(result.similarityPercentage).toBeGreaterThanOrEqual(0);
    expect(result.sources).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// Test essay submission flow
describe('Essay Submission Flow', () => {
  it('should create, save draft, and submit essay', async () => {
    // Create submission
    const submission = await api.essayAssessment.submitEssay({
      assessmentId,
      questionId,
      content: 'Draft content',
      isDraft: true
    });
    
    expect(submission.status).toBe('DRAFT');
    
    // Submit final
    const finalSubmission = await api.essayAssessment.submitEssay({
      assessmentId,
      questionId,
      content: 'Final content',
      isDraft: false,
      submissionId: submission.id
    });
    
    expect(finalSubmission.status).toBe('SUBMITTED');
  });
});
```

## Troubleshooting

### Common Issues

1. **AI Service Errors**
   - Check API key configuration
   - Verify network connectivity
   - Review rate limits

2. **Plagiarism Detection Issues**
   - Ensure sufficient content for comparison
   - Check database permissions
   - Verify submission access rights

3. **Rich Text Editor Problems**
   - Check browser compatibility
   - Verify TipTap extensions
   - Review content sanitization

4. **Performance Issues**
   - Monitor AI service response times
   - Optimize database queries
   - Implement proper caching

### Error Handling

```typescript
// Graceful error handling in components
try {
  const result = await api.essayAssessment.requestAIGrading({
    submissionId,
    mode: AIGradingMode.ASSIST
  });
  setAIResult(result);
} catch (error) {
  toast({
    title: "AI Grading Failed",
    description: "Please try again or grade manually.",
    variant: "destructive"
  });
  
  // Log error for debugging
  console.error('AI grading error:', error);
}
```

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Writing style analysis
   - Readability scoring
   - Sentiment analysis

2. **Collaborative Grading**
   - Multiple grader support
   - Grading consensus tools
   - Blind grading options

3. **Enhanced AI Features**
   - Custom AI models
   - Domain-specific grading
   - Multilingual support

4. **Integration Expansions**
   - External plagiarism services
   - Grammar checking tools
   - Citation analysis

### Migration Path

For existing assessments, a migration script will be provided to:
- Convert existing essay questions to new format
- Preserve existing rubrics and grading
- Maintain backward compatibility

## Quick Start Guide

### 1. Creating an Essay Assessment

```typescript
// 1. Add ESSAY to assessment category
const assessmentData = {
  title: "Literary Analysis Essay",
  category: AssessmentCategory.ESSAY,
  // ... other assessment fields
};

// 2. Create essay question
const essayQuestion = {
  type: QuestionType.ESSAY,
  text: "Analyze the themes in Shakespeare's Hamlet",
  points: 100,
  wordLimit: { min: 500, max: 1500 },
  timeLimit: 120, // 2 hours
  enableAIGrading: true,
  aiGradingMode: AIGradingMode.ASSIST,
  enablePlagiarismCheck: true,
  plagiarismThreshold: 20,
  rubric: [
    {
      id: "analysis",
      name: "Literary Analysis",
      description: "Depth of analysis and interpretation",
      maxScore: 40,
      weight: 40,
      levels: [
        { id: "excellent", name: "Excellent", description: "Sophisticated analysis", score: 40 },
        { id: "good", name: "Good", description: "Clear analysis", score: 32 },
        { id: "satisfactory", name: "Satisfactory", description: "Basic analysis", score: 24 },
        { id: "needs-improvement", name: "Needs Improvement", description: "Limited analysis", score: 16 }
      ]
    }
    // ... more criteria
  ]
};
```

### 2. Student Submission

```typescript
// Auto-save draft
await api.essayAssessment.submitEssay({
  assessmentId: "assessment-123",
  questionId: "question-456",
  content: "<p>Student's essay content...</p>",
  isDraft: true
});

// Final submission
await api.essayAssessment.submitEssay({
  assessmentId: "assessment-123",
  questionId: "question-456",
  content: "<p>Final essay content...</p>",
  isDraft: false,
  submissionId: "submission-789"
});
```

### 3. Teacher Grading

```typescript
// Request AI assistance
const aiResult = await api.essayAssessment.requestAIGrading({
  submissionId: "submission-789",
  mode: AIGradingMode.ASSIST,
  includeExplanation: true
});

// Manual grading
await api.essayAssessment.gradeSubmission({
  submissionId: "submission-789",
  criteriaScores: [
    { criterionId: "analysis", score: 35, feedback: "Good analysis with room for improvement" },
    { criterionId: "writing", score: 28, feedback: "Clear writing style" }
  ],
  overallFeedback: "Well-written essay with strong analysis. Consider expanding on the symbolism discussion."
});

// Check plagiarism
const plagiarismResult = await api.essayAssessment.checkPlagiarism({
  submissionId: "submission-789",
  content: essayContent,
  threshold: 20,
  checkSources: {
    database: true,
    submissions: true,
    internet: false
  }
});
```

## Conclusion

The essay assessment feature provides a comprehensive solution for creating, submitting, and grading essay-based assessments. With AI-powered grading assistance, plagiarism detection, and rich analytics, it enhances both teaching and learning experiences while maintaining the flexibility for manual oversight and customization.
