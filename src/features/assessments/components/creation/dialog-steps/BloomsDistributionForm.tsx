'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Award,
  AlertCircle,
  RefreshCw,
  Info,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

interface LearningOutcome {
  id: string;
  statement: string;
  bloomsLevel: BloomsTaxonomyLevel;
}

interface BloomsDistributionFormProps {
  distribution: Record<string, number>;
  onChange: (distribution: Record<string, number>) => void;
  learningOutcomes: LearningOutcome[];
  selectedOutcomes: string[];
}

const BLOOMS_LEVELS = [
  {
    level: BloomsTaxonomyLevel.REMEMBER,
    label: 'Remember',
    description: 'Recall facts and basic concepts',
    color: 'bg-red-100 text-red-800 border-red-200',
    examples: ['Define', 'List', 'Identify', 'Name']
  },
  {
    level: BloomsTaxonomyLevel.UNDERSTAND,
    label: 'Understand',
    description: 'Explain ideas or concepts',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    examples: ['Explain', 'Describe', 'Summarize', 'Interpret']
  },
  {
    level: BloomsTaxonomyLevel.APPLY,
    label: 'Apply',
    description: 'Use information in new situations',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    examples: ['Apply', 'Demonstrate', 'Solve', 'Use']
  },
  {
    level: BloomsTaxonomyLevel.ANALYZE,
    label: 'Analyze',
    description: 'Draw connections among ideas',
    color: 'bg-green-100 text-green-800 border-green-200',
    examples: ['Analyze', 'Compare', 'Contrast', 'Examine']
  },
  {
    level: BloomsTaxonomyLevel.EVALUATE,
    label: 'Evaluate',
    description: 'Justify a stand or decision',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    examples: ['Evaluate', 'Critique', 'Judge', 'Defend']
  },
  {
    level: BloomsTaxonomyLevel.CREATE,
    label: 'Create',
    description: 'Produce new or original work',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    examples: ['Create', 'Design', 'Compose', 'Develop']
  }
];

export function BloomsDistributionForm({
  distribution,
  onChange,
  learningOutcomes,
  selectedOutcomes
}: BloomsDistributionFormProps) {
  const [localDistribution, setLocalDistribution] = useState<Record<string, number>>(distribution);

  // Get selected learning outcomes
  const selectedLearningOutcomes = learningOutcomes.filter(
    outcome => selectedOutcomes.includes(outcome.id)
  );

  // Calculate suggested distribution based on learning outcomes
  const calculateSuggestedDistribution = () => {
    if (selectedLearningOutcomes.length === 0) {
      return {};
    }

    const levelCounts: Record<string, number> = {};
    selectedLearningOutcomes.forEach(outcome => {
      levelCounts[outcome.bloomsLevel] = (levelCounts[outcome.bloomsLevel] || 0) + 1;
    });

    const total = selectedLearningOutcomes.length;
    const suggested: Record<string, number> = {};

    Object.entries(levelCounts).forEach(([level, count]) => {
      suggested[level] = Math.round((count / total) * 100);
    });

    return suggested;
  };

  const suggestedDistribution = calculateSuggestedDistribution();

  // Calculate total percentage
  const totalPercentage = Object.values(localDistribution).reduce((sum, value) => sum + value, 0);

  // Update distribution when slider changes
  const handleSliderChange = (level: string, value: number[]) => {
    const newDistribution = {
      ...localDistribution,
      [level]: value[0]
    };
    setLocalDistribution(newDistribution);
    onChange(newDistribution);
  };

  // Apply suggested distribution
  const applySuggestedDistribution = () => {
    setLocalDistribution(suggestedDistribution);
    onChange(suggestedDistribution);
  };

  // Reset distribution
  const resetDistribution = () => {
    const emptyDistribution: Record<string, number> = {};
    setLocalDistribution(emptyDistribution);
    onChange(emptyDistribution);
  };

  // Auto-balance distribution
  const autoBalance = () => {
    const activeLevels = BLOOMS_LEVELS.filter(level =>
      (localDistribution[level.level] || 0) > 0
    );

    if (activeLevels.length === 0) return;

    const balancedValue = Math.floor(100 / activeLevels.length);
    const remainder = 100 % activeLevels.length;

    const balanced: Record<string, number> = {};
    activeLevels.forEach((level, index) => {
      balanced[level.level] = balancedValue + (index < remainder ? 1 : 0);
    });

    setLocalDistribution(balanced);
    onChange(balanced);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Bloom's Taxonomy Distribution</h3>
        <p className="text-muted-foreground">
          Set the cognitive level distribution for this assessment. This is optional but helps ensure balanced learning.
        </p>
      </div>

      {/* Learning Outcomes Summary */}
      {selectedLearningOutcomes.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Selected Learning Outcomes Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {BLOOMS_LEVELS.map(level => {
                const count = selectedLearningOutcomes.filter(
                  outcome => outcome.bloomsLevel === level.level
                ).length;

                if (count === 0) return null;

                return (
                  <Badge
                    key={level.level}
                    variant="outline"
                    className={cn("text-xs justify-center", level.color)}
                  >
                    {level.label}: {count}
                  </Badge>
                );
              })}
            </div>

            {Object.keys(suggestedDistribution).length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applySuggestedDistribution}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Use Suggested Distribution
                </Button>
                <span className="text-xs text-muted-foreground">
                  Based on your learning outcomes
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Distribution Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Cognitive Level Distribution</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={autoBalance}
            disabled={Object.values(localDistribution).every(v => v === 0)}
          >
            Auto Balance
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetDistribution}
            disabled={Object.values(localDistribution).every(v => v === 0)}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Total Percentage Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Total Distribution:</span>
          <span className={cn(
            "font-medium",
            totalPercentage === 100 ? "text-green-600" :
            totalPercentage > 100 ? "text-red-600" : "text-orange-600"
          )}>
            {totalPercentage}%
          </span>
        </div>
        <Progress
          value={Math.min(totalPercentage, 100)}
          className={cn(
            "h-2",
            totalPercentage > 100 && "bg-red-100"
          )}
        />
        {totalPercentage !== 100 && totalPercentage > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>
              {totalPercentage > 100
                ? "Total exceeds 100%. Please adjust the values."
                : "Total should equal 100% for balanced distribution."
              }
            </span>
          </div>
        )}
      </div>

      {/* Bloom's Level Sliders */}
      <div className="space-y-4">
        {BLOOMS_LEVELS.map((level) => {
          const value = localDistribution[level.level] || 0;
          const suggestedValue = suggestedDistribution[level.level] || 0;

          return (
            <Card key={level.level} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", level.color)}
                    >
                      {level.label}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{level.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {level.examples.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">{value}%</span>
                    {suggestedValue > 0 && suggestedValue !== value && (
                      <p className="text-xs text-muted-foreground">
                        Suggested: {suggestedValue}%
                      </p>
                    )}
                  </div>
                </div>

                <Slider
                  value={[value]}
                  onValueChange={(newValue) => handleSliderChange(level.level, newValue)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {totalPercentage === 100 && (
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Check className="h-4 w-4" />
            <span className="font-medium">
              Bloom's distribution configured (100%)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This distribution will help ensure your assessment covers appropriate cognitive levels.
          </p>
        </div>
      )}

      {totalPercentage === 0 && (
        <div className="mt-6 p-4 bg-muted/50 border border-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span className="font-medium">
              No distribution set (optional)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            You can skip this step and set the distribution later, or use the suggested distribution based on your learning outcomes.
          </p>
        </div>
      )}
    </div>
  );
}
