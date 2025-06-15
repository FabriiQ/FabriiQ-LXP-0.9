'use client';

import { useParams, useRouter } from 'next/navigation';
import { TopicForm } from '@/components/admin/subjects/TopicForm';
import { Button } from '@/components/ui/core/button';
import { ArrowLeft } from '@/components/ui/icons/lucide-icons';
import { PageHeader } from '@/components/ui/layout/page-header';

export default function EditTopicPage() {
  const params = useParams<{ institution: string; subjectId: string; topicId: string }>();
  const router = useRouter();
  
  // Extract params
  const institution = params!.institution;
  const subjectId = params!.subjectId;
  const topicId = params!.topicId;

  // Handle back button click
  const handleBack = () => {
    router.push(`/${institution}/admin/subjects/${subjectId}/topics/${topicId}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Topic
        </Button>

        <PageHeader
          title="Edit Topic"
          description="Update topic details"
        />
      </div>

      <TopicForm
        subjectId={subjectId}
        topicId={topicId}
      />
    </div>
  );
}
