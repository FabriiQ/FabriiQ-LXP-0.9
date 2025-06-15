'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Search, ChevronDown, ChevronRight, Check, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SubjectNodeType } from '@/server/api/constants';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Define the Topic interface with hierarchy support
interface Topic {
  id: string;
  title: string;
  code: string;
  nodeType: string;
  description?: string | null;
  keywords?: string[];
  parentTopicId?: string | null;
  children?: Topic[];
  childTopics?: Topic[];
  // Additional properties that might be in the data
  parentTopic?: any;
  subjectName?: string;
  activityCount?: number;
  assessmentCount?: number;
  childTopicCount?: number;
  subject?: any;
  _count?: any;
  subjectId?: string;
}

interface HierarchicalTopicSelectorProps {
  subjectId: string;
  selectedTopicIds: string[];
  customTopics: string[];
  onTopicsChange: (selectedTopicIds: string[], customTopics: string[]) => void;
}

export function HierarchicalTopicSelector({
  subjectId,
  selectedTopicIds,
  customTopics,
  onTopicsChange,
}: HierarchicalTopicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [newCustomTopic, setNewCustomTopic] = useState('');

  // Fetch subject topics
  const { data: topics, isLoading } = api.lessonPlan.getSubjectTopics.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );

  // Build hierarchical structure
  const hierarchicalTopics = useMemo(() => {
    if (!topics) return [];

    // Create a map of all topics by ID
    const topicMap = new Map<string, Topic>();
    topics.forEach(topic => {
      // Create a copy with an empty children array and handle null values
      // Convert any null values to undefined to match the Topic interface
      const topicWithChildren: Topic = {
        ...topic,
        children: [],
        // Ensure description is either string or undefined, not null
        description: topic.description || undefined
      };
      topicMap.set(topic.id, topicWithChildren);
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

    // Sort topics by code
    const sortTopics = (topics: Topic[]) => {
      topics.sort((a, b) => a.code?.localeCompare(b.code || '') || 0);
      topics.forEach(topic => {
        if (topic.children && topic.children.length > 0) {
          sortTopics(topic.children);
        }
      });
    };

    sortTopics(rootTopics);

    return rootTopics;
  }, [topics]);

  // Filter topics based on search query
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return hierarchicalTopics;

    // Helper function to search in a topic and its children
    const searchInTopic = (topic: Topic): boolean => {
      const matchesCriteria =
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.code && topic.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
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

    return filtered;
  }, [hierarchicalTopics, searchQuery]);

  // Handle auto-expansion when searching in a separate effect to avoid state updates in render
  useEffect(() => {
    if (searchQuery.trim() && filteredTopics.length > 0) {
      // Auto-expand all topics when searching
      const newExpandedTopics: Record<string, boolean> = {};
      const expandAllMatchingTopics = (topic: Topic) => {
        newExpandedTopics[topic.id] = true;
        if (topic.children) {
          topic.children.forEach(expandAllMatchingTopics);
        }
      };

      filteredTopics.forEach(expandAllMatchingTopics);

      // Check if we need to update at all
      let needsUpdate = false;
      for (const id in newExpandedTopics) {
        if (!expandedTopics[id]) {
          needsUpdate = true;
          break;
        }
      }

      // Only update state if necessary
      if (needsUpdate) {
        setExpandedTopics(prev => ({ ...prev, ...newExpandedTopics }));
      }
    }
  }, [searchQuery, filteredTopics, expandedTopics]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

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

    onTopicsChange(newSelectedIds, customTopics);
  }, [selectedTopicIds, customTopics, onTopicsChange]);

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

    onTopicsChange(newSelectedIds, customTopics);
  }, [selectedTopicIds, customTopics, onTopicsChange]);

  // Add custom topic
  const handleAddCustomTopic = useCallback(() => {
    if (newCustomTopic.trim()) {
      const newCustomTopics = [...customTopics, newCustomTopic.trim()];
      onTopicsChange(selectedTopicIds, newCustomTopics);
      setNewCustomTopic('');
    }
  }, [newCustomTopic, customTopics, selectedTopicIds, onTopicsChange]);

  // Remove custom topic
  const handleRemoveCustomTopic = useCallback((index: number) => {
    const newCustomTopics = customTopics.filter((_, i) => i !== index);
    onTopicsChange(selectedTopicIds, newCustomTopics);
  }, [customTopics, selectedTopicIds, onTopicsChange]);

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

  // Auto-expand chapters on initial load - use a ref to ensure it only runs once
  const initialExpandRef = React.useRef(false);

  useEffect(() => {
    // Only run this effect once when hierarchicalTopics are first loaded
    if (!initialExpandRef.current && hierarchicalTopics.length > 0) {
      initialExpandRef.current = true;

      const initialExpanded: Record<string, boolean> = {};
      hierarchicalTopics.forEach(topic => {
        if (topic.nodeType === SubjectNodeType.CHAPTER) {
          initialExpanded[topic.id] = true;
        }
      });

      // Use a functional update to avoid dependency on previous state
      setExpandedTopics(prev => {
        // Check if we need to update at all
        let needsUpdate = false;
        for (const id in initialExpanded) {
          if (!prev[id]) {
            needsUpdate = true;
            break;
          }
        }

        // Only create a new object if we actually need to update
        return needsUpdate ? { ...prev, ...initialExpanded } : prev;
      });
    }
  }, [hierarchicalTopics]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Select from Subject Topics</h3>
        {!subjectId ? (
          <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/20">
            <p className="text-sm text-muted-foreground text-center">
              Please select a subject first to see available topics.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 border rounded-md">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Loading topics...</p>
          </div>
        ) : !topics || topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/20">
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
              />
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
            </ScrollArea>
          </>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Add Custom Topics</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <Input
            placeholder="Enter custom topic"
            value={newCustomTopic}
            onChange={(e) => setNewCustomTopic(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustomTopic}
            disabled={!newCustomTopic.trim()}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {customTopics.length > 0 && (
          <div className="mt-2 space-y-2">
            {customTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span className="text-sm">{topic}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCustomTopic(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
