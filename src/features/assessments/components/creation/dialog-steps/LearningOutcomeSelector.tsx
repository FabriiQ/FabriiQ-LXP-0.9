'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Check, Eye, X, Filter, Plus, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA, ORDERED_BLOOMS_LEVELS } from '@/features/bloom/constants/bloom-levels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AILearningOutcomeGenerator } from '@/features/bloom/components/learning-outcomes/AILearningOutcomeGenerator';

interface LearningOutcome {
  id: string;
  statement: string;
  description?: string | null;
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];
  subjectId: string;
  topicId?: string;
  _count?: {
    criteria?: number;
    assessments?: number;
  };
}

interface LearningOutcomeSelectorProps {
  subjectId: string;
  topicId: string;
  topicIds?: string[]; // New prop for multiple topics
  selectedOutcomes: string[];
  onSelect: (outcomeIds: string[]) => void;
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

export function LearningOutcomeSelector({
  subjectId,
  topicId,
  topicIds = [],
  selectedOutcomes,
  onSelect,
  isLoading
}: LearningOutcomeSelectorProps) {
  const [filterLevel, setFilterLevel] = useState<BloomsTaxonomyLevel | 'ALL'>('ALL');
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('existing');

  // Determine which topics to fetch outcomes for
  const effectiveTopicIds = topicIds.length > 0 ? topicIds : (topicId ? [topicId] : []);

  // Fetch learning outcomes for all selected topics
  const learningOutcomeQueries = effectiveTopicIds.map(id =>
    api.learningOutcome.getByTopic.useQuery(
      { topicId: id },
      { enabled: !!id }
    )
  );

  // Combine all learning outcomes from multiple topics
  const allLearningOutcomes = learningOutcomeQueries
    .map(query => query.data || [])
    .flat();

  const isLoadingOutcomes = learningOutcomeQueries.some(query => query.isLoading);

  const refetch = () => {
    learningOutcomeQueries.forEach(query => query.refetch());
  };

  if (isLoading || isLoadingOutcomes) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Select Learning Outcomes</h3>
          <p className="text-muted-foreground">
            Choose the learning outcomes this assessment will measure.
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4 mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasExistingOutcomes = allLearningOutcomes && allLearningOutcomes.length > 0;

  const filteredOutcomes = hasExistingOutcomes && filterLevel === 'ALL'
    ? allLearningOutcomes
    : hasExistingOutcomes
      ? allLearningOutcomes.filter(outcome => outcome.bloomsLevel === filterLevel)
      : [];

  const handleOutcomeToggle = (outcomeId: string) => {
    const newSelection = selectedOutcomes.includes(outcomeId)
      ? selectedOutcomes.filter(id => id !== outcomeId)
      : [...selectedOutcomes, outcomeId];
    onSelect(newSelection);
  };

  const handleSelectAll = () => {
    const allIds = filteredOutcomes.map(outcome => outcome.id);
    const allSelected = allIds.every(id => selectedOutcomes.includes(id));

    if (allSelected) {
      // Deselect all filtered outcomes
      onSelect(selectedOutcomes.filter(id => !allIds.includes(id)));
    } else {
      // Select all filtered outcomes
      const newSelection = [...new Set([...selectedOutcomes, ...allIds])];
      onSelect(newSelection);
    }
  };

  const bloomsLevels = Object.values(BloomsTaxonomyLevel);
  const selectedCount = selectedOutcomes.length;
  const totalCount = allLearningOutcomes?.length || 0;

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Select Learning Outcomes *</h3>
        <p className="text-muted-foreground">
          Choose the learning outcomes this assessment will measure.
          <span className="text-red-600 font-medium"> At least one outcome is required.</span>
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Existing Outcomes
            {hasExistingOutcomes && (
              <Badge variant="secondary" className="ml-1">
                {totalCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Generate New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          {!hasExistingOutcomes ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Learning Outcomes Found</h3>
              <p className="text-muted-foreground mb-4">
                No learning outcomes are available for this topic. You can generate new ones using the "Generate New" tab.
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveTab('generate')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Generate Learning Outcomes
              </Button>
            </div>
          ) : (
            <>
              {/* Filter and Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by Bloom's Level:</span>
                  <div className="flex gap-1">
                    <Button
                      variant={filterLevel === 'ALL' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterLevel('ALL')}
                    >
                      All
                    </Button>
                    {bloomsLevels.map((level) => (
                      <Button
                        key={level}
                        variant={filterLevel === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterLevel(level)}
                        className="text-xs"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {filteredOutcomes.every(outcome => selectedOutcomes.includes(outcome.id))
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>
              </div>

              {/* Selection Summary */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {selectedCount} of {totalCount} learning outcomes selected
                </span>
                <span>
                  Showing {filteredOutcomes.length} outcomes
                </span>
              </div>

              {/* Learning Outcomes List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredOutcomes.map((outcome) => (
                  <Card
                    key={outcome.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      selectedOutcomes.includes(outcome.id)
                        ? "ring-2 ring-primary border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    )}
                    onClick={() => handleOutcomeToggle(outcome.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedOutcomes.includes(outcome.id)}
                          onChange={() => handleOutcomeToggle(outcome.id)}
                          className="mt-1"
                        />

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-relaxed">
                              {outcome.statement}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn("text-xs whitespace-nowrap", BLOOMS_COLORS[outcome.bloomsLevel])}
                            >
                              {outcome.bloomsLevel}
                            </Badge>
                          </div>

                          {outcome.actionVerbs && outcome.actionVerbs.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {outcome.actionVerbs.map((verb, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {verb}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {showDetails && outcome.description && (
                            <p className="text-xs text-muted-foreground">
                              {outcome.description}
                            </p>
                          )}

                          {showDetails && (
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{outcome._count?.criteria || 0} criteria</span>
                              <span>{outcome._count?.assessments || 0} assessments</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <AILearningOutcomeGenerator
            subjectId={subjectId}
            topicId={effectiveTopicIds[0] || topicId} // Use first topic for generation
            onSuccess={() => {
              refetch();
              setActiveTab('existing');
            }}
          />
        </TabsContent>
      </Tabs>

      {selectedOutcomes.length > 0 && (
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Check className="h-4 w-4" />
            <span className="font-medium">
              {selectedOutcomes.length} learning outcome{selectedOutcomes.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            These outcomes will be used to suggest appropriate rubrics and assessment methods.
          </p>
        </div>
      )}
    </div>
  );
}
