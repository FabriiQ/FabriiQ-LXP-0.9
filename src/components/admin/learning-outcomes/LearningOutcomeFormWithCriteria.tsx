'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import {
  BloomsTaxonomyLevel,
  LearningOutcomeCriterion,
  LearningOutcomePerformanceLevel
} from '@/features/bloom/types';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { ActionVerbSuggestions } from '@/features/bloom/components/taxonomy/ActionVerbSuggestions';
import { LearningOutcomeCriteriaEditor } from '@/features/bloom/components/learning-outcomes/LearningOutcomeCriteriaEditor';
import { LearningOutcomeCriteriaPreview } from '@/features/bloom/components/learning-outcomes/LearningOutcomeCriteriaPreview';
import { generateDefaultCriteria, generateDefaultPerformanceLevels } from '@/features/bloom/utils/learning-outcome-helpers';

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

interface LearningOutcomeFormWithCriteriaProps {
  subjectId: string;
  topicId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LearningOutcomeFormWithCriteria({
  subjectId,
  topicId,
  onSuccess,
  onCancel,
}: LearningOutcomeFormWithCriteriaProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBloomsLevel, setSelectedBloomsLevel] = useState<BloomsTaxonomyLevel>(BloomsTaxonomyLevel.REMEMBER);
  const [activeTab, setActiveTab] = useState('details');

  // Criteria state
  const [hasCriteria, setHasCriteria] = useState(false);
  const [criteria, setCriteria] = useState<LearningOutcomeCriterion[]>([]);
  const [performanceLevels, setPerformanceLevels] = useState<LearningOutcomePerformanceLevel[]>([]);

  // Form setup
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<LearningOutcomeFormValues>({
    resolver: zodResolver(learningOutcomeSchema),
    defaultValues: {
      statement: '',
      description: '',
      bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
      actionVerbs: [],
      subjectId,
      topicId,
    }
  });

  // Watch action verbs
  const actionVerbs = watch('actionVerbs') || [];

  // Create mutation
  const createLearningOutcome = api.learningOutcome.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Learning outcome created successfully',
        variant: 'success',
      });
      setIsSubmitting(false);
      reset({
        statement: '',
        description: '',
        bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
        actionVerbs: [],
        subjectId,
        topicId,
      });
      setSelectedBloomsLevel(BloomsTaxonomyLevel.REMEMBER);
      setHasCriteria(false);
      setCriteria([]);
      setPerformanceLevels([]);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create learning outcome',
        variant: 'error',
      });
      setIsSubmitting(false);
    },
  });

  // Handle Bloom's level change
  const handleBloomsLevelChange = (level: BloomsTaxonomyLevel) => {
    setSelectedBloomsLevel(level);
    setValue('bloomsLevel', level);

    // Generate default criteria if hasCriteria is true
    if (hasCriteria) {
      const defaultCriteria = generateDefaultCriteria(level, watch('statement'));
      setCriteria(defaultCriteria);
    }
  };

  // Handle action verb selection
  const handleActionVerbSelect = (verb: string) => {
    const currentVerbs = watch('actionVerbs') || [];
    if (!currentVerbs.includes(verb)) {
      setValue('actionVerbs', [...currentVerbs, verb]);
    }
  };

  // Handle action verb removal
  const handleActionVerbRemove = (verb: string) => {
    const currentVerbs = watch('actionVerbs') || [];
    setValue('actionVerbs', currentVerbs.filter(v => v !== verb));
  };

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
        hasCriteria: hasCriteria,
        criteria: criteria,
        performanceLevels: performanceLevels,
      });
      // Don't set isSubmitting to false here - it will be handled in the onSuccess callback
    } catch (error) {
      console.error('Error creating learning outcome:', error);
      setIsSubmitting(false); // Only reset on error
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 text-primary-green dark:text-primary-green">
          Create Learning Outcome
        </h2>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="criteria">Rubric Criteria</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            <form id="learning-outcome-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Hidden fields */}
              <input type="hidden" {...register('subjectId')} />
              <input type="hidden" {...register('topicId')} />

              {/* Bloom's Taxonomy Level */}
              <div>
                <Label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
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
              <div>
                <Label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Action Verbs <span className="text-red-500">*</span>
                </Label>
                <div className="mb-2">
                  <ActionVerbSuggestions
                    bloomsLevel={selectedBloomsLevel}
                    onSelect={handleActionVerbSelect}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {actionVerbs.map((verb) => (
                    <div
                      key={verb}
                      className="bg-primary-green/10 text-primary-green px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{verb}</span>
                      <button
                        type="button"
                        className="ml-2 text-primary-green hover:text-destructive"
                        onClick={() => handleActionVerbRemove(verb)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                {errors.actionVerbs && (
                  <p className="text-xs text-destructive mt-1">{errors.actionVerbs.message}</p>
                )}
              </div>

              {/* Statement */}
              <div>
                <Label htmlFor="statement" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Learning Outcome Statement <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="statement"
                  {...register('statement')}
                  className="w-full"
                  rows={3}
                  placeholder="Students will be able to..."
                />
                {errors.statement && (
                  <p className="text-xs text-destructive mt-1">{errors.statement.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  className="w-full"
                  rows={3}
                  placeholder="Additional details about this learning outcome..."
                />
                {errors.description && (
                  <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>
            </form>
          </TabsContent>

          <TabsContent value="criteria" className="space-y-6 mt-4">
            <LearningOutcomeCriteriaEditor
              bloomsLevel={selectedBloomsLevel}
              hasCriteria={hasCriteria}
              criteria={criteria}
              performanceLevels={performanceLevels}
              onHasCriteriaChange={setHasCriteria}
              onCriteriaChange={setCriteria}
              onPerformanceLevelsChange={setPerformanceLevels}
            />

            {hasCriteria && criteria.length > 0 && performanceLevels.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Preview</h3>
                <LearningOutcomeCriteriaPreview
                  hasCriteria={hasCriteria}
                  criteria={criteria}
                  performanceLevels={performanceLevels}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            form="learning-outcome-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Learning Outcome'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
