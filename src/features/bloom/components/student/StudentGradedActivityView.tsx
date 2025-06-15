'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { BloomsRadarChart } from '@/features/bloom/components/visualization/BloomsRadarChart';
import { api } from '@/trpc/react';

interface StudentGradedActivityViewProps {
  activityGradeId: string;
}

/**
 * StudentGradedActivityView
 * 
 * A component for students to view their graded activities with Bloom's Taxonomy information
 */
export function StudentGradedActivityView({ activityGradeId }: StudentGradedActivityViewProps) {
  // Fetch activity grade data
  const { data: activityGrade, isLoading } = api.activityGrade.getById.useQuery({ id: activityGradeId });
  
  // Extract Bloom's data from the grade
  const bloomsLevelScores = activityGrade?.attachments?.gradingDetails?.bloomsLevelScores as Record<BloomsTaxonomyLevel, number> | undefined;
  const bloomsLevel = activityGrade?.activity?.bloomsLevel as BloomsTaxonomyLevel | undefined;
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="h-24 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="h-48 bg-gray-200 animate-pulse rounded-md"></div>
      </div>
    );
  }
  
  if (!activityGrade) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <h2 className="text-red-600 font-medium">Activity grade not found</h2>
        <p className="text-red-500 text-sm mt-1">The requested activity grade could not be found.</p>
      </div>
    );
  }
  
  // Calculate percentage score
  const maxScore = activityGrade.activity?.maxScore || 100;
  const score = activityGrade.score || 0;
  const percentage = Math.round((score / maxScore) * 100);
  
  return (
    <div className="space-y-6">
      {/* Basic grade information */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{activityGrade.activity?.title}</CardTitle>
            <Badge variant={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'destructive'}>
              {percentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Score</span>
              <span className="font-medium">{score} / {maxScore}</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
          
          {activityGrade.feedback && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Feedback</h3>
              <p className="mt-1">{activityGrade.feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Bloom's Taxonomy section */}
      {(bloomsLevel || bloomsLevelScores) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cognitive Skills Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Single Bloom's level */}
            {bloomsLevel && !bloomsLevelScores && (
              <div className="mt-2">
                <div className="flex items-center">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: BLOOMS_LEVEL_METADATA[bloomsLevel].color }}
                  />
                  <span className="ml-2 font-medium">
                    {BLOOMS_LEVEL_METADATA[bloomsLevel].name}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {BLOOMS_LEVEL_METADATA[bloomsLevel].description}
                </p>
              </div>
            )}
            
            {/* Multiple Bloom's levels */}
            {bloomsLevelScores && (
              <div className="mt-2">
                <div className="flex justify-center mb-6">
                  <BloomsRadarChart 
                    data={bloomsLevelScores} 
                    size={250} 
                    showLabels={true}
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  {Object.entries(bloomsLevelScores).map(([level, score]) => {
                    const bloomsLevel = level as BloomsTaxonomyLevel;
                    return (
                      <div key={level} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="h-3 w-3 rounded-full mr-2"
                            style={{ backgroundColor: BLOOMS_LEVEL_METADATA[bloomsLevel].color }}
                          />
                          <span className="text-sm font-medium">
                            {BLOOMS_LEVEL_METADATA[bloomsLevel].name}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{Math.round(score)}%</span>
                          <Progress value={score} className="w-24 h-2 ml-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
