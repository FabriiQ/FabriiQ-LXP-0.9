'use client';

/**
 * HierarchicalTopicSelector Component
 *
 * This component provides a UI for selecting topics in a hierarchical structure.
 * It supports searching, filtering, and multi-selection of topics.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Search, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { recordAIStudioPerformance } from '@/features/contnet-studio/utils/performance-monitoring';
import { SubjectNodeType } from '@/server/api/constants';

// Define the Topic interface with hierarchy support
interface Topic {
  id: string;
  title: string;
  code: string;
  nodeType: string;
  description?: string;
  keywords?: string[];
  parentTopicId?: string | null;
  children?: Topic[];
}

interface HierarchicalTopicSelectorProps {
  topics: Topic[];
  selectedTopicIds: string[];
  onSelect: (ids: string[]) => void;
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMoreTopics?: boolean;
}

export function HierarchicalTopicSelector({
  topics,
  selectedTopicIds,
  onSelect,
  isLoading,
  onLoadMore,
  hasMoreTopics = false
}: HierarchicalTopicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [searchStartTime, setSearchStartTime] = useState<number>(0);

  // Build hierarchical structure
  const hierarchicalTopics = useMemo(() => {
    const startTime = performance.now();

    // Create a map of all topics by ID
    const topicMap = new Map<string, Topic>();
    topics.forEach(topic => {
      // Create a copy with an empty children array
      topicMap.set(topic.id, { ...topic, children: [] });
    });

    // Build the tree structure
    const rootTopics: Topic[] = [];

    topicMap.forEach(topic => {
      if (!topic.parentTopicId) {
        // This is a root topic (chapter)
        rootTopics.push(topic);
      } else {
        // This is a child topic
        const parent = topicMap.get(topic.parentTopicId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(topic);
        } else {
          // If parent not found, treat as root
          rootTopics.push(topic);
        }
      }
    });

    // Sort topics by orderIndex or code
    const sortTopics = (topics: Topic[]) => {
      topics.sort((a, b) => a.code.localeCompare(b.code));
      topics.forEach(topic => {
        if (topic.children && topic.children.length > 0) {
          sortTopics(topic.children);
        }
      });
    };

    sortTopics(rootTopics);

    const endTime = performance.now();
    recordAIStudioPerformance('HierarchicalTopicSelector', 'buildHierarchy', startTime, endTime);

    return rootTopics;
  }, [topics]);

  // Filter topics based on search query
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return hierarchicalTopics;

    const startTime = performance.now();
    setSearchStartTime(startTime);

    // Helper function to search in a topic and its children
    const searchInTopic = (topic: Topic): boolean => {
      const matchesCriteria =
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.keywords?.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()));

      if (matchesCriteria) return true;

      // Search in children
      if (topic.children && topic.children.length > 0) {
        return topic.children.some(child => searchInTopic(child));
      }

      return false;
    };

    // Filter the root topics
    const filtered = hierarchicalTopics.filter(topic => searchInTopic(topic));

    // Auto-expand all topics when searching
    const newExpandedTopics: Record<string, boolean> = {};
    const expandAllMatchingTopics = (topic: Topic) => {
      newExpandedTopics[topic.id] = true;
      if (topic.children) {
        topic.children.forEach(expandAllMatchingTopics);
      }
    };

    filtered.forEach(expandAllMatchingTopics);
    setExpandedTopics(prev => ({ ...prev, ...newExpandedTopics }));

    const endTime = performance.now();
    recordAIStudioPerformance('HierarchicalTopicSelector', 'filterTopics', startTime, endTime);

    return filtered;
  }, [hierarchicalTopics, searchQuery]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  }, []);

  // Handle "Skip" option (no topic selected)
  const handleSkip = useCallback(() => {
    onSelect([]);
  }, [onSelect]);

  // Toggle topic expansion
  const toggleExpand = useCallback((topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  }, []);

  // Handle topic selection with hierarchy
  const handleTopicSelect = useCallback((topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();

    // Get all descendant topic IDs
    const getAllDescendantIds = (topic: Topic): string[] => {
      let ids: string[] = [];
      if (topic.children && topic.children.length > 0) {
        topic.children.forEach(child => {
          ids.push(child.id);
          ids = [...ids, ...getAllDescendantIds(child)];
        });
      }
      return ids;
    };

    // Check if topic is already selected
    const isSelected = selectedTopicIds.includes(topic.id);
    let newSelectedIds: string[];

    if (isSelected) {
      // Deselect this topic and all its descendants
      const descendantIds = getAllDescendantIds(topic);
      newSelectedIds = selectedTopicIds.filter(id => id !== topic.id && !descendantIds.includes(id));
    } else {
      // Select this topic and all its descendants
      const descendantIds = getAllDescendantIds(topic);
      newSelectedIds = [...selectedTopicIds, topic.id, ...descendantIds];

      // Expand the topic when selected
      setExpandedTopics(prev => ({
        ...prev,
        [topic.id]: true
      }));
    }

    // Remove duplicates
    newSelectedIds = [...new Set(newSelectedIds)];

    onSelect(newSelectedIds);
  }, [selectedTopicIds, onSelect]);

  // Handle individual topic selection (without affecting children)
  const handleIndividualTopicSelect = useCallback((topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if topic is already selected
    const isSelected = selectedTopicIds.includes(topic.id);
    let newSelectedIds: string[];

    if (isSelected) {
      // Deselect just this topic
      newSelectedIds = selectedTopicIds.filter(id => id !== topic.id);
    } else {
      // Select just this topic
      newSelectedIds = [...selectedTopicIds, topic.id];
    }

    onSelect(newSelectedIds);
  }, [selectedTopicIds, onSelect]);

  // Recursive component to render a topic and its children
  const TopicItem = useCallback(({ topic, level = 0 }: { topic: Topic, level: number }) => {
    const isExpanded = expandedTopics[topic.id] || false;
    const isSelected = selectedTopicIds.includes(topic.id);
    const hasChildren = topic.children && topic.children.length > 0;

    // Determine border color based on node type
    const getBorderColorClass = () => {
      switch (topic.nodeType) {
        case SubjectNodeType.CHAPTER:
          return 'border-purple-500';
        case SubjectNodeType.TOPIC:
          return 'border-blue-500';
        case SubjectNodeType.SUBTOPIC:
          return 'border-green-500';
        default:
          return 'border-gray-200';
      }
    };

    return (
      <div className="mb-2">
        <Card
          className={cn(
            'cursor-pointer transition-colors hover:bg-muted',
            isSelected ? 'bg-primary/5' : '',
            getBorderColorClass(),
            'border-l-4'
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
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{topic.code}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          topic.nodeType === SubjectNodeType.CHAPTER ? "bg-purple-100 text-purple-800 border-purple-300" :
                          topic.nodeType === SubjectNodeType.TOPIC ? "bg-blue-100 text-blue-800 border-blue-300" :
                          "bg-green-100 text-green-800 border-green-300"
                        )}
                      >
                        {topic.nodeType}
                      </Badge>
                    </div>
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
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={(e) => handleIndividualTopicSelect(topic, e)}
                  className={cn(
                    "h-5 w-5 rounded border flex items-center justify-center",
                    isSelected ? "bg-primary border-primary text-white" : "border-gray-300"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {topic.children!.map(child => (
              <TopicItem key={child.id} topic={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }, [expandedTopics, selectedTopicIds, handleTopicSelect, handleIndividualTopicSelect, toggleExpand]);

  // Auto-expand chapters on initial load
  useEffect(() => {
    if (hierarchicalTopics.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      hierarchicalTopics.forEach(topic => {
        if (topic.nodeType === SubjectNodeType.CHAPTER) {
          initialExpanded[topic.id] = true;
        }
      });
      setExpandedTopics(prev => ({ ...prev, ...initialExpanded }));
    }
  }, [hierarchicalTopics]);

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

      <div className="flex items-center justify-between">
        <Card
          className={cn(
            "cursor-pointer transition-colors hover:bg-muted w-full",
            selectedTopicIds.length === 0 ? 'border-primary bg-primary/5' : ''
          )}
          onClick={handleSkip}
        >
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-lg font-medium">Skip topic selection</span>
              <span className="text-sm text-muted-foreground">Create an activity without specifying a topic</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {selectedTopicIds.length} topic(s) selected
        </span>
        {selectedTopicIds.length > 0 && (
          <button
            onClick={() => onSelect([])}
            className="text-sm text-primary hover:underline"
          >
            Clear selection
          </button>
        )}
      </div>

      <ScrollArea className="h-[400px] border rounded-md p-4">
        {isLoading && filteredTopics.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[100px] w-full rounded-md" />
            ))}
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery ? `No topics found matching "${searchQuery}"` : 'No topics available'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTopics.map(topic => (
              <TopicItem key={topic.id} topic={topic} level={0} />
            ))}
          </div>
        )}

        {isLoading && filteredTopics.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading more topics...</span>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
