'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Check,
  Eye,
  X,
  Award,
  List,
  Plus,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LearningOutcomeCriteriaEditor } from '@/features/bloom/components/learning-outcomes/LearningOutcomeCriteriaEditor';
import {
  LearningOutcomeCriterion,
  LearningOutcomePerformanceLevel,
  BloomsTaxonomyLevel as BloomsLevel,
  RubricType
} from '@/features/bloom/types';

// Type for the rubric criteria returned by the API
interface RubricCriteriaItem {
  id: string;
  rubric: {
    id: string;
    title: string;
  };
  criteriaLevels: Array<{
    performanceLevel: {
      description: string | null;
      name: string;
      id: string;
      createdAt: Date;
      updatedAt: Date;
      maxScore: number;
      rubricId: string;
      minScore: number;
      color: string | null;
    };
  }>;
}

interface Rubric {
  id: string;
  name: string;
  title?: string;
  description?: string | null;
  bloomsLevel?: BloomsTaxonomyLevel | null;
  subjectId: string;
  topicId?: string | null;
  _count?: {
    criteria?: number;
    assessments?: number;
  };
  criteria?: {
    id: string;
    name: string;
    description?: string | null;
    bloomsLevel?: BloomsTaxonomyLevel | null;
  }[];
}

interface RubricSelectorProps {
  subjectId: string;
  topicId: string;
  selectedRubricId: string;
  selectedLearningOutcomes: string[];
  onSelect: (rubricId: string) => void;
  isLoading: boolean;
}

const BLOOMS_COLORS = {
  [BloomsTaxonomyLevel.REMEMBER]: 'bg-red-100 text-red-800 border-red-200',
  [BloomsTaxonomyLevel.UNDERSTAND]: 'bg-orange-100 text-orange-800 border-orange-200',
  [BloomsTaxonomyLevel.APPLY]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [BloomsTaxonomyLevel.ANALYZE]: 'bg-green-100 text-green-800 border-green-200',
  [BloomsTaxonomyLevel.EVALUATE]: 'bg-blue-100 text-blue-800 border-blue-200',
  [BloomsTaxonomyLevel.CREATE]: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function RubricSelector({
  subjectId,
  topicId,
  selectedRubricId,
  selectedLearningOutcomes,
  onSelect,
  isLoading
}: RubricSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [createRubricOpen, setCreateRubricOpen] = useState(false);

  // State for comprehensive rubric creation
  const [rubricTitle, setRubricTitle] = useState('');
  const [rubricDescription, setRubricDescription] = useState('');
  const [rubricType, setRubricType] = useState<RubricType>(RubricType.ANALYTIC);
  const [maxScore, setMaxScore] = useState(100);
  const [hasCriteria, setHasCriteria] = useState(true);
  const [criteria, setCriteria] = useState<LearningOutcomeCriterion[]>([]);
  const [performanceLevels, setPerformanceLevels] = useState<LearningOutcomePerformanceLevel[]>([]);
  const [selectedExistingCriteria, setSelectedExistingCriteria] = useState<string[]>([]);

  // Fetch rubrics for this subject/topic
  const { data: rubricCriteria, isLoading: isLoadingRubrics, refetch } = api.rubric.getCriteriaByTopic.useQuery(
    { topicId },
    { enabled: !!topicId }
  );

  // Fetch reusable criteria from topic and learning outcomes
  const { data: reusableCriteriaData } = api.rubric.getReusableCriteria.useQuery(
    {
      topicId,
      learningOutcomeIds: selectedLearningOutcomes
    },
    { enabled: !!topicId || selectedLearningOutcomes.length > 0 }
  );

  // Fetch learning outcome details for display
  const { data: learningOutcomesData } = api.learningOutcome.getByIds.useQuery(
    { ids: selectedLearningOutcomes },
    { enabled: selectedLearningOutcomes.length > 0 }
  );

  // Create rubric mutation
  const createRubricMutation = api.rubric.create.useMutation({
    onSuccess: (data) => {
      // Select the newly created rubric
      onSelect(data.id);
      // Refetch rubrics to show the new one
      refetch();
      // Close dialog and reset form
      setCreateRubricOpen(false);
      resetRubricForm();
    },
    onError: (error) => {
      console.error('Failed to create rubric:', error);
    }
  });

  // Reset rubric form
  const resetRubricForm = () => {
    setRubricTitle('');
    setRubricDescription('');
    setRubricType(RubricType.ANALYTIC);
    setMaxScore(100);
    setHasCriteria(true);
    setCriteria([]);
    setPerformanceLevels([]);
    setSelectedExistingCriteria([]);
  };

  // Transform the rubric criteria data into rubrics
  const rubrics: Rubric[] = rubricCriteria ?
    rubricCriteria.reduce((acc: Rubric[], item: RubricCriteriaItem) => {
      const existingRubric = acc.find(r => r.id === item.rubric.id);
      if (existingRubric) {
        return acc;
      }

      acc.push({
        id: item.rubric.id,
        name: item.rubric.title,
        title: item.rubric.title,
        description: null,
        subjectId: '',
        topicId: topicId,
        _count: {
          criteria: rubricCriteria.filter(c => c.rubric.id === item.rubric.id).length,
          assessments: 0
        },
        criteria: []
      });

      return acc;
    }, []) : [];

  // Show the interface immediately, with loading states for specific sections
  const showRubricLoading = isLoading || isLoadingRubrics;

  const handleRubricSelect = (rubricId: string) => {
    // Allow deselection by clicking the same rubric
    if (selectedRubricId === rubricId) {
      onSelect('');
    } else {
      onSelect(rubricId);
    }
  };

  // Handle creating a new rubric
  const handleCreateRubric = async () => {
    if (!rubricTitle.trim()) {
      return;
    }

    // For now, skip reusable criteria to avoid type conflicts
    // TODO: Fix the reusable criteria data structure to match expected types
    const selectedReusableCriteria: any[] = [];

    // Original code commented out due to type mismatch:
    // const selectedReusableCriteria = reusableCriteriaData?.criteria.filter(c =>
    //   selectedExistingCriteria.includes(c.id)
    // ).map(c => ({
    //   id: c.id,
    //   name: c.name,
    //   description: c.description || '',
    //   bloomsLevel: c.bloomsLevel,
    //   weight: c.weight,
    //   topicId: topicId,
    //   learningOutcomeId: undefined,
    //   performanceLevels: (c.performanceLevels || []).map(pl => ({
    //     id: pl.id,
    //     name: pl.name,
    //     description: pl.description || '',
    //     scorePercentage: pl.scorePercentage,
    //     color: pl.color || '#3b82f6'
    //   }))
    // })) || [];

    const allCriteria = [
      ...criteria,
      ...selectedReusableCriteria
    ];

    try {
      await createRubricMutation.mutateAsync({
        title: rubricTitle,
        description: rubricDescription,
        type: rubricType,
        maxScore,
        subjectId,
        learningOutcomeIds: selectedLearningOutcomes,
        criteria: hasCriteria ? allCriteria : [],
        performanceLevels: hasCriteria ? performanceLevels.map(pl => ({
          id: pl.id,
          name: pl.name,
          description: pl.description || '',
          scorePercentage: pl.scorePercentage,
          color: pl.color || '#3b82f6' // Default color if not set
        })) : []
      });
    } catch (error) {
      console.error('Error creating rubric:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Grading Method</h3>
        <p className="text-muted-foreground">
          Select between simple scoring or detailed rubric-based grading for this assessment.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Rubrics provide detailed grading criteria and better feedback</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </div>

      {/* No Rubric Option */}
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md border-2 border-dashed",
          selectedRubricId === ''
            ? "ring-2 ring-primary border-primary bg-primary/5"
            : "hover:border-primary/50"
        )}
        onClick={() => onSelect('')}
      >
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-lg bg-muted">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                Use Simple Scoring
                {selectedRubricId === '' && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Grade with a simple score out of maximum points
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rubrics */}
      {showRubricLoading ? (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Loading Rubrics...</h4>
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rubrics && rubrics.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Available Rubrics:</h4>
          {rubrics.map((rubric) => (
            <Card
              key={rubric.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                selectedRubricId === rubric.id
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "hover:border-primary/50"
              )}
              onClick={() => handleRubricSelect(rubric.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      {rubric.name}
                      {selectedRubricId === rubric.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CardTitle>
                    {rubric.description && (
                      <CardDescription className="text-sm mt-1">
                        {rubric.description}
                      </CardDescription>
                    )}
                  </div>
                  {rubric.bloomsLevel && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs", BLOOMS_COLORS[rubric.bloomsLevel])}
                    >
                      {rubric.bloomsLevel}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <List className="h-4 w-4" />
                    <span>{rubric._count?.criteria || 0} criteria</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{rubric._count?.assessments || 0} assessments</span>
                  </div>
                </div>

                {showDetails && rubric.criteria && rubric.criteria.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Criteria:</p>
                    <div className="space-y-1">
                      {rubric.criteria.slice(0, 3).map((criterion) => (
                        <div key={criterion.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{criterion.name}</span>
                          {criterion.bloomsLevel && (
                            <Badge
                              variant="outline"
                              className={cn("text-xs", BLOOMS_COLORS[criterion.bloomsLevel])}
                            >
                              {criterion.bloomsLevel}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {rubric.criteria.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{rubric.criteria.length - 3} more criteria
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-medium mb-2">No Rubrics Available</h4>
          <p className="text-sm text-muted-foreground">
            No rubrics are available for this topic. You can create one using the button below or use simple scoring.
          </p>
        </div>
      )}

      {/* Always show Create Rubric Button */}
      <div className="flex justify-center pt-4 border-t">
        <Dialog open={createRubricOpen} onOpenChange={(open) => {
          setCreateRubricOpen(open);
          if (!open) {
            resetRubricForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create New Rubric
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Rubric</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-6">
              {/* Basic Rubric Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rubric Title *
                  </label>
                  <input
                    type="text"
                    value={rubricTitle}
                    onChange={(e) => setRubricTitle(e.target.value)}
                    placeholder="Enter rubric title"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={rubricDescription}
                    onChange={(e) => setRubricDescription(e.target.value)}
                    placeholder="Enter rubric description"
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rubric Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value={RubricType.ANALYTIC}
                          checked={rubricType === RubricType.ANALYTIC}
                          onChange={(e) => setRubricType(e.target.value as RubricType)}
                          className="mr-2"
                        />
                        Analytic (Multiple Criteria)
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value={RubricType.HOLISTIC}
                          checked={rubricType === RubricType.HOLISTIC}
                          onChange={(e) => setRubricType(e.target.value as RubricType)}
                          className="mr-2"
                        />
                        Holistic (Overall Assessment)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Maximum Score
                    </label>
                    <input
                      type="number"
                      value={maxScore}
                      onChange={(e) => setMaxScore(Number(e.target.value))}
                      min="1"
                      max="1000"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Learning Outcomes Details */}
              {learningOutcomesData && learningOutcomesData.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Selected Learning Outcomes</h3>
                  <div className="space-y-3">
                    {learningOutcomesData.map((outcome) => (
                      <div key={outcome.id} className="border rounded-md p-4 bg-muted/20">
                        <div className="font-medium mb-2">{outcome.statement}</div>
                        {outcome.description && (
                          <div className="text-sm text-muted-foreground mb-3">{outcome.description}</div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            BLOOMS_COLORS[outcome.bloomsLevel] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {outcome.bloomsLevel}
                          </span>
                          {outcome.actionVerbs.map((verb, index) => (
                            <span key={index} className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 border border-blue-200">
                              {verb}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reusable Criteria from Topic and Learning Outcomes */}
              {reusableCriteriaData?.criteria && reusableCriteriaData.criteria.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Reusable Criteria</h3>
                  <p className="text-sm text-muted-foreground">
                    Select existing criteria from this topic and your selected learning outcomes to reuse in this rubric:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-4">
                    {reusableCriteriaData.criteria.map((criterion) => (
                      <div key={criterion.id} className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={`reusable-${criterion.id}`}
                          checked={selectedExistingCriteria.includes(criterion.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExistingCriteria([...selectedExistingCriteria, criterion.id]);
                            } else {
                              setSelectedExistingCriteria(selectedExistingCriteria.filter(id => id !== criterion.id));
                            }
                          }}
                          className="mt-1"
                        />
                        <label htmlFor={`reusable-${criterion.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{criterion.name}</div>
                          <div className="text-sm text-muted-foreground">{criterion.description}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              BLOOMS_COLORS[criterion.bloomsLevel] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {criterion.bloomsLevel}
                            </span>
                            <span>From: {criterion.rubric.title}</span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comprehensive Rubric Criteria Editor */}
              <LearningOutcomeCriteriaEditor
                bloomsLevel={BloomsTaxonomyLevel.UNDERSTAND}
                hasCriteria={hasCriteria}
                criteria={criteria}
                performanceLevels={performanceLevels}
                onHasCriteriaChange={setHasCriteria}
                onCriteriaChange={setCriteria}
                onPerformanceLevelsChange={setPerformanceLevels}
              />

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCreateRubricOpen(false)}
                  disabled={createRubricMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRubric}
                  disabled={!rubricTitle.trim() || createRubricMutation.isLoading}
                >
                  {createRubricMutation.isLoading ? 'Creating...' : 'Create Rubric'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selection Summary */}
      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        {selectedRubricId ? (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Check className="h-4 w-4" />
            <span className="font-medium">
              Rubric selected: {rubrics?.find(r => r.id === selectedRubricId)?.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Check className="h-4 w-4" />
            <span className="font-medium">
              Simple scoring selected
            </span>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {selectedRubricId
            ? 'Students will be graded using detailed criteria with performance levels.'
            : 'Students will be graded with a simple score out of maximum points.'
          }
        </p>
      </div>
    </div>
  );
}
