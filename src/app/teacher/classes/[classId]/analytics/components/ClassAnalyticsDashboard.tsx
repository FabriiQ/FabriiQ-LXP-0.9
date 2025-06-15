'use client';

import React from 'react';
import { api } from '@/trpc/react';
// useParams can be used if classId is not passed as a prop directly from a server component
// import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Assumed structure for Topic Mastery data from mastery.getClassAnalytics
// This will need to be confirmed or adjusted based on the actual API response.
export interface TopicMasteryData {
  topicId: string;
  topicName: string;
  averageMasteryScore?: number | null; // e.g., 0-100, allow null for no data
  masteryDistribution?: Array<{
    level: string; // e.g., "Beginning", "Developing", "Proficient"
    count: number; // Number of students at this level
    percentage: number; // Percentage of students at this level
  }> | null;
  // Add other relevant fields that the API might return
  // For example, number of students assessed on this topic
  studentsAssessedCount?: number;
}

// This interface might represent the direct response of getClassAnalytics if it's not nested
// Or it could be a part of a larger analytics object.
// For this example, we'll assume getClassAnalytics returns an object that *contains* topicMastery,
// or is directly the topicMastery array.
export interface ClassAnalyticsApiResponse {
  // Example structure:
  // overallPerformance?: { averageGrade?: number; /* ... */ };
  topicMastery?: TopicMasteryData[]; // Assuming it's nested like this
  // If getClassAnalytics returns TopicMasteryData[] directly, this interface is not strictly needed here.
}

interface ClassAnalyticsDashboardProps {
  classId: string;
}

export function ClassAnalyticsDashboard({ classId }: ClassAnalyticsDashboardProps) {
  const {
    data: apiResponse, // Assuming the raw response might be nested
    isLoading: isLoadingMastery,
    error: masteryError,
    isError: isMasteryError // Use isError for boolean check
  } = api.mastery.getClassAnalytics.useQuery(
    { classId },
    {
      enabled: !!classId,
      refetchOnWindowFocus: true, // Good default with service worker
      // staleTime: 5 * 60 * 1000, // e.g., 5 minutes, if data isn't extremely volatile
    }
  );

  // Extract topicMastery data. Adjust this based on the actual API response structure.
  // Option 1: API returns { topicMastery: TopicMasteryData[] }
  const topicMasteryData: TopicMasteryData[] | undefined | null = apiResponse?.topicMastery;
  // Option 2: API returns TopicMasteryData[] directly
  // const topicMasteryData: TopicMasteryData[] | undefined = apiResponse;

  if (isLoadingMastery) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        {/* Add skeletons for other sections if any */}
      </div>
    );
  }

  if (isMasteryError && masteryError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Topic Mastery Data</AlertTitle>
        <AlertDescription>{masteryError.message || "An unexpected error occurred."}</AlertDescription>
      </Alert>
    );
  }

  if (!topicMasteryData || topicMasteryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Topic Mastery for Class</CardTitle>
          <CardDescription>Overview of class performance across different topics.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No topic mastery data available for this class yet, or the data is empty.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Placeholder for other analytics sections */}
      {/*
      <Card>
        <CardHeader><CardTitle>Overall Class Performance</CardTitle></CardHeader>
        <CardContent>
          <p>Average Grade: {apiResponse?.overallPerformance?.averageGrade || 'N/A'}%</p>
        </CardContent>
      </Card>
      */}

      <Card>
        <CardHeader>
          <CardTitle>Topic Mastery</CardTitle>
          <CardDescription>Overview of student mastery across different topics for class {classId}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Topic</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Students Assessed</TableHead>
                <TableHead className="text-center">Average Mastery</TableHead>
                {/* Example for distribution - choose one presentation style or make it configurable */}
                <TableHead className="text-center hidden md:table-cell">Proficient Students (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topicMasteryData.map((topic) => (
                <TableRow key={topic.topicId}>
                  <TableCell className="font-medium">{topic.topicName || 'Unnamed Topic'}</TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    {topic.studentsAssessedCount !== undefined ? topic.studentsAssessedCount : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    {topic.averageMasteryScore !== undefined && topic.averageMasteryScore !== null
                      ? `${topic.averageMasteryScore.toFixed(1)}%`
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center hidden md:table-cell">
                    {topic.masteryDistribution?.find(d => d.level.toLowerCase() === 'proficient')?.percentage?.toFixed(0) ?? 'N/A'}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
