'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassPerformanceDashboard } from './ClassPerformanceDashboard';

interface CoordinatorClassPerformanceProps {
  programId?: string;
  courseId?: string;
}

export const CoordinatorClassPerformance: React.FC<CoordinatorClassPerformanceProps> = ({
  programId,
  courseId,
}) => {
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Fetch classes based on program or course ID
  const { data: classesData, isLoading: isLoadingClasses } = api.class.list.useQuery(
    {
      programCampusId: programId || undefined,
      courseCampusId: courseId || undefined,
      status: 'ACTIVE',
    },
    {
      enabled: !!(programId || courseId),
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load classes: ${error.message}`,
          variant: 'error',
        });
      },
    }
  );

  const classes = classesData?.items;

  // Set the first class as selected when data is loaded
  React.useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Class Performance</h1>

        {isLoadingClasses ? (
          <Skeleton className="h-10 w-64" />
        ) : (
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes && classes.length > 0 ? (
                classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-classes" disabled>
                  No classes available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedClassId && !isLoadingClasses ? (
        <Card>
          <CardHeader>
            <CardTitle>No Class Selected</CardTitle>
            <CardDescription>Please select a class to view performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Select a class from the dropdown above to view detailed performance metrics.
            </p>
          </CardContent>
        </Card>
      ) : isLoadingClasses ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <ClassPerformanceDashboard classId={selectedClassId} />
      )}
    </div>
  );
};
