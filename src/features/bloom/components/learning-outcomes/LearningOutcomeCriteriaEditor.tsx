'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash, Edit, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ThemeWrapper } from '@/features/activties/components/ui/ThemeWrapper';
import { useTheme } from '@/providers/theme-provider';
import {
  BloomsTaxonomyLevel,
  LearningOutcomeCriterion,
  LearningOutcomePerformanceLevel,
  DEFAULT_PERFORMANCE_LEVELS,
  DEFAULT_CRITERIA_TEMPLATES
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { BloomsTaxonomySelector } from '../taxonomy/BloomsTaxonomySelector';
import { generateDefaultCriteria, generateDefaultPerformanceLevels } from '../../utils/learning-outcome-helpers';

interface LearningOutcomeCriteriaEditorProps {
  bloomsLevel: BloomsTaxonomyLevel;
  hasCriteria: boolean;
  criteria: LearningOutcomeCriterion[];
  performanceLevels: LearningOutcomePerformanceLevel[];
  onHasCriteriaChange: (hasCriteria: boolean) => void;
  onCriteriaChange: (criteria: LearningOutcomeCriterion[]) => void;
  onPerformanceLevelsChange: (performanceLevels: LearningOutcomePerformanceLevel[]) => void;
}

export function LearningOutcomeCriteriaEditor({
  bloomsLevel,
  hasCriteria,
  criteria,
  performanceLevels,
  onHasCriteriaChange,
  onCriteriaChange,
  onPerformanceLevelsChange,
}: LearningOutcomeCriteriaEditorProps) {
  const [activeTab, setActiveTab] = useState('criteria');
  const { theme } = useTheme();

  // Generate default criteria when bloomsLevel changes or when hasCriteria is enabled
  useEffect(() => {
    if (hasCriteria && (!criteria || criteria.length === 0)) {
      const defaultCriteria = generateDefaultCriteria(bloomsLevel, '');
      onCriteriaChange(defaultCriteria);
    }

    if (hasCriteria && (!performanceLevels || performanceLevels.length === 0)) {
      const defaultPerformanceLevels = generateDefaultPerformanceLevels();
      onPerformanceLevelsChange(defaultPerformanceLevels);
    }
  }, [bloomsLevel, hasCriteria, criteria, performanceLevels, onCriteriaChange, onPerformanceLevelsChange]);

  // Add a new criterion
  const handleAddCriterion = () => {
    const newCriterion: LearningOutcomeCriterion = {
      id: uuidv4(),
      name: `New Criterion`,
      description: `Description for the new criterion`,
      bloomsLevel,
      weight: 1,
      performanceLevels: performanceLevels.map(level => ({ ...level })),
    };

    onCriteriaChange([...criteria, newCriterion]);
  };

  // Update a criterion
  const handleUpdateCriterion = (index: number, updates: Partial<LearningOutcomeCriterion>) => {
    const updatedCriteria = [...criteria];
    updatedCriteria[index] = { ...updatedCriteria[index], ...updates };
    onCriteriaChange(updatedCriteria);
  };

  // Delete a criterion
  const handleDeleteCriterion = (index: number) => {
    const updatedCriteria = [...criteria];
    updatedCriteria.splice(index, 1);
    onCriteriaChange(updatedCriteria);
  };

  // Add a new performance level
  const handleAddPerformanceLevel = () => {
    const newLevel: LearningOutcomePerformanceLevel = {
      id: uuidv4(),
      name: 'New Level',
      description: 'Description for the new level',
      scorePercentage: 50,
      color: '#6b7280', // Gray
    };

    onPerformanceLevelsChange([...performanceLevels, newLevel]);
  };

  // Update a performance level
  const handleUpdatePerformanceLevel = (index: number, updates: Partial<LearningOutcomePerformanceLevel>) => {
    const updatedLevels = [...performanceLevels];
    updatedLevels[index] = { ...updatedLevels[index], ...updates };
    onPerformanceLevelsChange(updatedLevels);
  };

  // Delete a performance level
  const handleDeletePerformanceLevel = (index: number) => {
    const updatedLevels = [...performanceLevels];
    updatedLevels.splice(index, 1);
    onPerformanceLevelsChange(updatedLevels);
  };

  // Move a criterion up or down
  const handleMoveCriterion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === criteria.length - 1)
    ) {
      return;
    }

    const updatedCriteria = [...criteria];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    [updatedCriteria[index], updatedCriteria[newIndex]] =
      [updatedCriteria[newIndex], updatedCriteria[index]];

    onCriteriaChange(updatedCriteria);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="hasCriteria"
          checked={hasCriteria}
          onCheckedChange={onHasCriteriaChange}
        />
        <Label htmlFor="hasCriteria">Enable Rubric Criteria for this Learning Outcome</Label>
      </div>

      {hasCriteria && (
        <ThemeWrapper data-theme={theme}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="criteria">Criteria</TabsTrigger>
              <TabsTrigger value="performance-levels">Performance Levels</TabsTrigger>
            </TabsList>

          <TabsContent value="criteria" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Criteria</h3>
              <Button onClick={handleAddCriterion} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Criterion
              </Button>
            </div>

            {criteria.length === 0 ? (
              <div className="text-center p-4 border rounded-md bg-muted/20">
                No criteria defined. Click "Add Criterion" to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {criteria.map((criterion, index) => (
                  <Card key={criterion.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/20 p-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">{criterion.name}</CardTitle>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveCriterion(index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveCriterion(index, 'down')}
                            disabled={index === criteria.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCriterion(index)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <Label htmlFor={`criterion-name-${index}`}>Name</Label>
                        <Input
                          id={`criterion-name-${index}`}
                          value={criterion.name}
                          onChange={(e) => handleUpdateCriterion(index, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`criterion-description-${index}`}>Description</Label>
                        <Textarea
                          id={`criterion-description-${index}`}
                          value={criterion.description}
                          onChange={(e) => handleUpdateCriterion(index, { description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Bloom's Level</Label>
                        <BloomsTaxonomySelector
                          value={criterion.bloomsLevel}
                          onChange={(level) => handleUpdateCriterion(index, { bloomsLevel: level })}
                          variant="buttons"
                          showDescription={false}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`criterion-weight-${index}`}>Weight: {criterion.weight}</Label>
                        <Slider
                          id={`criterion-weight-${index}`}
                          value={[criterion.weight]}
                          min={1}
                          max={5}
                          step={1}
                          onValueChange={(value) => handleUpdateCriterion(index, { weight: value[0] })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance-levels" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Performance Levels</h3>
              <Button onClick={handleAddPerformanceLevel} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Level
              </Button>
            </div>

            {performanceLevels.length === 0 ? (
              <div className="text-center p-4 border rounded-md bg-muted/20">
                No performance levels defined. Click "Add Level" to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {performanceLevels.map((level, index) => (
                  <Card key={level.id} className="overflow-hidden">
                    <CardHeader
                      className="p-3"
                      style={{ backgroundColor: `${level.color}20` }}
                    >
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">{level.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePerformanceLevel(index)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <Label htmlFor={`level-name-${index}`}>Name</Label>
                        <Input
                          id={`level-name-${index}`}
                          value={level.name}
                          onChange={(e) => handleUpdatePerformanceLevel(index, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`level-description-${index}`}>Description</Label>
                        <Textarea
                          id={`level-description-${index}`}
                          value={level.description}
                          onChange={(e) => handleUpdatePerformanceLevel(index, { description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`level-score-${index}`}>Score Percentage: {level.scorePercentage}%</Label>
                        <Slider
                          id={`level-score-${index}`}
                          value={[level.scorePercentage]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(value) => handleUpdatePerformanceLevel(index, { scorePercentage: value[0] })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`level-color-${index}`}>Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id={`level-color-${index}`}
                            type="color"
                            value={level.color}
                            onChange={(e) => handleUpdatePerformanceLevel(index, { color: e.target.value })}
                            className="w-16 h-8 p-1"
                          />
                          <div
                            className="w-8 h-8 rounded-md border"
                            style={{ backgroundColor: level.color }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </ThemeWrapper>
      )}
    </div>
  );
}
