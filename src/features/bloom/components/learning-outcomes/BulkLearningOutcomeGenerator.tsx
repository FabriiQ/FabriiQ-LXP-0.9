'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/core/button';
import { Card } from '@/components/ui/data-display/card';
import { Sparkle } from 'lucide-react';
import { LearningOutcomeGenerationDialog } from './LearningOutcomeGenerationDialog';

interface BulkLearningOutcomeGeneratorProps {
  subjectId: string;
  topicId?: string;
  onSuccess?: () => void;
}

export function BulkLearningOutcomeGenerator({
  subjectId,
  topicId,
  onSuccess,
}: BulkLearningOutcomeGeneratorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Open the dialog
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  // Close the dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // Handle bulk generation success
  const handleBulkGenerateSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      <Card className="p-4 border-dashed border-2 border-gray-300 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center mb-4">
          <Sparkle className="h-5 w-5 text-primary-green mr-2" />
          <h3 className="text-lg font-medium text-primary-green">Bulk Generate Learning Outcomes</h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate learning outcomes for multiple Bloom's Taxonomy levels at once. You can select which levels to generate and provide custom prompts.
          </p>

          <div className="flex justify-end">
            <Button
              onClick={handleOpenDialog}
              className="bg-primary-green hover:bg-medium-teal text-white"
            >
              <Sparkle className="h-4 w-4 mr-2" />
              Generate Learning Outcomes
            </Button>
          </div>
        </div>
      </Card>

      <LearningOutcomeGenerationDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        subjectId={subjectId}
        topicId={topicId}
        onBulkGenerate={handleBulkGenerateSuccess}
      />
    </>
  );
}
