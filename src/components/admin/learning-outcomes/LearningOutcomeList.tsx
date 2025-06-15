'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/core/button';
import { Card } from '@/components/ui/data-display/card';
import { Plus as PlusIcon, Loader2 } from 'lucide-react';
import { LearningOutcomeFormWithCriteria } from './LearningOutcomeFormWithCriteria';
import { LearningOutcomeEditDialogWithCriteria } from './LearningOutcomeEditDialogWithCriteria';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import {
  BloomsTaxonomyLevel
} from '@/features/bloom/types';
import {
  BLOOMS_LEVEL_METADATA,
  ORDERED_BLOOMS_LEVELS
} from '@/features/bloom/constants/bloom-levels';

interface LearningOutcomeListProps {
  subjectId: string;
  topicId?: string;
}

export function LearningOutcomeList({
  subjectId,
  topicId,
}: LearningOutcomeListProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<any>(null);

  // Fetch learning outcomes
  const learningOutcomesQuery = topicId
    ? api.learningOutcome.getByTopic.useQuery({ topicId })
    : api.learningOutcome.getBySubject.useQuery({ subjectId });

  // Delete mutation
  const deleteLearningOutcome = api.learningOutcome.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Learning outcome deleted successfully',
        variant: 'success',
      });
      learningOutcomesQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete learning outcome',
        variant: 'error',
      });
    },
  });

  // Handle form success
  const handleFormSuccess = () => {
    setShowForm(false);
    learningOutcomesQuery.refetch();
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this learning outcome?')) {
      deleteLearningOutcome.mutate({ id });
    }
  };

  // Handle edit
  const handleEdit = (outcome: any) => {
    setSelectedOutcome(outcome);
    setEditDialogOpen(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    learningOutcomesQuery.refetch();
  };

  // Get the color for a specific Bloom's level
  const getLevelColor = (level: BloomsTaxonomyLevel) => {
    const color = BLOOMS_LEVEL_METADATA[level]?.color || '#CCCCCC';
    // Return the actual color and tailwind-like classes
    return {
      color: color,
      bg: `bg-[${color}]`,
      text: `text-[${color}]`,
      border: `border-[${color}]`
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Learning Outcomes
        </h2>

        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary-green hover:bg-medium-teal text-white"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Learning Outcome
          </Button>
        )}
      </div>

      {showForm ? (
        <LearningOutcomeFormWithCriteria
          subjectId={subjectId}
          topicId={topicId}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      ) : (
        <div className="space-y-4">
          {learningOutcomesQuery.isLoading ? (
            <Card className="p-6 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-green" />
              <span className="ml-2 text-gray-600">Loading learning outcomes...</span>
            </Card>
          ) : learningOutcomesQuery.isError ? (
            <Card className="p-6 text-center text-red-500">
              <p>Error loading learning outcomes: {learningOutcomesQuery.error.message}</p>
              <Button
                onClick={() => learningOutcomesQuery.refetch()}
                variant="outline"
                className="mt-4"
              >
                Retry
              </Button>
            </Card>
          ) : learningOutcomesQuery.data?.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No learning outcomes have been created yet.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="mt-4 border-medium-teal text-medium-teal hover:bg-light-mint"
              >
                Create your first learning outcome
              </Button>
            </Card>
          ) : (
            learningOutcomesQuery.data?.map((outcome) => {
              const levelColor = getLevelColor(outcome.bloomsLevel as BloomsTaxonomyLevel);
              const levelName = BLOOMS_LEVEL_METADATA[outcome.bloomsLevel as BloomsTaxonomyLevel]?.name || 'Unknown';

              return (
                <Card
                  key={outcome.id}
                  className="p-4 transition-all flex flex-col"
                  style={{
                    borderLeft: `4px solid ${levelColor.color}`,
                    boxShadow: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
                  }}
                >
                  <div className="flex items-start">
                    <div
                      className={`${levelColor.bg} text-white text-xs font-medium px-2 py-1 rounded-md mr-3 mt-1`}
                    >
                      {levelName}
                    </div>

                    <div className="flex-1">
                      <h3
                        className="font-semibold text-gray-900 dark:text-gray-100 text-base"
                        style={{ color: levelColor.color }}
                      >
                        {outcome.statement}
                      </h3>

                      {outcome.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {outcome.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {outcome.actionVerbs.map((verb) => (
                          <span
                            key={verb}
                            className="text-xs px-2 py-0.5 rounded-full border"
                            style={{
                              color: levelColor.color,
                              borderColor: levelColor.color,
                              backgroundColor: `${levelColor.color}10` // 10% opacity
                            }}
                          >
                            {verb}
                          </span>
                        ))}

                        {outcome.hasCriteria && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full border ml-1"
                            style={{
                              color: '#22c55e', // Green
                              borderColor: '#22c55e',
                              backgroundColor: '#22c55e10' // 10% opacity
                            }}
                          >
                            Has Rubric Criteria
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => handleEdit(outcome)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(outcome.id)}
                        disabled={deleteLearningOutcome.isLoading}
                      >
                        {deleteLearningOutcome.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Edit Dialog */}
      {selectedOutcome && (
        <LearningOutcomeEditDialogWithCriteria
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          learningOutcome={selectedOutcome}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
