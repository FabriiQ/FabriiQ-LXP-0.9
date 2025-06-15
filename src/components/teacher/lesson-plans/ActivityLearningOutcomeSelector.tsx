'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
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

interface ActivityLearningOutcomeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  topicIds: string[];
  subjectId: string;
  selectedOutcomeIds: string[];
  onSelect: (outcomeIds: string[]) => void;
  onAddObjective: (objective: string) => void;
  isAssessment?: boolean; // Flag to determine if this is for an assessment
  bloomsLevel?: BloomsTaxonomyLevel; // Bloom's taxonomy level to filter outcomes
}

export function ActivityLearningOutcomeSelector({
  isOpen,
  onClose,
  topicIds,
  subjectId,
  selectedOutcomeIds,
  onSelect,
  onAddObjective,
  isAssessment = false,
  bloomsLevel
}: ActivityLearningOutcomeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedOutcomeIds || []);
  const [newObjective, setNewObjective] = useState('');

  // Fetch learning outcomes for the selected topics and Bloom's level
  const { data: learningOutcomes, isLoading } = api.lessonPlan.getLearningOutcomesByBloomsLevel.useQuery(
    {
      subjectId,
      topicId: topicIds.length > 0 ? topicIds[0] : undefined,
      bloomsLevel
    },
    {
      enabled: isOpen && topicIds.length > 0 && !!bloomsLevel,
      onSuccess: (data) => {
        // If there are selected IDs that don't match the current Bloom's level, clear them
        if (selectedIds.length > 0) {
          const validIds = data.map(outcome => outcome.id);
          const newSelectedIds = selectedIds.filter(id => validIds.includes(id));
          if (newSelectedIds.length !== selectedIds.length) {
            setSelectedIds(newSelectedIds);
            onSelect(newSelectedIds);
          }
        }
      }
    }
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

    setSelectedIds(newSelectedIds);
    // Immediately update the parent component with the new selection
    // This ensures the selection is reflected in the UI right away
    onSelect(newSelectedIds);
  };

  // Handle save
  const handleSave = () => {
    onSelect(selectedIds);
    onClose();
  };

  // Handle add objective
  const handleAddObjective = () => {
    if (newObjective.trim()) {
      onAddObjective(newObjective.trim());
      setNewObjective('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isAssessment
              ? "Select Learning Outcomes & Assessment Methods"
              : "Select Learning Outcomes & Objectives"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
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

          {!bloomsLevel ? (
            <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/20">
              <p className="text-sm text-muted-foreground text-center">
                Please select a Bloom's Taxonomy level first to see relevant learning outcomes.
              </p>
            </div>
          ) : topicIds.length === 0 ? (
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
            <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/20">
              <p className="text-sm text-muted-foreground text-center">
                No learning outcomes found for the selected topics and Bloom's level.
              </p>
            </div>
          ) : (
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
          )}

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">
              {isAssessment
                ? "Add Custom Assessment Method"
                : "Add Custom Learning Objective"}
            </h3>
            <div className="flex space-x-2">
              <Input
                placeholder={isAssessment
                  ? "Enter a custom assessment method"
                  : "Enter a custom learning objective"}
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleAddObjective}
                disabled={!newObjective.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
