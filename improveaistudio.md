# AI Content Studio Performance Optimization Plan

## Current Performance Issues

The AI Content Studio is currently experiencing slow loading times. This document outlines the identified issues and provides a comprehensive optimization plan to improve performance without compromising functionality.

### Identified Issues

1. **External API Calls to AI Services**
   - The application makes calls to external AI services (Anthropic, OpenAI, Google) which can be slow
   - Multiple model initializations in files like `generate-activity.ts` and `generate-assessment.ts`
   - No visible caching mechanism for AI responses

2. **Database Query Inefficiencies**
   - Multiple database queries without proper batching
   - Some evidence of raw SQL queries in the codebase (documented in `rawsql.md`)
   - Potential N+1 query issues with nested includes

3. **Client-Side Performance Issues**
   - Large component trees with insufficient code splitting
   - Limited client-side caching for AI-generated content
   - Inefficient data fetching patterns (multiple separate API calls)

4. **LangGraph Integration**
   - External calls to LangGraph API which may add latency
   - No visible error handling or timeout mechanisms for these calls

## Optimization Recommendations

### 1. Implement Proper Caching

#### Server-Side Caching

```typescript
// Add this to your AI service
import { LRUCache } from 'lru-cache';

// Create a cache with a maximum of 100 items that expire after 1 hour
const aiResponseCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
});

// Cache AI responses
async function getCachedAIResponse(prompt, config) {
  const cacheKey = `${prompt}-${JSON.stringify(config)}`;
  
  // Check if response is in cache
  const cachedResponse = aiResponseCache.get(cacheKey);
  if (cachedResponse) {
    console.log('AI response cache hit');
    return cachedResponse;
  }
  
  // Generate new response
  console.log('AI response cache miss, generating new response');
  const response = await generateAIResponse(prompt, config);
  
  // Store in cache
  aiResponseCache.set(cacheKey, response);
  return response;
}
```

#### Client-Side Caching with React Query

```jsx
// Current implementation lacks caching for AI Content Studio data
const { data: subjects, isLoading: isLoadingSubjects } = api.subject.getTeacherSubjects.useQuery(
  { teacherId },
  { 
    enabled: open && currentStep === 0 && !!teacherId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  }
);

// Similar approach for topics and other data
const { data: topics, isLoading: isLoadingTopics } = api.subjectTopic.list.useQuery(
  { subjectId },
  { 
    enabled: open && currentStep === 1 && !!subjectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  }
);
```

#### Next.js Server Component Caching

```typescript
// Use Next.js unstable_cache for database queries
import { unstable_cache } from 'next/cache';

const getCachedWorksheets = unstable_cache(
  async (teacherId: string) => {
    return prisma.worksheet.findMany({
      where: { teacherId, status: SystemStatus.ACTIVE },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          }
        },
        topic: {
          select: {
            id: true,
            title: true,
          }
        }
      },
    });
  },
  ['teacher-worksheets'],
  { revalidate: 300 } // 5 minutes
);
```

### 2. Optimize Database Queries

#### Replace Raw SQL Queries

Replace any raw SQL queries with Prisma queries. For example:

```typescript
// Instead of this raw SQL query
const activities = await ctx.prisma.$queryRaw`
  SELECT a.*, s.name as subject_name, t.title as topic_title
  FROM Activity a
  LEFT JOIN Subject s ON a.subjectId = s.id
  LEFT JOIN SubjectTopic t ON a.topicId = t.id
  WHERE a.teacherId = ${input.teacherId}
  AND a.status = ${input.status}
  ORDER BY a.createdAt DESC
`;

// Use this Prisma query
const activities = await ctx.prisma.activity.findMany({
  where: {
    teacherId: input.teacherId,
    status: input.status
  },
  include: {
    subject: {
      select: {
        name: true
      }
    },
    topic: {
      select: {
        title: true
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  }
});
```

#### Optimize Includes

Only fetch the fields you need:

```typescript
// Instead of
include: {
  subject: true,
  topic: true,
  teacher: true,
}

// Use selective includes
include: {
  subject: {
    select: {
      id: true,
      name: true,
    }
  },
  topic: {
    select: {
      id: true,
      title: true,
    }
  },
  teacher: {
    select: {
      id: true,
      name: true,
    }
  }
}
```

#### Batch Database Queries

Use Prisma's transactions to batch multiple queries:

```typescript
// Instead of multiple separate queries
const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
const topics = await prisma.subjectTopic.findMany({ where: { subjectId } });
const activities = await prisma.activity.findMany({ where: { subjectId } });

// Use a transaction to batch queries
const [subject, topics, activities] = await prisma.$transaction([
  prisma.subject.findUnique({ where: { id: subjectId } }),
  prisma.subjectTopic.findMany({ where: { subjectId } }),
  prisma.activity.findMany({ where: { subjectId } })
]);
```

### 3. Implement Code Splitting and Lazy Loading

#### Lazy Load Components

```jsx
// In your page component
import dynamic from 'next/dynamic';

// Lazy load the AI Studio Dialog
const AIStudioDialog = dynamic(
  () => import('@/features/content-studio/components/AIStudioDialog'),
  { 
    loading: () => <div className="p-8 flex justify-center"><LoadingIndicator message="Loading AI Studio..." /></div>,
    ssr: false // Disable SSR for this component if it's client-only
  }
);

// Lazy load the AI Conversation Interface
const AIConversationInterface = dynamic(
  () => import('@/features/content-studio/components/AIConversationInterface'),
  { 
    loading: () => <LoadingIndicator message="Loading conversation interface..." />,
    ssr: false
  }
);
```

#### Split AI Agent Code

Refactor the AI agent code into smaller modules:

```typescript
// Instead of one large file with all agent logic
// Split into purpose-specific modules

// generate-activity.ts
export const generateActivity = async (state, config) => {
  const model = await loadModelOnDemand(config); // Lazy load the model
  // Rest of the function
};

// Utility to lazy load models
export const loadModelOnDemand = async (config) => {
  const { modelProvider } = config.configurable || { modelProvider: "anthropic" };
  
  if (modelProvider === "anthropic") {
    const { ChatAnthropic } = await import("@langchain/anthropic");
    return new ChatAnthropic({
      model: config.configurable?.model_name || "claude-3-5-sonnet-20240620",
      temperature: 0.7,
    });
  } else if (modelProvider === "openai") {
    const { ChatOpenAI } = await import("@langchain/openai");
    return new ChatOpenAI({
      model: config.configurable?.model_name || "gpt-4o",
      temperature: 0.7,
    });
  }
  // Other providers...
};
```

### 4. Optimize External API Calls

#### Implement Timeouts and Retries

```typescript
const modelWithTimeout = async (prompt, config, timeout = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await model.invoke(prompt, { 
      signal: controller.signal,
      ...config
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('AI request timed out, using fallback');
      // Return fallback response or retry with simpler model
      return fallbackResponse();
    }
    throw error;
  }
};

// Implement retries with exponential backoff
const modelWithRetry = async (prompt, config, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await model.invoke(prompt, config);
    } catch (error) {
      retries++;
      if (retries >= maxRetries) throw error;
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retry ${retries}/${maxRetries} after ${delay}ms`);
    }
  }
};
```

#### Implement Request Queuing

```typescript
// Simple request queue
class AIRequestQueue {
  private queue: Array<{
    prompt: any;
    config: any;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];
  private processing = false;
  private concurrentLimit = 2; // Process 2 requests at a time
  private activeRequests = 0;

  async enqueue(prompt: any, config: any) {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, config, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.activeRequests >= this.concurrentLimit || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.concurrentLimit) {
      const { prompt, config, resolve, reject } = this.queue.shift()!;
      this.activeRequests++;

      try {
        const result = await model.invoke(prompt, config);
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.activeRequests--;
      }
    }

    this.processing = false;

    // If there are more items and we have capacity, process them
    if (this.queue.length > 0 && this.activeRequests < this.concurrentLimit) {
      this.processQueue();
    }
  }
}

// Usage
const aiQueue = new AIRequestQueue();
const response = await aiQueue.enqueue(prompt, config);
```

### 5. Implement Progressive Loading

#### Skeleton UI

```jsx
// In your component
return (
  <div>
    {/* Critical content */}
    <div className="mb-6">
      {isLoadingCritical ? <SkeletonCritical /> : <CriticalContent data={criticalData} />}
    </div>
    
    {/* Non-critical content loaded after critical content */}
    {!isLoadingCritical && (
      <div>
        {isLoadingNonCritical ? <SkeletonNonCritical /> : <NonCriticalContent data={nonCriticalData} />}
      </div>
    )}
  </div>
);

// Skeleton components
const SkeletonCritical = () => (
  <div className="space-y-4">
    <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
  </div>
);
```

#### Prioritize Content Loading

```jsx
// In your page component
const AIStudioPage = () => {
  // Load critical data first
  const { data: criticalData, isLoading: isLoadingCritical } = useCriticalData();
  
  // Only load non-critical data after critical data is loaded
  const { data: nonCriticalData, isLoading: isLoadingNonCritical } = useNonCriticalData({
    enabled: !!criticalData
  });
  
  // ...rest of component
};
```

### 6. Optimize State Management

#### Memoize Components and Calculations

```jsx
// Memoize expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Memoize expensive calculations
const MyComponent = ({ data }) => {
  const processedData = useMemo(() => {
    return performExpensiveCalculation(data);
  }, [data]);
  
  return <div>{/* Use processedData */}</div>;
};
```

#### Reduce Re-renders

```jsx
// Use callback to prevent unnecessary re-renders
const handleSubjectSelect = useCallback((id: string) => {
  setSubjectId(id);
}, []);

// Use state batching
const handleFormSubmit = () => {
  // Instead of multiple state updates
  // setLoading(true);
  // setError(null);
  // setData(newData);
  
  // Batch state updates
  React.startTransition(() => {
    setLoading(true);
    setError(null);
    setData(newData);
  });
};
```

### 7. Implement Client-Side Storage

#### LocalStorage for Generated Content

```typescript
// Save generated content to localStorage
const saveGeneratedContent = (id, content) => {
  try {
    localStorage.setItem(`ai-content-${id}`, JSON.stringify({
      content,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    // Handle storage quota exceeded or other errors
  }
};

// Get content from localStorage with expiration
const getStoredContent = (id, maxAge = 24 * 60 * 60 * 1000) => {
  try {
    const stored = localStorage.getItem(`ai-content-${id}`);
    if (!stored) return null;
    
    const { content, timestamp } = JSON.parse(stored);
    if (Date.now() - timestamp > maxAge) {
      localStorage.removeItem(`ai-content-${id}`);
      return null;
    }
    
    return content;
  } catch (error) {
    console.error('Failed to retrieve from localStorage:', error);
    return null;
  }
};
```

#### IndexedDB for Larger Content

```typescript
// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AIContentStudioDB', 1);
    
    request.onerror = () => reject('Failed to open database');
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('generatedContent', { keyPath: 'id' });
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Save content to IndexedDB
const saveToIndexedDB = async (id, content) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['generatedContent'], 'readwrite');
    const store = transaction.objectStore('generatedContent');
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        id,
        content,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject('Failed to save content');
    });
  } catch (error) {
    console.error('IndexedDB error:', error);
    return false;
  }
};

// Get content from IndexedDB
const getFromIndexedDB = async (id) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['generatedContent'], 'readonly');
    const store = transaction.objectStore('generatedContent');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => {
        const data = request.result;
        if (!data) return resolve(null);
        
        // Check if expired (24 hours)
        if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
          // Delete expired content
          const deleteTransaction = db.transaction(['generatedContent'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('generatedContent');
          deleteStore.delete(id);
          return resolve(null);
        }
        
        resolve(data.content);
      };
      
      request.onerror = () => reject('Failed to get content');
    });
  } catch (error) {
    console.error('IndexedDB error:', error);
    return null;
  }
};
```

## Implementation Priority

### 1. Immediate Fixes (1-2 weeks)

- Replace any raw SQL queries with Prisma queries
- Implement proper caching for database queries
- Add lazy loading for heavy components
- Optimize includes in database queries to fetch only necessary fields
- Add proper error handling for AI model calls

### 2. Short-term Improvements (2-4 weeks)

- Implement client-side storage for generated content
- Add code splitting for the AI Content Studio
- Optimize AI model calls with timeouts and fallbacks
- Implement progressive loading with skeleton UI
- Add memoization for expensive components and calculations

### 3. Long-term Optimizations (1-2 months)

- Refactor the AI agent architecture for better performance
- Implement a queue system for AI requests
- Consider moving some AI processing to background jobs
- Implement IndexedDB for larger content storage
- Add analytics to monitor performance and identify bottlenecks

## Monitoring and Measurement

To ensure our optimizations are effective, we should implement the following monitoring:

1. **Performance Metrics**
   - Time to first contentful paint
   - Time to interactive
   - Total blocking time
   - Largest contentful paint
   - API response times

2. **User Experience Metrics**
   - User-perceived loading time
   - Interaction to next paint
   - First input delay

3. **Server Metrics**
   - Database query times
   - AI model response times
   - Memory usage
   - CPU usage

## Conclusion

By implementing these optimizations, the AI Content Studio should load significantly faster while maintaining its functionality and user experience. The most critical issues to address are the raw SQL queries, lack of proper caching, and inefficient API calls to external AI services.

Regular performance testing should be conducted throughout the implementation process to measure the impact of each optimization and identify any new bottlenecks that may arise.
