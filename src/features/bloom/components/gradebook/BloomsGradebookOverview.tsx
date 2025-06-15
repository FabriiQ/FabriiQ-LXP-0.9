'use client';

/**
 * Bloom's Taxonomy Gradebook Overview Component
 * 
 * This component displays an overview of Bloom's Taxonomy distribution
 * for a class gradebook, showing cognitive level distribution across
 * all students and activities.
 */

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Alert, AlertDescription } from '@/components/ui/feedback/alert';
import { BloomsDistributionChart } from '@/features/bloom/components/visualization/BloomsDistributionChart';
import { CognitiveBalanceAnalysis } from '@/features/bloom/components/analytics/CognitiveBalanceAnalysis';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { DEFAULT_BLOOMS_DISTRIBUTION } from '@/features/bloom/constants/bloom-levels';

// Define the props for the component
interface BloomsGradebookOverviewProps {
  classId: string;
  termId: string;
}

/**
 * Calculate class distribution from gradebook data
 */
function calculateClassDistribution(gradebook: any) {
  if (!gradebook || !gradebook.studentGrades) {
    return DEFAULT_BLOOMS_DISTRIBUTION;
  }

  // Initialize distribution
  const distribution: Record<BloomsTaxonomyLevel, number> = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0
  };

  let totalStudents = 0;

  // Aggregate Bloom's level scores from all student grades
  gradebook.studentGrades.forEach((studentGrade: any) => {
    // Skip if no activity grades
    if (!studentGrade.activityGrades) return;

    totalStudents++;

    // Process activity grades
    Object.values(studentGrade.activityGrades).forEach((activityGrade: any) => {
      if (activityGrade.bloomsLevelScores) {
        Object.entries(activityGrade.bloomsLevelScores).forEach(([level, score]) => {
          distribution[level as BloomsTaxonomyLevel] += Number(score);
        });
      }
    });
  });

  // Calculate average if there are students
  if (totalStudents > 0) {
    Object.keys(distribution).forEach(level => {
      distribution[level as BloomsTaxonomyLevel] /= totalStudents;
    });
  } else {
    // Return default distribution if no students
    return DEFAULT_BLOOMS_DISTRIBUTION;
  }

  return distribution;
}

/**
 * BloomsGradebookOverview Component
 */
export function BloomsGradebookOverview({
  classId,
  termId
}: BloomsGradebookOverviewProps) {
  const [activeTab, setActiveTab] = useState<string>('distribution');

  // Fetch gradebook data
  const { data: gradebook, isLoading, error } = api.gradebook.getByClassAndTerm.useQuery({
    classId,
    termId
  });

  // Fetch target distribution from class settings
  const { data: classSettings } = api.class.getSettings.useQuery({
    classId
  });

  // Calculate the actual distribution
  const actualDistribution = calculateClassDistribution(gradebook);

  // Get target distribution from class settings or use default
  const targetDistribution = classSettings?.bloomsDistribution || DEFAULT_BLOOMS_DISTRIBUTION;

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-64" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading gradebook data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cognitive Level Distribution</CardTitle>
        <CardDescription>
          Analysis of Bloom's Taxonomy levels across all graded activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="analysis">Balance Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution">
            <BloomsDistributionChart
              distribution={actualDistribution}
              showLegend={true}
            />
          </TabsContent>

          <TabsContent value="analysis">
            <CognitiveBalanceAnalysis
              actual={actualDistribution}
              target={targetDistribution}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
