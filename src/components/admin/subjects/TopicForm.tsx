import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { api } from "@/trpc/react";
import { SubjectNodeType, CompetencyLevel, SystemStatus } from "@/server/api/constants";
import { Card } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/core/button";
import { CreateButton, UpdateButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/core/input";
import { Textarea } from "@/components/ui/forms/textarea";
import { Loader2 } from "lucide-react";
import { RichTextEditor } from "@/features/activties/components/ui/RichTextEditor";
import { ThemeWrapper } from "@/features/activties/components/ui/ThemeWrapper";
import { constructSubjectUrl, constructTopicUrl } from "@/utils/admin-navigation";

// Form schema
const topicFormSchema = z.object({
  code: z.string().min(1, "Code is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  context: z.string().optional(),
  learningOutcomesText: z.string().optional(),
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

interface TopicFormProps {
  subjectId: string;
  topicId?: string;
  parentTopicId?: string;
}

// Custom FormSelect component that accepts error messages
const FormSelect = ({ error, children, ...props }: { error?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) => {
  return (
    <div className="flex flex-col gap-1">
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export const TopicForm = ({ subjectId, topicId, parentTopicId }: TopicFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const isEditMode = !!topicId;

  // Get topic data if in edit mode
  const { data: topicData, isLoading: isLoadingTopic } = api.subjectTopic.get.useQuery(
    { id: topicId || "" },
    { enabled: isEditMode, refetchOnWindowFocus: false }
  );

  // Get parent topics for dropdown
  const { data: parentTopics, isLoading: isLoadingParents } = api.subjectTopic.list.useQuery(
    {
      subjectId,
      nodeType: isEditMode ? undefined : SubjectNodeType.CHAPTER, // Only chapters can be parents when creating
      status: SystemStatus.ACTIVE
    },
    { refetchOnWindowFocus: false }
  );



  // Create and update mutations
  const createMutation = api.subjectTopic.create.useMutation();
  const updateMutation = api.subjectTopic.update.useMutation();

  // Form setup
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      status: SystemStatus.ACTIVE,
      keywords: [],
    }
  });

  // Watch for changes to nodeType
  const selectedNodeType = watch("nodeType");
  const selectedKeywords = watch("keywords") || [];

  // Set form values when editing
  useEffect(() => {
    if (isEditMode && topicData) {
      // Use a more direct approach to avoid type issues
      const formData = {
        code: topicData.code,
        title: topicData.title,
        description: topicData.description || "",
        context: topicData.context || "",
        learningOutcomesText: topicData.learningOutcomesText || "",
        nodeType: topicData.nodeType,
        orderIndex: topicData.orderIndex,
        estimatedMinutes: topicData.estimatedMinutes || undefined,
        competencyLevel: topicData.competencyLevel || undefined,
        keywords: topicData.keywords || [],
        parentTopicId: topicData.parentTopicId || undefined,
        status: topicData.status,
      };

      // @ts-ignore - Ignore type checking for this reset call
      reset(formData);
    } else if (!isEditMode && parentTopicId) {
      // If creating with a parent topic ID
      setValue("parentTopicId", parentTopicId);
      setValue("nodeType", SubjectNodeType.TOPIC); // Default to TOPIC when creating under a parent
    }
  }, [isEditMode, topicData, parentTopicId, reset, setValue]);

  // Handle form submission
  const onSubmit = async (data: TopicFormValues) => {
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Handle parentTopicId special case - convert "none" to null
        const parentTopicId = data.parentTopicId === "none" ? null : data.parentTopicId;

        // Use type assertion to avoid TypeScript errors
        const updateData = {
          id: topicId!,
          title: data.title,
          description: data.description || "",
          context: data.context || "",
          nodeType: data.nodeType,
          orderIndex: data.orderIndex,
          estimatedMinutes: data.estimatedMinutes || 0,
          competencyLevel: data.competencyLevel,
          keywords: data.keywords || [],
          parentTopicId: parentTopicId,
          status: data.status,
        };

        console.log("Updating topic with data:", updateData);

        // @ts-ignore - Ignore type checking for this mutation call
        await updateMutation.mutateAsync(updateData);
        toast.success("Topic updated successfully");
      } else {
        // Handle parentTopicId special case - convert "none" to null
        const parentTopicId = data.parentTopicId === "none" ? null : data.parentTopicId;

        // Use type assertion to avoid TypeScript errors
        const createData = {
          code: data.code,
          title: data.title,
          description: data.description || "",
          context: data.context || "",
          learningOutcomesText: data.learningOutcomesText || "",
          nodeType: data.nodeType,
          orderIndex: data.orderIndex,
          estimatedMinutes: data.estimatedMinutes || 0,
          competencyLevel: data.competencyLevel,
          keywords: data.keywords || [],
          parentTopicId: parentTopicId,
          status: data.status,
          subjectId,
        };

        // @ts-ignore - Ignore type checking for this mutation call
        await createMutation.mutateAsync(createData);
        toast.success("Topic created successfully");
      }

      // Navigate to the appropriate page
      if (isEditMode) {
        // For edit mode, navigate back to the topic page
        const url = constructTopicUrl(subjectId, topicId!, window.location.pathname);
        router.push(url);
      } else {
        // For create mode, navigate back to the subject page
        const url = constructSubjectUrl(subjectId, window.location.pathname);
        router.push(url);
      }
    } catch (error) {
      console.error("Error saving topic:", error);
      toast.error(isEditMode ? "Failed to update topic" : "Failed to create topic");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyword input
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !selectedKeywords.includes(keywordInput.trim())) {
      setValue("keywords", [...selectedKeywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setValue("keywords", selectedKeywords.filter(k => k !== keyword));
  };

  // Loading state
  if (isEditMode && isLoadingTopic) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 text-base">Loading topic data...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-primary-green dark:text-primary-green">
        {isEditMode ? "Edit Topic" : "Add New Topic"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Code <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("code")}
              placeholder="e.g., CH1, T1.2"
              helperText={errors.code?.message}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("title")}
              placeholder="Topic title"
              helperText={errors.title?.message}
            />
          </div>

          {/* Node Type */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Type <span className="text-red-500">*</span>
            </label>
            <FormSelect
              {...register("nodeType")}
              error={errors.nodeType?.message}
            >
              <option value={SubjectNodeType.CHAPTER}>Chapter</option>
              <option value={SubjectNodeType.TOPIC}>Topic</option>
              <option value={SubjectNodeType.SUBTOPIC}>Subtopic</option>
            </FormSelect>
          </div>

          {/* Parent Topic */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Parent Topic {selectedNodeType !== SubjectNodeType.CHAPTER && <span className="text-red-500">*</span>}
            </label>
            <FormSelect
              {...register("parentTopicId")}
              disabled={isLoadingParents || selectedNodeType === SubjectNodeType.CHAPTER}
              error={errors.parentTopicId?.message}
            >
              <option value="none">None (Root Level)</option>
              {parentTopics && parentTopics.data && parentTopics.data.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.code} - {topic.title}
                </option>
              ))}
            </FormSelect>
            {selectedNodeType !== SubjectNodeType.CHAPTER && !parentTopicId && (
              <p className="text-xs text-amber-600 mt-1">
                Topics and subtopics must have a parent.
              </p>
            )}
          </div>

          {/* Order Index */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Order <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              {...register("orderIndex", { valueAsNumber: true })}
              placeholder="0"
              helperText={errors.orderIndex?.message}
            />
          </div>

          {/* Estimated Minutes */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Estimated Minutes
            </label>
            <Input
              type="number"
              min="0"
              {...register("estimatedMinutes", { valueAsNumber: true })}
              placeholder="e.g., 45"
              helperText={errors.estimatedMinutes?.message}
            />
          </div>

          {/* Competency Level */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Competency Level
            </label>
            <FormSelect
              {...register("competencyLevel")}
              error={errors.competencyLevel?.message}
            >
              <option value="none">Select a level</option>
              <option value={CompetencyLevel.BASIC}>Basic</option>
              <option value={CompetencyLevel.INTERMEDIATE}>Intermediate</option>
              <option value={CompetencyLevel.ADVANCED}>Advanced</option>
              <option value={CompetencyLevel.EXPERT}>Expert</option>
            </FormSelect>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Status <span className="text-red-500">*</span>
            </label>
            <FormSelect
              {...register("status")}
              error={errors.status?.message}
            >
              <option value={SystemStatus.ACTIVE}>Active</option>
              <option value={SystemStatus.INACTIVE}>Inactive</option>
              <option value={SystemStatus.ARCHIVED}>Archived</option>
            </FormSelect>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Description
          </label>
          <ThemeWrapper>
            <RichTextEditor
              content={watch("description") || ""}
              onChange={(value) => setValue("description", value)}
              placeholder="Brief description of this topic"
              minHeight="150px"
            />
          </ThemeWrapper>
          {errors.description?.message && (
            <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Context */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Educational Context
          </label>
          <ThemeWrapper>
            <RichTextEditor
              content={watch("context") || ""}
              onChange={(value) => setValue("context", value)}
              placeholder="Educational context for this topic"
              minHeight="150px"
            />
          </ThemeWrapper>
          {errors.context?.message && (
            <p className="text-xs text-destructive mt-1">{errors.context.message}</p>
          )}
        </div>





        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Keywords
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Add keyword"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddKeyword}
              className="bg-primary-green hover:bg-medium-teal text-white"
            >
              Add
            </Button>
          </div>
          {selectedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedKeywords.map((keyword, index) => (
                <div key={index} className="bg-light-mint text-primary-green px-2 py-1 rounded-full text-sm flex items-center dark:bg-opacity-90">
                  {keyword}
                  <button
                    type="button"
                    className="ml-1 text-medium-teal hover:text-primary-green"
                    onClick={() => handleRemoveKeyword(keyword)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const url = constructSubjectUrl(subjectId, window.location.pathname);
              router.push(url);
            }}
            disabled={isSubmitting}
            className="border-medium-teal text-medium-teal hover:bg-light-mint dark:border-medium-teal dark:text-medium-teal dark:hover:bg-opacity-20"
          >
            Cancel
          </Button>
          {isEditMode ? (
            <UpdateButton
              type="submit"
              loading={isSubmitting}
              className="bg-primary-green hover:bg-medium-teal text-white"
            >
              Update Topic
            </UpdateButton>
          ) : (
            <CreateButton
              type="submit"
              loading={isSubmitting}
              className="bg-primary-green hover:bg-medium-teal text-white"
            >
              Create Topic
            </CreateButton>
          )}
        </div>
      </form>
    </Card>
  );
};