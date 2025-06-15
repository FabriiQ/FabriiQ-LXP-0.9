'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionBankList } from '@/features/question-bank/components/manager/QuestionBankList';
import { QuestionBankForm } from '@/features/question-bank/components/manager/QuestionBankForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionBank } from '@/features/question-bank/models/types';

/**
 * Question Bank Dashboard Page
 *
 * This page displays a list of question banks and provides functionality
 * to create, view, edit, and delete question banks.
 */
export default function QuestionBankDashboardPage() {
  const router = useRouter();

  // State for dialogs and tabs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedQuestionBank, setSelectedQuestionBank] = useState<QuestionBank | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Handle view question bank
  const handleViewQuestionBank = (questionBank: QuestionBank) => {
    router.push(`/admin/academic/question-bank/${questionBank.id}`);
  };

  // Handle edit question bank
  const handleEditQuestionBank = (questionBank: QuestionBank) => {
    setSelectedQuestionBank(questionBank);
    setEditDialogOpen(true);
  };

  // Handle create question bank
  const handleCreateQuestionBank = () => {
    setCreateDialogOpen(true);
  };

  // Handle create success
  const handleCreateSuccess = (questionBank: QuestionBank) => {
    setCreateDialogOpen(false);
    router.push(`/admin/academic/question-bank/${questionBank.id}`);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedQuestionBank(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Question Bank</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Question Banks</TabsTrigger>
          <TabsTrigger value="recent">Recently Used</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <QuestionBankList
            onView={handleViewQuestionBank}
            onEdit={handleEditQuestionBank}
            onDelete={() => {}} // We'll handle delete in the list component
            onCreate={handleCreateQuestionBank}
          />
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <QuestionBankList
            onView={handleViewQuestionBank}
            onEdit={handleEditQuestionBank}
            onDelete={() => {}} // We'll handle delete in the list component
            onCreate={handleCreateQuestionBank}
          />
        </TabsContent>
      </Tabs>

      {/* Create Question Bank Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Question Bank</DialogTitle>
            <DialogDescription>
              Create a new question bank to organize your questions.
            </DialogDescription>
          </DialogHeader>
          <QuestionBankForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
            isCampusManager={true}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Question Bank Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Question Bank</DialogTitle>
            <DialogDescription>
              Update the details of your question bank.
            </DialogDescription>
          </DialogHeader>
          {selectedQuestionBank && (
            <QuestionBankForm
              questionBank={selectedQuestionBank}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditDialogOpen(false)}
              isCampusManager={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
