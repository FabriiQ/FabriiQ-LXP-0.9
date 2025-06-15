'use client';

import React, { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopicForm } from "~/components/admin/subjects/TopicForm";
import { Button } from "~/components/ui";
import { ArrowLeft } from "lucide-react";

// Create a wrapper component to handle the params
function TopicPageContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentTopicId = searchParams.get('parentTopicId') || undefined;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/system/subjects/${id}`)}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Subject
        </Button>
        <h1 className="text-2xl font-bold">Add New Topic</h1>
      </div>

      <TopicForm
        subjectId={id}
        parentTopicId={parentTopicId}
      />
    </div>
  );
}

// Main page component that unwraps params
export default function AddTopicPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Unwrap params properly using React.use() for future compatibility
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const id = unwrappedParams.id;

  return <TopicPageContent id={id} />;
}