'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Custom RefreshCw icon component
const RefreshCw = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 2v6h6" />
    <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
    <path d="M21 22v-6h-6" />
    <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
  </svg>
);

interface LearningObjectivesSuggesterProps {
  topicIds: string[];
  selectedObjectives: string[];
  onObjectivesChange: (objectives: string[]) => void;
}

export function LearningObjectivesSuggester({
  topicIds,
  selectedObjectives,
  onObjectivesChange,
}: LearningObjectivesSuggesterProps) {
  const [newObjective, setNewObjective] = useState('');
  const [objectives, setObjectives] = useState<string[]>(selectedObjectives || []);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  // Fetch suggested learning objectives
  const { data: suggestedObjectives, isLoading, refetch } = api.lessonPlan.getSuggestedLearningObjectives.useQuery(
    { topicIds },
    { enabled: topicIds.length > 0 }
  );

  // Initialize objectives from selectedObjectives prop only once
  useEffect(() => {
    if (selectedObjectives) setObjectives(selectedObjectives);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selected suggestions when suggested objectives change
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedObjectives]);

  // Update when props change with proper dependency array
  const prevSelectedObjectivesRef = React.useRef<string[]>([]);

  useEffect(() => {
    // Only update if selectedObjectives actually changed from previous value
    const prevSelectedObjectives = prevSelectedObjectivesRef.current;
    const selectedObjectivesChanged =
      !prevSelectedObjectives ||
      prevSelectedObjectives.length !== selectedObjectives.length ||
      selectedObjectives.some((obj, idx) => obj !== prevSelectedObjectives[idx]);

    if (selectedObjectivesChanged) {
      prevSelectedObjectivesRef.current = [...selectedObjectives];

      // Only update local state if it's different from props
      const objectivesDifferent =
        objectives.length !== selectedObjectives.length ||
        selectedObjectives.some((obj, idx) => objectives[idx] !== obj);

      if (objectivesDifferent) {
        setObjectives(selectedObjectives);

        // Mark any suggestions that are already in the objectives as selected
        if (suggestedObjectives) {
          const newSelectedSuggestions = suggestedObjectives.filter(suggestion =>
            selectedObjectives.includes(suggestion)
          );
          setSelectedSuggestions(newSelectedSuggestions);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObjectives, suggestedObjectives]);

  // Create a ref outside of useEffect
  const initialRenderRef = React.useRef(true);
  const prevObjectivesRef = React.useRef<string[]>([]);

  // Update parent component when local state changes, but only if they actually changed
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      prevObjectivesRef.current = objectives;
      return;
    }

    // Only call onObjectivesChange if the objectives actually changed
    const prevObjectives = prevObjectivesRef.current;
    const objectivesChanged =
      prevObjectives.length !== objectives.length ||
      objectives.some((obj, idx) => obj !== prevObjectives[idx]);

    if (objectivesChanged) {
      prevObjectivesRef.current = [...objectives];
      onObjectivesChange(objectives);
    }
  }, [objectives, onObjectivesChange]);

  // Add custom objective
  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setObjectives((prev) => [...prev, newObjective.trim()]);
      setNewObjective('');
    }
  };

  // Remove objective
  const handleRemoveObjective = (index: number) => {
    setObjectives((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle suggestion selection
  const handleSuggestionChange = (objective: string, checked: boolean) => {
    if (checked) {
      setSelectedSuggestions((prev) => [...prev, objective]);
    } else {
      setSelectedSuggestions((prev) => prev.filter((obj) => obj !== objective));
    }
  };

  // Add selected suggestions to objectives
  const handleAddSelectedSuggestions = () => {
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
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
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
                        disabled={objectives.includes(objective)}
                      />
                      <Label
                        htmlFor={`objective-${index}`}
                        className={`text-sm font-normal leading-tight cursor-pointer ${
                          objectives.includes(objective) ? 'text-muted-foreground line-through' : ''
                        }`}
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
                disabled={selectedSuggestions.length === 0}
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
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddObjective}
            disabled={!newObjective.trim()}
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
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
