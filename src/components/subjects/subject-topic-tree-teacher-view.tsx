'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, FileText, X } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(level === 0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasChildren = topic.childTopics && topic.childTopics.length > 0;

  // Fetch topic details when dialog is opened
  const { data: topicDetails, isLoading } = api.subjectTopic.get.useQuery(
    { id: topic.id },
    { enabled: dialogOpen }
  );

  const getNodeTypeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'CHAPTER':
        return 'bg-blue-100 text-blue-800';
      case 'TOPIC':
        return 'bg-green-100 text-green-800';
      case 'SUBTOPIC':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          {topic._count && (
            <div className="ml-auto flex items-center text-sm text-gray-500">
              {topic._count.activities > 0 && (
                <span className="flex items-center mr-3">
                  <FileText className="h-3 w-3 mr-1" />
                  {topic._count.activities}
                </span>
              )}
              {topic._count.assessments > 0 && (
                <span className="flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {topic._count.assessments}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={() => setDialogOpen(true)}
          >
            <FileText className="h-4 w-4" />
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
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Context</TabsTrigger>
                <TabsTrigger value="resources">Details</TabsTrigger>
              </TabsList>

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

                <Card>
                  <CardHeader>
                    <CardTitle>Learning Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none dark:prose-invert">
                      {topicDetails.learningOutcomes || "No learning outcomes defined."}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none dark:prose-invert">
                      {topicDetails.context || "No context information available."}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Competency Level</h3>
                        <p>{topicDetails.competencyLevel || "Not specified"}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Estimated Duration</h3>
                        <p>{topicDetails.estimatedMinutes ? `${topicDetails.estimatedMinutes} minutes` : "Not specified"}</p>
                      </div>

                      {topicDetails.keywords && topicDetails.keywords.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Keywords</h3>
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

interface SubjectTopicTreeTeacherViewProps {
  topics: Topic[];
  subjectId: string;
  classId: string;
}

export function SubjectTopicTreeTeacherView({ topics, subjectId, classId }: SubjectTopicTreeTeacherViewProps) {
  return (
    <div className="space-y-2">
      {topics.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
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
