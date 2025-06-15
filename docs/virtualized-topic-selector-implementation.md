# Virtualized Topic Selector Implementation

This document provides a detailed implementation plan for the virtualized topic selector component, which is a critical part of the AI Content Studio revamp to address performance issues when loading large numbers of topics.

## Overview

The current topic selector loads all topics at once, which causes performance issues when dealing with hundreds or thousands of topics. The virtualized topic selector will only render the topics that are currently visible in the viewport, significantly improving performance.

## Implementation Steps

### 1. Create the VirtualizedTopicSelector Component

Create a new file at `src/features/content-studio/components/dialog-steps/VirtualizedTopicSelector.tsx`:

```typescript
'use client';

import { useState, useMemo, useCallback } from 'react';
import { VirtualizedList } from '@/features/activities/core/components/virtualized/VirtualizedList';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { recordAIStudioPerformance } from '@/features/content-studio/utils/performance-monitoring';

// Define the Topic interface
interface Topic {
  id: string;
  title: string;
  code: string;
  nodeType?: string;
  description?: string;
  keywords?: string[];
}

interface VirtualizedTopicSelectorProps {
  topics: Topic[];
  selectedTopicId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMoreTopics?: boolean;
}

export function VirtualizedTopicSelector({
  topics,
  selectedTopicId,
  onSelect,
  isLoading,
  onLoadMore,
  hasMoreTopics = false
}: VirtualizedTopicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchStartTime, setSearchStartTime] = useState<number>(0);

  // Filter topics based on search query with memoization
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    
    const startTime = performance.now();
    setSearchStartTime(startTime);
    
    const filtered = topics.filter(topic =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.keywords?.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    const endTime = performance.now();
    recordAIStudioPerformance('VirtualizedTopicSelector', 'filterTopics', startTime, endTime);
    
    return filtered;
  }, [topics, searchQuery]);

  // Handle search input change with debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  }, []);

  // Handle "Skip" option (no topic selected)
  const handleSkip = useCallback(() => {
    onSelect('');
  }, [onSelect]);

  // Render a topic item
  const renderTopic = useCallback((topic: Topic) => (
    <Card
      key={topic.id}
      className={`cursor-pointer transition-colors hover:bg-muted mb-2 ${
        selectedTopicId === topic.id ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={() => onSelect(topic.id)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{topic.code}</span>
          <span className="text-lg font-medium">{topic.title}</span>
          {topic.keywords && topic.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {topic.keywords.slice(0, 3).map((keyword, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {topic.keywords.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{topic.keywords.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ), [selectedTopicId, onSelect]);

  // Handle scroll to end for infinite loading
  const handleScrollEnd = useCallback(() => {
    if (!isLoading && hasMoreTopics && onLoadMore) {
      onLoadMore();
    }
  }, [isLoading, hasMoreTopics, onLoadMore]);

  // Calculate estimated item height
  const estimateSize = useCallback(() => 100, []); // Adjust based on your topic item height

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search topics..."
          className="pl-8"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <Card
        className={`cursor-pointer transition-colors hover:bg-muted ${
          selectedTopicId === '' ? 'border-primary bg-primary/5' : ''
        }`}
        onClick={handleSkip}
      >
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-lg font-medium">Skip topic selection</span>
            <span className="text-sm text-muted-foreground">Create an activity without specifying a topic</span>
          </div>
        </CardContent>
      </Card>

      <div className="h-[400px] border rounded-md">
        {isLoading && topics.length === 0 ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[100px] w-full rounded-md" />
            ))}
          </div>
        ) : (
          <VirtualizedList
            items={filteredTopics}
            itemHeight={100} // Adjust based on your topic item height
            renderItem={renderTopic}
            height="100%"
            width="100%"
            overscan={5}
            containerClassName="p-4"
            keyExtractor={(item) => item.id}
            onEndReached={handleScrollEnd}
            estimateSize={estimateSize}
            ariaLabel="Topic List"
          />
        )}
      </div>

      {filteredTopics.length === 0 && !isLoading && (
        <div className="text-center py-2">
          <p className="text-muted-foreground">No topics found matching "{searchQuery}"</p>
        </div>
      )}

      {isLoading && topics.length > 0 && (
        <div className="flex justify-center py-2">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading more topics...</span>
        </div>
      )}
    </div>
  );
}
```

### 2. Create the Performance Monitoring Utility

Create a new file at `src/features/content-studio/utils/performance-monitoring.ts`:

```typescript
/**
 * Performance monitoring utility for AI Content Studio
 * Records and analyzes performance metrics for various components
 */

// Define the performance metric interface
interface PerformanceMetric {
  component: string;
  action: string;
  duration: number;
  timestamp: number;
}

// Store recent performance metrics for analysis
const recentMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 100; // Maximum number of metrics to store

/**
 * Record a performance metric for an AI Studio component
 * @param component The component name
 * @param action The action being performed
 * @param startTime The start time in milliseconds
 * @param endTime The end time in milliseconds
 */
export function recordAIStudioPerformance(
  component: string,
  action: string,
  startTime: number,
  endTime: number
) {
  const duration = endTime - startTime;
  
  // Log performance metrics in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`AI Studio Performance: ${component} - ${action} - ${duration.toFixed(2)}ms`);
  }
  
  // Store the metric for analysis
  const metric: PerformanceMetric = {
    component,
    action,
    duration,
    timestamp: Date.now(),
  };
  
  recentMetrics.push(metric);
  
  // Keep only the most recent metrics
  if (recentMetrics.length > MAX_METRICS) {
    recentMetrics.shift();
  }
  
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

/**
 * Get performance metrics for a specific component
 * @param component The component name
 * @returns Array of performance metrics
 */
export function getComponentPerformance(component: string): PerformanceMetric[] {
  return recentMetrics.filter(metric => metric.component === component);
}

/**
 * Get average performance for a specific component and action
 * @param component The component name
 * @param action The action name
 * @returns Average duration in milliseconds
 */
export function getAveragePerformance(component: string, action: string): number {
  const metrics = recentMetrics.filter(
    metric => metric.component === component && metric.action === action
  );
  
  if (metrics.length === 0) return 0;
  
  const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
  return total / metrics.length;
}

/**
 * Clear all stored performance metrics
 */
export function clearPerformanceMetrics(): void {
  recentMetrics.length = 0;
}
```

### 3. Update the Subject Topic API Router

Modify the file at `src/server/api/routers/subject-topic.ts` to add pagination support:

```typescript
// Add pagination and search parameters to the list endpoint
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
```

### 4. Create the Topic Cache Service

Create a new file at `src/server/api/cache/topic-cache.service.ts`:

```typescript
/**
 * Topic Cache Service
 * Provides caching for topic queries to improve performance
 */

import { SubjectTopic } from '@prisma/client';
import NodeCache from 'node-cache';

// Cache configuration
const CACHE_TTL = 60 * 5; // 5 minutes
const CACHE_CHECK_PERIOD = 60; // 1 minute

// Create a cache instance
const topicCache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CACHE_CHECK_PERIOD,
});

// Define the cache key generator
function generateCacheKey(subjectId: string, page: number, pageSize: number, search?: string): string {
  return `topics:${subjectId}:${page}:${pageSize}:${search || ''}`;
}

// Define the cached data interface
interface CachedTopicData {
  data: SubjectTopic[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Cache wrapper for topic queries
 * @param queryFn The function that performs the actual query
 * @returns A function that returns cached data or performs the query
 */
export function cacheTopicsQuery<T extends CachedTopicData>(
  queryFn: (subjectId: string, page: number, pageSize: number, search?: string) => Promise<T>
) {
  return async (subjectId: string, page: number, pageSize: number, search?: string): Promise<T> => {
    const cacheKey = generateCacheKey(subjectId, page, pageSize, search);
    
    // Try to get from cache
    const cachedData = topicCache.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, perform the query
    const data = await queryFn(subjectId, page, pageSize, search);
    
    // Store in cache
    topicCache.set(cacheKey, data);
    
    return data;
  };
}

/**
 * Invalidate cache for a specific subject
 * @param subjectId The subject ID
 */
export function invalidateSubjectCache(subjectId: string): void {
  const keys = topicCache.keys();
  const subjectKeys = keys.filter(key => key.startsWith(`topics:${subjectId}:`));
  
  subjectKeys.forEach(key => {
    topicCache.del(key);
  });
}

/**
 * Clear the entire topic cache
 */
export function clearTopicCache(): void {
  topicCache.flushAll();
}
```

### 5. Update the Subject Topic Service

Modify the file at `src/server/api/services/subject-topic.service.ts` to support pagination and efficient filtering:

```typescript
/**
 * List topics with pagination and search
 */
async listTopics(options: {
  subjectId: string;
  page: number;
  pageSize: number;
  search?: string;
}): Promise<{
  data: SubjectTopic[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}> {
  try {
    const { subjectId, page, pageSize, search } = options;
    const skip = (page - 1) * pageSize;
    
    // Build the where clause
    const where: Prisma.SubjectTopicWhereInput = {
      subjectId,
      status: SystemStatus.ACTIVE as any,
    };
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { keywords: { has: search } },
      ];
    }
    
    // Count total records
    const total = await this.prisma.subjectTopic.count({ where });
    
    // Fetch data with pagination
    const topics = await this.prisma.subjectTopic.findMany({
      where,
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            activities: true,
            assessments: true,
            childTopics: true,
          },
        },
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: pageSize,
    });
    
    // Format the results to match the expected structure
    const formattedTopics = topics.map(topic => ({
      ...topic,
      subjectName: topic.subject.name,
      activityCount: topic._count.activities,
      assessmentCount: topic._count.assessments,
      childTopicCount: topic._count.childTopics,
      subject: undefined, // Remove the subject object
      _count: undefined, // Remove the _count object
    }));
    
    return {
      data: formattedTopics,
      total,
      page,
      pageSize,
      hasMore: skip + topics.length < total,
    };
  } catch (error) {
    // If it's already a TRPCError, rethrow it
    if (error instanceof TRPCError) {
      throw error;
    }
    
    console.error("Error listing subject topics:", error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to list subject topics',
      cause: error,
    });
  }
}
```

### 6. Update the AIStudioDialog Component

Modify the file at `src/features/content-studio/components/AIStudioDialog.tsx` to use the virtualized topic selector:

```typescript
// Import the virtualized topic selector
import { VirtualizedTopicSelector } from '@/features/content-studio/components/dialog-steps/VirtualizedTopicSelector';
import { recordAIStudioPerformance } from '@/features/content-studio/utils/performance-monitoring';

// Add state for pagination
const [topicsPage, setTopicsPage] = useState<number>(1);
const [hasMoreTopics, setHasMoreTopics] = useState<boolean>(false);

// Update the topics query to use pagination
const { 
  data: topicsData, 
  isLoading: isLoadingTopics,
  fetchNextPage,
  hasNextPage
} = api.subjectTopic.list.useInfiniteQuery(
  { 
    subjectId,
    pageSize: 50
  },
  {
    enabled: open && currentStep === 1 && !!subjectId,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    onSuccess: (data) => {
      setHasMoreTopics(!!data.pages[data.pages.length - 1].hasMore);
    }
  }
);

// Flatten the topics data
const topics = useMemo(() => {
  if (!topicsData) return [];
  return topicsData.pages.flatMap(page => page.data);
}, [topicsData]);

// Handle loading more topics
const handleLoadMoreTopics = useCallback(() => {
  if (hasNextPage) {
    fetchNextPage();
  }
}, [hasNextPage, fetchNextPage]);

// Update the renderStepContent function to use the virtualized topic selector
const renderStepContent = useMemo(() => {
  switch (STEPS[currentStep]) {
    // ... other cases
    case 'topic':
      return (
        <VirtualizedTopicSelector
          topics={topics}
          selectedTopicId={topicId}
          onSelect={handleTopicSelect}
          isLoading={isLoadingTopics}
          onLoadMore={handleLoadMoreTopics}
          hasMoreTopics={hasMoreTopics}
        />
      );
    // ... other cases
  }
}, [currentStep, topics, topicId, isLoadingTopics, hasMoreTopics, handleLoadMoreTopics, handleTopicSelect]);
```

## Testing the Implementation

### 1. Performance Testing

Create a test script to measure the performance of the virtualized topic selector with large datasets:

```typescript
// src/features/content-studio/tests/virtualized-topic-selector.test.ts

import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualizedTopicSelector } from '../components/dialog-steps/VirtualizedTopicSelector';

// Generate a large number of test topics
function generateTestTopics(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `topic-${i}`,
    title: `Test Topic ${i}`,
    code: `T${i}`,
    keywords: [`keyword-${i % 10}`, `tag-${i % 5}`],
  }));
}

describe('VirtualizedTopicSelector', () => {
  test('renders with 1000 topics without performance issues', () => {
    const topics = generateTestTopics(1000);
    const startTime = performance.now();
    
    render(
      <VirtualizedTopicSelector
        topics={topics}
        selectedTopicId=""
        onSelect={() => {}}
        isLoading={false}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Rendering should be fast even with 1000 topics
    expect(renderTime).toBeLessThan(500); // Should render in less than 500ms
    
    // Check that the component rendered correctly
    expect(screen.getByPlaceholderText('Search topics...')).toBeInTheDocument();
    
    // Test search functionality
    fireEvent.change(screen.getByPlaceholderText('Search topics...'), {
      target: { value: 'Test Topic 500' },
    });
    
    // Should filter to just one topic
    expect(screen.getByText('Test Topic 500')).toBeInTheDocument();
  });
});
```

### 2. Manual Testing

Test the virtualized topic selector with real data in the AI Content Studio:

1. Open the AI Content Studio dialog
2. Select a subject with a large number of topics
3. Verify that the topic selector loads quickly
4. Scroll through the topics and verify that scrolling is smooth
5. Search for specific topics and verify that filtering works correctly
6. Test on different devices (desktop, tablet, mobile)

## Conclusion

The virtualized topic selector implementation will significantly improve the performance of the AI Content Studio when dealing with large numbers of topics. By only rendering the visible topics and implementing efficient pagination and caching, we can handle thousands of topics without performance issues.

Key benefits of this implementation:

1. **Improved Performance**: Only renders visible topics, reducing DOM size and improving rendering performance
2. **Efficient Data Loading**: Uses pagination to load topics in smaller chunks
3. **Optimized Search**: Implements efficient client-side filtering for quick search results
4. **Smooth Scrolling**: Provides a smooth scrolling experience even with large datasets
5. **Performance Monitoring**: Includes built-in performance tracking for ongoing optimization

This implementation serves as a model for other components in the AI Content Studio that need to handle large datasets.
