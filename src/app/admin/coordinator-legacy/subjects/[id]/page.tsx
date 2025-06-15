'use client';

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronDown, ChevronRight, Plus, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { SubjectNodeType, CompetencyLevel } from "@/server/api/constants";
import { useToast } from "@/components/ui/feedback/toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define the topic schema for the form
const topicSchema = z.object({
  code: z.string().min(1, "Code is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  nodeType: z.enum([SubjectNodeType.CHAPTER, SubjectNodeType.TOPIC, SubjectNodeType.SUBTOPIC]),
  parentTopicId: z.string().optional(),
  orderIndex: z.number().default(0),
  estimatedMinutes: z.number().optional(),
  competencyLevel: z.enum([
    CompetencyLevel.BEGINNER,
    CompetencyLevel.INTERMEDIATE,
    CompetencyLevel.ADVANCED
  ]).optional(),
  keywords: z.array(z.string()).optional(),
});

type TopicFormValues = z.infer<typeof topicSchema>;

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const subjectId = params?.id as string;
  const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>("none");
  const [activeTab, setActiveTab] = useState("structure");
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch subject details
  const { data: subject, isLoading: isLoadingSubject } = api.subject.getById.useQuery(
    { id: subjectId },
    {
      enabled: !!subjectId,
      refetchOnWindowFocus: false
    }
  );

  // Fetch topic hierarchy
  const { data: topicHierarchy, isLoading: isLoadingTopics } = api.subjectTopic.getHierarchy.useQuery(
    { subjectId },
    {
      enabled: !!subjectId,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      keepPreviousData: false,
      refetchInterval: refreshKey ? undefined : false
    }
  );

  // Fetch parent topics for dropdown
  const { data: parentTopicsResponse } = api.subjectTopic.list.useQuery(
    {
      subjectId,
      nodeType: SubjectNodeType.CHAPTER, // Only chapters can be parents when creating
    },
    {
      enabled: !!subjectId,
      refetchOnWindowFocus: false
    }
  );

  // Extract the parent topics array from the response
  const parentTopics = parentTopicsResponse?.data || [];

  // Create topic mutation
  const createTopic = api.subjectTopic.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Topic created successfully",
        variant: "success",
      });
      setIsAddTopicDialogOpen(false);
      setRefreshKey(prev => prev + 1);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create topic",
        variant: "error",
      });
    },
  });

  // Form setup
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      parentTopicId: undefined,
    }
  });

  const isLoading = isLoadingSubject || isLoadingTopics;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="container mx-auto py-6">
        <div className="p-4 bg-destructive/10 rounded-md">
          <p className="text-destructive">Subject not found</p>
        </div>
      </div>
    );
  }

  // Handle form submission
  const onSubmit = async (data: TopicFormValues) => {
    try {
      await createTopic.mutateAsync({
        ...data,
        subjectId,
      });
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error("Error creating topic:", error);
    }
  };

  // Handle opening the add topic dialog with a parent pre-selected
  const handleAddSubtopic = (parentId: string) => {
    setSelectedParentId(parentId);
    setValue("parentTopicId", parentId);
    setValue("nodeType", SubjectNodeType.TOPIC);
    setIsAddTopicDialogOpen(true);
  };

  // Handle opening the add topic dialog without a parent
  const handleAddTopic = () => {
    setSelectedParentId("none");
    setValue("parentTopicId", undefined);
    setValue("nodeType", SubjectNodeType.CHAPTER);
    setIsAddTopicDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <PageHeader
              title={subject.name}
              description={`Subject Code: ${subject.code}`}
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleAddTopic}>
            <Plus className="mr-2 h-4 w-4" />
            Add Topic
          </Button>
        </div>
      </div>

      <Tabs defaultValue="structure" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure">Topic Structure</TabsTrigger>
          <TabsTrigger value="details">Subject Details</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Topic Structure</CardTitle>
              <CardDescription>
                Organize the topics and subtopics for this subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topicHierarchy && topicHierarchy.length > 0 ? (
                <div className="space-y-2">
                  {topicHierarchy.map(topic => (
                    <TopicNode
                      key={topic.id}
                      topic={topic}
                      level={0}
                      onAddSubtopic={handleAddSubtopic}
                      onRefresh={() => setRefreshKey(prev => prev + 1)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No topics defined yet. Add a chapter to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Subject Code</p>
                <p className="font-medium">{subject.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits</p>
                <p className="font-medium">{subject.credits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={subject.status === 'ACTIVE' ? 'success' : 'secondary'}>
                  {subject.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{subject.description || "No description available"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activities and Assessments</CardTitle>
              <CardDescription>
                Learning activities and assessments for this subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No activities or assessments defined yet.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Topic Dialog */}
      <Dialog open={isAddTopicDialogOpen} onOpenChange={setIsAddTopicDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
            <DialogDescription>
              Create a new topic or subtopic for this subject.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code <span className="text-red-500">*</span></Label>
                  <Input
                    id="code"
                    {...register("code")}
                    placeholder="e.g., CH01"
                  />
                  {errors.code && (
                    <p className="text-sm text-red-500">{errors.code.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nodeType">Type <span className="text-red-500">*</span></Label>
                  <Select
                    defaultValue={selectedParentId ? SubjectNodeType.TOPIC : SubjectNodeType.CHAPTER}
                    onValueChange={(value) => setValue("nodeType", value as SubjectNodeType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SubjectNodeType.CHAPTER}>Chapter</SelectItem>
                      <SelectItem value={SubjectNodeType.TOPIC}>Topic</SelectItem>
                      <SelectItem value={SubjectNodeType.SUBTOPIC}>Subtopic</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.nodeType && (
                    <p className="text-sm text-red-500">{errors.nodeType.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="e.g., Introduction to the Subject"
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Enter a description for this topic"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentTopicId">Parent Topic</Label>
                  <Select
                    defaultValue={selectedParentId || "none"}
                    onValueChange={(value) => setValue("parentTopicId", value === "none" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Root Level)</SelectItem>
                      {parentTopics?.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderIndex">Order</Label>
                  <Input
                    id="orderIndex"
                    type="number"
                    {...register("orderIndex", { valueAsNumber: true })}
                    defaultValue={0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedMinutes">Estimated Minutes</Label>
                  <Input
                    id="estimatedMinutes"
                    type="number"
                    {...register("estimatedMinutes", { valueAsNumber: true })}
                    placeholder="e.g., 60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competencyLevel">Competency Level</Label>
                  <Select
                    onValueChange={(value) => setValue("competencyLevel", value as CompetencyLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CompetencyLevel.BEGINNER}>Beginner</SelectItem>
                      <SelectItem value={CompetencyLevel.INTERMEDIATE}>Intermediate</SelectItem>
                      <SelectItem value={CompetencyLevel.ADVANCED}>Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddTopicDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTopic.isLoading}>
                {createTopic.isLoading ? <LoadingSpinner /> : "Create Topic"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Topic Node Component
interface TopicNodeProps {
  topic: any;
  level: number;
  onAddSubtopic: (parentId: string) => void;
  onRefresh: () => void;
}

function TopicNode({ topic, level, onAddSubtopic, onRefresh }: TopicNodeProps) {
  const [expanded, setExpanded] = useState(level === 0);
  const { toast } = useToast();
  const router = useRouter();
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const hasChildren = topic.children && topic.children.length > 0;

  // Delete topic mutation
  const deleteTopic = api.subjectTopic.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Topic deleted successfully",
        variant: "success",
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
    if (confirm("Are you sure you want to delete this topic? This action cannot be undone.")) {
      try {
        await deleteTopic.mutateAsync({ id: topic.id });
      } catch (error) {
        // Error is handled in the mutation callbacks
        console.error("Error deleting topic:", error);
      }
    }
  };

  const getNodeTypeColor = (nodeType: string) => {
    switch (nodeType) {
      case SubjectNodeType.CHAPTER:
        return "bg-purple-100 text-purple-800";
      case SubjectNodeType.TOPIC:
        return "bg-blue-100 text-blue-800";
      case SubjectNodeType.SUBTOPIC:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="mb-2">
      <div className={`flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${level === 0 ? "bg-gray-50 dark:bg-gray-900" : ""}`}>
        <Button
          variant="ghost"
          size="sm"
          className="p-1 mr-1"
          onClick={() => setExpanded(!expanded)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="w-4" />
          )}
        </Button>

        <div className="flex-1 flex items-center">
          <span className="font-medium">{topic.title}</span>
          <Badge className={`ml-2 text-xs ${getNodeTypeColor(topic.nodeType)}`}>
            {topic.nodeType}
          </Badge>
          {topic._count && (
            <div className="ml-auto flex items-center text-sm text-gray-500">
              {topic._count.activities > 0 && (
                <span className="flex items-center mr-3">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {topic._count.activities}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsViewDialogOpen(true)}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddSubtopic(topic.id)}
          >
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="pl-6 border-l ml-3 mt-1">
          {topic.children?.map((childTopic: any) => (
            <TopicNode
              key={childTopic.id}
              topic={childTopic}
              level={level + 1}
              onAddSubtopic={onAddSubtopic}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {/* View Topic Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{topic.title}</DialogTitle>
            <DialogDescription>
              {topic.code} • {topic.nodeType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {topic.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p>{topic.description}</p>
              </div>
            )}
            {topic.context && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Context</h3>
                <p>{topic.context}</p>
              </div>
            )}
            {topic.learningOutcomes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Learning Outcomes</h3>
                <p>{topic.learningOutcomes}</p>
              </div>
            )}
            {topic.estimatedMinutes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Estimated Duration</h3>
                <p>{topic.estimatedMinutes} minutes</p>
              </div>
            )}
            {topic.competencyLevel && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Competency Level</h3>
                <p>{topic.competencyLevel}</p>
              </div>
            )}
            {topic.keywords && topic.keywords.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Keywords</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {topic.keywords.map((keyword: string, index: number) => (
                    <Badge key={index} variant="outline">{keyword}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
