'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PrincipalClassPerformanceView } from '../performance/PrincipalClassPerformanceView';

interface PrincipalPerformanceDashboardProps {
  campusId?: string;
}

export const PrincipalPerformanceDashboard: React.FC<PrincipalPerformanceDashboardProps> = ({
  campusId,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  // Fetch programs for the campus
  const { data: programs, isLoading: isLoadingPrograms } = api.program.list.useQuery(
    {
      institutionId: campusId ? undefined : undefined, // We'll filter by campus in the backend
      status: 'ACTIVE',
    },
    {
      enabled: true,
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load programs: ${error.message}`,
          variant: 'error',
        });
      },
    }
  );

  // Fetch classes for the selected program or all classes if no program is selected
  const { data: classes, isLoading: isLoadingClasses } = api.class.list.useQuery(
    {
      courseCampusId: undefined, // We'll filter by campus in the backend
      status: 'ACTIVE',
      search: '',
    },
    {
      enabled: true,
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load classes: ${error.message}`,
          variant: 'error',
        });
      },
    }
  );

  // Set the first program as selected when data is loaded
  React.useEffect(() => {
    if (programs?.programs && programs.programs.length > 0 && !selectedProgramId) {
      setSelectedProgramId(programs.programs[0].id);
    }
  }, [programs, selectedProgramId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Campus Performance Dashboard</h1>

        {isLoadingPrograms ? (
          <Skeleton className="h-10 w-64" />
        ) : (
          <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Programs</SelectItem>
              {programs?.programs && programs.programs.length > 0 ? (
                programs.programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-programs" disabled>
                  No programs available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          {isLoadingClasses ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
              <Skeleton className="h-80 w-full" />
            </div>
          ) : classes && classes.items && classes.items.length > 0 ? (
            <PrincipalClassPerformanceView classIds={classes.items.map(cls => cls.id)} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Classes Available</CardTitle>
                <CardDescription>
                  {selectedProgramId
                    ? "There are no classes for the selected program."
                    : "There are no classes available for this campus."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {selectedProgramId
                    ? "Try selecting a different program or check if classes have been created for this program."
                    : "Please create classes or check your filters."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Performance</CardTitle>
              <CardDescription>Teacher performance metrics will be displayed here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This feature is coming soon. It will display performance metrics for teachers.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>Student performance metrics will be displayed here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This feature is coming soon. It will display performance metrics for students.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
