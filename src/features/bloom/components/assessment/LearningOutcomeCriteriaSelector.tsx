'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Check } from 'lucide-react';
import { api } from '@/trpc/react';
import {
  BloomsTaxonomyLevel,
  LearningOutcome,
  LearningOutcomeCriterion
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { LearningOutcomeCriteriaPreview } from '../learning-outcomes/LearningOutcomeCriteriaPreview';

interface LearningOutcomeCriteriaSelectorProps {
  learningOutcomeIds: string[];
  selectedCriteriaIds: string[];
  onCriteriaChange: (criteriaIds: string[]) => void;
  className?: string;
}

export function LearningOutcomeCriteriaSelector({
  learningOutcomeIds,
  selectedCriteriaIds,
  onCriteriaChange,
  className = '',
}: LearningOutcomeCriteriaSelectorProps) {
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch learning outcomes
  const learningOutcomesQuery = api.learningOutcome.getByIds.useQuery(
    { ids: learningOutcomeIds },
    {
      enabled: learningOutcomeIds.length > 0,
      onSuccess: (data) => {
        setOutcomes(data.filter(outcome => outcome.hasCriteria && outcome.criteria && outcome.criteria.length > 0));
        setIsLoading(false);
      },
      onError: (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    }
  );

  // Get all criteria from all outcomes
  const getAllCriteria = (): LearningOutcomeCriterion[] => {
    const allCriteria: LearningOutcomeCriterion[] = [];

    outcomes.forEach(outcome => {
      if (outcome.criteria) {
        outcome.criteria.forEach(criterion => {
          allCriteria.push({
            ...criterion,
            outcomeId: outcome.id, // Add reference to parent outcome
            outcomeStatement: outcome.statement, // Add reference to parent outcome statement
          } as any);
        });
      }
    });

    return allCriteria;
  };

  // Handle select all criteria
  const handleSelectAll = () => {
    const allCriteria = getAllCriteria();
    onCriteriaChange(allCriteria.map(c => c.id));
  };

  // Handle clear all criteria
  const handleClearAll = () => {
    onCriteriaChange([]);
  };

  // Handle toggle criterion
  const handleToggleCriterion = (criterionId: string) => {
    if (selectedCriteriaIds.includes(criterionId)) {
      onCriteriaChange(selectedCriteriaIds.filter(id => id !== criterionId));
    } else {
      onCriteriaChange([...selectedCriteriaIds, criterionId]);
    }
  };

  // Handle select all criteria for an outcome
  const handleSelectOutcomeCriteria = (outcome: LearningOutcome) => {
    if (!outcome.criteria) return;

    const criteriaIds = outcome.criteria.map(c => c.id);
    const newSelectedIds = [...selectedCriteriaIds];

    criteriaIds.forEach(id => {
      if (!newSelectedIds.includes(id)) {
        newSelectedIds.push(id);
      }
    });

    onCriteriaChange(newSelectedIds);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-green" />
          <span className="ml-2">Loading criteria...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-red-500">
          <p>Error loading criteria: {error}</p>
          <Button
            onClick={() => learningOutcomesQuery.refetch()}
            variant="outline"
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (outcomes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            No learning outcomes with criteria found. Please add criteria to your learning outcomes first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allCriteria = getAllCriteria();
  const selectedCount = selectedCriteriaIds.length;
  const totalCount = allCriteria.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Learning Outcome Criteria</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={selectedCount === totalCount}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={selectedCount === 0}
            >
              Clear All
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Selected {selectedCount} of {totalCount} criteria
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {outcomes.map(outcome => {
              const levelColor = BLOOMS_LEVEL_METADATA[outcome.bloomsLevel].color;
              const levelName = BLOOMS_LEVEL_METADATA[outcome.bloomsLevel].name;

              if (!outcome.criteria || outcome.criteria.length === 0) {
                return null;
              }

              const outcomeCriteriaIds = outcome.criteria.map(c => c.id);
              const allSelected = outcomeCriteriaIds.every(id => selectedCriteriaIds.includes(id));
              const someSelected = outcomeCriteriaIds.some(id => selectedCriteriaIds.includes(id));

              return (
                <Card key={outcome.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: levelColor }}>
                  <CardHeader className="p-3 bg-muted/20">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`outcome-${outcome.id}`}
                          checked={allSelected}
                          indeterminate={someSelected && !allSelected}
                          onCheckedChange={() => handleSelectOutcomeCriteria(outcome)}
                        />
                        <Label
                          htmlFor={`outcome-${outcome.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {outcome.statement}
                        </Label>
                      </div>
                      <Badge style={{ backgroundColor: levelColor }}>
                        {levelName}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {outcome.criteria.map(criterion => (
                        <div
                          key={criterion.id}
                          className="flex items-start p-2 rounded-md hover:bg-muted/20"
                        >
                          <Checkbox
                            id={`criterion-${criterion.id}`}
                            checked={selectedCriteriaIds.includes(criterion.id)}
                            onCheckedChange={() => handleToggleCriterion(criterion.id)}
                            className="mt-1"
                          />
                          <div className="ml-2">
                            <Label
                              htmlFor={`criterion-${criterion.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {criterion.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {criterion.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
