"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/atoms/skeleton";

interface WorksheetDetailProps {
  worksheet: any;
}

export function WorksheetDetail({ worksheet }: WorksheetDetailProps) {
  if (!worksheet) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  // This is a placeholder for the actual worksheet content rendering
  // In the future, this will render the content based on the worksheet type
  const renderContent = () => {
    try {
      // For now, we'll just display the JSON content as a string
      return (
        <div className="prose dark:prose-invert max-w-none">
          <p>This is a placeholder for the worksheet content.</p>
          <p>In the future, this will render the actual worksheet content based on its type.</p>
          <pre className="bg-muted p-4 rounded-md overflow-auto">
            {JSON.stringify(worksheet.content, null, 2)}
          </pre>
        </div>
      );
    } catch (error) {
      return (
        <div className="text-destructive">
          <p>Error rendering worksheet content.</p>
          <p>{(error as Error).message}</p>
        </div>
      );
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs defaultValue="preview">
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-0">
            {renderContent()}
          </TabsContent>

          <TabsContent value="edit" className="mt-0">
            <p className="text-muted-foreground text-center py-8">
              Worksheet editing functionality will be implemented here.
            </p>
          </TabsContent>

          <TabsContent value="metadata" className="mt-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Title</h3>
                <p>{worksheet.title}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Subject</h3>
                <p>{worksheet.subject?.name || "No subject assigned"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Topic</h3>
                <p>{worksheet.topic?.title || "No topic assigned"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Status</h3>
                <p>{worksheet.status}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Created</h3>
                <p>{new Date(worksheet.createdAt).toLocaleString()}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Last Updated</h3>
                <p>{new Date(worksheet.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
