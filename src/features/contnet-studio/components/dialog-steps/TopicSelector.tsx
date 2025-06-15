'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Topic {
  id: string;
  title: string;
  code: string;
  nodeType?: string;
  description?: string;
  keywords?: string[];
}

interface TopicSelectorProps {
  topics: Topic[];
  selectedTopicId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function TopicSelector({ topics, selectedTopicId, onSelect, isLoading }: TopicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter topics based on search query
  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.keywords?.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle "Skip" option (no topic selected)
  const handleSkip = () => {
    onSelect('');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            className="pl-8"
            disabled
            value=""
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search topics..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      <ScrollArea className="h-[calc(100%-100px)] max-h-[350px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic) => (
              <Card
                key={topic.id}
                className={`cursor-pointer transition-colors hover:bg-muted ${
                  selectedTopicId === topic.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => onSelect(topic.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground">{topic.code}</span>
                      {topic.nodeType && (
                        <Badge variant="outline" className="text-xs">
                          {topic.nodeType}
                        </Badge>
                      )}
                    </div>
                    <span className="text-lg font-medium">{topic.title}</span>
                    {topic.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {topic.description}
                      </p>
                    )}
                    {topic.keywords && topic.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {topic.keywords.slice(0, 3).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {topic.keywords.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{topic.keywords.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center py-8">
              <p className="text-muted-foreground">No topics found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
