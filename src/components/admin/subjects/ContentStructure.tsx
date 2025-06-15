'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/core/button";
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, GraduationCap, Info, CheckSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "react-hot-toast";
import { SubjectNodeType, CompetencyLevel, SystemStatus } from "@/server/api/constants";
import { AddTopicDialog } from "./AddTopicDialog";
import { ThemeWrapper } from "@/features/activties/components/ui/ThemeWrapper";
import { useTheme } from "@/providers/theme-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BloomsDistributionChart } from "@/features/bloom/components/taxonomy/BloomsDistributionChart";
import { BloomsDistribution } from "@/features/bloom/types";
import { constructLearningOutcomesUrl, constructTopicUrl } from "@/utils/admin-navigation";

// Topic structure based on the new SubjectTopic model
type SubjectTopic = {
  id: string;
  code: string;
  title: string;
  description?: string;
  context?: string;
  learningOutcomes?: string;
  nodeType: SubjectNodeType;
  orderIndex: number;
  estimatedMinutes?: number;
  competencyLevel?: CompetencyLevel;
  keywords?: string[];
  subjectId: string;
  parentTopicId?: string;
  status: SystemStatus;
  children?: SubjectTopic[];
  _count?: {
    activities: number;
    assessments: number;
    childTopics: number;
  };
};

interface TopicNodeProps {
  topic: SubjectTopic;
  level: number;
  subjectId: string;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
  onSelect: (topic: SubjectTopic) => void;
  selectedId?: string;
}

const TopicNode = ({
  topic,
  level,
  subjectId,
  onDelete,
  onRefresh,
  onSelect,
  selectedId
}: TopicNodeProps) => {
  // Default to collapsed state for all levels
  const [expanded, setExpanded] = useState(false);
  const hasChildren = topic.children && topic.children.length > 0;
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const isSelected = selectedId === topic.id;

  // Fetch learning outcomes for this topic
  const { data: learningOutcomes } = api.learningOutcome.getByTopic.useQuery(
    { topicId: topic.id }
  );

  // Fetch rubric criteria for this topic
  const { data: rubricCriteria } = api.rubric.getCriteriaByTopic.useQuery(
    { topicId: topic.id },
    { enabled: dialogOpen }
  );

  // Fetch topic details when dialog is opened
  const { data: topicDetails, isLoading } = api.subjectTopic.get.useQuery(
    { id: topic.id },
    { enabled: dialogOpen }
  );

  // Navigate to learning outcomes page for this topic
  const handleNavigateToLearningOutcomes = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = constructLearningOutcomesUrl(subjectId, topic.id, window.location.pathname);
    router.push(url);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${topic.title}"? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await onDelete(topic.id);
        toast.success("Topic deleted successfully");
        onRefresh();
      } catch (error) {
        toast.error("Failed to delete topic");
        console.error(error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Get background color based on node type and selection
  const getBackgroundColor = () => {
    if (isSelected) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400';

    if (topic.nodeType === SubjectNodeType.CHAPTER) {
      return 'bg-muted/50 border-border';
    } else if (topic.nodeType === SubjectNodeType.TOPIC) {
      return 'bg-background border-border';
    } else {
      return 'bg-muted/30 border-border';
    }
  };

  return (
    <div className="mb-2">
      <div
        className={`p-3 rounded border ${getBackgroundColor()} transition-colors duration-200 text-foreground`}
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex justify-between items-center">
          <div
            className="flex items-center gap-2 cursor-pointer flex-grow"
            onClick={() => onSelect(topic)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div className="w-4"></div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{topic.title}</span>
                <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                  {topic.code}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  topic.nodeType === SubjectNodeType.CHAPTER
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : topic.nodeType === SubjectNodeType.TOPIC
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
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
                    <CheckSquare className="h-3 w-3" />
                    {rubricCriteria.length} RC
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Learning Outcomes button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNavigateToLearningOutcomes}
              title="View learning outcomes"
            >
              <GraduationCap size={16} className="text-primary-green" />
            </Button>

            {/* Info button for Bloom's taxonomy distribution */}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(true);
              }}
              title="View topic details"
            >
              <Info size={16} />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(topic);
              }}
              title={`Add ${
                topic.nodeType === SubjectNodeType.CHAPTER
                  ? 'Topic'
                  : topic.nodeType === SubjectNodeType.TOPIC
                    ? 'Subtopic'
                    : 'Item'
              }`}
            >
              <Plus size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                const url = constructTopicUrl(subjectId, topic.id, window.location.pathname);
                router.push(url);
              }}
              title="Edit Topic"
            >
              <Edit size={16} />
            </Button>
            {/* Delete button */}
            {!(topic._count && (topic._count.childTopics > 0 || topic._count.activities > 0 || topic._count.assessments > 0)) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                title="Delete topic"
              >
                <Trash2 size={16} className={isDeleting ? "text-gray-400" : "text-red-500"} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {topic.children!.map(child => (
            <TopicNode
              key={child.id}
              topic={child}
              level={level + 1}
              subjectId={subjectId}
              onDelete={onDelete}
              onRefresh={onRefresh}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}

      {/* Topic Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{topic.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                topic.nodeType === SubjectNodeType.CHAPTER
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : topic.nodeType === SubjectNodeType.TOPIC
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {topic.nodeType}
              </span>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 text-center">Loading topic details...</div>
          ) : topicDetails ? (
            <div className="space-y-6 mt-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Topic Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4 bg-muted/50 border-border">
                    <h3 className="text-sm font-medium mb-2 text-foreground">Learning Outcomes</h3>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold text-primary">
                        {learningOutcomes?.length || 0}
                      </div>
                      <div className="ml-3 text-sm text-muted-foreground">
                        {learningOutcomes?.length === 1 ? 'outcome' : 'outcomes'} defined
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-4 bg-muted/50 border-border">
                    <h3 className="text-sm font-medium mb-2 text-foreground">Rubric Criteria</h3>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold text-primary">
                        {rubricCriteria?.length || 0}
                      </div>
                      <div className="ml-3 text-sm text-muted-foreground">
                        {rubricCriteria?.length === 1 ? 'criterion' : 'criteria'} defined
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Bloom's Taxonomy Distribution</h3>
                <div className="h-64">
                  <ThemeWrapper>
                    {topicDetails.bloomsDistribution ? (
                      <BloomsDistributionChart
                        distribution={topicDetails.bloomsDistribution as BloomsDistribution}
                        editable={false}
                        showLabels={true}
                        showPercentages={true}
                        variant="pie"
                      />
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No Bloom's taxonomy distribution defined for this topic.
                      </div>
                    )}
                  </ThemeWrapper>
                </div>
              </Card>
            </div>
          ) : (
            <div className="py-8 text-center">Failed to load topic details.</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ContentStructureProps {
  subjectId: string;
}

export const ContentStructure = ({ subjectId }: ContentStructureProps) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedNode, setSelectedNode] = useState<SubjectTopic | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Use the TRPC API to fetch topic hierarchy
  const { data: topicHierarchy, isLoading: isLoadingTopics, error } = api.subjectTopic.getHierarchy.useQuery(
    { subjectId },
    {
      enabled: !!subjectId,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      keepPreviousData: false,
      refetchInterval: refreshKey ? undefined : false
    }
  );

  // Delete mutation
  const deleteMutation = api.subjectTopic.delete.useMutation();

  // Handle delete topic
  const handleDeleteTopic = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
    setRefreshKey(prev => prev + 1); // Trigger a refresh
    if (selectedNode?.id === id) {
      setSelectedNode(null); // Clear selection if deleted node was selected
    }
  };

  // Handle node selection
  const handleSelectNode = (topic: SubjectTopic) => {
    setSelectedNode(prev => prev?.id === topic.id ? null : topic);
  };

  // Handle add button click
  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };

  // Handle topic creation success
  const handleTopicCreated = () => {
    setRefreshKey(prev => prev + 1); // Trigger a refresh
  };
  useEffect(() => {
    setIsLoading(isLoadingTopics);
  }, [isLoadingTopics]);

  // Get button label based on selected node
  const getAddButtonLabel = () => {
    if (!selectedNode) {
      return 'Add Chapter';
    }

    switch (selectedNode.nodeType) {
      case SubjectNodeType.CHAPTER:
        return 'Add Topic';
      case SubjectNodeType.TOPIC:
        return 'Add Subtopic';
      default:
        return 'Add Item';
    }
  };

  return (
    <ThemeWrapper data-theme={theme}>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Content Structure</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleAddClick}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              {getAddButtonLabel()}
            </Button>
          </div>
        </div>

      {selectedNode && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Selected: <span className="font-medium">{selectedNode.title}</span> ({selectedNode.nodeType})</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Click "{getAddButtonLabel()}" to add a child item, or select a different node</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedNode(null)}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-4">
          Error loading topic structure: {error.message}
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading topic structure...
          </div>
        ) : topicHierarchy && topicHierarchy.length > 0 ? (
          topicHierarchy.map(topic => (
            <TopicNode
              key={topic.id}
              topic={topic}
              level={0}
              subjectId={subjectId}
              onDelete={handleDeleteTopic}
              onRefresh={() => setRefreshKey(prev => prev + 1)}
              onSelect={handleSelectNode}
              selectedId={selectedNode?.id}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No topic structure defined yet. Add a chapter to get started.
          </div>
        )}
      </div>

      {/* Add Topic Dialog */}
      <AddTopicDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        subjectId={subjectId}
        selectedNodeId={selectedNode?.id}
        selectedNodeType={selectedNode?.nodeType}
        onTopicCreated={handleTopicCreated}
      />
    </Card>
    </ThemeWrapper>
  );
};