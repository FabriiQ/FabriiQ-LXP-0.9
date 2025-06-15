'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EssayRubric, EssayRubricCriterion, EssayRubricLevel } from '@/features/question-bank/models/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button'; // Added Button for potential internal save/clear
import { Separator } from '@/components/ui/separator'; // Added Separator

// Define the structure for selections more explicitly
export interface CustomRubricCriterionSelection {
  levelId: string;
  points: number;
  feedback?: string;
  levelName?: string; // Store the name of the selected level for easier display or data processing
}

export interface CustomRubricSelections {
  [criterionId: string]: CustomRubricCriterionSelection;
}

interface CustomJsonRubricGradingProps {
  rubric: EssayRubric; // Or a more generic custom rubric type
  initialSelections?: CustomRubricSelections;
  onSelectionsChange: (result: {
    score: number;
    selections: CustomRubricSelections;
  }) => void;
  readOnly?: boolean;
  // maxScore?: number; // totalPoints from rubric is used
}

export function CustomJsonRubricGrading({
  rubric,
  initialSelections = {},
  onSelectionsChange,
  readOnly = false,
}: CustomJsonRubricGradingProps) {
  const [currentSelections, setCurrentSelections] = useState<CustomRubricSelections>(initialSelections);

  // Initialize selections if not fully provided based on rubric criteria
  useEffect(() => {
    const initial: CustomRubricSelections = {};
    let hasChanged = false;
    rubric.criteria.forEach(criterion => {
      if (initialSelections[criterion.id]) {
        initial[criterion.id] = initialSelections[criterion.id];
      } else {
        // Optionally pre-select the first level or no level
        // For now, no pre-selection if not in initialSelections
      }
    });
    // Only set if there was a need to initialize, to avoid loops if initialSelections was already complete.
    // This effect is more about ensuring all criteria have an entry if we decide to pre-populate.
    // For now, currentSelections will build up as user interacts or if initialSelections are passed.
    // If initialSelections can be "partial", this might need adjustment.
    // Let's assume initialSelections is either complete or empty for now.
    setCurrentSelections(initialSelections);
  }, [rubric, initialSelections]); // Rerun if rubric or initialSelections change


  // Calculate total score and propagate changes whenever selections change
  useEffect(() => {
    let totalScore = 0;
    Object.values(currentSelections).forEach(selection => {
      totalScore += selection.points || 0; // Ensure points exist
    });
    onSelectionsChange({ score: totalScore, selections: currentSelections });
  }, [currentSelections, onSelectionsChange]);

  const handleLevelSelect = useCallback((criterionId: string, level: EssayRubricLevel) => {
    if (readOnly) return;
    setCurrentSelections(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId], // Preserve existing feedback if any
        levelId: level.id,
        points: level.points,
        levelName: level.name,
      },
    }));
  }, [readOnly]);

  const handleFeedbackChange = useCallback((criterionId: string, feedbackText: string) => {
    if (readOnly) return;
    setCurrentSelections(prev => {
      // Ensure a level is selected before adding feedback, or handle default selection
      const existingSelection = prev[criterionId] || { levelId: '', points: 0, levelName: 'N/A' };
      return {
        ...prev,
        [criterionId]: { ...existingSelection, feedback: feedbackText },
      };
    });
  }, [readOnly]);

  if (!rubric || !rubric.criteria || rubric.criteria.length === 0) {
    return <p className="text-sm text-muted-foreground">Rubric data is missing, invalid, or has no criteria.</p>;
  }

  const calculatedTotalScore = Object.values(currentSelections).reduce((sum, sel) => sum + (sel.points || 0), 0);
  const rubricTotalPoints = rubric.totalPoints || rubric.criteria.reduce((sum, crit) => sum + (crit.points || 0), 0);


  return (
    <div className="space-y-6">
      {rubric.title && <h3 className="text-lg font-semibold">{rubric.title}</h3>}
      {rubric.criteria.map((criterion: EssayRubricCriterion) => (
        <Card key={criterion.id} className="overflow-hidden">
          <CardHeader className="bg-muted/30 p-4">
            <CardTitle className="text-md">{criterion.name}</CardTitle>
            {criterion.description && <CardDescription className="text-xs">{criterion.description}</CardDescription>}
            <div className="text-sm font-medium pt-1">Max Points: {criterion.points}</div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <RadioGroup
              value={currentSelections[criterion.id]?.levelId || ''}
              onValueChange={(levelId) => {
                const selectedLevel = criterion.levels.find(l => l.id === levelId);
                if (selectedLevel) {
                  handleLevelSelect(criterion.id, selectedLevel);
                }
              }}
              disabled={readOnly}
              aria-label={`Levels for ${criterion.name}`}
            >
              {criterion.levels.map((level: EssayRubricLevel) => (
                <div key={level.id} className="flex items-start space-x-3 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={level.id} id={`${criterion.id}-${level.id}`} className="mt-1"/>
                  <Label htmlFor={`${criterion.id}-${level.id}`} className="flex-grow cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{level.name}</span>
                      <span className="text-sm font-semibold text-primary">{level.points} pts</span>
                    </div>
                    {level.description && <p className="text-xs text-muted-foreground mt-1">{level.description}</p>}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {!readOnly && (
              <div className="pt-2">
                <Label htmlFor={`feedback-${criterion.id}`} className="text-xs font-medium text-muted-foreground">Criterion Feedback (Optional)</Label>
                <Textarea
                   id={`feedback-${criterion.id}`}
                   className="mt-1"
                   placeholder={`Specific feedback for "${criterion.name}"...`}
                   value={currentSelections[criterion.id]?.feedback || ''}
                   onChange={(e) => handleFeedbackChange(criterion.id, e.target.value)}
                   rows={2}
                />
              </div>
            )}
            {readOnly && currentSelections[criterion.id]?.feedback && (
                <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground">Feedback:</p>
                    <p className="text-sm whitespace-pre-wrap p-2 border rounded-md bg-muted/50">{currentSelections[criterion.id]?.feedback}</p>
                </div>
            )}
          </CardContent>
        </Card>
      ))}
      <Separator />
      <div className="mt-4 p-4 border rounded-lg shadow-sm bg-background text-right">
         <p className="text-xl font-bold">
             Total Score: {calculatedTotalScore} / {rubricTotalPoints}
         </p>
      </div>
    </div>
  );
}
