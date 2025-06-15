'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/feedback/dialog';
import { Button } from '@/components/ui/core/button';
import { Label } from '@/components/ui/core/label';
import { Textarea } from '@/components/ui/core/textarea';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { ActionVerbSuggestions } from '@/features/bloom/components/taxonomy/ActionVerbSuggestions';

const learningOutcomeSchema = z.object({
  statement: z.string().min(10, 'Learning outcome statement must be at least 10 characters'),
  description: z.string().optional(),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
  actionVerbs: z.array(z.string()).min(1, 'At least one action verb is required'),
});

type LearningOutcomeFormValues = z.infer<typeof learningOutcomeSchema>;

interface LearningOutcomeCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  topicId?: string;
  initialData: {
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
    actionVerbs: string[];
  };
  onSuccess: () => void;
}

export function LearningOutcomeCreateDialog({
  isOpen,
  onClose,
  subjectId,
  topicId,
  initialData,
  onSuccess,
}: LearningOutcomeCreateDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBloomsLevel, setSelectedBloomsLevel] = useState<BloomsTaxonomyLevel>(initialData.bloomsLevel);

  // Form setup
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<LearningOutcomeFormValues>({
    resolver: zodResolver(learningOutcomeSchema),
    defaultValues: {
      statement: initialData.statement,
      description: '',
      bloomsLevel: initialData.bloomsLevel,
      actionVerbs: initialData.actionVerbs,
    }
  });

  const actionVerbs = watch('actionVerbs') || [];

  // Create learning outcome mutation
  const createLearningOutcome = api.learningOutcome.create.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      toast({
        title: 'Success',
        description: 'Learning outcome created successfully',
        variant: 'success',
      });
      onSuccess(); // This will handle cache invalidation and parent updates
      onClose(); // Close only this edit dialog, not the main generation dialog
      reset();
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create learning outcome',
        variant: 'error',
      });
    },
  });

  // Handle Bloom's level change
  const handleBloomsLevelChange = (level: BloomsTaxonomyLevel) => {
    setSelectedBloomsLevel(level);
    setValue('bloomsLevel', level);
  };

  // Handle action verb selection
  const handleVerbSelection = (verb: string) => {
    const currentVerbs = actionVerbs || [];
    if (!currentVerbs.includes(verb)) {
      setValue('actionVerbs', [...currentVerbs, verb]);
    }
  };

  // Handle action verb removal
  const handleVerbRemoval = (verb: string) => {
    setValue('actionVerbs', actionVerbs.filter((v: string) => v !== verb));
  };

  // Handle form submission
  const onSubmit = async (data: LearningOutcomeFormValues) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createLearningOutcome.mutateAsync({
        statement: data.statement,
        description: data.description || `This learning outcome focuses on developing ${BLOOMS_LEVEL_METADATA[data.bloomsLevel].name.toLowerCase()} skills. It aligns with the ${BLOOMS_LEVEL_METADATA[data.bloomsLevel].name} cognitive level of Bloom's Taxonomy.`,
        bloomsLevel: data.bloomsLevel,
        actionVerbs: data.actionVerbs,
        subjectId,
        topicId,
        hasCriteria: true,
      });
    } catch (error) {
      console.error('Error creating learning outcome:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Learning Outcome</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="statement">Learning Outcome Statement *</Label>
            <Textarea
              id="statement"
              {...register('statement')}
              placeholder="Students will be able to..."
              className="min-h-[100px]"
              rows={4}
            />
            {errors.statement && (
              <p className="text-sm text-red-600 mt-1">{errors.statement.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Additional context or details about this learning outcome..."
              className="min-h-[80px]"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label className="block mb-2">Bloom's Taxonomy Level *</Label>
            <BloomsTaxonomySelector
              value={selectedBloomsLevel}
              onChange={handleBloomsLevelChange}
              showDescription={true}
              variant="buttons"
            />
            {errors.bloomsLevel && (
              <p className="text-sm text-red-600 mt-1">{errors.bloomsLevel.message}</p>
            )}
          </div>

          <div>
            <Label className="block mb-2">Action Verbs *</Label>
            <ActionVerbSuggestions
              bloomsLevel={selectedBloomsLevel}
              onSelect={handleVerbSelection}
              showExamples={true}
              showRefreshButton={true}
              selectedVerbs={actionVerbs}
            />
            {actionVerbs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {actionVerbs.map((verb: string) => {
                  const levelColor = BLOOMS_LEVEL_METADATA[selectedBloomsLevel].color;
                  return (
                    <div
                      key={verb}
                      className="px-3 py-1 text-sm rounded-full flex items-center gap-1 border"
                      style={{
                        backgroundColor: `${levelColor}20`,
                        color: levelColor,
                        borderColor: levelColor,
                      }}
                    >
                      {verb}
                      <button
                        type="button"
                        onClick={() => handleVerbRemoval(verb)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.actionVerbs && (
              <p className="text-sm text-red-600 mt-1">{errors.actionVerbs.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-green hover:bg-medium-teal text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save Learning Outcome'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
