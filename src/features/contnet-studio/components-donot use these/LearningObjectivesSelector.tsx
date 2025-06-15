'use client';

/**
 * LearningObjectivesSelector Component
 *
 * This component provides a UI for selecting learning objectives.
 * It fetches suggested learning objectives based on selected topics
 * and allows custom objectives to be added.
 */

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, RotateCcw as RefreshCcw, X } from 'lucide-react';

interface LearningObjectivesSelectorProps {
  topicIds: string[];
  selectedObjectives: string[];
  onObjectivesChange: (objectives: string[]) => void;
  disabled?: boolean;
}

export function LearningObjectivesSelector({
  topicIds,
  selectedObjectives,
  onObjectivesChange,
  disabled = false
}: LearningObjectivesSelectorProps) {
  const [newObjective, setNewObjective] = useState('');
  const [objectives, setObjectives] = useState<string[]>(selectedObjectives || []);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const initialRenderRef = useRef(true);

  // Fetch suggested learning objectives
  const { data: suggestedObjectives, isLoading, refetch } = api.lessonPlan.getSuggestedLearningObjectives.useQuery(
    { topicIds },
    {
      enabled: topicIds.length > 0,
      retry: 1
    }
  );

  // Initialize objectives from selectedObjectives prop only once
  useEffect(() => {
    if (selectedObjectives) setObjectives(selectedObjectives);
  }, []);

  // Auto-select suggested objectives when they load
  useEffect(() => {
    if (suggestedObjectives && suggestedObjectives.length > 0) {
      // Mark any suggestions that are already in the objectives as selected
      const newSelectedSuggestions = suggestedObjectives.filter(suggestion =>
        objectives.includes(suggestion)
      );
      setSelectedSuggestions(newSelectedSuggestions);

      // Auto-add suggested objectives if we don't have any objectives yet
      if (objectives.length <= 1 && objectives[0] === '') {
        // If we only have the default empty objective, replace it with suggestions
        const newObjectives = [...suggestedObjectives];
        setObjectives(newObjectives);
        onObjectivesChange(newObjectives);
      } else if (objectives.length === 0) {
        // If we have no objectives at all, add the suggestions
        setObjectives(suggestedObjectives);
        onObjectivesChange(suggestedObjectives);
      }
    }
  }, [suggestedObjectives]);

  // Update when props change with proper dependency array
  useEffect(() => {
    if (selectedObjectives && JSON.stringify(selectedObjectives) !== JSON.stringify(objectives)) {
      setObjectives(selectedObjectives);

      // Mark any suggestions that are already in the objectives as selected
      if (suggestedObjectives) {
        const newSelectedSuggestions = suggestedObjectives.filter(suggestion =>
          selectedObjectives.includes(suggestion)
        );
        setSelectedSuggestions(newSelectedSuggestions);
      }
    }
  }, [selectedObjectives, JSON.stringify(objectives), suggestedObjectives]);

  // Update parent component when local state changes
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    onObjectivesChange(objectives);
  }, [JSON.stringify(objectives)]);

  // Add custom objective
  const handleAddObjective = () => {
    if (disabled) return;

    if (newObjective.trim()) {
      setObjectives((prev) => [...prev, newObjective.trim()]);
      setNewObjective('');
    }
  };

  // Remove objective
  const handleRemoveObjective = (index: number) => {
    if (disabled) return;

    setObjectives((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle suggestion selection
  const handleSuggestionChange = (objective: string, checked: boolean) => {
    if (disabled) return;

    if (checked) {
      setSelectedSuggestions((prev) => [...prev, objective]);
    } else {
      setSelectedSuggestions((prev) => prev.filter((obj) => obj !== objective));
    }
  };

  // Add selected suggestions to objectives
  const handleAddSelectedSuggestions = () => {
    if (disabled) return;

    if (selectedSuggestions.length > 0) {
      // Add only suggestions that aren't already in objectives
      const newObjectives = [...objectives];
      selectedSuggestions.forEach((suggestion) => {
        if (!newObjectives.includes(suggestion)) {
          newObjectives.push(suggestion);
        }
      });
      setObjectives(newObjectives);
      setSelectedSuggestions([]);
    }
  };

  return (
    <div className="space-y-4">
      {topicIds.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Suggested Learning Objectives</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || disabled}
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 border rounded-md">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Loading learning objectives...</p>
            </div>
          ) : !suggestedObjectives || suggestedObjectives.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/20">
              <p className="text-sm text-muted-foreground text-center">
                No learning objectives found for the selected topics. Try selecting different topics or add custom objectives below.
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-48 sm:h-60 border rounded-md p-2">
                <div className="space-y-2">
                  {suggestedObjectives.map((objective, index) => (
                    <div key={index} className="flex items-start space-x-2 py-1">
                      <Checkbox
                        id={`objective-${index}`}
                        checked={selectedSuggestions.includes(objective)}
                        onCheckedChange={(checked) => handleSuggestionChange(objective, !!checked)}
                        disabled={objectives.includes(objective) || disabled}
                      />
                      <Label
                        htmlFor={`objective-${index}`}
                        className={`text-sm font-normal leading-tight cursor-pointer ${
                          objectives.includes(objective) ? 'text-muted-foreground line-through' : ''
                        } ${disabled ? 'cursor-not-allowed' : ''}`}
                      >
                        {objective}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Button
                type="button"
                size="sm"
                onClick={handleAddSelectedSuggestions}
                disabled={selectedSuggestions.length === 0 || disabled}
                className="mt-2 w-full sm:w-auto"
              >
                Add Selected Objectives
              </Button>
            </>
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-2">Add Custom Learning Objective</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <Input
            placeholder="Enter learning objective"
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            className="flex-1"
            disabled={disabled}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddObjective}
            disabled={!newObjective.trim() || disabled}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {objectives.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Current Learning Objectives</h3>
          <div className="space-y-2">
            {objectives.map((objective, index) => (
              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span className="text-sm">{objective}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveObjective(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
