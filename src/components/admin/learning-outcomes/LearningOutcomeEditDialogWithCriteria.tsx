'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

// Form schema
const learningOutcomeSchema = z.object({
  statement: z.string().min(1, 'Statement is required'),
  description: z.string().optional(),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
  actionVerbs: z.array(z.string()).min(1, 'At least one action verb is required'),
});

type LearningOutcomeFormValues = z.infer<typeof learningOutcomeSchema>;

interface LearningOutcomeEditDialogWithCriteriaProps {
  isOpen: boolean;
  onClose: () => void;
  learningOutcome: {
    id: string;
    statement: string;
    description?: string;
    bloomsLevel: BloomsTaxonomyLevel;
    actionVerbs: string[];
    hasCriteria?: boolean;
    criteria?: LearningOutcomeCriterion[];
    performanceLevels?: LearningOutcomePerformanceLevel[];
  };
  onSuccess?: () => void;
}

export function LearningOutcomeEditDialogWithCriteria({
  isOpen,
  onClose,
  learningOutcome,
  onSuccess,
}: LearningOutcomeEditDialogWithCriteriaProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBloomsLevel, setSelectedBloomsLevel] = useState<BloomsTaxonomyLevel>(learningOutcome.bloomsLevel);
  const [activeTab, setActiveTab] = useState('details');

  // Criteria state
  const [hasCriteria, setHasCriteria] = useState(learningOutcome.hasCriteria || false);
  const [criteria, setCriteria] = useState<LearningOutcomeCriterion[]>(learningOutcome.criteria || []);
  const [performanceLevels, setPerformanceLevels] = useState<LearningOutcomePerformanceLevel[]>(
    learningOutcome.performanceLevels || []
  );

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

  // Handle Bloom's level change
  const handleBloomsLevelChange = (level: BloomsTaxonomyLevel) => {
    setSelectedBloomsLevel(level);
    setValue('bloomsLevel', level);
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
      await updateLearningOutcome.mutateAsync({
        id: learningOutcome.id,
        data: {
          statement: data.statement,
          description: data.description,
          bloomsLevel: data.bloomsLevel,
          actionVerbs: data.actionVerbs,
          hasCriteria: hasCriteria,
          criteria: criteria,
          performanceLevels: performanceLevels,
        },
      });
      // Don't set isSubmitting to false here - it will be handled in the onSuccess callback
    } catch (error) {
      console.error('Error updating learning outcome:', error);
      setIsSubmitting(false); // Only reset on error
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      reset({
        statement: learningOutcome.statement,
        description: learningOutcome.description || '',
        bloomsLevel: learningOutcome.bloomsLevel,
        actionVerbs: learningOutcome.actionVerbs,
      });
      setSelectedBloomsLevel(learningOutcome.bloomsLevel);
      setHasCriteria(learningOutcome.hasCriteria || false);
      setCriteria(learningOutcome.criteria || []);
      setPerformanceLevels(learningOutcome.performanceLevels || []);
    }
  }, [isOpen, learningOutcome, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Learning Outcome</DialogTitle>
        </DialogHeader>

        <form id="learning-outcome-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="criteria">Rubric Criteria</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-4">
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
        </form>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="learning-outcome-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
