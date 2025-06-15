'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { AILearningOutcomeGenerator } from '@/features/bloom/components/learning-outcomes/AILearningOutcomeGenerator';
import { cn } from '@/lib/utils';

interface LearningOutcome {
  id: string;
  statement: string;
  description?: string;
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];
  subjectId: string;
  topicId?: string;
}

interface LearningOutcomeSelectorProps {
  topicIds: string[];
  subjectId: string;
  selectedOutcomeIds: string[];
  onOutcomesChange: (outcomeIds: string[]) => void;
}

export function LearningOutcomeSelector({
  topicIds,
  subjectId,
  selectedOutcomeIds,
  onOutcomesChange,
}: LearningOutcomeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedOutcomeIds || []);

  // Fetch learning outcomes for the selected topics
  const { data: learningOutcomes, isLoading } = api.learningOutcome.getByTopics.useQuery(
    { topicIds },
    { enabled: topicIds.length > 0 }
  );

  // Update selected IDs when prop changes, but only if they're different
  useEffect(() => {
    // Check if the arrays are different before updating state
    const isDifferent =
      selectedOutcomeIds.length !== selectedIds.length ||
      selectedOutcomeIds.some(id => !selectedIds.includes(id));

    if (isDifferent) {
      setSelectedIds(selectedOutcomeIds);
    }
  }, [selectedOutcomeIds, selectedIds]);

  // Update parent component when selection changes, but only if initiated by this component
  const handleSelectionChange = useCallback((newSelectedIds: string[]) => {
    setSelectedIds(newSelectedIds);
    onOutcomesChange(newSelectedIds);
  }, [onOutcomesChange]);

  // Filter outcomes based on search query
  const filteredOutcomes = learningOutcomes
    ? learningOutcomes.filter(outcome =>
        outcome.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (outcome.description && outcome.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Handle outcome selection
  const handleOutcomeToggle = (outcomeId: string) => {
    const newSelectedIds = selectedIds.includes(outcomeId)
      ? selectedIds.filter(id => id !== outcomeId)
      : [...selectedIds, outcomeId];

    handleSelectionChange(newSelectedIds);
  };

  // Handle AI-generated outcome
  const handleAIOutcomeSelect = (outcome: string, bloomsLevel: BloomsTaxonomyLevel, actionVerbs: string[]) => {
    // In a real implementation, this would create a new learning outcome and add it to the selected list
    console.log('AI generated outcome:', outcome, bloomsLevel, actionVerbs);
    // For now, we'll just show a message
    alert(`AI generated outcome: ${outcome}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Learning Outcomes</h3>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search outcomes..."
              className="pl-8 w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {topicIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/20">
          <p className="text-sm text-muted-foreground text-center">
            Please select topics first to see available learning outcomes.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 border rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Loading learning outcomes...</p>
        </div>
      ) : !learningOutcomes || learningOutcomes.length === 0 ? (
        <div>
          <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/20 mb-4">
            <p className="text-sm text-muted-foreground text-center">
              No learning outcomes found for the selected topics. You can generate outcomes using AI.
            </p>
          </div>
          <AILearningOutcomeGenerator
            subjectId={subjectId}
            topicId={topicIds[0]} // Use the first topic ID
            onSelect={handleAIOutcomeSelect}
          />
        </div>
      ) : (
        <>
          <ScrollArea className="h-[300px] border rounded-md">
            <div className="divide-y">
              {filteredOutcomes.map(outcome => {
                const isSelected = selectedIds.includes(outcome.id);
                const metadata = BLOOMS_LEVEL_METADATA[outcome.bloomsLevel];
                const levelColor = metadata?.color || '#888888';

                return (
                  <div
                    key={outcome.id}
                    className={cn(
                      "p-3 flex items-start space-x-3 hover:bg-muted/50 transition-colors",
                      isSelected && "bg-muted/50"
                    )}
                    style={{
                      borderLeft: isSelected ? `4px solid ${levelColor}` : '4px solid transparent'
                    }}
                  >
                    <Checkbox
                      id={`outcome-${outcome.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleOutcomeToggle(outcome.id)}
                    />
                    <div className="space-y-1 flex flex-col h-full">
                      <Label
                        htmlFor={`outcome-${outcome.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {outcome.statement}
                      </Label>
                      {outcome.description && (
                        <p className="text-sm text-muted-foreground">
                          {outcome.description}
                        </p>
                      )}
                      <div className="flex flex-col gap-2 mt-auto pt-2">
                        <div className="flex items-center">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${levelColor}20`,
                              color: levelColor,
                              border: `1px solid ${levelColor}40`
                            }}
                          >
                            {metadata?.name || outcome.bloomsLevel}
                          </span>
                        </div>
                        {/* Action verb tags at the bottom */}
                        {outcome.actionVerbs && outcome.actionVerbs.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {outcome.actionVerbs.map((verb, verbIndex) => (
                              <span
                                key={verbIndex}
                                className="text-xs px-2 py-0.5 rounded-full border"
                                style={{
                                  backgroundColor: `${levelColor}15`,
                                  borderColor: `${levelColor}60`,
                                  color: levelColor
                                }}
                              >
                                {verb}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {filteredOutcomes.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-2">
              No outcomes match your search. Try different keywords.
            </p>
          )}

          <div className="mt-4">
            <AILearningOutcomeGenerator
              subjectId={subjectId}
              topicId={topicIds[0]} // Use the first topic ID
              onSelect={handleAIOutcomeSelect}
            />
          </div>
        </>
      )}
    </div>
  );
}
