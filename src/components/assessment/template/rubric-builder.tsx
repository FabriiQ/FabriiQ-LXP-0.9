'use client';

import React, { useState } from 'react';
import { Button } from '~/components/ui/atoms/button';
import { Card } from '~/components/ui/atoms/card';
import { Input } from '~/components/ui/forms/input';
import { Textarea } from '~/components/ui/forms/textarea';
import { Plus, Trash, PlusCircle, MinusCircle } from 'lucide-react';

export interface RubricLevel {
  description: string;
  score: number;
}

export interface RubricCriteria {
  criteria: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricBuilderProps {
  value: RubricCriteria[];
  onChange: (value: RubricCriteria[]) => void;
  maxScore?: number;
}

export function RubricBuilder({ value = [], onChange, maxScore = 100 }: RubricBuilderProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<number | null>(null);

  const handleAddCriteria = () => {
    const newCriteria: RubricCriteria = {
      criteria: '',
      weight: 0,
      levels: [
        { description: 'Excellent', score: maxScore },
        { description: 'Good', score: Math.floor(maxScore * 0.8) },
        { description: 'Satisfactory', score: Math.floor(maxScore * 0.6) },
        { description: 'Needs Improvement', score: Math.floor(maxScore * 0.4) },
      ],
    };
    onChange([...value, newCriteria]);
    setExpandedCriteria(value.length);
  };

  const handleRemoveCriteria = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
    if (expandedCriteria === index) {
      setExpandedCriteria(null);
    } else if (expandedCriteria !== null && expandedCriteria > index) {
      setExpandedCriteria(expandedCriteria - 1);
    }
  };

  const handleUpdateCriteria = (index: number, field: keyof RubricCriteria, newValue: any) => {
    const newCriterias = [...value];
    newCriterias[index] = {
      ...newCriterias[index],
      [field]: newValue,
    };
    onChange(newCriterias);
  };

  const handleAddLevel = (criteriaIndex: number) => {
    const newCriterias = [...value];
    const levels = [...newCriterias[criteriaIndex].levels];
    const lastScore = levels.length > 0 ? levels[levels.length - 1].score / 2 : maxScore / 2;
    
    levels.push({
      description: '',
      score: lastScore,
    });
    
    newCriterias[criteriaIndex] = {
      ...newCriterias[criteriaIndex],
      levels,
    };
    
    onChange(newCriterias);
  };

  const handleRemoveLevel = (criteriaIndex: number, levelIndex: number) => {
    const newCriterias = [...value];
    const levels = [...newCriterias[criteriaIndex].levels];
    levels.splice(levelIndex, 1);
    
    newCriterias[criteriaIndex] = {
      ...newCriterias[criteriaIndex],
      levels,
    };
    
    onChange(newCriterias);
  };

  const handleUpdateLevel = (
    criteriaIndex: number,
    levelIndex: number,
    field: keyof RubricLevel,
    newValue: any
  ) => {
    const newCriterias = [...value];
    const levels = [...newCriterias[criteriaIndex].levels];
    
    levels[levelIndex] = {
      ...levels[levelIndex],
      [field]: newValue,
    };
    
    newCriterias[criteriaIndex] = {
      ...newCriterias[criteriaIndex],
      levels,
    };
    
    onChange(newCriterias);
  };

  return (
    <div className="space-y-4">
      {value.map((criteria, criteriaIndex) => (
        <Card key={criteriaIndex} className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Criteria name"
                  value={criteria.criteria}
                  onChange={(e) => handleUpdateCriteria(criteriaIndex, 'criteria', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Weight (%)"
                  value={criteria.weight}
                  onChange={(e) => handleUpdateCriteria(criteriaIndex, 'weight', parseFloat(e.target.value))}
                  className="w-24"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCriteria(criteriaIndex)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => setExpandedCriteria(expandedCriteria === criteriaIndex ? null : criteriaIndex)}
            >
              {expandedCriteria === criteriaIndex ? 'Collapse' : 'Expand'}
            </Button>
          </div>

          {expandedCriteria === criteriaIndex && (
            <div className="space-y-4">
              <div className="text-sm font-medium">Levels</div>
              {criteria.levels.map((level, levelIndex) => (
                <div key={levelIndex} className="flex items-start gap-2">
                  <Input
                    type="number"
                    placeholder="Score"
                    value={level.score}
                    onChange={(e) => handleUpdateLevel(criteriaIndex, levelIndex, 'score', parseFloat(e.target.value))}
                    className="w-24"
                  />
                  <Textarea
                    placeholder="Level description"
                    value={level.description}
                    onChange={(e) => handleUpdateLevel(criteriaIndex, levelIndex, 'description', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLevel(criteriaIndex, levelIndex)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddLevel(criteriaIndex)}
                className="mt-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Level
              </Button>
            </div>
          )}
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={handleAddCriteria}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Criteria
      </Button>
    </div>
  );
} 