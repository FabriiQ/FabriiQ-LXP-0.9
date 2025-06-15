'use client';

/**
 * HierarchicalTopicSelector Component
 *
 * This component provides a hierarchical UI for selecting topics.
 * It fetches topics based on the selected subject and allows multi-selection.
 */

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Search, ChevronRight, ChevronDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Topic {
  id: string;
  title: string;
  code?: string;
  description?: string;
  parentTopicId?: string | null;
  children?: Topic[];
  level?: number;
}

interface HierarchicalTopicSelectorProps {
  subjectId?: string;
  selectedTopicIds: string[];
  customTopics?: string[];
  onTopicsChange: (selectedIds: string[], customTopics?: string[]) => void;
  disabled?: boolean;
}

export function HierarchicalTopicSelector({
  subjectId,
  selectedTopicIds,
  customTopics = [],
  onTopicsChange,
  disabled = false
}: HierarchicalTopicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [newCustomTopic, setNewCustomTopic] = useState('');
  const [localCustomTopics, setLocalCustomTopics] = useState<string[]>(customTopics);

  // Update local custom topics when prop changes
  useEffect(() => {
    setLocalCustomTopics(customTopics);
  }, [customTopics]);

  // Fetch subject topics
  const { data: topicsResponse, isLoading } = api.subjectTopic.list.useQuery(
    {
      subjectId,
      status: "ACTIVE"
    },
    { enabled: !!subjectId }
  );

  // Extract topics from response
  const topicsData = topicsResponse?.data || [];

  // Build topic hierarchy
  const buildTopicHierarchy = (topics: Topic[] = []): Topic[] => {
    const topicMap = new Map<string, Topic>();
    const rootTopics: Topic[] = [];

    // First pass: create a map of all topics
    topics.forEach(topic => {
      topicMap.set(topic.id, { ...topic, children: [] });
    });

    // Second pass: build the hierarchy
    topics.forEach(topic => {
      const topicWithChildren = topicMap.get(topic.id);
      if (!topicWithChildren) return;

      if (topic.parentTopicId && topicMap.has(topic.parentTopicId)) {
        const parent = topicMap.get(topic.parentTopicId);
        if (parent && parent.children) {
          parent.children.push(topicWithChildren);
        }
      } else {
        rootTopics.push(topicWithChildren);
      }
    });

    // Add level information
    const addLevelInfo = (topics: Topic[], level: number): Topic[] => {
      return topics.map(topic => ({
        ...topic,
        level,
        children: topic.children ? addLevelInfo(topic.children, level + 1) : []
      }));
    };

    return addLevelInfo(rootTopics, 0);
  };

  // Flatten hierarchy for search
  const flattenHierarchy = (topics: Topic[]): Topic[] => {
    return topics.reduce<Topic[]>((acc, topic) => {
      acc.push(topic);
      if (topic.children && topic.children.length > 0) {
        acc.push(...flattenHierarchy(topic.children));
      }
      return acc;
    }, []);
  };

  // Get topics hierarchy
  const topicsHierarchy = buildTopicHierarchy(topicsData);

  // Filter topics based on search query
  const filteredTopics = searchQuery
    ? flattenHierarchy(topicsHierarchy).filter(topic =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.code && topic.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : topicsHierarchy;

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Expand all topics when searching
    if (e.target.value) {
      const allExpanded: Record<string, boolean> = {};
      flattenHierarchy(topicsHierarchy).forEach(topic => {
        allExpanded[topic.id] = true;
      });
      setExpandedTopics(allExpanded);
    }
  };

  // Toggle topic expansion
  const toggleExpand = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  // Handle topic selection
  const handleTopicSelect = (topic: Topic, e: React.MouseEvent) => {
    if (disabled) return;

    e.stopPropagation();
    const newSelectedTopicIds = [...selectedTopicIds];
    const index = newSelectedTopicIds.indexOf(topic.id);

    if (index === -1) {
      newSelectedTopicIds.push(topic.id);
    } else {
      newSelectedTopicIds.splice(index, 1);
    }

    onTopicsChange(newSelectedTopicIds, localCustomTopics);
  };

  // Add custom topic
  const handleAddCustomTopic = () => {
    if (disabled) return;

    if (newCustomTopic.trim()) {
      const updatedCustomTopics = [...localCustomTopics, newCustomTopic.trim()];
      setLocalCustomTopics(updatedCustomTopics);
      onTopicsChange(selectedTopicIds, updatedCustomTopics);
      setNewCustomTopic('');
    }
  };

  // Remove custom topic
  const handleRemoveCustomTopic = (index: number) => {
    if (disabled) return;

    const updatedCustomTopics = [...localCustomTopics];
    updatedCustomTopics.splice(index, 1);
    setLocalCustomTopics(updatedCustomTopics);
    onTopicsChange(selectedTopicIds, updatedCustomTopics);
  };

  // Get border color class based on topic level
  const getBorderColorClass = (level: number = 0) => {
    switch (level) {
      case 0: return 'border-blue-500';
      case 1: return 'border-green-500';
      case 2: return 'border-yellow-500';
      case 3: return 'border-purple-500';
      default: return 'border-gray-500';
    }
  };

  // Render a topic with its children
  const renderTopic = (topic: Topic) => {
    const isSelected = selectedTopicIds.includes(topic.id);
    const isExpanded = expandedTopics[topic.id];
    const hasChildren = topic.children && topic.children.length > 0;
    const level = topic.level || 0;

    return (
      <div key={topic.id} className="mb-2">
        <Card
          className={cn(
            'cursor-pointer transition-colors hover:bg-muted',
            isSelected ? 'bg-primary/5' : '',
            getBorderColorClass(level),
            'border-l-4',
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          )}
          onClick={(e) => handleTopicSelect(topic, e)}
        >
          <CardContent className={cn("p-4", level > 0 && `pl-${4 + level * 4}`)}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  {hasChildren && (
                    <button
                      onClick={(e) => toggleExpand(topic.id, e)}
                      className="mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                      disabled={disabled}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <div>
                    <div className="flex items-center">
                      {topic.code && (
                        <span className="text-xs text-muted-foreground mr-2">{topic.code}</span>
                      )}
                      <span className="font-medium">{topic.title}</span>
                    </div>
                    {topic.description && (
                      <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                    )}
                  </div>
                </div>
              </div>
              {isSelected && (
                <Badge variant="outline" className="ml-2 bg-primary/10">Selected</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {topic.children?.map(childTopic => renderTopic(childTopic))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        // Loading skeleton
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" data-testid="loading-skeleton" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" data-testid="loading-skeleton" />
            ))}
          </div>
        </div>
      ) : !subjectId ? (
        <div className="text-center py-8 text-muted-foreground">
          Please select a subject first to view topics
        </div>
      ) : topicsData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground text-center">
            No topics available for this subject. You can add custom topics below.
          </p>
        </div>
      ) : (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={disabled}
            />
          </div>
          <ScrollArea className="h-[400px] border rounded-md p-4">
            {isLoading && filteredTopics.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredTopics.length > 0 ? (
              filteredTopics.map(topic => renderTopic(topic))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `No topics found matching "${searchQuery}"`
                    : 'No topics available for this subject'}
                </p>
              </div>
            )}
          </ScrollArea>
        </>
      )}

      {/* Custom Topics Section */}
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Add Custom Topic</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Enter custom topic"
            value={newCustomTopic}
            onChange={(e) => setNewCustomTopic(e.target.value)}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            onClick={handleAddCustomTopic}
            disabled={!newCustomTopic.trim() || disabled}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Display Custom Topics */}
      {localCustomTopics.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Custom Topics</h3>
          <div className="space-y-2">
            {localCustomTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span>{topic}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCustomTopic(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Topics Summary */}
      {selectedTopicIds.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Selected Topics</h3>
          <div className="flex flex-wrap gap-2">
            {selectedTopicIds.map(id => {
              const topic = flattenHierarchy(topicsHierarchy).find(t => t.id === id);
              return topic ? (
                <Badge key={id} variant="secondary" className="flex items-center gap-1">
                  {topic.title}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => {
                      if (!disabled) {
                        const newSelectedTopicIds = selectedTopicIds.filter(topicId => topicId !== id);
                        onTopicsChange(newSelectedTopicIds, localCustomTopics);
                      }
                    }}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
