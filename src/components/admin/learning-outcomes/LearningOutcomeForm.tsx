'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { Card } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Loader2 } from 'lucide-react';
import { InfoCircledIcon } from '@radix-ui/react-icons';

// Import Bloom's Taxonomy components and types
import {
  BloomsTaxonomySelector
} from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import {
  ActionVerbSuggestions
} from '@/features/bloom/components/taxonomy/ActionVerbSuggestions';
import {
  BloomsTaxonomyLevel
} from '@/features/bloom/types';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { AILearningOutcomeGenerator } from '@/features/bloom/components/learning-outcomes/AILearningOutcomeGenerator';

// Form schema
const learningOutcomeSchema = z.object({
  statement: z.string().min(1, 'Statement is required'),
  description: z.string().optional(),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
  actionVerbs: z.array(z.string()).min(1, 'At least one action verb is required'),
  subjectId: z.string(),
  topicId: z.string().optional(),
});

type LearningOutcomeFormValues = z.infer<typeof learningOutcomeSchema>;

interface LearningOutcomeFormProps {
  subjectId: string;
  topicId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LearningOutcomeForm({
  subjectId,
  topicId,
  onSuccess,
  onCancel,
}: LearningOutcomeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBloomsLevel, setSelectedBloomsLevel] = useState<BloomsTaxonomyLevel | null>(null);

  // Form setup
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LearningOutcomeFormValues>({
    resolver: zodResolver(learningOutcomeSchema),
    defaultValues: {
      statement: '',
      description: '',
      bloomsLevel: undefined,
      actionVerbs: [],
      subjectId,
      topicId,
    }
  });

  // Watch action verbs
  const actionVerbs = watch('actionVerbs') || [];

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

  // Handle AI-generated learning outcome selection
  const handleAIOutcomeSelect = (outcome: string, bloomsLevel: BloomsTaxonomyLevel, verbs: string[]) => {
    // Set the Bloom's level
    handleBloomsLevelChange(bloomsLevel);

    // Set the statement
    setValue('statement', outcome);

    // Set the action verbs
    setValue('actionVerbs', verbs);
  };

  // API mutations
  const createLearningOutcome = api.learningOutcome.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Learning outcome created successfully',
        variant: 'success',
      });

      // Reset submission state
      setIsSubmitting(false);

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error('Error creating learning outcome:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create learning outcome',
        variant: 'error',
      });
      // Reset submission state on error (redundant but safe)
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = async (data: LearningOutcomeFormValues) => {
    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Use mutateAsync to wait for the mutation to complete
      await createLearningOutcome.mutateAsync({
        statement: data.statement,
        description: data.description,
        bloomsLevel: data.bloomsLevel,
        actionVerbs: data.actionVerbs,
        subjectId: data.subjectId,
        topicId: data.topicId,
      });
      // Don't set isSubmitting to false here - it will be handled in the onSuccess callback
    } catch (error) {
      console.error('Error creating learning outcome:', error);
      toast({
        title: 'Error',
        description: 'Failed to create learning outcome',
        variant: 'error',
      });
      setIsSubmitting(false); // Only reset on error
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 text-primary-green dark:text-primary-green">
          Create Learning Outcome
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Bloom's Taxonomy Level */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Bloom's Taxonomy Level <span className="text-red-500">*</span>
          </label>
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
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Action Verbs <span className="text-red-500">*</span>
            </label>
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
                      className="px-2 py-1 rounded-full text-sm flex items-center"
                      style={{
                        backgroundColor: `${levelColor}20`, // 20% opacity
                        color: levelColor,
                        borderColor: levelColor,
                        borderWidth: '1px',
                      }}
                    >
                      {verb}
                      <button
                        type="button"
                        className="ml-1 hover:font-bold"
                        onClick={() => handleVerbRemoval(verb)}
                        style={{ color: levelColor }}
                      >
                        &times;
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

        {/* Learning Outcome Statement */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Learning Outcome Statement <span className="text-red-500">*</span>
          </label>
          <Textarea
            {...register('statement')}
            placeholder="Students will be able to..."
            rows={3}
          />
          {errors.statement && (
            <p className="text-xs text-destructive mt-1">{errors.statement.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Start with "Students will be able to..." and use action verbs from the selected Bloom's level.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Description
          </label>
          <Textarea
            {...register('description')}
            placeholder="Additional details about this learning outcome..."
            rows={3}
          />
          {errors.description && (
            <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
                <span className="animate-pulse">Creating...</span>
              </>
            ) : (
              <span className="flex items-center">
                <span className="mr-1">+</span>
                Create Learning Outcome
              </span>
            )}
          </Button>
        </div>
      </form>
      </Card>
    </div>
  );
}
