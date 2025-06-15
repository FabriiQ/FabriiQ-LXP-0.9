'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BloomsTaxonomyLevel, MasteryLevel, TopicMasteryData } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { MASTERY_LEVEL_COLORS } from '../../constants/mastery-thresholds';
import { getMasteryLevel } from '../../utils/mastery-helpers';
import { CognitiveLevelBadge } from '../achievements/CognitiveLevelBadge';
import { ArrowRight } from 'lucide-react';
import { Trophy, Star, Award, Zap } from '@/components/ui/icons/custom-icons';
import { cn } from '@/lib/utils';

interface MasteryProgressionGameProps {
  masteryData: TopicMasteryData;
  topicName: string;
  onComplete?: () => void;
  className?: string;
}

/**
 * Component for displaying mastery progression with gamification elements
 */
export function MasteryProgressionGame({
  masteryData,
  topicName,
  onComplete,
  className = '',
}: MasteryProgressionGameProps) {
  // State for active level and animation
  const [activeLevel, setActiveLevel] = useState<BloomsTaxonomyLevel | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<BloomsTaxonomyLevel[]>([]);

  // Get mastery levels for each cognitive level
  const masteryLevels = Object.values(BloomsTaxonomyLevel).reduce((acc, level) => {
    acc[level] = getMasteryLevel(masteryData[level]);
    return acc;
  }, {} as Record<BloomsTaxonomyLevel, MasteryLevel>);

  // Check if all levels are at least proficient
  const allLevelsProficient = Object.values(masteryLevels).every(
    level => level >= MasteryLevel.PROFICIENT
  );

  // Handle level click
  const handleLevelClick = (level: BloomsTaxonomyLevel) => {
    setActiveLevel(level);

    // If not already completed, mark as completed
    if (!completedLevels.includes(level)) {
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
        setCompletedLevels([...completedLevels, level]);
      }, 2000);
    }
  };

  // Handle completion
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  // Get next level to focus on
  const getNextFocusLevel = (): BloomsTaxonomyLevel | null => {
    // Find the lowest mastery level
    let lowestLevel: BloomsTaxonomyLevel = BloomsTaxonomyLevel.REMEMBER;
    let lowestValue = 100;

    Object.values(BloomsTaxonomyLevel).forEach(level => {
      const value = masteryData[level];
      if (value < lowestValue) {
        lowestValue = value;
        lowestLevel = level;
      }
    });

    return lowestLevel;
  };

  const nextFocusLevel = getNextFocusLevel();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Mastery Journey: {topicName}</CardTitle>
        <CardDescription>
          Explore your mastery levels and unlock achievements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Cognitive Level Badges */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {Object.values(BloomsTaxonomyLevel).map(level => {
              const value = masteryData[level];
              const masteryLevel = masteryLevels[level];
              const isUnlocked = masteryLevel >= MasteryLevel.DEVELOPING;
              const isCompleted = completedLevels.includes(level);

              return (
                <div key={level} className="flex flex-col items-center">
                  <CognitiveLevelBadge
                    level={level}
                    value={value}
                    unlocked={isUnlocked}
                    onClick={() => isUnlocked && handleLevelClick(level)}
                    className={cn(
                      isCompleted && 'ring-2 ring-offset-2',
                      isCompleted && `ring-${MASTERY_LEVEL_COLORS[masteryLevel]}`
                    )}
                  />
                  {isCompleted && (
                    <div className="mt-1 text-xs text-green-600 font-medium">
                      Explored
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Level Details */}
          {activeLevel && (
            <Card className="mt-4 overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: BLOOMS_LEVEL_METADATA[activeLevel].color }}
              />
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <CognitiveLevelBadge
                    level={activeLevel}
                    value={masteryData[activeLevel]}
                    size="lg"
                    showLabel={false}
                  />

                  <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: BLOOMS_LEVEL_METADATA[activeLevel].color }}>
                      {BLOOMS_LEVEL_METADATA[activeLevel].name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {BLOOMS_LEVEL_METADATA[activeLevel].description}
                    </p>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-sm font-medium">Mastery Level:</div>
                      <div
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${MASTERY_LEVEL_COLORS[masteryLevels[activeLevel]]}20`,
                          color: MASTERY_LEVEL_COLORS[masteryLevels[activeLevel]]
                        }}
                      >
                        {masteryLevels[activeLevel]}
                      </div>
                    </div>

                    {/* Animation for level completion */}
                    {showAnimation && (
                      <div className="flex items-center gap-2 text-yellow-500 animate-pulse">
                        <Star className="h-5 w-5" />
                        <span className="font-medium">Level explored! +10 XP</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-lg font-medium mb-2">Next Steps</h3>

              {nextFocusLevel && (
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span>
                    Focus on improving your{' '}
                    <span style={{ color: BLOOMS_LEVEL_METADATA[nextFocusLevel].color }}>
                      {BLOOMS_LEVEL_METADATA[nextFocusLevel].name}
                    </span>{' '}
                    skills
                  </span>
                </div>
              )}

              {/* Completion Status */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span>
                    {completedLevels.length} of {Object.values(BloomsTaxonomyLevel).length} levels explored
                  </span>
                </div>

                {allLevelsProficient && (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleComplete}
                  >
                    <Award className="h-4 w-4" />
                    Claim Master Badge
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
