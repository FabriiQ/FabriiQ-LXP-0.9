'use client';

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { api } from "@/trpc/react";
import { SubjectNodeType, CompetencyLevel, SystemStatus } from "@/server/api/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/feedback/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/forms/form";
import { Input } from "@/components/ui/forms/input";
import { Textarea } from "@/components/ui/forms/textarea";
import { Button } from "@/components/ui/core/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/navigation/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/forms/select";
import { Loader2 } from "lucide-react";

// Form schema
const topicFormSchema = z.object({
  code: z.string().min(1, "Code is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  context: z.string().optional(),
  learningOutcomes: z.string().optional(),
  nodeType: z.enum([
    SubjectNodeType.CHAPTER,
    SubjectNodeType.TOPIC,
    SubjectNodeType.SUBTOPIC,
  ]),
  orderIndex: z.number().int().min(0),
  estimatedMinutes: z.number().int().optional(),
  competencyLevel: z.enum([
    CompetencyLevel.BASIC,
    CompetencyLevel.INTERMEDIATE,
    CompetencyLevel.ADVANCED,
    CompetencyLevel.EXPERT,
  ]).optional(),
  keywords: z.array(z.string()).optional(),
  parentTopicId: z.string().optional(),
  status: z.enum([
    SystemStatus.ACTIVE,
    SystemStatus.INACTIVE,
    SystemStatus.ARCHIVED,
  ]).default(SystemStatus.ACTIVE),
});

type TopicFormValues = z.infer<typeof topicFormSchema>;

interface AddTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  selectedNodeId?: string;
  selectedNodeType?: SubjectNodeType;
  onTopicCreated: () => void;
}

export function AddTopicDialog({
  open,
  onOpenChange,
  subjectId,
  selectedNodeId,
  selectedNodeType,
  onTopicCreated,
}: AddTopicDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create mutation
  const createMutation = api.subjectTopic.create.useMutation();

  // Determine available node types based on selected parent
  const getAvailableNodeTypes = (): SubjectNodeType[] => {
    if (!selectedNodeId) {
      // If no parent is selected, only CHAPTER is allowed at root level
      return [SubjectNodeType.CHAPTER];
    } else if (selectedNodeType === SubjectNodeType.CHAPTER) {
      // If parent is a CHAPTER, only TOPIC is allowed as child
      return [SubjectNodeType.TOPIC];
    } else if (selectedNodeType === SubjectNodeType.TOPIC) {
      // If parent is a TOPIC, only SUBTOPIC is allowed as child
      return [SubjectNodeType.SUBTOPIC];
    }
    return [SubjectNodeType.CHAPTER];
  };

  // Get the default node type based on parent
  const getDefaultNodeType = (): SubjectNodeType => {
    const availableTypes = getAvailableNodeTypes();
    return availableTypes[0];
  };

  // Form setup
  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      context: "",
      learningOutcomes: "",
      nodeType: getDefaultNodeType(),
      orderIndex: 0,
      estimatedMinutes: undefined,
      competencyLevel: undefined,
      keywords: [],
      parentTopicId: selectedNodeId,
      status: SystemStatus.ACTIVE,
    }
  });

  const [keywordInput, setKeywordInput] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  // Watch for changes
  const selectedKeywords = form.watch("keywords") || [];

  // Reset form when dialog opens/closes or selected node changes
  useEffect(() => {
    if (open) {
      form.reset({
        code: "",
        title: "",
        description: "",
        context: "",
        learningOutcomes: "",
        nodeType: getDefaultNodeType(),
        orderIndex: 0,
        estimatedMinutes: undefined,
        competencyLevel: undefined,
        keywords: [],
        parentTopicId: selectedNodeId,
        status: SystemStatus.ACTIVE,
      });
      setActiveTab("basic");
    }
  }, [open, selectedNodeId, selectedNodeType, form]);

  // Handle adding a keyword
  const handleAddKeyword = () => {
    if (keywordInput.trim() === "") return;

    const currentKeywords = form.getValues("keywords") || [];
    if (!currentKeywords.includes(keywordInput.trim())) {
      form.setValue("keywords", [...currentKeywords, keywordInput.trim()]);
    }
    setKeywordInput("");
  };

  // Handle removing a keyword
  const handleRemoveKeyword = (keyword: string) => {
    const currentKeywords = form.getValues("keywords") || [];
    form.setValue(
      "keywords",
      currentKeywords.filter((k) => k !== keyword)
    );
  };

  // Handle form submission
  const onSubmit = async (data: TopicFormValues) => {
    setIsSubmitting(true);

    try {
      await createMutation.mutateAsync({
        ...data,
        subjectId,
      });

      // Show success message with node type and title
      toast.success(`${data.nodeType} "${data.title}" created successfully`);

      // Close dialog and refresh parent
      onOpenChange(false);
      onTopicCreated();
    } catch (error) {
      console.error("Error creating topic:", error);
      toast.error("Failed to create topic");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get dialog title based on node type
  const getDialogTitle = () => {
    const nodeType = getDefaultNodeType();
    return `Add New ${nodeType}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CH1, T1.2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter description (optional)"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Node type is automatically determined based on parent */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nodeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            value={field.value}
                            disabled={true}
                            className="bg-gray-100 dark:bg-gray-700"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderIndex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={SystemStatus.ACTIVE}>Active</SelectItem>
                          <SelectItem value={SystemStatus.INACTIVE}>Inactive</SelectItem>
                          <SelectItem value={SystemStatus.ARCHIVED}>Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <FormField
                  control={form.control}
                  name="context"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Context</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Educational context for this topic"
                          {...field}
                          value={field.value || ""}
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="learningOutcomes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Outcomes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Expected learning outcomes"
                          {...field}
                          value={field.value || ""}
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimatedMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Minutes</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Estimated time in minutes"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="competencyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Competency Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select competency level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value={CompetencyLevel.BASIC}>Basic</SelectItem>
                            <SelectItem value={CompetencyLevel.INTERMEDIATE}>Intermediate</SelectItem>
                            <SelectItem value={CompetencyLevel.ADVANCED}>Advanced</SelectItem>
                            <SelectItem value={CompetencyLevel.EXPERT}>Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Add keyword"
                      className="flex-grow"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddKeyword}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedKeywords.map((keyword) => (
                      <div
                        key={keyword}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md flex items-center gap-1"
                      >
                        <span>{keyword}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </FormItem>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
