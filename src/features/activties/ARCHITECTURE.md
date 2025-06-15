# Activities System Architecture

This document provides a detailed overview of the activities system architecture, including component relationships, data flow, and design patterns.

## System Overview

The activities system is designed as a modular, extensible framework for creating, editing, and viewing interactive learning activities. It follows a component-based architecture with clear separation of concerns and well-defined interfaces.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Activities System                              │
│                                                                          │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│  │    Models   │     │  Components │     │    Utils    │                │
│  └─────────────┘     └─────────────┘     └─────────────┘                │
│         │                   │                   │                        │
│         ▼                   ▼                   ▼                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│  │ Base Models │     │   Viewers   │     │ Accessibility│                │
│  └─────────────┘     └─────────────┘     └─────────────┘                │
│         │                   │                   │                        │
│         │                   │                   │                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│  │Activity Type│     │   Editors   │     │  Analytics  │                │
│  │   Models    │     └─────────────┘     └─────────────┘                │
│  └─────────────┘             │                   │                       │
│         │                    │                   │                       │
│         ▼                    ▼                   ▼                       │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                      UI Components                           │        │
│  │                                                              │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │        │
│  │  │ActivityButton│  │SelectableOpt│  │ProgressIndic│          │        │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │        │
│  │                                                              │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │        │
│  │  │QuestionHint │  │RichTextEditor│  │RichTextDisp │          │        │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │        │
│  │                                                              │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │        │
│  │  │MediaUploader│  │MediaDisplay │  │MediaSelector│          │        │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │        │
│  │                                                              │        │
│  │  ┌─────────────┐  ┌─────────────┐                           │        │
│  │  │JinaImageSrch│  │AccessibTester│                           │        │
│  │  └─────────────┘  └─────────────┘                           │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                     Activity Types                           │        │
│  │                                                              │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │        │
│  │  │Multiple     │  │True/False   │  │Multiple     │          │        │
│  │  │Choice       │  │             │  │Response     │          │        │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │        │
│  │                                                              │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │        │
│  │  │Fill in the  │  │Matching     │  │Sequence     │          │        │
│  │  │Blanks       │  │             │  │             │          │        │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │        │
│  │                                                              │        │
│  │  ┌─────────────┐  ┌─────────────┐                           │        │
│  │  │Reading      │  │Video        │                           │        │
│  │  │             │  │             │                           │        │
│  │  └─────────────┘  └─────────────┘                           │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                     Integration                              │        │
│  │                                                              │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │        │
│  │  │AI Converters│  │Analytics    │  │Accessibility │          │        │
│  │  │             │  │Tracking     │  │Testing       │          │        │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │        │
│  │                                                              │        │
│  │  ┌─────────────┐  ┌─────────────┐                           │        │
│  │  │SimpleActivity│  │Jina AI      │                           │        │
│  │  │Preview      │  │Integration   │                           │        │
│  │  └─────────────┘  └─────────────┘                           │        │
│  └─────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Relationships

### Core Components

The activities system is built around several core components:

1. **Models**: Define the data structures for activities
2. **Viewers**: Display activities to users
3. **Editors**: Allow creation and editing of activities
4. **UI Components**: Reusable UI elements
5. **Utils**: Utility functions and helpers

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Models   │ ──▶ │   Editors   │ ──▶ │  Activity   │
│             │     │             │     │   Data      │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Analytics  │ ◀── │   Viewers   │ ◀── │  Activity   │
│   Events    │     │             │     │   Data      │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. **Activity Creation Flow**:
   - Models define the structure of activities
   - Editors use these models to create and modify activities
   - Activity data is stored and can be passed to viewers

2. **Activity Viewing Flow**:
   - Activity data is passed to viewers
   - Viewers render the activity for user interaction
   - User interactions generate analytics events

### AI Integration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ AI-Generated│ ──▶ │ AI Converters│ ──▶ │  Activity   │
│   Content   │     │             │     │   Models    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│SimpleActivity│ ◀── │   Editors   │ ◀── │  Activity   │
│   Preview   │     │             │     │   Data      │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. **AI Content Generation**:
   - AI generates content in a generic format
   - AI converters transform this content into activity-specific models
   - Activity data is created based on these models

2. **AI Content Preview**:
   - SimpleActivityPreview component displays the AI-generated content
   - Editors allow modification of the content
   - Final activity data is saved

## Detailed Component Architecture

### Models

The models layer defines the data structures for activities:

```
┌─────────────────────────────────────────────────────────┐
│                        Models                           │
│                                                         │
│  ┌─────────────┐                                        │
│  │ Base Models │                                        │
│  │             │                                        │
│  │ - Activity  │                                        │
│  │ - Settings  │                                        │
│  │ - Metadata  │                                        │
│  └─────────────┘                                        │
│          │                                              │
│          ▼                                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Activity Type Models                 │  │
│  │                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │  │
│  │  │MultipleChoice│  │TrueFalse    │  │Multiple  │  │  │
│  │  │- Question   │  │- Question   │  │Response  │  │  │
│  │  │- Option     │  │- Statement  │  │- Question│  │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  │                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │  │
│  │  │FillInBlanks │  │Matching     │  │Sequence  │  │  │
│  │  │- Question   │  │- Question   │  │- Question│  │  │
│  │  │- Blank      │  │- Pair       │  │- Item    │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Components

The components layer includes viewers and editors for each activity type:

```
┌─────────────────────────────────────────────────────────┐
│                      Components                         │
│                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │        Viewers          │  │       Editors       │  │
│  │                         │  │                     │  │
│  │  - MultipleChoiceViewer │  │  - MultipleChoiceEd │  │
│  │  - TrueFalseViewer      │  │  - TrueFalseEd      │  │
│  │  - MultipleResponseView │  │  - MultipleResponseE│  │
│  │  - FillInBlanksViewer   │  │  - FillInBlanksEd   │  │
│  │  - MatchingViewer       │  │  - MatchingEd       │  │
│  │  - SequenceViewer       │  │  - SequenceEd       │  │
│  └─────────────────────────┘  └─────────────────────┘  │
│                │                        │              │
│                └────────────┬───────────┘              │
│                             ▼                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │                 UI Components                    │  │
│  │                                                  │  │
│  │  - ActivityButton    - QuestionHint             │  │
│  │  - SelectableOption  - RichTextEditor           │  │
│  │  - ProgressIndicator - RichTextDisplay          │  │
│  │  - MediaUploader     - MediaDisplay             │  │
│  │  - MediaSelector     - JinaImageSearch          │  │
│  │  - AccessibilityTester                          │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Integration

The integration layer connects the activities system with external systems:

```
┌─────────────────────────────────────────────────────────┐
│                      Integration                        │
│                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │     AI Integration      │  │     Analytics       │  │
│  │                         │  │                     │  │
│  │  - AI Converters        │  │  - Activity Events  │  │
│  │  - SimpleActivityPreview│  │  - User Tracking    │  │
│  │  - Jina AI Integration  │  │  - Performance      │  │
│  └─────────────────────────┘  └─────────────────────┘  │
│                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │    Accessibility        │  │     Content Studio   │  │
│  │                         │  │                     │  │
│  │  - Accessibility Tests  │  │  - AIStudioDialog   │  │
│  │  - ARIA Support         │  │  - AIConversationInt│  │
│  │  - Keyboard Navigation  │  │  - Content Creation │  │
│  └─────────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Design Patterns

The activities system employs several design patterns:

### 1. Component Pattern

Each activity type is implemented as a set of components (viewer and editor) that share a common interface.

```typescript
// Common interface for activity viewers
interface ActivityViewerProps<T extends Activity> {
  activity: T;
  mode?: 'student' | 'teacher';
  onSubmit?: (answers: any, result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
}

// Implementation for specific activity type
export const MultipleChoiceViewer: React.FC<ActivityViewerProps<MultipleChoiceActivity>> = ({
  activity,
  mode = 'student',
  onSubmit,
  onProgress,
  className
}) => {
  // Implementation
};
```

### 2. Composition Pattern

UI components are composed to create more complex components.

```tsx
// Composition of UI components
<div className="question-container">
  <RichTextDisplay content={question.text} />
  <MediaDisplay media={question.media} />
  <QuestionHint hint={question.hint} />
  <div className="options">
    {question.options.map(option => (
      <SelectableOption
        key={option.id}
        selected={selectedOption === option.id}
        correct={isSubmitted ? option.isCorrect : undefined}
        onClick={() => handleOptionSelect(option.id)}
      >
        <RichTextDisplay content={option.text} />
        {option.media && <MediaDisplay media={option.media} />}
      </SelectableOption>
    ))}
  </div>
</div>
```

### 3. Strategy Pattern

Different grading strategies are implemented for each activity type.

```typescript
// Strategy interface
interface GradingStrategy<T extends Activity, A> {
  grade(activity: T, answers: A): GradingResult;
}

// Implementation for multiple choice
export const gradeMultipleChoiceActivity: GradingStrategy<
  MultipleChoiceActivity,
  Record<string, string>
> = (activity, answers) => {
  // Implementation
};
```

### 4. Observer Pattern

Analytics tracking uses an observer pattern to track user interactions.

```typescript
// Observer (analytics manager)
export class AnalyticsManager {
  private listeners: AnalyticsListener[] = [];

  addListener(listener: AnalyticsListener) {
    this.listeners.push(listener);
  }

  trackEvent(eventType: string, eventData: any) {
    this.listeners.forEach(listener => listener.onEvent(eventType, eventData));
  }
}

// Usage
analyticsManager.trackEvent('option_select', {
  activityId,
  questionId,
  optionId,
  isCorrect
});
```

### 5. Factory Pattern

Activity creators use a factory pattern to create new activities.

```typescript
// Factory function
export function createDefaultMultipleChoiceActivity(): MultipleChoiceActivity {
  return {
    id: generateId(),
    title: 'New Multiple Choice Activity',
    description: '',
    instructions: '',
    activityType: 'multiple-choice',
    questions: [createDefaultMultipleChoiceQuestion()],
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
      attemptsAllowed: 1,
      showFeedback: true,
      passingScore: 60
    },
    metadata: {
      aiGenerated: false,
      difficulty: 'medium',
      estimatedTime: 5
    }
  };
}
```

## Data Flow Diagrams

### Activity Creation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Activity   │     │   Editor    │     │    User     │
│   Model     │ ──▶ │  Component  │ ◀── │ Interaction │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Updated    │     │  onChange   │     │   Content   │
│  Activity   │ ◀── │  Handler    │ ◀── │   Changes   │
└─────────────┘     └─────────────┘     └─────────────┘
      │
      ▼
┌─────────────┐     ┌─────────────┐
│   onSave    │     │  Saved      │
│   Handler   │ ──▶ │  Activity   │
└─────────────┘     └─────────────┘
```

### Activity Viewing Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Activity   │     │   Viewer    │     │    User     │
│   Data      │ ──▶ │  Component  │ ◀── │ Interaction │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Analytics  │     │  Tracking   │     │    User     │
│   Events    │ ◀── │  Functions  │ ◀── │  Responses  │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
┌─────────────┐     ┌─────────────┐
│  Grading    │     │  Activity   │
│  Functions  │ ──▶ │  Results    │
└─────────────┘     └─────────────┘
```

### AI Integration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │ AI Studio   │     │     AI      │
│   Request   │ ──▶ │   Dialog    │ ──▶ │  Generation │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Activity   │     │     AI      │     │ AI-Generated│
│   Models    │ ◀── │  Converters │ ◀── │   Content   │
└─────────────┘     └─────────────┘     └─────────────┘
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│SimpleActivity│     │    User     │     │   Final     │
│   Preview   │ ──▶ │   Editing   │ ──▶ │  Activity   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Technology Stack

The activities system is built using the following technologies:

- **React**: For building user interfaces
- **TypeScript**: For type safety and better developer experience
- **TailwindCSS**: For styling components
- **react-beautiful-dnd**: For drag-and-drop functionality
- **TipTap**: For rich text editing
- **Jina AI**: For image search and generation

## Performance Considerations

The activities system is designed with performance in mind:

1. **Component Memoization**: Complex components are memoized to prevent unnecessary re-renders
2. **Lazy Loading**: Media components use lazy loading to improve initial load time
3. **Code Splitting**: Activity types are loaded on demand to reduce initial bundle size
4. **Optimized Rendering**: Lists use virtualization for handling large datasets
5. **Efficient State Management**: State updates are batched to minimize renders

## Accessibility Considerations

The activities system is designed to be accessible to all users:

1. **ARIA Attributes**: All interactive elements have appropriate ARIA attributes
2. **Keyboard Navigation**: All interactions can be performed using keyboard
3. **Screen Reader Support**: Content is structured for screen reader compatibility
4. **Color Contrast**: All text meets WCAG AA contrast requirements
5. **Focus Management**: Focus is managed appropriately for interactive elements

## Future Enhancements

Planned enhancements to the architecture include:

1. **Server-Side Rendering**: Improve initial load performance with SSR
2. **Progressive Web App**: Add offline support and installability
3. **GraphQL Integration**: Replace REST API calls with GraphQL for more efficient data fetching
4. **Micro-Frontend Architecture**: Split the system into independently deployable micro-frontends
5. **WebAssembly**: Use WebAssembly for performance-critical operations like complex grading algorithms

## Conclusion

The activities system architecture provides a solid foundation for building interactive learning activities. Its modular design, clear separation of concerns, and well-defined interfaces make it easy to extend and maintain. The system's focus on accessibility, performance, and user experience ensures that it meets the needs of all users.
