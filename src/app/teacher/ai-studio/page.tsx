'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ContentStudioProvider, ContentTypeSelector, ContentType, AIStudioDialog } from '@/features/contnet-studio';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { useState } from 'react';

export default function AIStudioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Handle content type selection
  const handleContentTypeSelect = (contentType: ContentType) => {
    switch (contentType) {
      case ContentType.ACTIVITY:
        // Open the AIStudioDialog instead of navigating
        setDialogOpen(true);
        break;
      case ContentType.ASSESSMENT:
        router.push('/teacher/content-studio/create/assessment');
        break;
      case ContentType.WORKSHEET:
        router.push('/teacher/content-studio/create/worksheet');
        break;
      case ContentType.LESSON_PLAN:
        router.push('/teacher/content-studio/create/lesson-plan');
        break;
    }
  };

  return (
    <ContentStudioProvider>
      <div className="container mx-auto py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/teacher/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>AI Content Studio</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8 text-center">
          <PageHeader
            title="AI Content Studio"
            description="Create engaging learning content with the help of AI"
          />
        </div>

        <div className="max-w-4xl mx-auto">
          <ContentTypeSelector onSelect={handleContentTypeSelect} />
        </div>

        <div className="bg-muted rounded-lg p-6 mt-12 max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <HelpCircle className="h-6 w-6 mr-2 text-primary" />
            <h2 className="text-xl font-semibold">Tips for Using AI Content Studio</h2>
          </div>
          <ul className="list-disc pl-6 space-y-2">
            <li>Select a specific topic to generate more focused content</li>
            <li>Use the AI parameters to customize the generated content</li>
            <li>Preview and test the generated content before saving</li>
            <li>Edit the parameters if you need to refine the content</li>
            <li>Save the content to make it available to your students</li>
          </ul>
        </div>

        {/* AIStudioDialog for activity creation */}
        <AIStudioDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          classId={selectedClassId}
        />
      </div>
    </ContentStudioProvider>
  );
}
