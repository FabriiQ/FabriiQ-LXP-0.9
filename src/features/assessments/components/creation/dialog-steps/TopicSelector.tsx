'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Award,
  Check,
  List,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Search,
  GraduationCap,
  Square,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';

interface Topic {
  id: string;
  code: string;
  title: string;
  description?: string;
  nodeType: string;
  orderIndex: number;
  subjectId: string;
  parentTopicId?: string | null;
  status: string;
  children?: Topic[];
  _count?: {
    activities: number;
    assessments: number;
    childTopics: number;
  };
}

interface TopicSelectorProps {
  subjectId: string;
  selectedTopicId: string;
  selectedTopicIds?: string[]; // New prop for multiple selection
  onSelect: (topicId: string) => void;
  onSelectMultiple?: (topicIds: string[]) => void; // New prop for multiple selection
  isLoading: boolean;
  allowMultiple?: boolean; // New prop to enable multiple selection
}

// TopicNode component for tree structure
interface TopicNodeProps {
  topic: Topic;
  level: number;
  selectedTopicId: string;
  selectedTopicIds?: string[];
  onSelect: (topicId: string) => void;
  onSelectMultiple?: (topicIds: string[]) => void;
  searchQuery: string;
  learningOutcomesCount?: number;
  rubricCriteriaCount?: number;
  allowMultiple?: boolean;
}

const TopicNode = ({
  topic,
  level,
  selectedTopicId,
  selectedTopicIds = [],
  onSelect,
  onSelectMultiple,
  searchQuery,
  learningOutcomesCount = 0,
  rubricCriteriaCount = 0,
  allowMultiple = false
}: TopicNodeProps) => {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = topic.children && topic.children.length > 0;
  const isSelected = allowMultiple
    ? selectedTopicIds.includes(topic.id)
    : selectedTopicId === topic.id;

  // Fetch learning outcomes for this topic
  const { data: learningOutcomes } = api.learningOutcome.getByTopic.useQuery(
    { topicId: topic.id },
    { enabled: !!topic.id }
  );

  // Fetch rubric criteria for this topic
  const { data: rubricCriteria } = api.rubric.getCriteriaByTopic.useQuery(
    { topicId: topic.id },
    { enabled: !!topic.id }
  );

  const getNodeTypeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'CHAPTER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'TOPIC':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'SUBTOPIC':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Filter based on search query
  const matchesSearch = !searchQuery ||
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!matchesSearch && !hasChildren) return null;

  return (
    <div className={cn("border-l ml-3", level > 0 && "pl-4")}>
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200",
          "hover:bg-muted/50",
          isSelected && "bg-primary/10 border border-primary/20"
        )}
        onClick={() => {
          if (allowMultiple && onSelectMultiple) {
            const newSelection = isSelected
              ? selectedTopicIds.filter(id => id !== topic.id)
              : [...selectedTopicIds, topic.id];
            onSelectMultiple(newSelection);
          } else {
            onSelect(topic.id);
          }
        }}
      >
        <div className="flex items-center space-x-3 flex-1">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{topic.title}</span>
              <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                {topic.code}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getNodeTypeColor(topic.nodeType)}`}>
                {topic.nodeType}
              </span>

              {/* Learning Outcomes Count */}
              {learningOutcomes && learningOutcomes.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-primary-green/10 text-primary-green rounded-full flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {learningOutcomes.length} LO
                </span>
              )}

              {/* Rubric Criteria Count */}
              {rubricCriteria && rubricCriteria.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full flex items-center gap-1">
                  <Square className="h-3 w-3" />
                  {rubricCriteria.length} RC
                </span>
              )}

              {isSelected && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>

            {topic.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {topic.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="mt-1">
          {topic.children!.map(child => (
            <TopicNode
              key={child.id}
              topic={child}
              level={level + 1}
              selectedTopicId={selectedTopicId}
              selectedTopicIds={selectedTopicIds}
              onSelect={onSelect}
              onSelectMultiple={onSelectMultiple}
              searchQuery={searchQuery}
              allowMultiple={allowMultiple}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function TopicSelector({
  subjectId,
  selectedTopicId,
  selectedTopicIds = [],
  onSelect,
  onSelectMultiple,
  isLoading,
  allowMultiple = false
}: TopicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch topic hierarchy
  const { data: topicHierarchy, isLoading: isLoadingTopics } = api.subjectTopic.getHierarchy.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );

  if (isLoading || isLoadingTopics) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Select a Topic</h3>
          <p className="text-muted-foreground">
            Choose the topic for this assessment.
          </p>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 border rounded-lg">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!topicHierarchy || topicHierarchy.length === 0) {
    return (
      <div className="text-center py-12">
        <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Topics Found</h3>
        <p className="text-muted-foreground mb-4">
          No topics are available for this subject. Please contact your administrator or create topics first.
        </p>
      </div>
    );
  }

  const selectedTopic = topicHierarchy
    .flatMap(topic => [topic, ...(topic.children || [])])
    .find(t => t.id === selectedTopicId);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {allowMultiple ? 'Select Topics *' : 'Select a Topic *'}
        </h3>
        <p className="text-muted-foreground">
          {allowMultiple
            ? 'Choose one or more topics for this assessment. This will determine the available learning outcomes and rubrics.'
            : 'Choose the topic for this assessment. This will determine the available learning outcomes and rubrics.'
          }
          <span className="text-red-600 font-medium"> This field is required.</span>
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Topic Tree */}
      <Card className="p-4">
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-1">
            {topicHierarchy.map(topic => (
              <TopicNode
                key={topic.id}
                topic={topic}
                level={0}
                selectedTopicId={selectedTopicId}
                selectedTopicIds={selectedTopicIds}
                onSelect={onSelect}
                onSelectMultiple={onSelectMultiple}
                searchQuery={searchQuery}
                allowMultiple={allowMultiple}
              />
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Selected Topic Summary */}
      {allowMultiple ? (
        selectedTopicIds.length > 0 && (
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-primary mb-2">
              <Check className="h-4 w-4" />
              <span className="font-medium">
                {selectedTopicIds.length} topic{selectedTopicIds.length === 1 ? '' : 's'} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTopicIds.map(topicId => {
                const topic = topicHierarchy
                  ?.flatMap(t => [t, ...(t.children || [])])
                  .find(t => t.id === topicId);
                return topic ? (
                  <Badge key={topicId} variant="outline" className="text-xs">
                    {topic.title} ({topic.code})
                  </Badge>
                ) : null;
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              You can now select the learning outcomes for this assessment.
            </p>
          </div>
        )
      ) : (
        selectedTopicId && selectedTopic && (
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-primary mb-2">
              <Check className="h-4 w-4" />
              <span className="font-medium">
                Topic selected: {selectedTopic.title}
              </span>
              <Badge variant="outline" className="text-xs">
                {selectedTopic.code}
              </Badge>
            </div>
            {selectedTopic.description && (
              <p className="text-xs text-muted-foreground mb-2">
                {selectedTopic.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              You can now select the learning outcomes for this assessment.
            </p>
          </div>
        )
      )}
    </div>
  );
}
