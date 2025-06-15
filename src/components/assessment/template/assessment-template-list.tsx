'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/atoms/button";
import { Card } from "~/components/ui/atoms/card";
import { Badge } from "~/components/ui/atoms/badge";
import { DataTable } from "~/components/ui/data-display/data-table";
import { SearchBar } from "~/components/ui/search-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/forms/select";
import { formatDate } from "~/lib/utils";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/feedback/toast";
import { Trash2, Eye, FileEdit, Plus } from "lucide-react";
import { AssessmentCategory, SystemStatus } from "~/server/api/constants";

// Define the interface for assessment templates
interface AssessmentTemplate {
  id: string;
  title: string;
  category?: AssessmentCategory; // Make category optional
  description?: string | null; // Make description optional
  status: SystemStatus | string; // Accept both SystemStatus enum and string values from Prisma
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    submissions: number;
  };
  subject?: {
    code: string;
    id: string;
    name: string;
  };
  // Add other potential properties from the API response
  institutionId?: string;
  policyId?: string | null;
  [key: string]: any; // Allow for additional properties
}

export function AssessmentTemplateList() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch templates using tRPC
  const { data: templates, isLoading, refetch } = api.assessment.list.useQuery({
    // Remove filters to show all templates
  }, {
    enabled: true,
  });

  // Delete template mutation
  const deleteTemplate = api.assessment.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template deleted successfully",
        variant: "success",
      });
      void refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "error",
      });
    },
  });

  // Filter templates based on search query and category
  const filteredTemplates = templates?.items.map(template => {
    // Create a template object that matches our AssessmentTemplate interface
    const enhancedTemplate: AssessmentTemplate = {
      ...template,
      // Provide default values for required properties if they don't exist
      category: (template as any).category || AssessmentCategory.QUIZ,
      description: (template as any).description || null,
      // Convert status string from Prisma to SystemStatus enum
      status: template.status as string in SystemStatus 
        ? SystemStatus[template.status as keyof typeof SystemStatus] 
        : SystemStatus.ACTIVE,
    };
    return enhancedTemplate;
  }).filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Handle template deletion
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplate.mutate({ id });
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Template card component for mobile view
  const TemplateCard = ({ template }: { template: AssessmentTemplate }) => (
    <Card className="mb-4 p-4">
      <div className="flex justify-between">
        <h3 className="font-semibold">{template.title}</h3>
        <Badge 
          variant={
            template.status === SystemStatus.ACTIVE ? 'success' :
            template.status === SystemStatus.INACTIVE ? 'warning' : 'default'
          }
        >
          {template.status}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {template.category}
      </p>
      <div className="mt-4 flex justify-between text-sm">
        <span>Submissions: {template._count?.submissions || 0}</span>
        <span>Updated: {formatDate(template.updatedAt)}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/system/assessments/${template.id}`)}
        >
          <Eye className="mr-1 h-4 w-4" />
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/system/assessments/${template.id}/edit`)}
        >
          <FileEdit className="mr-1 h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(template.id)}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      </div>
    </Card>
  );

  // Table columns
  const columns = [
    {
      header: "Title",
      accessorKey: "title",
    },
    {
      header: "Category",
      accessorKey: "category",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: { row: { original: AssessmentTemplate } }) => (
        <Badge 
          variant={
            row.original.status === SystemStatus.ACTIVE ? 'success' :
            row.original.status === SystemStatus.INACTIVE ? 'warning' : 'default'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Submissions",
      accessorKey: "_count.submissions",
      cell: ({ row }: { row: { original: AssessmentTemplate } }) => row.original._count?.submissions || 0,
    },
    {
      header: "Last Modified",
      accessorKey: "updatedAt",
      cell: ({ row }: { row: { original: AssessmentTemplate } }) => formatDate(row.original.updatedAt),
    },
    {
      header: "Actions",
      cell: ({ row }: { row: { original: AssessmentTemplate } }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/system/assessments/${row.original.id}`)}
          >
            <Eye className="mr-1 h-4 w-4" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/system/assessments/${row.original.id}/edit`)}
          >
            <FileEdit className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex flex-col gap-4 sm:flex-row">
          <SearchBar
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            className="w-full sm:w-[300px]"
          />
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.values(AssessmentCategory).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="block sm:hidden">
        {filteredTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      <div className="hidden sm:block">
        <DataTable
          columns={columns}
          data={filteredTemplates}
          pagination
        />
      </div>
    </div>
  );
} 