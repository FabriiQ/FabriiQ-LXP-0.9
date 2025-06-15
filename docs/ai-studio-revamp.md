# AI Content Studio Revamp Plan

This document outlines the plan for revamping the AI Content Studio to align with our new activities architecture and improve performance, particularly for topic loading which currently experiences significant slowdowns with large datasets.

## Current Issues

1. **Performance Issues**:
   - Topic loading is inefficient when handling hundreds or thousands of topics
   - No virtualization implemented for large topic lists
   - Slow initial loading of the AI Studio dialog
   - Redundant API calls and data fetching

2. **Architectural Issues**:
   - Two separate implementations of AI content generation exist
   - Need to standardize on the dialog-based AI generation approach
   - Current implementation doesn't fully align with the new activities architecture
   - H5P-related implementations need to be removed

3. **User Experience Issues**:
   - Inconsistent UI between different parts of the AI Studio
   - Lack of real-time preview for generated activities
   - Limited feedback during content generation process

## Revamp Goals

1. **Performance Optimization**:
   - Implement virtualization for topic loading to handle 1000+ topics efficiently
   - Optimize API calls with proper caching and pagination
   - Implement lazy loading and code splitting for faster initial load
   - Add performance monitoring for AI Studio components

2. **Architecture Alignment**:
   - Standardize on the dialog-based AI generation approach
   - Integrate with the new activities architecture
   - Remove all H5P-related implementations
   - Ensure generated content follows the new activity structure

3. **User Experience Improvements**:
   - Provide consistent UI across all AI Studio components
   - Enhance real-time preview capabilities
   - Improve feedback during content generation
   - Add progress indicators for long-running operations

## Implementation Plan

### Phase 1: Performance Optimization

#### 1.1 Topic Selector Virtualization

Implement virtualization for the topic selector component to efficiently handle large datasets:

```typescript
// src/features/content-studio/components/dialog-steps/VirtualizedTopicSelector.tsx
import { useState, useMemo } from 'react';
import { VirtualizedList } from '@/features/activities/core/components/virtualized/VirtualizedList';
import { SubjectTopic } from '@/server/api/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface VirtualizedTopicSelectorProps {
  topics: SubjectTopic[];
  selectedTopicId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function VirtualizedTopicSelector({ 
  topics, 
  selectedTopicId, 
  onSelect, 
  isLoading 
}: VirtualizedTopicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter topics based on search query
  const filteredTopics = useMemo(() => {
    return topics.filter(topic =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.keywords?.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [topics, searchQuery]);

  // Render a topic item
  const renderTopic = (topic: SubjectTopic) => (
    <div
      key={topic.id}
      className={`p-4 border rounded-md cursor-pointer transition-colors ${
        selectedTopicId === topic.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
      }`}
      onClick={() => onSelect(topic.id)}
    >
      <div className="font-medium">{topic.title}</div>
      <div className="text-sm text-muted-foreground">{topic.code}</div>
      {topic.keywords && topic.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {topic.keywords.slice(0, 3).map((keyword, idx) => (
            <span key={idx} className="px-2 py-1 text-xs bg-secondary rounded-full">
              {keyword}
            </span>
          ))}
          {topic.keywords.length > 3 && (
            <span className="px-2 py-1 text-xs bg-secondary rounded-full">
              +{topic.keywords.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <div className="h-[400px] border rounded-md">
        <VirtualizedList
          items={filteredTopics}
          itemHeight={100} // Adjust based on your topic item height
          renderItem={renderTopic}
          height="100%"
          width="100%"
          overscan={5}
          containerClassName="p-4"
          keyExtractor={(item) => item.id}
          ariaLabel="Topic List"
        />
      </div>
      
      <button
        type="button"
        className="text-sm text-primary hover:underline"
        onClick={() => onSelect('')}
      >
        Skip topic selection
      </button>
    </div>
  );
}
```

#### 1.2 API Optimization

Implement pagination and caching for topic loading:

```typescript
// src/server/api/routers/subject-topic.ts
// Add pagination and caching to the list endpoint

export const subjectTopicRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        subjectId: z.string(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const service = new SubjectTopicService({ prisma: ctx.prisma });
        
        // Use the caching utility to cache the topics query
        const getTopicsCached = cacheTopicsQuery(
          async (subjectId: string, page: number, pageSize: number, search?: string) =>
            await service.listTopics({
              subjectId,
              page,
              pageSize,
              search,
            })
        );
        
        return await getTopicsCached(
          input.subjectId,
          input.page,
          input.pageSize,
          input.search
        );
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get topics: ${(error as Error).message}`,
        });
      }
    }),
});
```

#### 1.3 Performance Monitoring

Add performance monitoring for AI Studio components:

```typescript
// src/features/content-studio/utils/performance-monitoring.ts
export function recordAIStudioPerformance(
  component: string,
  action: string,
  startTime: number,
  endTime: number
) {
  const duration = endTime - startTime;
  
  // Log performance metrics
  console.log(`AI Studio Performance: ${component} - ${action} - ${duration}ms`);
  
  // Send metrics to analytics service if available
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track('AI Studio Performance', {
      component,
      action,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Phase 2: Architecture Alignment

#### 2.1 Standardize on Dialog-Based AI Generation

Update the AI Content Studio to use only the dialog-based approach:

```typescript
// src/features/content-studio/index.ts
export { AIStudioDialog } from './components/AIStudioDialog';
// Remove exports of the old implementation
```

#### 2.2 Integrate with New Activities Architecture

Update the content generation service to align with the new activities architecture:

```typescript
// src/features/content-studio/services/content-generator.service.ts
import { ActivityPurpose, LearningActivityType } from '@/server/api/constants';
import { aiResponseCache, AIResponseCacheService } from './ai-cache.service';
import { aiRequestQueue } from './request-queue.service';
import { activityRegistry } from '@/components/shared/entities/activities';

export async function generateContent(params: ContentGenerationParams): Promise<Record<string, any>> {
  // Create a cache key based on the parameters
  const cacheKey = AIResponseCacheService.generateKey('content-generation', params);

  // Try to get from cache or generate new content
  return await aiResponseCache.getOrGenerate(cacheKey, async () => {
    // Use the request queue to manage concurrent requests
    return await aiRequestQueue.enqueueMediumPriority(async () => {
      // Get the activity type definition from the registry
      const activityTypeDef = activityRegistry.get(params.activityType);
      
      if (!activityTypeDef) {
        throw new Error(`Activity type ${params.activityType} not found in registry`);
      }
      
      // Generate content using AI agent
      // This will be implemented in Phase 3
      
      // For now, return a placeholder that matches the new activity structure
      const content = {
        title: `${params.difficultyLevel} ${activityTypeDef.name}`,
        description: `A ${params.difficultyLevel} level ${activityTypeDef.name.toLowerCase()} activity with ${params.numQuestions} questions.`,
        type: params.activityType,
        purpose: params.activityPurpose,
        config: activityTypeDef.defaultConfig,
        // Add other required fields based on the activity schema
      };
      
      return content;
    });
  });
}
```

#### 2.3 Remove H5P-Related Implementations

Remove all H5P-related code from the AI Content Studio:

1. Remove H5P imports from register-activities.ts
2. Remove H5P-related components and types
3. Update any references to H5P in the AI Content Studio

### Phase 3: User Experience Improvements

#### 3.1 Consistent UI

Ensure consistent UI across all AI Studio components:

```typescript
// src/features/content-studio/components/AIStudioDialog.tsx
// Update the dialog to use consistent UI components

// Use the same styling, layout, and component structure throughout the dialog
// Ensure mobile-first design with responsive layouts
```

#### 3.2 Real-Time Preview

Enhance the preview capabilities for generated activities:

```typescript
// src/features/content-studio/components/AIConversationInterface.tsx
// Add a real-time preview tab

<Tabs defaultValue="conversation">
  <TabsList>
    <TabsTrigger value="conversation">Conversation</TabsTrigger>
    <TabsTrigger value="preview">Preview</TabsTrigger>
    <TabsTrigger value="code">JSON</TabsTrigger>
  </TabsList>
  
  <TabsContent value="conversation">
    {/* Conversation UI */}
  </TabsContent>
  
  <TabsContent value="preview">
    <div className="border rounded-md p-4">
      {currentContent && activityType && (
        <DynamicActivityPreview
          activityType={activityType}
          config={currentContent.config}
          mode="preview"
        />
      )}
    </div>
  </TabsContent>
  
  <TabsContent value="code">
    <pre className="bg-muted p-4 rounded-md overflow-auto">
      {JSON.stringify(currentContent, null, 2)}
    </pre>
  </TabsContent>
</Tabs>
```

#### 3.3 Improved Feedback

Add better feedback during content generation:

```typescript
// src/features/content-studio/components/GeneratingContent.tsx
// Create a component that shows the generation progress

export function GeneratingContent() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-primary" />
      </div>
      
      <h3 className="text-xl font-semibold">Generating Your Activity</h3>
      
      <div className="text-center text-muted-foreground">
        <p>Our AI is crafting your activity based on your specifications.</p>
        <p className="text-sm mt-2">This usually takes 15-30 seconds.</p>
      </div>
      
      <div className="w-full max-w-md">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
```

## Technical Implementation Details

### Data Flow

1. **User Input** → User selects subject, topic, activity type, and parameters
2. **Content Generation** → AI generates content based on user input
3. **Content Review** → User reviews and refines content through conversation
4. **Activity Creation** → Content is saved as an activity in the new format

### API Endpoints

Update or create the following API endpoints:

1. `api.subject.getTeacherSubjects` - Get subjects assigned to the teacher
2. `api.subjectTopic.list` - Get topics for a subject with pagination and virtualization support
3. `api.aiContentStudio.generateContent` - Generate content using AI
4. `api.activity.create` - Create an activity with the generated content

### Database Changes

No schema changes are required, but ensure that the generated content follows the new activity structure:

```typescript
// Activity structure
{
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  purpose: ActivityPurpose;
  status: ActivityStatus;
  config: Record<string, any>; // Activity-specific configuration
  points: number;
  timeEstimate: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
  capabilities: {
    isGradable: boolean;
    hasSubmission: boolean;
    hasInteraction: boolean;
    hasRealTimeComponents: boolean;
  };
}
```

## Performance Optimization Strategies

1. **Virtualization**:
   - Implement virtualized lists for topics and other large datasets
   - Only render visible items to reduce DOM size and improve performance

2. **Code Splitting**:
   - Lazy load components that aren't immediately needed
   - Use dynamic imports for heavy components

3. **Caching**:
   - Cache API responses to reduce server load
   - Implement client-side caching for frequently accessed data

4. **Pagination**:
   - Load data in smaller chunks
   - Implement infinite scrolling for large datasets

5. **Optimized Rendering**:
   - Use React.memo for pure components
   - Implement useMemo for expensive calculations
   - Avoid unnecessary re-renders

6. **Asset Optimization**:
   - Lazy load images and other assets
   - Use appropriate image formats and sizes

7. **State Management**:
   - Localize state when possible
   - Use context API efficiently

8. **Network Optimization**:
   - Implement data prefetching
   - Reduce API call frequency

## Timeline and Milestones

1. **Week 1**: Performance Optimization
   - Implement virtualization for topic selector
   - Optimize API calls with caching and pagination
   - Add performance monitoring

2. **Week 2**: Architecture Alignment
   - Standardize on dialog-based AI generation
   - Integrate with new activities architecture
   - Remove H5P-related implementations

3. **Week 3**: User Experience Improvements
   - Ensure consistent UI
   - Enhance preview capabilities
   - Improve feedback during content generation

4. **Week 4**: Testing and Refinement
   - Conduct performance testing
   - Fix bugs and issues
   - Optimize based on performance metrics

## Conclusion

The AI Content Studio revamp will align with our new activities architecture while significantly improving performance, especially for topic loading. By implementing virtualization, optimizing API calls, and enhancing the user experience, we will create a more efficient and user-friendly tool for generating educational content.
