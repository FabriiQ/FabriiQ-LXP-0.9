# Component-Based Activities Implementation Plan

## 1. Overview

This document outlines the implementation plan for migrating from the current activity system to a component-based activity system using Plate.js for rich text editing. This approach will provide more specialized interfaces for different activity types, greater interactivity, and improved analytics.

## 2. Current System Analysis

### 2.1 Database Model

The current activity model in the database is basic but provides a foundation:

```prisma
model Activity {
  id              String            @id @default(cuid())
  title           String
  purpose         ActivityPurpose
  learningType    LearningActivityType?
  assessmentType  AssessmentType?
  status          SystemStatus      @default(ACTIVE)
  subjectId       String
  topicId         String?           // Direct topic association
  classId         String
  content         Json              // Currently stores simple content

  // Grading fields
  isGradable      Boolean           @default(false)
  maxScore        Float?
  passingScore    Float?
  weightage       Float?            // Contribution to overall grade
  gradingConfig   Json?             // Configuration for grading
  
  // Time fields
  startDate       DateTime?
  endDate         DateTime?
  duration        Int?              // in minutes
  
  // Standard fields
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relationships
  class           Class             @relation(fields: [classId], references: [id], onDelete: Cascade)
  subject         Subject           @relation(fields: [subjectId], references: [id])
  topic           SubjectTopic?     @relation(fields: [topicId], references: [id])
  activityGrades  ActivityGrade[]   // Student grades for this activity
}
```

### 2.2 Current Limitations

1. The JSON `content` field lacks structured validation for different activity types
2. There's no specialized UI for different activity types (reading, quiz, video, etc.)
3. Rich text editing is limited or non-existent
4. Limited interactive elements for students
5. Minimal analytics tracking within activities
6. No standardized way to handle different types of content (images, videos, etc.)

## 3. Implementation Plan

### 3.1 Dependencies Installation

First, we need to install Plate.js and its dependencies:

```bash
npm install @udecode/plate-common @udecode/plate-core @udecode/plate-ui @udecode/plate-serializer-md slate slate-react slate-history
```

### 3.2 Enhanced Database Schema

While we will keep the existing Activity model for backward compatibility, we'll enhance the content field with structured JSON. The content field will now follow this structure:

```typescript
type ActivityContent = {
  version: number;                        // Schema version for migrations
  activityType: string;                   // Type identifier (reading, quiz, video, etc.)
  blocks: ActivityBlock[];                // Ordered content blocks
  settings: Record<string, any>;          // Activity-specific settings
  metadata: {                            
    objectives: string[];
    prerequisites: string[];
    estimatedDuration: number;
    difficultyLevel: string;
    tags: string[];
  };
  analytics?: {
    trackViews: boolean;
    trackInteractions: boolean;
    trackCompletion: boolean;
    customTracking?: Record<string, any>;
  };
}

type ActivityBlock = {
  id: string;                              // Unique block ID
  type: string;                            // Block type (text, image, video, quiz, etc.)
  content: Record<string, any>;            // Block-specific content
  settings?: Record<string, any>;          // Block-specific settings
}
```

### 3.3 Activity Type Registry

We'll create a registry system for activity types:

```typescript
// src/features/activities/registry/ActivityTypeRegistry.ts
import { z } from 'zod';

export interface ActivityTypeDefinition {
  id: string;
  name: string;
  description: string;
  category: 'LEARNING' | 'ASSESSMENT' | 'PRACTICE';
  configSchema: z.ZodSchema;
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
    analytics?: React.ComponentType<{
      activityId: string;
      classId: string;
    }>;
  };
}

// Registry singleton
class ActivityRegistry {
  private activityTypes = new Map<string, ActivityTypeDefinition>();

  register(activityType: ActivityTypeDefinition) {
    this.activityTypes.set(activityType.id, activityType);
  }

  get(id: string) {
    return this.activityTypes.get(id);
  }

  getAll() {
    return Array.from(this.activityTypes.values());
  }

  getByCategory(category: 'LEARNING' | 'ASSESSMENT' | 'PRACTICE') {
    return this.getAll().filter(type => type.category === category);
  }
}

export const activityRegistry = new ActivityRegistry();
```

### 3.4 Plate.js Integration

We'll create a PlateEditor component that can be used across different activity types:

```typescript
// src/components/plate-editor/PlateEditor.tsx
import React from 'react';
import { Plate, createPlateEditor, createPluginFactory, createPlateUI, PlateRenderElementProps } from '@udecode/plate-core';
import { createParagraphPlugin } from '@udecode/plate-paragraph';
import { createHeadingPlugin } from '@udecode/plate-heading';
import { createBoldPlugin } from '@udecode/plate-bold';
import { createItalicPlugin } from '@udecode/plate-italic';
import { createUnderlinePlugin } from '@udecode/plate-underline';
import { createLinkPlugin } from '@udecode/plate-link';
import { createImagePlugin } from '@udecode/plate-image';
import { createCodeBlockPlugin } from '@udecode/plate-code-block';
import { createListPlugin } from '@udecode/plate-list';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Define the editor components and plugins
const plugins = [
  createParagraphPlugin(),
  createHeadingPlugin(),
  createBoldPlugin(),
  createItalicPlugin(),
  createUnderlinePlugin(),
  createLinkPlugin(),
  createListPlugin(),
  createImagePlugin(),
  createCodeBlockPlugin(),
];

export const PlateEditor = ({ value, onChange, readOnly = false }) => {
  const editor = createPlateEditor({
    plugins,
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <Plate
        editor={editor}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
      >
        {/* Editor components will go here */}
      </Plate>
    </DndProvider>
  );
};
```

### 3.5 Activity Type Implementations

We'll implement several activity types starting with the most common ones:

#### 3.5.1 Reading Activity

```typescript
// src/features/activities/types/reading/ReadingActivity.tsx
import { z } from 'zod';
import { activityRegistry } from '../../registry/ActivityTypeRegistry';
import { PlateEditor } from '@/components/plate-editor/PlateEditor';

const ReadingActivitySchema = z.object({
  content: z.array(z.any()), // Plate.js content
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

const ReadingActivityEditor = ({ config, onChange }) => {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Content</h3>
        <PlateEditor 
          value={config.content}
          onChange={(newContent) => onChange({ ...config, content: newContent })}
        />
      </div>
      
      {/* Add checkpoint editor */}
      {/* Add attachment editor */}
    </div>
  );
};

const ReadingActivityViewer = ({ config, mode, onInteraction }) => {
  return (
    <div className="space-y-8">
      <div className="prose max-w-none">
        <PlateEditor 
          value={config.content}
          readOnly={true}
        />
      </div>
      
      {/* Display checkpoints for students */}
      {/* Display attachments */}
    </div>
  );
};

// Register the activity type
activityRegistry.register({
  id: 'reading',
  name: 'Reading Activity',
  description: 'Text-based reading materials with optional checkpoints',
  category: 'LEARNING',
  configSchema: ReadingActivitySchema,
  defaultConfig: {
    content: [{ type: 'p', children: [{ text: '' }] }],
    checkpoints: [],
    attachments: [],
  },
  capabilities: {
    isGradable: false,
    hasSubmission: false,
    hasInteraction: true,
    hasRealTimeComponents: false,
  },
  components: {
    editor: ReadingActivityEditor,
    viewer: ReadingActivityViewer,
  }
});
```

#### 3.5.2 Quiz Activity

```typescript
// src/features/activities/types/quiz/QuizActivity.tsx
import { z } from 'zod';
import { activityRegistry } from '../../registry/ActivityTypeRegistry';
import { PlateEditor } from '@/components/plate-editor/PlateEditor';

const QuizActivitySchema = z.object({
  instructions: z.array(z.any()), // Plate.js content for instructions
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
    questionText: z.array(z.any()), // Plate.js content for question
    media: z.object({
      type: z.enum(['image', 'video', 'audio']),
      url: z.string(),
    }).optional(),
    points: z.number(),
    options: z.array(z.any()).optional(),
    correctAnswer: z.any(),
    feedback: z.object({
      correct: z.array(z.any()).optional(), // Plate.js content
      incorrect: z.array(z.any()).optional(), // Plate.js content
    }).optional(),
    hints: z.array(z.array(z.any())).optional(), // Array of Plate.js content
  }))
});

// Implement editor and viewer components
// ...
```

#### 3.5.3 Video Activity

```typescript
// src/features/activities/types/video/VideoActivity.tsx
import { z } from 'zod';
import { activityRegistry } from '../../registry/ActivityTypeRegistry';
import { PlateEditor } from '@/components/plate-editor/PlateEditor';

const VideoActivitySchema = z.object({
  videoSource: z.enum(['upload', 'youtube', 'vimeo']),
  videoUrl: z.string(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  description: z.array(z.any()).optional(), // Plate.js content
  transcript: z.array(z.any()).optional(), // Plate.js content
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
    question: z.array(z.any()), // Plate.js content
    type: z.enum(['multiple-choice', 'short-answer']),
    options: z.array(z.array(z.any())).optional(), // Array of Plate.js content
    correctAnswer: z.any().optional(),
  })).optional()
});

// Implement editor and viewer components
// ...
```

### 3.6 Activity Builder UI

Create a unified activity builder interface that adapts based on the selected activity type:

```typescript
// src/app/admin/campus/classes/[id]/activities/new/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { activityRegistry } from '@/features/activities/registry/ActivityTypeRegistry';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Select } from '@/components/ui/forms/select';
import { Input } from '@/components/ui/forms/input';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';

export default function NewActivityPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  
  const [activityType, setActivityType] = useState('');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('LEARNING');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [config, setConfig] = useState({});
  
  const { data: subjects } = api.class.getSubjects.useQuery({
    classId,
  });
  
  const { data: topics } = api.subject.getTopics.useQuery({
    subjectId,
  }, {
    enabled: !!subjectId,
  });
  
  const createActivity = api.activity.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Activity Created',
        description: 'The activity has been created successfully',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/activities`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });
  
  const selectedActivityType = activityType ? activityRegistry.get(activityType) : null;
  
  const handleSubmit = () => {
    if (!selectedActivityType) return;
    
    // Create structured content
    const content = {
      version: 1,
      activityType,
      blocks: [],
      settings: {},
      metadata: {
        objectives: [],
        prerequisites: [],
        estimatedDuration: 0,
        difficultyLevel: 'intermediate',
        tags: [],
      },
      ...config,
    };
    
    createActivity.mutate({
      title,
      purpose: purpose as any,
      subjectId,
      topicId: topicId || undefined,
      classId,
      content,
      isGradable: selectedActivityType.capabilities.isGradable,
    });
  };
  
  return (
    <div className="container">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create New Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-medium">Activity Type</label>
              <Select
                value={activityType}
                onValueChange={setActivityType}
                options={activityRegistry.getAll().map(type => ({
                  label: type.name,
                  value: type.id,
                }))}
                placeholder="Select an activity type"
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter activity title"
              />
            </div>
            
            {/* Add subject and topic selectors */}
            
            {selectedActivityType && (
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">{selectedActivityType.name} Configuration</h3>
                <selectedActivityType.components.editor
                  config={config}
                  onChange={setConfig}
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!activityType || !title || !subjectId}>
                Create Activity
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.7 Activity Viewer

Create a unified activity viewer that renders the appropriate component based on activity type:

```typescript
// src/components/activities/ActivityViewer.tsx
import { useEffect } from 'react';
import { activityRegistry } from '@/features/activities/registry/ActivityTypeRegistry';
import { api } from '@/trpc/react';

interface ActivityViewerProps {
  activity: any;
  mode?: 'preview' | 'student' | 'teacher';
  onInteraction?: (data: any) => void;
}

export function ActivityViewer({ activity, mode = 'student', onInteraction }: ActivityViewerProps) {
  // Extract activity type from content
  const activityType = activity.content?.activityType;
  const activityDef = activityType ? activityRegistry.get(activityType) : null;
  
  // Track view analytics
  useEffect(() => {
    if (activity.content?.analytics?.trackViews) {
      // Call analytics API to record view
      api.analytics.recordActivityView.mutate({ activityId: activity.id });
    }
  }, [activity.id]);
  
  if (!activityDef) {
    // Fallback for old or unknown activity types
    return (
      <div className="p-4 border rounded-md bg-muted">
        <h2 className="text-xl font-bold mb-4">{activity.title}</h2>
        <div className="prose max-w-none">
          {typeof activity.content === 'string' 
            ? activity.content 
            : JSON.stringify(activity.content, null, 2)}
        </div>
      </div>
    );
  }
  
  const ViewerComponent = activityDef.components.viewer;
  
  return (
    <div className="activity-viewer">
      <h1 className="text-2xl font-bold mb-4">{activity.title}</h1>
      <ViewerComponent 
        config={activity.content}
        mode={mode}
        onInteraction={(data) => {
          // Record interactions if enabled
          if (activity.content?.analytics?.trackInteractions) {
            api.analytics.recordActivityInteraction.mutate({
              activityId: activity.id,
              data
            });
          }
          
          if (onInteraction) onInteraction(data);
        }}
      />
    </div>
  );
}
```

### 3.8 API Updates

Update the activity API to support the new component-based structure:

```typescript
// src/server/api/types/activity.ts
// Add new schema for component-based activities

export const componentBasedActivitySchema = z.object({
  title: z.string().min(1).max(100),
  purpose: z.nativeEnum(ActivityPurpose),
  subjectId: z.string(),
  topicId: z.string().optional(),
  classId: z.string(),
  content: z.object({
    version: z.number(),
    activityType: z.string(),
    blocks: z.array(z.any()).optional(),
    settings: z.record(z.any()).optional(),
    metadata: z.object({
      objectives: z.array(z.string()).optional(),
      prerequisites: z.array(z.string()).optional(),
      estimatedDuration: z.number().optional(),
      difficultyLevel: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }).optional(),
    analytics: z.object({
      trackViews: z.boolean().optional(),
      trackInteractions: z.boolean().optional(),
      trackCompletion: z.boolean().optional(),
      customTracking: z.record(z.any()).optional(),
    }).optional(),
  }),
  isGradable: z.boolean().optional().default(false),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weightage: z.number().optional(),
  gradingConfig: z.record(z.any()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  duration: z.number().int().optional(),
});
```

### 3.9 Analytics Integration

Implement analytics tracking for activities:

```typescript
// src/server/api/services/analytics.service.ts
export class AnalyticsService {
  private readonly prisma: PrismaClient;
  
  constructor(config: ServiceConfig) {
    this.prisma = config.prisma;
  }
  
  async recordActivityView(userId: string, activityId: string) {
    return this.prisma.analyticsEvent.create({
      data: {
        event: 'ACTIVITY_VIEW',
        userId,
        data: {
          activityId
        },
        timestamp: new Date()
      }
    });
  }
  
  async recordActivityInteraction(userId: string, activityId: string, data: any) {
    return this.prisma.analyticsEvent.create({
      data: {
        event: 'ACTIVITY_INTERACTION',
        userId,
        data: {
          activityId,
          interactionData: data
        },
        timestamp: new Date()
      }
    });
  }
  
  async recordActivityCompletion(userId: string, activityId: string, data: any) {
    return this.prisma.analyticsEvent.create({
      data: {
        event: 'ACTIVITY_COMPLETION',
        userId,
        data: {
          activityId,
          completionData: data
        },
        timestamp: new Date()
      }
    });
  }
}
```

## 4. Migration Strategy

### 4.1 Phase 1: Infrastructure Setup

1. Install Plate.js and dependencies
2. Create the activity type registry
3. Set up the PlateEditor component
4. Implement first activity type (Reading)

### 4.2 Phase 2: Initial Implementation

1. Create the activity builder UI
2. Create the activity viewer
3. Update API to support component-based activities
4. Implement analytics tracking

### 4.3 Phase 3: Additional Activity Types

1. Implement Quiz activity type
2. Implement Video activity type
3. Implement additional activity types as needed

### 4.4 Phase 4: Migration of Existing Activities

1. Create a migration script to convert existing activities to the new format
2. Update activity listing pages to handle both old and new activity formats
3. Test migration with sample data

### 4.5 Phase 5: Full Deployment

1. Deploy changes to staging environment
2. Run migration scripts for all existing activities
3. Deploy to production
4. Monitor for issues

## 5. Testing Strategy

1. **Unit Tests**: Create tests for each activity type component
2. **Integration Tests**: Test the activity editor and viewer with different activity types
3. **API Tests**: Ensure API endpoints correctly handle the new activity format
4. **Migration Tests**: Verify that existing activities are correctly migrated
5. **User Acceptance Testing**: Have teachers test the new activity builder

## 6. Timeline

1. Phase 1: 1 week
2. Phase 2: 2 weeks
3. Phase 3: 2 weeks
4. Phase 4: 1 week
5. Phase 5: 1 week

Total estimated time: 7 weeks

## 7. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex activity types require more time | Schedule slippage | Start with simpler activity types, add more complex ones in later iterations |
| Migration issues with existing activities | Data loss or corruption | Create backup, extensive testing of migration scripts |
| Performance issues with Plate.js | Poor user experience | Performance testing, consider alternatives if needed |
| Learning curve for teachers | Low adoption | Create tutorials and documentation |

## 8. Conclusion

This implementation plan provides a structured approach to migrate from the current activity system to a component-based system using Plate.js. The new system will offer greater flexibility, interactivity, and analytics capabilities, enhancing the learning experience for students and providing teachers with more effective tools. 