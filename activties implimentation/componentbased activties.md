# Component-Based Activity System Implementation

## Overview

This document outlines an alternative approach for implementing LMS-like activities using a component-based architecture. Instead of relying on markdown templates, this approach uses structured JSON configurations for different activity types with specialized React components for each element.

## Current System Analysis

The current system provides a foundation with activity categorization but lacks:
1. Specialized interfaces for different activity types
2. Interactive components for engagement
3. Structured assessment tools
4. Media-rich content support
5. Learning analytics integration

## Proposed Solution: Component-Based Activity System

### Core Concept

Create a flexible component system where activities are composed of various building blocks, each with specific functionality and configuration options. This enables:

1. Tailored interfaces for each activity type
2. Fine-grained control over activity structure
3. Advanced interactivity options
4. Better analytics capabilities

### Implementation Details

#### 1. Activity Type Registry

Create a registry of activity types, each with their own:
- Configuration schema
- Editing component
- Viewing component
- Analytics hooks

```typescript
interface ActivityTypeDefinition {
  id: string;
  name: string;
  description: string;
  category: ActivityPurpose;
  subCategory: string; // learningType or assessmentType
  configSchema: zod.ZodSchema; // Schema validation
  defaultConfig: Record<string, any>;
  capabilities: {
    isGradable: boolean;
    hasSubmission: boolean;
    hasInteraction: boolean;
    hasRealTimeComponents: boolean;
  };
  components: {
    editor: React.ComponentType<{
      config: any;
      onChange: (newConfig: any) => void;
    }>;
    viewer: React.ComponentType<{
      config: any;
      mode: 'preview' | 'student' | 'teacher';
      onInteraction?: (data: any) => void;
    }>;
    analytics: React.ComponentType<{
      activityId: string;
      classId: string;
    }>;
  };
}
```

#### 2. Enhanced Activity Model

Extend the current Activity model with structured content based on activity type:

```typescript
interface EnhancedActivity {
  // Base fields remain the same
  id: string;
  title: string;
  purpose: ActivityPurpose;
  learningType?: LearningActivityType;
  assessmentType?: AssessmentType;
  
  // New fields
  activityTypeId: string;     // References the activity type registry
  version: number;            // For handling updates to schema
  config: Record<string, any>; // Type-specific configuration
  resources: {
    id: string;
    type: 'image' | 'video' | 'document' | 'link';
    url: string;
    title?: string;
    description?: string;
  }[];
  metadata: {
    objectives: string[];
    prerequisites: string[];
    estimatedDuration: number;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
  };
  analytics: {
    enabled: boolean;
    trackViews: boolean;
    trackInteractions: boolean;
    trackCompletion: boolean;
    customTracking?: Record<string, any>;
  };
}
```

#### 3. Activity Type Implementations

Implement specialized components for different activity types:

##### Reading Activity

```typescript
const ReadingActivitySchema = z.object({
  content: z.array(z.object({
    type: z.enum(['heading', 'paragraph', 'image', 'video', 'code', 'quote']),
    content: z.string(),
    level: z.number().optional(),
    language: z.string().optional(),
    src: z.string().optional(),
    caption: z.string().optional(),
  })),
  checkpoints: z.array(z.object({
    position: z.number(),
    question: z.string(),
    type: z.enum(['multiple-choice', 'true-false', 'reflection']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.number(), z.array(z.number())]).optional(),
  })).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string(),
  })).optional()
});
```

##### Video Activity

```typescript
const VideoActivitySchema = z.object({
  videoSource: z.enum(['upload', 'youtube', 'vimeo']),
  videoUrl: z.string(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  transcript: z.string().optional(),
  captions: z.array(z.object({
    language: z.string(),
    url: z.string(),
  })).optional(),
  interactions: z.array(z.object({
    timestamp: z.number(),
    type: z.enum(['quiz', 'note', 'discussion']),
    content: z.any(),
  })).optional(),
  followupQuestions: z.array(z.object({
    question: z.string(),
    type: z.enum(['multiple-choice', 'short-answer']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.any().optional(),
  })).optional()
});
```

##### Quiz Activity

```typescript
const QuizActivitySchema = z.object({
  instructions: z.string(),
  timeLimit: z.number().optional(),
  randomizeQuestions: z.boolean().optional(),
  showResults: z.enum(['immediately', 'after_submission', 'after_closing']),
  passingScore: z.number().optional(),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum([
      'multiple-choice-single',
      'multiple-choice-multiple',
      'true-false',
      'short-answer',
      'matching',
      'ordering',
      'fill-in-blanks',
      'numerical',
      'essay'
    ]),
    questionText: z.string(),
    media: z.object({
      type: z.enum(['image', 'video', 'audio']),
      url: z.string(),
    }).optional(),
    points: z.number(),
    options: z.array(z.any()).optional(),
    correctAnswer: z.any(),
    feedback: z.object({
      correct: z.string().optional(),
      incorrect: z.string().optional(),
    }).optional(),
    hints: z.array(z.string()).optional(),
  }))
});
```

#### 4. Activity Builder Interface

Create a modular activity builder that adapts based on the selected activity type:

```tsx
function ActivityBuilder({ activityType, initialConfig, onSave }) {
  const activityDef = activityRegistry[activityType];
  const [config, setConfig] = useState(initialConfig || activityDef.defaultConfig);
  
  // Dynamic component rendering based on activity type
  const EditorComponent = activityDef.components.editor;
  
  return (
    <div>
      <h2>Creating {activityDef.name}</h2>
      <EditorComponent 
        config={config} 
        onChange={setConfig} 
      />
      <Button onClick={() => onSave(config)}>Save Activity</Button>
    </div>
  );
}
```

#### 5. Activity Viewer

Create a unified viewer that renders the appropriate component based on activity type:

```tsx
function ActivityViewer({ activity, mode = 'student', onInteraction }) {
  const activityDef = activityRegistry[activity.activityTypeId];
  const ViewerComponent = activityDef.components.viewer;
  
  // Track view analytics
  useEffect(() => {
    if (activity.analytics?.trackViews) {
      recordActivityView(activity.id);
    }
  }, [activity.id]);
  
  return (
    <div className="activity-viewer">
      <h1>{activity.title}</h1>
      <ViewerComponent 
        config={activity.config}
        mode={mode}
        onInteraction={(data) => {
          // Record interactions if enabled
          if (activity.analytics?.trackInteractions) {
            recordActivityInteraction(activity.id, data);
          }
          
          if (onInteraction) onInteraction(data);
        }}
      />
    </div>
  );
}
```

### Integration with Quiz Component

Implement a quiz activity type using react-quiz-component:

```tsx
function QuizEditor({ config, onChange }) {
  return (
    <div>
      <h3>Quiz Editor</h3>
      
      <div className="form-group">
        <label>Quiz Title</label>
        <input
          value={config.quizTitle}
          onChange={(e) => onChange({...config, quizTitle: e.target.value})}
        />
      </div>
      
      <div className="form-group">
        <label>Synopsis</label>
        <textarea
          value={config.quizSynopsis}
          onChange={(e) => onChange({...config, quizSynopsis: e.target.value})}
        />
      </div>
      
      <QuestionBuilder
        questions={config.questions || []}
        onChange={(questions) => onChange({...config, questions})}
      />
      
      <SettingsPanel
        settings={{
          shuffle: config.shuffle || false,
          showInstantFeedback: config.showInstantFeedback || false,
          continueTillCorrect: config.continueTillCorrect || false
        }}
        onChange={(settings) => onChange({...config, ...settings})}
      />
    </div>
  );
}

function QuizViewer({ config, mode }) {
  return (
    <div className="quiz-viewer">
      <Quiz 
        quiz={config}
        shuffle={config.shuffle}
        showInstantFeedback={config.showInstantFeedback}
        continueTillCorrect={config.continueTillCorrect}
        onComplete={mode === 'student' ? recordQuizCompletion : undefined}
      />
    </div>
  );
}

// Register the quiz activity type
registerActivityType({
  id: 'quiz',
  name: 'Interactive Quiz',
  description: 'Create interactive quizzes with various question types',
  category: ActivityPurpose.ASSESSMENT,
  subCategory: AssessmentType.QUIZ,
  configSchema: QuizSchema,
  defaultConfig: {
    quizTitle: 'New Quiz',
    quizSynopsis: 'Please answer all questions',
    questions: [],
    shuffle: false,
    showInstantFeedback: true
  },
  capabilities: {
    isGradable: true,
    hasSubmission: true,
    hasInteraction: true,
    hasRealTimeComponents: false
  },
  components: {
    editor: QuizEditor,
    viewer: QuizViewer,
    analytics: QuizAnalytics
  }
});
```

## Benefits

1. **Type-specific interfaces**: Each activity type gets a tailored editing experience
2. **Schema validation**: Ensure activity configurations are always valid
3. **Component reusability**: Share components across different activity types
4. **Extensibility**: Easily add new activity types without changing the core system
5. **Analytics**: Built-in hooks for detailed learning analytics
6. **Versioning**: Track schema versions to handle updates gracefully

## Implementation Plan

1. Design the activity type registry system
2. Define core activity types and their schemas
3. Develop the base activity editor and viewer components
4. Implement specialized editors for each activity type
5. Create the analytics integration
6. Build migration tools for existing activities
7. Develop documentation and examples for creating new activity types

## Technical Considerations

1. Create a plugin architecture for adding new activity types
2. Implement client-side validation with server-side verification
3. Consider performance implications of complex activities
4. Design for offline capabilities where possible
5. Build with accessibility as a core requirement