'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/feedback/dialog';
import { Button } from '@/components/ui/core/button';
import { Loader2, CheckCircle2, AlertCircle, Lightbulb, Edit } from 'lucide-react';
import { BloomsTaxonomyLevel, LearningOutcomeFramework } from '@/features/bloom/types';
import { BLOOMS_LEVEL_METADATA, ORDERED_BLOOMS_LEVELS } from '@/features/bloom/constants/bloom-levels';
import { ACTION_VERBS_BY_LEVEL } from '@/features/bloom/constants/action-verbs';
import { LEARNING_OUTCOME_FRAMEWORK_METADATA, ORDERED_FRAMEWORKS, DEFAULT_FRAMEWORK } from '@/features/bloom/constants/learning-outcome-frameworks';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { ActionVerbSuggestions } from '@/features/bloom/components/taxonomy/ActionVerbSuggestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Checkbox } from '@/components/ui/core/checkbox';
import { Label } from '@/components/ui/core/label';

import { Textarea } from '@/components/ui/core/textarea';
import { LearningOutcomeCreateDialog } from './LearningOutcomeCreateDialog';
import { Slider } from '@/components/ui/core/slider';

interface LearningOutcomeGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  topicId?: string;
  onSelect?: (outcome: string, bloomsLevel: BloomsTaxonomyLevel, actionVerbs: string[]) => void;
  onBulkGenerate?: () => void;
}

export function LearningOutcomeGenerationDialog({
  isOpen,
  onClose,
  subjectId,
  topicId,
  onSelect,
  onBulkGenerate,
}: LearningOutcomeGenerationDialogProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<BloomsTaxonomyLevel | null>(null);
  const [generatedOutcomes, setGeneratedOutcomes] = useState<string[]>([]);
  const [structuredOutcomes, setStructuredOutcomes] = useState<Array<{ outcome: string; actionVerbs: string[]; bloomsLevel: BloomsTaxonomyLevel }>>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('single');
  const [selectedActionVerbs, setSelectedActionVerbs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outcomeCount, setOutcomeCount] = useState(1);
  const [hasGenerated, setHasGenerated] = useState(false);

  // For bulk generation
  const [selectedLevels, setSelectedLevels] = useState<BloomsTaxonomyLevel[]>([]);
  const [bulkCustomPrompt, setBulkCustomPrompt] = useState('');
  const [generatingLevel, setGeneratingLevel] = useState<BloomsTaxonomyLevel | null>(null);
  const [completedLevels, setCompletedLevels] = useState<BloomsTaxonomyLevel[]>([]);
  const [bulkResults, setBulkResults] = useState<Record<BloomsTaxonomyLevel, any[]>>({} as Record<BloomsTaxonomyLevel, any[]>);
  const [bulkActionVerbs, setBulkActionVerbs] = useState<Record<BloomsTaxonomyLevel, string[]>>({} as Record<BloomsTaxonomyLevel, string[]>);
  const [generateRubrics, setGenerateRubrics] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<LearningOutcomeFramework>(DEFAULT_FRAMEWORK);

  // Add this state for taxonomy distribution
  const [taxonomyDistribution, setTaxonomyDistribution] = useState<Record<BloomsTaxonomyLevel, number>>({
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<{
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
    actionVerbs: string[];
    id?: string;
  } | null>(null);

  // Fetch subject and topic details for context
  const { data: subject } = api.subject.getById.useQuery({ id: subjectId });
  const { data: topic } = topicId ? api.subjectTopic.getById.useQuery({ id: topicId }) : { data: null };

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Create a mutation for generating learning outcomes
  const generateOutcomesMutation = api.bloom.generateLearningOutcomes.useMutation({
    onSuccess: (data) => {
      setHasGenerated(true);

      if (activeTab === 'single') {
        // Check if data is structured or simple array
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'outcome' in data[0]) {
          // Structured data
          setStructuredOutcomes(data as Array<{ outcome: string; actionVerbs: string[]; bloomsLevel: BloomsTaxonomyLevel }>);
          setGeneratedOutcomes(data.map((item: any) => item.outcome));
        } else {
          // Simple string array
          setGeneratedOutcomes(data as string[]);
          setStructuredOutcomes([]);
        }
        setIsGenerating(false);
        toast({
          title: 'Success',
          description: 'Learning outcomes generated successfully',
          variant: 'success',
        });
      } else if (activeTab === 'bulk') {
        // For bulk generation with distribution, store all results
        setBulkResults(prev => ({
          ...prev,
          [BloomsTaxonomyLevel.CREATE]: data // Store under a single key for distributed generation
        }));
        setIsGenerating(false);
        toast({
          title: 'Success',
          description: 'Learning outcomes generated successfully with cognitive distribution',
          variant: 'success',
        });
      }
    },
    onError: (error) => {
      console.error('Error generating learning outcomes:', error);
      setIsGenerating(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate learning outcomes',
        variant: 'error',
      });
    },
  });

  // Create a mutation for creating learning outcomes
  const createLearningOutcomeMutation = api.learningOutcome.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch learning outcomes to refresh the list
      if (topicId) {
        utils.learningOutcome.getByTopic.invalidate({ topicId });
      } else {
        utils.learningOutcome.getBySubject.invalidate({ subjectId });
      }

      toast({
        title: 'Success',
        description: 'Learning outcome saved successfully',
        variant: 'success',
      });
    },
    onError: (error) => {
      console.error('Error creating learning outcome:', error);
      setIsGenerating(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create learning outcome',
        variant: 'error',
      });
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedLevel(null);
      setGeneratedOutcomes([]);
      setCustomPrompt('');
      setActiveTab('single');
      setSelectedLevels([]);
      setBulkCustomPrompt('');
      setGeneratingLevel(null);
      setCompletedLevels([]);
      setBulkResults({} as Record<BloomsTaxonomyLevel, string[]>);
      setSelectedActionVerbs([]);
      setBulkActionVerbs({} as Record<BloomsTaxonomyLevel, string[]>);
      setGenerateRubrics(false);
      setOutcomeCount(1);
      setError(null);
      setSelectedFramework(DEFAULT_FRAMEWORK);
      setEditDialogOpen(false);
      setEditingOutcome(null);
    }
  }, [isOpen]);

  // Handle level selection for single generation
  const handleLevelChange = (level: BloomsTaxonomyLevel) => {
    setSelectedLevel(level);
    // Clear previous outcomes when level changes
    setGeneratedOutcomes([]);
    // Clear action verbs when level changes
    setSelectedActionVerbs([]);
  };

  // Handle action verb selection
  const handleVerbSelection = (verb: string) => {
    if (!selectedActionVerbs.includes(verb)) {
      setSelectedActionVerbs(prev => [...prev, verb]);
    }
  };



  // Handle level selection for bulk generation
  const handleBulkLevelToggle = (level: BloomsTaxonomyLevel) => {
    setSelectedLevels(prev => {
      const newLevels = prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level];

      // If removing a level, also remove its action verbs
      if (!newLevels.includes(level)) {
        setBulkActionVerbs(prev => {
          const newVerbs = { ...prev };
          delete newVerbs[level];
          return newVerbs;
        });
      }

      return newLevels;
    });
  };

  // Handle bulk action verb selection
  const handleBulkVerbSelection = (level: BloomsTaxonomyLevel, verb: string) => {
    setBulkActionVerbs(prev => {
      const currentVerbs = prev[level] || [];
      if (!currentVerbs.includes(verb)) {
        return {
          ...prev,
          [level]: [...currentVerbs, verb]
        };
      }
      return prev;
    });
  };

  // Handle bulk action verb removal
  const handleBulkVerbRemoval = (level: BloomsTaxonomyLevel, verb: string) => {
    setBulkActionVerbs(prev => {
      const currentVerbs = prev[level] || [];
      return {
        ...prev,
        [level]: currentVerbs.filter(v => v !== verb)
      };
    });
  };

  // Handle generate button click for single generation
  const handleGenerate = async () => {
    if (!selectedLevel) {
      toast({
        title: 'Error',
        description: 'Please select a Bloom\'s Taxonomy level',
        variant: 'error',
      });
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get the topic name or subject name for context
      const contextName = topic?.title || subject?.name || '';

      // Get topic description and context if available
      const topicDescription = topic?.description || '';
      const topicContext = topic?.context || '';

      // Build a comprehensive prompt with all available context
      let plainTextPrompt = customPrompt || '';

      // Add topic description and context to the prompt
      if (topicDescription) {
        plainTextPrompt += `\n\nTopic Description: ${topicDescription}`;
      }

      if (topicContext) {
        plainTextPrompt += `\n\nTopic Context: ${topicContext}`;
      }

      // Add selected action verbs to the prompt if any
      if (selectedActionVerbs.length > 0) {
        plainTextPrompt += `\n\nPlease use one of these action verbs if possible: ${selectedActionVerbs.join(', ')}.`;
      }

      // Calculate total count based on selected action verbs and outcome count
      const totalCount = selectedActionVerbs.length > 0
        ? selectedActionVerbs.length * outcomeCount
        : outcomeCount;

      // Call the API to generate learning outcomes
      await generateOutcomesMutation.mutateAsync({
        topic: contextName,
        level: selectedLevel,
        count: Math.min(totalCount, 10), // Cap at 10 total outcomes
        customPrompt: plainTextPrompt || undefined,
        selectedActionVerbs: selectedActionVerbs.length > 0 ? selectedActionVerbs : undefined,
        framework: selectedFramework,
      });
    } catch (error) {
      console.error('Error generating learning outcomes:', error);
      setIsGenerating(false);
      setError('Failed to generate learning outcomes. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to generate learning outcomes',
        variant: 'error',
      });
    }
  };

  // Handle bulk generation
  const handleBulkGenerate = async () => {
    if (selectedLevels.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one Bloom\'s Taxonomy level',
        variant: 'error',
      });
      return;
    }

    setIsGenerating(true);

    // Start the bulk generation process
    await startBulkGeneration();
  };

  // Start bulk generation process
  const startBulkGeneration = async () => {
    // Reset state for a new bulk generation
    setCompletedLevels([]);
    setBulkResults({} as Record<BloomsTaxonomyLevel, string[]>);
    setError(null);

    // Calculate total percentage and normalize if needed
    const totalPercentage = Object.values(taxonomyDistribution).reduce((sum, val) => sum + val, 0);
    const normalizedDistribution = {...taxonomyDistribution};

    if (totalPercentage > 0) {
      // Normalize to ensure total is 100%
      Object.keys(normalizedDistribution).forEach(level => {
        normalizedDistribution[level as BloomsTaxonomyLevel] =
          Math.round((normalizedDistribution[level as BloomsTaxonomyLevel] / totalPercentage) * 100);
      });
    } else {
      // If no distribution set, distribute evenly among selected levels
      const evenPercentage = Math.floor(100 / selectedLevels.length);
      selectedLevels.forEach(level => {
        normalizedDistribution[level] = evenPercentage;
      });
      // Adjust for rounding errors
      normalizedDistribution[selectedLevels[0]] += 100 - (evenPercentage * selectedLevels.length);
    }

    try {
      // Get the topic name or subject name for context
      const contextName = topic?.title || subject?.name || '';

      // Build comprehensive prompt with distribution information
      let enhancedPrompt = bulkCustomPrompt || '';
      enhancedPrompt += `\n\nGenerate a total of ${outcomeCount} learning outcomes for "${contextName}" with the following Bloom's Taxonomy distribution:\n`;

      // Add distribution information
      selectedLevels.forEach(level => {
        const percentage = normalizedDistribution[level];
        const levelVerbs = bulkActionVerbs[level] || [];
        enhancedPrompt += `\n- ${BLOOMS_LEVEL_METADATA[level].name} (${percentage}%)`;
        if (levelVerbs.length > 0) {
          enhancedPrompt += `: Consider these verbs: ${levelVerbs.join(', ')}`;
        }
      });

      enhancedPrompt += `\n\nImportant guidelines:
      - Create a cognitively balanced set of outcomes following the distribution above
      - Ensure outcomes are measurable and student-centered
      - Use appropriate action verbs that truly reflect the cognitive processes
      - Create natural connections between outcomes at different levels
      - Focus on meaningful learning rather than just using specific verbs`;

      // Collect all selected action verbs from all levels
      const allSelectedActionVerbs = Object.values(bulkActionVerbs).flat();

      // Call the API with the enhanced prompt
      await generateOutcomesMutation.mutateAsync({
        topic: contextName,
        // Use the highest selected level as the primary level
        level: selectedLevels.sort((a, b) =>
          Object.values(BloomsTaxonomyLevel).indexOf(b) -
          Object.values(BloomsTaxonomyLevel).indexOf(a)
        )[0],
        count: outcomeCount,
        customPrompt: enhancedPrompt,
        taxonomyDistribution: normalizedDistribution,
        selectedActionVerbs: allSelectedActionVerbs.length > 0 ? allSelectedActionVerbs : undefined,
        framework: selectedFramework,
      });
    } catch (error) {
      console.error('Error generating learning outcomes:', error);
      setIsGenerating(false);
      setGeneratingLevel(null);
      setError('Failed to generate learning outcomes. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to generate learning outcomes',
        variant: 'error',
      });
    }
  };



  // Extract action verbs from outcome (enhanced to detect multiple verbs)
  const extractActionVerb = (outcome: string, level: BloomsTaxonomyLevel): string[] => {
    if (!outcome) return [];

    // Get action verbs for this level and all levels
    const levelVerbs = ACTION_VERBS_BY_LEVEL[level] || [];
    const allVerbs = Object.values(ACTION_VERBS_BY_LEVEL).flat();

    // Extract words from the outcome, preserving original case
    const words = outcome.split(/\s+/).map(word => word.replace(/[^a-zA-Z]/g, ''));

    // Find matching action verbs (case-insensitive matching, preserve original case)
    const foundVerbs: string[] = [];

    words.forEach(word => {
      const lowerWord = word.toLowerCase();

      // First check level-specific verbs
      const levelMatch = levelVerbs.find(verbObj => verbObj.verb.toLowerCase() === lowerWord);
      if (levelMatch && !foundVerbs.some(v => v.toLowerCase() === lowerWord)) {
        foundVerbs.push(word); // Use original case from outcome
        return;
      }

      // Then check all verbs for cross-level detection
      const allMatch = allVerbs.find(verbObj => verbObj.verb.toLowerCase() === lowerWord);
      if (allMatch && !foundVerbs.some(v => v.toLowerCase() === lowerWord)) {
        foundVerbs.push(word); // Use original case from outcome
      }
    });

    // If no verbs found, try to extract the first word as a potential verb
    if (foundVerbs.length === 0) {
      const firstWord = words[0];
      if (firstWord && firstWord.length > 2) {
        return [firstWord];
      }
    }

    // Return found verbs or default to level-appropriate verb
    return foundVerbs.length > 0 ? foundVerbs : [levelVerbs[0]?.verb || 'apply'];
  };

  // Get the taxonomy level for a specific action verb
  const getVerbTaxonomyLevel = (verb: string): BloomsTaxonomyLevel => {
    for (const [level, verbs] of Object.entries(ACTION_VERBS_BY_LEVEL)) {
      if (verbs.some(v => v.verb.toLowerCase() === verb.toLowerCase())) {
        return level as BloomsTaxonomyLevel;
      }
    }
    return BloomsTaxonomyLevel.REMEMBER; // Default fallback
  };

  // Detect cognitive level from outcome content
  const detectCognitiveLevel = (outcome: string | any): BloomsTaxonomyLevel => {
    // Handle both string and object outcomes
    const outcomeText = typeof outcome === 'string' ? outcome : outcome?.outcome || '';
    if (!outcomeText) return BloomsTaxonomyLevel.REMEMBER;

    // Extract the first word as potential action verb
    const firstWord = outcomeText.split(' ')[0].replace(/[^a-zA-Z]/g, '').toLowerCase();

    // Check each level to find the best match
    for (const level of ORDERED_BLOOMS_LEVELS) {
      const levelVerbs = ACTION_VERBS_BY_LEVEL[level];
      const isMatch = levelVerbs.some(
        verbObj => verbObj.verb.toLowerCase() === firstWord
      );
      if (isMatch) {
        return level;
      }
    }

    // If no exact match, try to detect based on common patterns
    const lowerOutcome = outcomeText.toLowerCase();

    if (lowerOutcome.includes('create') || lowerOutcome.includes('design') || lowerOutcome.includes('develop')) {
      return BloomsTaxonomyLevel.CREATE;
    } else if (lowerOutcome.includes('evaluate') || lowerOutcome.includes('assess') || lowerOutcome.includes('critique')) {
      return BloomsTaxonomyLevel.EVALUATE;
    } else if (lowerOutcome.includes('analyze') || lowerOutcome.includes('examine') || lowerOutcome.includes('compare')) {
      return BloomsTaxonomyLevel.ANALYZE;
    } else if (lowerOutcome.includes('apply') || lowerOutcome.includes('use') || lowerOutcome.includes('implement')) {
      return BloomsTaxonomyLevel.APPLY;
    } else if (lowerOutcome.includes('explain') || lowerOutcome.includes('describe') || lowerOutcome.includes('summarize')) {
      return BloomsTaxonomyLevel.UNDERSTAND;
    }

    // Default to Remember level
    return BloomsTaxonomyLevel.REMEMBER;
  };



  // Handle outcome edit (opens edit dialog)
  const handleOutcomeEdit = (outcome: string, level?: BloomsTaxonomyLevel) => {
    const bloomsLevel = level || selectedLevel;
    if (!bloomsLevel) return;

    // Extract action verbs from the outcome
    const actionVerbs = extractActionVerb(outcome, bloomsLevel);

    // Set up the editing outcome
    setEditingOutcome({
      statement: outcome,
      bloomsLevel,
      actionVerbs,
    });

    // Open the edit dialog
    setEditDialogOpen(true);
  };

  // Handle edit dialog success
  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setEditingOutcome(null);

    // Invalidate cache to refresh the list
    if (topicId) {
      utils.learningOutcome.getByTopic.invalidate({ topicId });
    } else {
      utils.learningOutcome.getBySubject.invalidate({ subjectId });
    }

    // Call onBulkGenerate to notify parent component
    if (onBulkGenerate) {
      onBulkGenerate();
    }

    toast({
      title: 'Success',
      description: 'Learning outcome saved successfully',
      variant: 'success',
    });

    // DO NOT close the main dialog - keep it open to preserve remaining outcomes
  };

  // Handle saving all single outcomes at once
  const handleSaveAllSingleOutcomes = async () => {
    if (!selectedLevel || !subjectId || generatedOutcomes.length === 0) {
      return;
    }

    try {
      const contextName = topic?.title || subject?.name || '';

      // Save all outcomes in parallel
      const savePromises = generatedOutcomes.map(async (outcome) => {
        const actionVerbs = extractActionVerb(outcome, selectedLevel);
        const description = `This learning outcome focuses on developing ${BLOOMS_LEVEL_METADATA[selectedLevel].name.toLowerCase()} skills in ${contextName}. Students will demonstrate their ability to ${actionVerbs.join(', ')} concepts and materials related to this topic. This aligns with the ${BLOOMS_LEVEL_METADATA[selectedLevel].name} level of Bloom's Taxonomy, which involves ${BLOOMS_LEVEL_METADATA[selectedLevel].description.toLowerCase()}.`;

        return createLearningOutcomeMutation.mutateAsync({
          statement: outcome,
          description,
          bloomsLevel: selectedLevel,
          actionVerbs,
          subjectId,
          topicId,
          hasCriteria: true,
        });
      });

      await Promise.all(savePromises);

      // Clear the generated outcomes
      setGeneratedOutcomes([]);

      toast({
        title: 'Success',
        description: `${generatedOutcomes.length} learning outcomes saved successfully`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving learning outcomes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save some learning outcomes',
        variant: 'error',
      });
    }
  };

  // Handle saving all bulk outcomes at once
  const handleSaveAllBulkOutcomes = async () => {
    if (!subjectId || Object.keys(bulkResults).length === 0) {
      return;
    }

    try {
      const contextName = topic?.title || subject?.name || '';

      // Flatten all bulk outcomes and save them in parallel
      const allOutcomes = Object.entries(bulkResults).flatMap(([levelKey, outcomes]) => {
        const level = levelKey as BloomsTaxonomyLevel;
        return outcomes.map(outcome => {
          const outcomeText = typeof outcome === 'string' ? outcome : outcome?.outcome || '';
          const actionVerbs = extractActionVerb(outcomeText, level);
          const description = `This learning outcome focuses on developing ${BLOOMS_LEVEL_METADATA[level].name.toLowerCase()} skills in ${contextName}. Students will demonstrate their ability to ${actionVerbs.join(', ')} concepts and materials related to this topic. This aligns with the ${BLOOMS_LEVEL_METADATA[level].name} level of Bloom's Taxonomy, which involves ${BLOOMS_LEVEL_METADATA[level].description.toLowerCase()}.`;

          return {
            statement: outcomeText,
            description,
            bloomsLevel: level,
            actionVerbs,
            subjectId,
            topicId,
            hasCriteria: generateRubrics,
          };
        });
      });

      // Save all outcomes in parallel
      const savePromises = allOutcomes.map(outcomeData =>
        createLearningOutcomeMutation.mutateAsync(outcomeData)
      );

      await Promise.all(savePromises);

      // Clear the bulk results
      setBulkResults({} as Record<BloomsTaxonomyLevel, any[]>);

      toast({
        title: 'Success',
        description: `${allOutcomes.length} learning outcomes saved successfully`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving learning outcomes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save some learning outcomes',
        variant: 'error',
      });
    }
  };



  // Handle bulk outcome edit (opens edit dialog)
  const handleBulkOutcomeEdit = (outcome: string, level: BloomsTaxonomyLevel) => {
    // Extract action verbs from the outcome
    const actionVerbs = extractActionVerb(outcome, level);

    // Set up the editing outcome
    setEditingOutcome({
      statement: outcome,
      bloomsLevel: level,
      actionVerbs,
    });

    // Open the edit dialog
    setEditDialogOpen(true);
  };

  // Handle saving all outcomes and finishing
  const handleFinishAndSave = async () => {
    try {
      // Save all single outcomes if any
      if (generatedOutcomes.length > 0) {
        await handleSaveAllSingleOutcomes();
      }

      // Save all bulk outcomes if any
      if (Object.keys(bulkResults).length > 0) {
        await handleSaveAllBulkOutcomes();
      }

      // Refresh the parent component
      if (onBulkGenerate) {
        onBulkGenerate();
      }

      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error finishing and saving:', error);
      // Don't close the dialog if there was an error
    }
  };

  // Add this component to the bulk generation tab
  const TaxonomyDistributionSlider = () => (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Cognitive Distribution</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Set even distribution among selected levels
            const evenValue = Math.floor(100 / selectedLevels.length);
            const newDist = {...taxonomyDistribution};

            // Reset all to zero first
            Object.keys(newDist).forEach(key => {
              newDist[key as BloomsTaxonomyLevel] = 0;
            });

            // Set even distribution for selected levels
            selectedLevels.forEach(level => {
              newDist[level] = evenValue;
            });

            // Adjust for rounding errors
            if (selectedLevels.length > 0) {
              newDist[selectedLevels[0]] += 100 - (evenValue * selectedLevels.length);
            }

            setTaxonomyDistribution(newDist);
          }}
        >
          Balance
        </Button>
      </div>

      {selectedLevels.map(level => (
        <div key={level} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium" style={{color: BLOOMS_LEVEL_METADATA[level].color}}>
              {BLOOMS_LEVEL_METADATA[level].name}
            </span>
            <span className="text-xs">{taxonomyDistribution[level]}%</span>
          </div>
          <Slider
            value={[taxonomyDistribution[level]]}
            min={0}
            max={100}
            step={5}
            onValueChange={(values) => {
              setTaxonomyDistribution(prev => ({
                ...prev,
                [level]: values[0]
              }));
            }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Learning Outcomes with AI</DialogTitle>
          {/* Progress indicator */}
          {(generatedOutcomes.length > 0 || Object.keys(bulkResults).length > 0) && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  {(() => {
                    const singleRemaining = generatedOutcomes.length;
                    const bulkRemaining = Object.values(bulkResults).flat().length;
                    const totalRemaining = singleRemaining + bulkRemaining;

                    if (totalRemaining > 0) {
                      return `${totalRemaining} learning outcome${totalRemaining === 1 ? '' : 's'} generated. Click "Save All & Finish" to save them.`;
                    } else {
                      return 'All outcomes saved! Click "Finish & Refresh" to see them in the list.';
                    }
                  })()}
                </span>
                {(() => {
                  const singleRemaining = generatedOutcomes.length;
                  const bulkRemaining = Object.values(bulkResults).flat().length;
                  const totalRemaining = singleRemaining + bulkRemaining;

                  if (totalRemaining === 0) {
                    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
                  }
                })()}
              </div>
            </div>
          )}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Level Generation</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
          </TabsList>

            <TabsContent value="single" className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Select a Bloom's level to generate learning outcomes:
                </p>
                <BloomsTaxonomySelector
                  value={selectedLevel}
                  onChange={handleLevelChange}
                  showDescription={true}
                  variant="buttons"
                />
              </div>

              {selectedLevel && (
                <div>
                  <Label className="block mb-2">Action Verbs</Label>
                  <ActionVerbSuggestions
                    bloomsLevel={selectedLevel}
                    onSelect={handleVerbSelection}
                    showExamples={true}
                    showRefreshButton={true}
                    selectedVerbs={selectedActionVerbs}
                  />
                </div>
              )}

              <div>
                <Label className="block mb-3">Learning Outcome Framework</Label>
                <div className="space-y-3">
                  {ORDERED_FRAMEWORKS.map((framework) => {
                    const metadata = LEARNING_OUTCOME_FRAMEWORK_METADATA[framework];
                    const isSelected = selectedFramework === framework;

                    return (
                      <div
                        key={framework}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-green bg-primary-green/10 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-green/50'
                        }`}
                        onClick={() => setSelectedFramework(framework)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                            isSelected
                              ? 'border-primary-green bg-primary-green'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {metadata.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {metadata.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">
                              {metadata.structure}
                            </p>
                            {metadata.example && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                                Example: {metadata.example}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="customPrompt">Custom Prompt (Optional)</Label>
                <Textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific details or requirements for the learning outcomes..."
                  className="min-h-[150px]"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide additional context to guide the AI in generating more relevant learning outcomes.
                </p>
              </div>

              <div>
                <Label htmlFor="outcomeCount">Number of Learning Outcomes</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <input
                    type="range"
                    id="outcomeCount"
                    min="1"
                    max="5"
                    value={outcomeCount}
                    onChange={(e) => setOutcomeCount(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[20px]">
                    {outcomeCount}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This number of learning outcomes will be generated per action verb selected (1-5)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedLevel || isGenerating}
                  className="bg-primary-green hover:bg-medium-teal text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      {hasGenerated && activeTab === 'single' ? 'Regenerate Learning Outcomes' : 'Generate Learning Outcomes'}
                    </>
                  )}
                </Button>
              </div>

              {generatedOutcomes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Generated Learning Outcomes:
                  </p>
                  <div className="space-y-3">
                    {generatedOutcomes.map((outcome, index) => {
                      const levelColor = selectedLevel ? BLOOMS_LEVEL_METADATA[selectedLevel].color : '#1F504B';

                      // Get action verbs from structured data if available, otherwise extract
                      const structuredOutcome = structuredOutcomes[index];
                      const actionVerbs = structuredOutcome?.actionVerbs ||
                        (selectedLevel ? extractActionVerb(outcome, selectedLevel) : []);

                      return (
                        <div
                          key={index}
                          className="rounded-md transition-all hover:shadow-md border"
                          style={{
                            borderColor: levelColor,
                          }}
                        >
                          <div
                            className="p-3"
                            style={{
                              backgroundColor: `${levelColor}10`, // 10% opacity
                              borderLeft: `3px solid ${levelColor}`,
                            }}
                          >
                            <div className="flex flex-col">
                              <div className="flex justify-between items-start mb-3">
                                <p className="text-sm flex-1 pr-2">{outcome}</p>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 flex-shrink-0">
                                  {LEARNING_OUTCOME_FRAMEWORK_METADATA[selectedFramework].name}
                                </span>
                              </div>
                              {/* Action verb tags at the bottom */}
                              <div className="flex flex-wrap gap-1 mt-auto">
                                {actionVerbs.map((verb, verbIndex) => {
                                  const verbLevel = getVerbTaxonomyLevel(verb);
                                  const verbColor = BLOOMS_LEVEL_METADATA[verbLevel].color;
                                  return (
                                    <span
                                      key={verbIndex}
                                      className="text-xs px-2 py-1 rounded-full border"
                                      style={{
                                        backgroundColor: `${verbColor}15`,
                                        borderColor: verbColor,
                                        color: verbColor
                                      }}
                                    >
                                      {verb}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end p-2 bg-gray-50 dark:bg-gray-800 border-t" style={{ borderColor: `${levelColor}30` }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOutcomeEdit(outcome)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Select Bloom's levels to generate learning outcomes for:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {ORDERED_BLOOMS_LEVELS.map((level) => {
                    const metadata = BLOOMS_LEVEL_METADATA[level];
                    const isSelected = selectedLevels.includes(level);
                    const isCompleted = completedLevels.includes(level);
                    const isGenerating = generatingLevel === level;

                    return (
                      <div
                        key={level}
                        className={`p-3 rounded-md cursor-pointer transition-all ${
                          isSelected ? 'border-2 shadow-md' : 'border'
                        }`}
                        style={{
                          backgroundColor: isSelected ? `${metadata.color}20` : 'transparent',
                          borderColor: metadata.color,
                        }}
                        onClick={() => handleBulkLevelToggle(level)}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium ${isSelected ? 'text-white' : ''}`}
                            style={{ color: isSelected ? metadata.color : metadata.color }}
                          >
                            {metadata.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedLevels.length > 0 && (
                <div className="space-y-4">
                  <Label className="block">Action Verbs for Selected Levels</Label>
                  <div className="space-y-3">
                    {selectedLevels.map((level) => {
                      const metadata = BLOOMS_LEVEL_METADATA[level];
                      const selectedVerbs = bulkActionVerbs[level] || [];

                      return (
                        <div
                          key={level}
                          className="border rounded-md p-3"
                          style={{ borderColor: metadata.color }}
                        >
                          <h4 className="text-sm font-medium mb-2" style={{ color: metadata.color }}>
                            {metadata.name} Level
                          </h4>
                          <ActionVerbSuggestions
                            bloomsLevel={level}
                            onSelect={(verb) => handleBulkVerbSelection(level, verb)}
                            showExamples={false}
                            showRefreshButton={true}
                            selectedVerbs={selectedVerbs}
                          />

                          {selectedVerbs.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {selectedVerbs.map((verb) => (
                                <div
                                  key={verb}
                                  className="px-3 py-1 text-sm rounded-full flex items-center gap-1"
                                  style={{
                                    backgroundColor: `${metadata.color}20`,
                                    color: metadata.color,
                                    borderColor: metadata.color,
                                    borderWidth: '1px',
                                  }}
                                >
                                  {verb}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleBulkVerbRemoval(level, verb);
                                    }}
                                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    <span className="sr-only">Remove</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Taxonomy Distribution Slider */}
              {selectedLevels.length > 0 && <TaxonomyDistributionSlider />}

              {/* Framework Selection for Bulk Generation */}
              <div>
                <Label className="block mb-3">Learning Outcome Framework</Label>
                <div className="grid grid-cols-1 gap-3">
                  {ORDERED_FRAMEWORKS.map((framework) => {
                    const metadata = LEARNING_OUTCOME_FRAMEWORK_METADATA[framework];
                    const isSelected = selectedFramework === framework;

                    return (
                      <div
                        key={framework}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-green bg-primary-green/10 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-green/50'
                        }`}
                        onClick={() => setSelectedFramework(framework)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                            isSelected
                              ? 'border-primary-green bg-primary-green'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {metadata.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {metadata.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="bulkCustomPrompt">Custom Prompt (Optional)</Label>
                <Textarea
                  id="bulkCustomPrompt"
                  value={bulkCustomPrompt}
                  onChange={(e) => setBulkCustomPrompt(e.target.value)}
                  placeholder="Add specific details or requirements for all learning outcomes..."
                  className="min-h-[150px]"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide additional context to guide the AI in generating more relevant learning outcomes for all selected levels.
                </p>
              </div>

              <div>
                <Label htmlFor="bulkOutcomeCount">Number of Learning Outcomes</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <input
                    type="range"
                    id="bulkOutcomeCount"
                    min="1"
                    max="10"
                    value={outcomeCount}
                    onChange={(e) => setOutcomeCount(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[20px]">
                    {outcomeCount}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total number of learning outcomes to generate with cognitive distribution (1-10)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generateRubrics"
                  checked={generateRubrics}
                  onCheckedChange={(checked) => setGenerateRubrics(checked as boolean)}
                />
                <Label htmlFor="generateRubrics" className="text-sm">
                  Generate rubric criteria for learning outcomes
                </Label>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleBulkGenerate}
                  disabled={selectedLevels.length === 0 || isGenerating}
                  className="bg-primary-green hover:bg-medium-teal text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      {hasGenerated && activeTab === 'bulk' ? 'Regenerate for Selected Levels' : 'Generate for Selected Levels'}
                    </>
                  )}
                </Button>
              </div>

              {Object.keys(bulkResults).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Generated Learning Outcomes (Cognitively Balanced):
                  </p>
                  <div className="space-y-3">
                    {/* Display all outcomes from distributed generation */}
                    {Object.entries(bulkResults).map(([_, outcomes]) =>
                      outcomes.map((outcome, index) => {
                        // Handle both string and object outcomes
                        const outcomeText = typeof outcome === 'string' ? outcome : outcome?.outcome || '';
                        const detectedLevel = detectCognitiveLevel(outcome);
                        const metadata = BLOOMS_LEVEL_METADATA[detectedLevel];

                        return (
                          <div
                            key={index}
                            className="rounded-md transition-all hover:shadow-md border"
                            style={{
                              borderColor: metadata.color,
                            }}
                          >
                            <div
                              className="p-3"
                              style={{
                                backgroundColor: `${metadata.color}10`, // 10% opacity
                                borderLeft: `3px solid ${metadata.color}`,
                              }}
                            >
                              <div className="flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                  <p className="text-sm flex-1 pr-2">{outcomeText}</p>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <span
                                      className="text-xs px-2 py-1 rounded-full"
                                      style={{
                                        backgroundColor: `${metadata.color}20`,
                                        color: metadata.color
                                      }}
                                    >
                                      {metadata.name}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                      {LEARNING_OUTCOME_FRAMEWORK_METADATA[selectedFramework].name}
                                    </span>
                                  </div>
                                </div>
                                {/* Action verb tags at the bottom */}
                                <div className="flex flex-wrap gap-1 mt-auto">
                                  {extractActionVerb(outcomeText, detectedLevel).map((verb, verbIndex) => {
                                    const verbLevel = getVerbTaxonomyLevel(verb);
                                    const verbColor = BLOOMS_LEVEL_METADATA[verbLevel].color;
                                    return (
                                      <span
                                        key={verbIndex}
                                        className="text-xs px-2 py-1 rounded-full border"
                                        style={{
                                          backgroundColor: `${verbColor}15`,
                                          borderColor: verbColor,
                                          color: verbColor
                                        }}
                                      >
                                        {verb}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end p-2 bg-gray-50 dark:bg-gray-800 border-t" style={{ borderColor: `${metadata.color}30` }}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkOutcomeEdit(outcomeText, detectedLevel)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    ).flat()}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {(generatedOutcomes.length > 0 || Object.keys(bulkResults).length > 0) && (
            <Button
              onClick={handleFinishAndSave}
              className="bg-primary-green hover:bg-medium-teal text-white"
            >
              {(() => {
                const singleRemaining = generatedOutcomes.length;
                const bulkRemaining = Object.values(bulkResults).flat().length;
                const totalRemaining = singleRemaining + bulkRemaining;

                if (totalRemaining > 0) {
                  return `Save All & Finish (${totalRemaining})`;
                } else {
                  return 'Finish & Refresh';
                }
              })()}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Create Dialog for Editing Generated Outcomes */}
      {editingOutcome && (
        <LearningOutcomeCreateDialog
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          subjectId={subjectId}
          topicId={topicId}
          initialData={{
            statement: editingOutcome.statement,
            bloomsLevel: editingOutcome.bloomsLevel,
            actionVerbs: editingOutcome.actionVerbs,
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </Dialog>
  );
}


