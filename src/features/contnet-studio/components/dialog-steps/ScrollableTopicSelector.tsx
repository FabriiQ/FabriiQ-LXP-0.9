'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { recordAIStudioPerformance } from '@/features/contnet-studio/utils/performance-monitoring';


// Define the Topic interface
interface Topic {
  id: string;
  title: string;
  code: string;
  nodeType?: string;
  description?: string;
  keywords?: string[];
}

interface ScrollableTopicSelectorProps {
  topics: Topic[];
  selectedTopicIds: string[];
  onSelect: (ids: string[]) => void;
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMoreTopics?: boolean;
}

export function ScrollableTopicSelector({
  topics,
  selectedTopicIds,
  onSelect,
  isLoading,
  onLoadMore,
  hasMoreTopics = false
}: ScrollableTopicSelectorProps) {
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
    recordAIStudioPerformance('ScrollableTopicSelector', 'filterTopics', startTime, endTime);

    return filtered;
  }, [topics, searchQuery]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  }, []);

  // Handle topic selection
  const handleTopicSelect = useCallback((topicId: string) => {
    const isSelected = selectedTopicIds.includes(topicId);
    let newSelectedIds: string[];

    if (isSelected) {
      // Remove from selection
      newSelectedIds = selectedTopicIds.filter(id => id !== topicId);
    } else {
      // Add to selection
      newSelectedIds = [...selectedTopicIds, topicId];
    }

    onSelect(newSelectedIds);
  }, [selectedTopicIds, onSelect]);

  // Handle "Skip" option (no topic selected)
  const handleSkip = useCallback(() => {
    onSelect([]);
  }, [onSelect]);

  // Handle scroll event for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isLoading && hasMoreTopics && onLoadMore) {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        onLoadMore();
      }
    }
  }, [isLoading, hasMoreTopics, onLoadMore]);

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
          selectedTopicIds.length === 0 ? 'border-primary bg-primary/5' : ''
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
          <ScrollArea className="h-full" onScrollCapture={handleScroll}>
            <div className="p-4 space-y-2">
              {filteredTopics.map((topic) => (
                <Card
                  key={topic.id}
                  className={`cursor-pointer transition-colors hover:bg-muted ${
                    selectedTopicIds.includes(topic.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleTopicSelect(topic.id)}
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
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {filteredTopics.length === 0 && !isLoading && searchQuery.trim() !== '' && (
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
