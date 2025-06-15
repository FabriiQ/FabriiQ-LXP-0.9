'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { Badge } from '@/components/ui/atoms/badge';
import { Check, Info } from 'lucide-react';
import { AlertTriangle } from '@/components/ui/icons/alert-triangle';
import {
  BloomsTaxonomyLevel,
  BloomsDistribution,
  BLOOMS_LEVEL_METADATA,
  ORDERED_BLOOMS_LEVELS,
  DEFAULT_BLOOMS_DISTRIBUTION
} from '@/features/bloom';
import { cn } from '@/lib/utils';

interface CognitiveBalanceAnalysisProps {
  bloomsDistribution: BloomsDistribution;
  totalQuestions: number;
  className?: string;
}

/**
 * Component for analyzing the cognitive balance of an assessment
 * based on Bloom's Taxonomy distribution
 */
export function CognitiveBalanceAnalysis({
  bloomsDistribution,
  totalQuestions,
  className = '',
}: CognitiveBalanceAnalysisProps) {
  // Calculate the balance status
  const getBalanceStatus = (): 'balanced' | 'partially-balanced' | 'unbalanced' => {
    // If no distribution data, return unbalanced
    if (!bloomsDistribution || Object.keys(bloomsDistribution).length === 0) {
      return 'unbalanced';
    }

    // Count how many levels are represented
    const levelsRepresented = Object.values(BloomsTaxonomyLevel).filter(
      level => bloomsDistribution[level] && bloomsDistribution[level] > 0
    ).length;

    // Check if lower and higher order thinking skills are represented
    const hasLowerOrderSkills = [
      BloomsTaxonomyLevel.REMEMBER,
      BloomsTaxonomyLevel.UNDERSTAND,
      BloomsTaxonomyLevel.APPLY
    ].some(level => bloomsDistribution[level] && bloomsDistribution[level] > 0);

    const hasHigherOrderSkills = [
      BloomsTaxonomyLevel.ANALYZE,
      BloomsTaxonomyLevel.EVALUATE,
      BloomsTaxonomyLevel.CREATE
    ].some(level => bloomsDistribution[level] && bloomsDistribution[level] > 0);

    // Determine balance status
    if (levelsRepresented >= 4 && hasLowerOrderSkills && hasHigherOrderSkills) {
      return 'balanced';
    } else if (levelsRepresented >= 2 && (hasLowerOrderSkills || hasHigherOrderSkills)) {
      return 'partially-balanced';
    } else {
      return 'unbalanced';
    }
  };

  // Generate recommendations based on the current distribution
  const getRecommendations = (): string[] => {
    const recommendations: string[] = [];
    const balanceStatus = getBalanceStatus();

    // Check for missing levels
    const missingLevels = Object.values(BloomsTaxonomyLevel).filter(
      level => !bloomsDistribution[level] || bloomsDistribution[level] === 0
    );

    // Check for overrepresented levels (more than 40%)
    const overrepresentedLevels = Object.entries(bloomsDistribution)
      .filter(([_, percentage]) => percentage > 40)
      .map(([level]) => level as BloomsTaxonomyLevel);

    // Add recommendations based on balance status
    if (balanceStatus === 'unbalanced') {
      recommendations.push('This assessment lacks cognitive balance. Consider including questions from more Bloom\'s Taxonomy levels.');
    } else if (balanceStatus === 'partially-balanced') {
      recommendations.push('This assessment has partial cognitive balance. Consider adding more variety in question types.');
    }

    // Add recommendations for missing levels
    if (missingLevels.length > 0) {
      const missingLevelNames = missingLevels
        .map(level => BLOOMS_LEVEL_METADATA[level].name)
        .join(', ');
      recommendations.push(`Consider adding questions for these missing cognitive levels: ${missingLevelNames}.`);
    }

    // Add recommendations for overrepresented levels
    if (overrepresentedLevels.length > 0) {
      const overrepresentedLevelNames = overrepresentedLevels
        .map(level => BLOOMS_LEVEL_METADATA[level].name)
        .join(', ');
      recommendations.push(`The ${overrepresentedLevelNames} ${overrepresentedLevels.length === 1 ? 'level is' : 'levels are'} overrepresented. Consider reducing the number of questions at ${overrepresentedLevels.length === 1 ? 'this level' : 'these levels'}.`);
    }

    // Add recommendation for total questions if too few
    if (totalQuestions < 5) {
      recommendations.push('Consider adding more questions to better assess across cognitive levels.');
    }

    return recommendations;
  };

  const balanceStatus = getBalanceStatus();
  const recommendations = getRecommendations();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Cognitive Balance Analysis</CardTitle>
        <CardDescription>
          Analysis of the assessment's cognitive complexity based on Bloom's Taxonomy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Status */}
        <div className="flex items-center space-x-2">
          <span className="font-medium">Balance Status:</span>
          {balanceStatus === 'balanced' && (
            <Badge variant="success" className="flex items-center space-x-1">
              <Check className="h-3 w-3" />
              <span>Balanced</span>
            </Badge>
          )}
          {balanceStatus === 'partially-balanced' && (
            <Badge variant="warning" className="flex items-center space-x-1">
              <Info className="h-3 w-3" />
              <span>Partially Balanced</span>
            </Badge>
          )}
          {balanceStatus === 'unbalanced' && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Unbalanced</span>
            </Badge>
          )}
        </div>

        {/* Distribution Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Cognitive Level Distribution</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ORDERED_BLOOMS_LEVELS.map(level => {
              const percentage = bloomsDistribution[level] || 0;
              const metadata = BLOOMS_LEVEL_METADATA[level];

              return (
                <div
                  key={level}
                  className="flex items-center justify-between p-2 rounded-md"
                  style={{ backgroundColor: `${metadata.color}20` }}
                >
                  <span className="text-sm font-medium" style={{ color: metadata.color }}>
                    {metadata.name}
                  </span>
                  <span className="text-sm font-bold">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Alert variant="info" className="mt-4">
            <AlertTitle>Recommendations</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                {recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm">{recommendation}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
