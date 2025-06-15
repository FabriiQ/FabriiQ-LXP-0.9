'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/feedback/dialog';
import { Button } from '@/components/ui/core/button';
import { Label } from '@/components/ui/core/label';
import { Input } from '@/components/ui/core/input';
import { Textarea } from '@/components/ui/core/textarea';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { ActionVerbSuggestions } from '@/features/bloom/components/taxonomy/ActionVerbSuggestions';

// Form schema
const learningOutcomeSchema = z.object({
  statement: z.string().min(1, 'Statement is required'),
  description: z.string().optional(),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
  actionVerbs: z.array(z.string()).min(1, 'At least one action verb is required'),
});

type LearningOutcomeFormValues = z.infer<typeof learningOutcomeSchema>;

interface LearningOutcomeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  learningOutcome: {
    id: string;
    statement: string;
    description?: string;
    bloomsLevel: BloomsTaxonomyLevel;
    actionVerbs: string[];
  };
  onSuccess?: () => void;
}

export function LearningOutcomeEditDialog({
  isOpen,
  onClose,
  learningOutcome,
  onSuccess,
}: LearningOutcomeEditDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBloomsLevel, setSelectedBloomsLevel] = useState<BloomsTaxonomyLevel>(learningOutcome.bloomsLevel);

  // Form setup
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<LearningOutcomeFormValues>({
    resolver: zodResolver(learningOutcomeSchema),
    defaultValues: {
      statement: learningOutcome.statement,
      description: learningOutcome.description || '',
      bloomsLevel: learningOutcome.bloomsLevel,
      actionVerbs: learningOutcome.actionVerbs,
    }
  });

  // Watch action verbs
  const actionVerbs = watch('actionVerbs') || [];

  // Update mutation
  const updateLearningOutcome = api.learningOutcome.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Learning outcome updated successfully',
        variant: 'success',
      });
      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update learning outcome',
        variant: 'error',
      });
      setIsSubmitting(false);
    },
  });

  // Handle Bloom's level selection
  const handleBloomsLevelChange = (level: BloomsTaxonomyLevel) => {
    // Only clear verbs if the level actually changed
    if (level !== selectedBloomsLevel) {
      setSelectedBloomsLevel(level);
      setValue('bloomsLevel', level);
      // Clear action verbs when level changes
      setValue('actionVerbs', []);

      // Add a small delay to ensure the UI updates properly
      setTimeout(() => {
        // Force a re-render of the form
        setValue('bloomsLevel', level, { shouldValidate: true });
      }, 50);
    }
  };

  // Handle action verb selection
  const handleVerbSelection = (verb: string) => {
    if (!actionVerbs.includes(verb)) {
      setValue('actionVerbs', [...actionVerbs, verb]);
    }
  };

  // Handle action verb removal
  const handleVerbRemoval = (verb: string) => {
    setValue('actionVerbs', actionVerbs.filter(v => v !== verb));
  };

  // Handle form submission
  const onSubmit = async (data: LearningOutcomeFormValues) => {
    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Use mutateAsync to wait for the mutation to complete
      await updateLearningOutcome.mutateAsync({
        id: learningOutcome.id,
        data: {
          statement: data.statement,
          description: data.description,
          bloomsLevel: data.bloomsLevel,
          actionVerbs: data.actionVerbs,
        },
      });
      // Don't set isSubmitting to false here - it will be handled in the onSuccess callback
    } catch (error) {
      console.error('Error updating learning outcome:', error);
      setIsSubmitting(false); // Only reset on error
    }
  };

  // Reset form when dialog opens
  useState(() => {
    if (isOpen) {
      reset({
        statement: learningOutcome.statement,
        description: learningOutcome.description || '',
        bloomsLevel: learningOutcome.bloomsLevel,
        actionVerbs: learningOutcome.actionVerbs,
      });
      setSelectedBloomsLevel(learningOutcome.bloomsLevel);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Learning Outcome</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Bloom's Taxonomy Level */}
          <div>
            <Label className="block mb-2">
              Bloom's Taxonomy Level <span className="text-red-500">*</span>
            </Label>
            <BloomsTaxonomySelector
              value={selectedBloomsLevel}
              onChange={handleBloomsLevelChange}
              showDescription={true}
              variant="buttons"
            />
            {errors.bloomsLevel && (
              <p className="text-xs text-destructive mt-1">{errors.bloomsLevel.message}</p>
            )}
          </div>

          {/* Action Verbs */}
          {selectedBloomsLevel && (
            <div>
              <Label className="block mb-2">
                Action Verbs <span className="text-red-500">*</span>
              </Label>
              <ActionVerbSuggestions
                bloomsLevel={selectedBloomsLevel}
                onSelect={handleVerbSelection}
                count={8}
                showExamples={true}
                showRefreshButton={true}
              />
              {actionVerbs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {actionVerbs.map((verb) => {
                    // Get the color from the current Bloom's level
                    const levelColor = selectedBloomsLevel ?
                      BLOOMS_LEVEL_METADATA[selectedBloomsLevel].color :
                      '#1F504B'; // Default to primary-green if no level selected

                    return (
                      <div
                        key={verb}
                        className="px-3 py-1 text-sm rounded-full flex items-center gap-1"
                        style={{
                          backgroundColor: `${levelColor}20`,
                          color: levelColor,
                          borderColor: levelColor,
                          borderWidth: '1px',
                        }}
                      >
                        {verb}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerbRemoval(verb);
                          }}
                          className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <span className="sr-only">Remove</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.actionVerbs && (
                <p className="text-xs text-destructive mt-1">{errors.actionVerbs.message}</p>
              )}
            </div>
          )}

          {/* Statement */}
          <div>
            <Label htmlFor="statement" className="block mb-2">
              Learning Outcome Statement <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="statement"
              {...register('statement')}
              className="w-full"
              rows={3}
            />
            {errors.statement && (
              <p className="text-xs text-destructive mt-1">{errors.statement.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="block mb-2">
              Description
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              className="w-full"
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-medium-teal text-medium-teal hover:bg-light-mint"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`relative bg-primary-green hover:bg-medium-teal text-white transition-all ${isSubmitting ? 'pl-9' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="absolute left-3 h-4 w-4 animate-spin" />
                  <span className="animate-pulse">Updating...</span>
                </>
              ) : (
                <span>Update Learning Outcome</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
