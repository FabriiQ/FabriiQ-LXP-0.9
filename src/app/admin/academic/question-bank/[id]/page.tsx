'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { QuestionBankManager } from '@/features/question-bank/components/manager/QuestionBankManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Question Bank Detail Page
 * 
 * This page displays the details of a question bank and its questions.
 * It uses the QuestionBankManager component to manage the questions.
 */
export default function QuestionBankDetailPage() {
  const params = useParams();
  const questionBankId = params.id as string;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
        >
          <Link href="/admin/academic/question-bank">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Question Bank</h1>
      </div>
      
      <QuestionBankManager questionBankId={questionBankId} />
    </div>
  );
}
