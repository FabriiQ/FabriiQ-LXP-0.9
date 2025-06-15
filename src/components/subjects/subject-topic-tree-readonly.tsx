'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, GraduationCap, FolderIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms/button';
import { Badge } from '@/components/ui/atoms/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { api } from '@/trpc/react';
import { BloomsDistributionChart } from '@/features/bloom/components/taxonomy/BloomsDistributionChart';
import { BloomsDistribution, BloomsTaxonomyLevel } from '@/features/bloom/types';
import { ThemeWrapper } from '@/features/activties/components/ui/ThemeWrapper';
import { useRouter } from 'next/navigation';
import { constructLearningOutcomesUrl } from '@/utils/admin-navigation';

// Define the topic type based on the database schema
type Topic = {
  id: string;
  code: string;
  title: string;
  description?: string;
  nodeType: string;
  orderIndex: number;
  subjectId: string;
  parentTopicId?: string | null;
  status: string;
  childTopics?: Topic[];
  _count?: {
    activities: number;
    assessments: number;
    childTopics: number;
  };
};

interface TopicNodeProps {
  topic: Topic;
  level: number;
  subjectId: string;
  classId: string;
}

const TopicNode: React.FC<TopicNodeProps> = ({ topic, level, subjectId, classId }) => {
  // Default to collapsed state for all levels
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasChildren = topic.childTopics && topic.childTopics.length > 0;
  const router = useRouter();

  // Fetch topic details when dialog is opened
  const { data: topicDetails, isLoading } = api.subjectTopic.get.useQuery(
    { id: topic.id },
    { enabled: dialogOpen }
  );

  // Fetch learning outcomes for this topic
  const { data: learningOutcomes } = api.learningOutcome.getByTopic.useQuery(
    { topicId: topic.id },
    { enabled: dialogOpen }
  );

  // Fetch rubric criteria for this topic
  const { data: rubricCriteria } = api.rubric.getCriteriaByTopic.useQuery(
    { topicId: topic.id },
    { enabled: dialogOpen }
  );

  // Navigate to learning outcomes page for this topic
  const handleNavigateToLearningOutcomes = () => {
    const url = constructLearningOutcomesUrl(subjectId, topic.id, window.location.pathname);
    router.push(url);
  };

  const getNodeTypeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'CHAPTER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'TOPIC':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'SUBTOPIC':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="mb-2">
      <div
        className={cn(
          "flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
          level === 0 ? "bg-gray-50 dark:bg-gray-900" : ""
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className="p-1 mr-1"
          onClick={() => setExpanded(!expanded)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="w-4" />
          )}
        </Button>

        <div className="flex-1 flex items-center">
          <span className="font-medium">{topic.title}</span>
          <Badge className={cn("ml-2 text-xs", getNodeTypeColor(topic.nodeType))}>
            {topic.nodeType}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {/* Learning Outcomes button */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={handleNavigateToLearningOutcomes}
            title="View learning outcomes"
          >
            <GraduationCap className="h-4 w-4 text-primary-green" />
          </Button>

          {/* Info button for Bloom's taxonomy distribution */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={() => setDialogOpen(true)}
            title="View topic details"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className={cn("pl-6 border-l ml-3 mt-1")}>
          {topic.childTopics?.map((childTopic) => (
            <TopicNode
              key={childTopic.id}
              topic={childTopic}
              level={level + 1}
              subjectId={subjectId}
              classId={classId}
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
              <Badge className={cn("ml-2", getNodeTypeColor(topic.nodeType))}>
                {topic.nodeType}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Topic Code: {topic.code}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 text-center">Loading topic details...</div>
          ) : topicDetails ? (
            <Tabs defaultValue="stats" className="mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Topic Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="text-sm font-medium mb-2 dark:text-gray-300">Learning Outcomes</h3>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold text-primary-green dark:text-medium-teal">
                            {learningOutcomes?.length || 0}
                          </div>
                          <div className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                            {learningOutcomes?.length === 1 ? 'outcome' : 'outcomes'} defined
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="text-sm font-medium mb-2 dark:text-gray-300">Rubric Criteria</h3>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold text-primary-green dark:text-medium-teal">
                            {rubricCriteria?.length || 0}
                          </div>
                          <div className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                            {rubricCriteria?.length === 1 ? 'criterion' : 'criteria'} defined
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bloom's Taxonomy Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topicDetails.bloomsDistribution ? (
                      <div className="h-64">
                        <ThemeWrapper>
                          <BloomsDistributionChart
                            distribution={topicDetails.bloomsDistribution as BloomsDistribution}
                            editable={false}
                            showLabels={true}
                            showPercentages={true}
                            variant="pie"
                          />
                        </ThemeWrapper>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No Bloom's taxonomy distribution defined for this topic.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none dark:prose-invert">
                      {topicDetails.description || "No description available."}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Competency Level</h3>
                        <p className="dark:text-gray-300">{topicDetails.competencyLevel || "Not specified"}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Duration</h3>
                        <p className="dark:text-gray-300">{topicDetails.estimatedMinutes ? `${topicDetails.estimatedMinutes} minutes` : "Not specified"}</p>
                      </div>

                      {topicDetails.keywords && topicDetails.keywords.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Keywords</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {topicDetails.keywords.map((keyword: string, index: number) => (
                              <Badge key={index} variant="outline">{keyword}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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

interface SubjectTopicTreeReadonlyProps {
  topics: Topic[];
  subjectId: string;
  classId: string;
}

export function SubjectTopicTreeReadonly({ topics, subjectId, classId }: SubjectTopicTreeReadonlyProps) {
  return (
    <div className="space-y-2 transition-colors dark:text-gray-200">
      {topics.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No topics defined for this subject yet.
        </div>
      ) : (
        topics.map(topic => (
          <TopicNode
            key={topic.id}
            topic={topic}
            level={0}
            subjectId={subjectId}
            classId={classId}
          />
        ))
      )}
    </div>
  );
}
