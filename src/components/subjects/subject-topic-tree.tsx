'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Plus, Trash2, BookOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms/button';
import { Badge } from '@/components/ui/atoms/badge';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  onRefresh: () => void;
}

const TopicNode: React.FC<TopicNodeProps> = ({ topic, level, subjectId, classId, onRefresh }) => {
  const [expanded, setExpanded] = useState(level === 0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const hasChildren = topic.childTopics && topic.childTopics.length > 0;

  const deleteTopic = api.subjectTopic.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Topic deleted",
        description: "The topic has been successfully deleted.",
      });
      onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete topic",
        variant: "error",
      });
    },
  });

  const handleDelete = async () => {
    try {
      await deleteTopic.mutateAsync({ id: topic.id });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

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
          <Button variant="ghost" size="sm" className="p-1" asChild>
            <Link href={`/teacher/classes/${classId}/subjects/${subjectId}/topics/${topic.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="p-1" asChild>
            <Link href={`/teacher/classes/${classId}/subjects/${subjectId}/topics/${topic.id}/activities`}>
              <FileText className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="p-1" asChild>
            <Link href={`/teacher/classes/${classId}/subjects/${subjectId}/topics/create?parentId=${topic.id}`}>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
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
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the topic "{topic.title}" and all its content. This action cannot be undone.
              {hasChildren && (
                <p className="mt-2 text-red-500 font-semibold">
                  Warning: This topic has {topic.childTopics?.length} child topics that will also be deleted!
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface SubjectTopicTreeProps {
  topics: Topic[];
  subjectId: string;
  classId: string;
}

export function SubjectTopicTree({ topics, subjectId, classId }: SubjectTopicTreeProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-2" key={refreshKey}>
      {topics.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No topics defined yet. Add a chapter to get started.
        </div>
      ) : (
        topics.map(topic => (
          <TopicNode
            key={topic.id}
            topic={topic}
            level={0}
            subjectId={subjectId}
            classId={classId}
            onRefresh={handleRefresh}
          />
        ))
      )}
    </div>
  );
}
