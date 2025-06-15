'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BulkUploadForm } from '@/features/question-bank/components/bulk/BulkUploadForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/utils/api';

/**
 * Bulk Upload Page
 *
 * This page provides a form for uploading questions in bulk to a question bank.
 */
export default function BulkUploadPage() {
  const params = useParams();
  const router = useRouter();
  const questionBankId = params?.id as string;

  // Get question bank details
  const { data: questionBank, isLoading } = api.questionBank.getQuestion.useQuery(
    { id: questionBankId },
    { enabled: !!questionBankId }
  );

  // Handle success
  const handleSuccess = () => {
    // Stay on the page to allow for more uploads
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/admin/academic/question-bank/${questionBankId}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
        >
          <Link href={`/admin/academic/question-bank/${questionBankId}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Bulk Upload Questions</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="col-span-1">
            <BulkUploadForm
              questionBankId={questionBankId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
