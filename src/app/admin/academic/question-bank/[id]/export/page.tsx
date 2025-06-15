'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExportForm } from '@/features/question-bank/components/bulk/ExportForm';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { api } from '@/utils/api';

/**
 * Export Page
 *
 * This page provides a form for exporting questions from a question bank.
 */
export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const questionBankId = params?.id as string;

  // Get question bank details
  const { data: questionBank, isLoading } = api.questionBank.getQuestion.useQuery(
    { id: questionBankId },
    { enabled: !!questionBankId }
  );

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
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Export Questions</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="col-span-1">
            <ExportForm
              questionBankId={questionBankId}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
