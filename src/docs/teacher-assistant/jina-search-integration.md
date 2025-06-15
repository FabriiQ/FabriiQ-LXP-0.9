# Jina Search Integration for Teacher Assistant

## Overview

The Teacher Assistant integrates Jina Search to provide teachers with access to external knowledge sources, educational resources, and research. This integration enables the assistant to supplement its internal knowledge with up-to-date information from the web, educational databases, and curated teaching resources.

## Architecture

### 1. System Components

```
JinaSearchIntegration
├── SearchAgent
│   ├── QueryProcessor
│   ├── FilterManager
│   └── ResultsFormatter
├── SearchUI
│   ├── SearchInput
│   ├── FilterControls
│   └── ResultsDisplay
├── SearchContext
│   ├── TeacherPreferences
│   ├── SubjectContext
│   └── GradeLevelContext
└── DataSources
    ├── EducationalResources
    ├── ResearchPapers
    ├── CurriculumStandards
    ├── LessonPlans
    └── TeachingStrategies
```

### 2. Jina Client Implementation

```typescript
// src/lib/jina-client.ts
import axios, { AxiosInstance } from 'axios';

export interface JinaSearchParams {
  query: string;
  limit?: number;
  filter?: string;
  page?: number;
}

export interface JinaSearchResult {
  id: string;
  score: number;
  metadata: {
    title: string;
    snippet: string;
    url: string;
    source: string;
    publicationDate?: string;
    author?: string;
    contentType?: string;
    gradeLevel?: string;
    subject?: string;
    [key: string]: any;
  };
}

export interface JinaSearchResponse {
  matches: JinaSearchResult[];
  total: number;
  page: number;
  limit: number;
}

export class JinaClient {
  private client: AxiosInstance;
  private baseUrl: string;
  
  constructor(options: {
    apiKey: string;
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
  }) {
    this.baseUrl = options.baseUrl || 'https://api.jina.ai/v1';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
        ...options.defaultHeaders
      }
    });
  }
  
  async search(params: JinaSearchParams): Promise<JinaSearchResponse> {
    try {
      const response = await this.client.post('/search', {
        query: params.query,
        limit: params.limit || 10,
        filter: params.filter || '',
        page: params.page || 1
      });
      
      return response.data;
    } catch (error) {
      console.error('Jina search error:', error);
      throw new Error(`Jina search failed: ${(error as any).message}`);
    }
  }
}
```

### 3. Search Agent Implementation

```typescript
// src/features/teacher-assistant/search-agent.ts
import { JinaClient, JinaSearchParams, JinaSearchResponse } from '@/lib/jina-client';

export interface SearchFilters {
  contentType?: string;
  subject?: string;
  gradeLevel?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export class SearchAgent {
  private jinaClient: JinaClient;
  private teacherContext: TeacherContext;
  
  constructor(apiKey: string, teacherContext: TeacherContext) {
    this.jinaClient = new JinaClient({
      apiKey,
      defaultHeaders: {
        'Content-Type': 'application/json'
      }
    });
    
    this.teacherContext = teacherContext;
  }
  
  async search(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    try {
      // Enhance query with context if no specific filters provided
      const enhancedQuery = this.enhanceQuery(query, filters);
      
      // Prepare search parameters
      const params: JinaSearchParams = {
        query: enhancedQuery,
        limit: filters?.limit || 5,
        filter: this.buildFilterExpression(filters)
      };
      
      // Execute search
      const response = await this.jinaClient.search(params);
      
      // Process and return results
      return this.processResults(response, query);
    } catch (error) {
      console.error('Error executing Jina search:', error);
      throw new Error(`Search failed: ${(error as Error).message}`);
    }
  }
  
  private enhanceQuery(query: string, filters?: SearchFilters): string {
    // If specific filters are provided, don't enhance the query
    if (filters && Object.keys(filters).some(k => !!filters[k as keyof SearchFilters])) {
      return query;
    }
    
    // Otherwise, enhance with teacher context
    let enhancedQuery = query;
    
    // Add subject context if available
    if (this.teacherContext.subjects?.length) {
      const subjectContext = this.teacherContext.subjects.join(' OR ');
      enhancedQuery += ` (${subjectContext})`;
    }
    
    // Add grade level context if available
    if (this.teacherContext.gradeLevels?.length) {
      const gradeLevelContext = this.teacherContext.gradeLevels.join(' OR ');
      enhancedQuery += ` (${gradeLevelContext})`;
    }
    
    return enhancedQuery;
  }
  
  private buildFilterExpression(filters?: SearchFilters): string {
    if (!filters) return '';
    
    const expressions = [];
    
    if (filters.contentType) {
      expressions.push(`content_type = "${filters.contentType}"`);
    }
    
    if (filters.subject) {
      expressions.push(`subject = "${filters.subject}"`);
    }
    
    if (filters.gradeLevel) {
      expressions.push(`grade_level = "${filters.gradeLevel}"`);
    }
    
    if (filters.dateRange) {
      expressions.push(`publication_date >= "${filters.dateRange.start}" AND publication_date <= "${filters.dateRange.end}"`);
    }
    
    return expressions.join(' AND ');
  }
  
  private processResults(response: JinaSearchResponse, originalQuery: string): SearchResult[] {
    return response.matches.map(match => ({
      id: match.id,
      title: match.metadata.title,
      snippet: match.metadata.snippet,
      url: match.metadata.url,
      source: match.metadata.source,
      relevanceScore: match.score,
      metadata: {
        ...match.metadata,
        originalQuery
      }
    }));
  }
}
```

### 4. Integration with Teacher Assistant

```typescript
// src/providers/teacher-assistant-provider.tsx
export function TeacherAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Context from other providers
  const { teacher } = useTeacherContext();
  const { currentClass } = useClassContext();
  
  // Initialize search agent
  const searchAgent = useMemo(() => {
    return new SearchAgent(
      process.env.NEXT_PUBLIC_JINA_API_KEY || '',
      {
        subjects: teacher?.subjects?.map(s => s.name) || [],
        gradeLevels: teacher?.gradeLevels?.map(g => g.name) || []
      }
    );
  }, [teacher]);
  
  // Agent orchestration
  const agentOrchestrator = useAgentOrchestrator({
    teacher,
    currentClass,
    searchAgent
  });
  
  // Execute search
  const executeSearch = async (query: string, filters?: SearchFilters) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      const results = await searchAgent.search(query, filters);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      // Show error message
    } finally {
      setIsSearching(false);
    }
  };
  
  // Send message with search capability
  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Process with agent orchestrator
      const response = await agentOrchestrator.processMessage(content);
      
      // Add assistant message
      const assistantMessage = { role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      // Add error message
      const errorMessage = { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Value to be provided by context
  const value = {
    isOpen,
    setIsOpen,
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    isSearchMode,
    setIsSearchMode,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    executeSearch,
    sendMessage
  };
  
  return (
    <TeacherAssistantContext.Provider value={value}>
      {children}
      <AssistantButton />
      <AssistantDialog />
    </TeacherAssistantContext.Provider>
  );
}
```

## Search UI Components

### 1. SearchToggle Component

```tsx
// src/components/teacher-assistant/SearchToggle.tsx
export function SearchToggle() {
  const { isSearchMode, setIsSearchMode } = useTeacherAssistant();
  
  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={isSearchMode ? "default" : "outline"}
        size="sm"
        onClick={() => setIsSearchMode(false)}
        className={isSearchMode ? "" : "bg-primary text-primary-foreground"}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Chat
      </Button>
      <Button
        variant={isSearchMode ? "default" : "outline"}
        size="sm"
        onClick={() => setIsSearchMode(true)}
        className={isSearchMode ? "bg-primary text-primary-foreground" : ""}
      >
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </div>
  );
}
```

### 2. SearchResultCard Component

```tsx
// src/components/teacher-assistant/SearchResultCard.tsx
export function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-medium">
          <a 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {result.title}
          </a>
        </CardTitle>
        <CardDescription className="text-xs flex items-center">
          <Badge variant="outline" className="mr-2">
            {result.source}
          </Badge>
          {result.metadata?.contentType && (
            <Badge variant="secondary" className="mr-2 text-xs">
              {result.metadata.contentType}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground">{result.snippet}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <a href={result.url} target="_blank" rel="noopener noreferrer">
            Visit Source
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={() => {
            // Add to conversation
          }}
        >
          Add to Chat
          <MessageSquarePlus className="h-3 w-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## Data Sources

The Jina Search integration accesses the following types of data sources:

1. **Educational Resources**
   - Teaching materials and lesson plans
   - Worksheets and activities
   - Educational videos and multimedia

2. **Research Papers**
   - Academic journals in education
   - Teaching methodology research
   - Subject-specific research

3. **Curriculum Standards**
   - National and state curriculum frameworks
   - Learning objectives by grade level
   - Subject-specific standards

4. **Teaching Strategies**
   - Instructional methods and approaches
   - Classroom management techniques
   - Assessment strategies

5. **Subject Content**
   - Subject-specific explanations and content
   - Examples and illustrations
   - Problem sets and solutions

## Next Steps

1. Implement the Jina Client and SearchAgent
2. Develop the search UI components
3. Integrate with the Teacher Assistant provider
4. Test with various educational queries
5. Refine search enhancement based on teacher context
6. Implement result filtering and sorting capabilities
