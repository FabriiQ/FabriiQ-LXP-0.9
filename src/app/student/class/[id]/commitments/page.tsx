'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { CommitmentManager } from '@/components/student/CommitmentManager';
import { useToast } from '@/components/ui/use-toast';
import { EducationalLoadingFact } from '@/components/ui/loading/EducationalLoadingFact';
import { LaborIllusionLoader } from '@/components/ui/loading/LaborIllusionLoader';

export default function StudentCommitmentsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string || "";
  const [activeTab, setActiveTab] = useState('active');

  // Get class details
  const {
    data: classData,
    isLoading: isLoadingClass,
    error: classError
  } = api.student.getClassDetails.useQuery(
    { classId },
    {
      enabled: !!classId,
      retry: 1
    }
  );

  // Get student ID
  const { data: studentData } = api.student.getCurrentStudentProfile.useQuery(
    undefined,
    {
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );

  const studentId = studentData?.id || '';

  // Get pending activities for the class
  const {
    data: activities,
    isLoading: isLoadingActivities
  } = api.activityGrade.listByStudentAndClass.useQuery(
    { classId },
    {
      enabled: !!classId && !!studentId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Get commitments for the student and class
  const {
    data: commitments,
    isLoading: isLoadingCommitments,
    refetch: refetchCommitments
  } = api.commitmentContract.getStudentCommitmentContracts.useQuery(
    {
      studentId,
      classId
    },
    {
      enabled: !!studentId && !!classId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Process activities to the format needed by CommitmentManager
  const processedActivities = React.useMemo(() => {
    if (!activities) return [];

    return activities.map(grade => ({
      id: grade.activity.id,
      title: grade.activity.title,
      status: grade.status === 'UNATTEMPTED' ? 'pending' :
              grade.status === 'SUBMITTED' || grade.status === 'DRAFT' ? 'in-progress' :
              grade.status === 'GRADED' || grade.status === 'COMPLETED' ? 'completed' : 'pending'
    }));
  }, [activities]);

  // Process commitments to the format needed by CommitmentManager
  const processedCommitments = React.useMemo(() => {
    if (!commitments) return [];

    return commitments.map(commitment => ({
      id: commitment.id,
      title: commitment.title,
      description: commitment.description || undefined,
      deadline: new Date(commitment.deadline),
      isCompleted: commitment.isCompleted,
      completedAt: commitment.completedAt ? new Date(commitment.completedAt) : undefined,
      createdAt: new Date(commitment.createdAt),
      metadata: commitment.metadata as any
    }));
  }, [commitments]);

  // Filter commitments based on active tab
  const filteredCommitments = React.useMemo(() => {
    if (!processedCommitments) return [];

    return processedCommitments.filter(commitment =>
      activeTab === 'active' ? !commitment.isCompleted : commitment.isCompleted
    );
  }, [processedCommitments, activeTab]);

  // Handle commitment creation
  const handleCommitmentCreated = () => {
    toast({
      title: "Commitment created",
      description: "Your commitment has been created successfully.",
      variant: "success",
    });
    refetchCommitments();
  };

  // Handle back button
  const handleBack = () => {
    router.push(`/student/class/${classId}`);
  };

  // Show loading state
  if (isLoadingClass || isLoadingActivities || isLoadingCommitments) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Commitments</h1>
          <p className="text-muted-foreground">
            Create and manage your learning commitments
          </p>
        </div>

        <div className="mb-8">
          <EducationalLoadingFact
            isLoading={true}
            autoRotate={true}
            interval={5000}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Loading Your Commitments</h2>
          <LaborIllusionLoader
            isLoading={true}
            showTimeRemaining={true}
            totalEstimatedTime={7}
            steps={[
              { label: 'Verifying your session...', duration: 1, weight: 10 },
              { label: 'Loading class information...', duration: 1.5, weight: 15 },
              { label: 'Fetching activity data...', duration: 1.5, weight: 15 },
              { label: 'Retrieving commitments...', duration: 2, weight: 25 },
              { label: 'Calculating progress data...', duration: 1.5, weight: 15 },
              { label: 'Checking commitment status...', duration: 1.5, weight: 15 },
              { label: 'Finalizing commitment data...', duration: 1, weight: 15 },
            ]}
          />
        </div>
      </div>
    );
  }

  // Show error if class data fails to load
  if (classError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load class data. Please try again later.
          </AlertDescription>
        </Alert>
        <Button onClick={handleBack} variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Class
        </Button>
      </div>
    );
  }

  // Extract class name from data
  const className = classData?.className || "Class";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-8 w-8 mr-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>

        <div>
          <h1 className="text-2xl font-bold">Commitments</h1>
          <p className="text-muted-foreground">
            {className}
          </p>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader>
          <CardTitle>My Learning Commitments</CardTitle>
          <CardDescription>
            Create and manage your commitments to complete activities by specific deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingClass || isLoadingActivities || isLoadingCommitments ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">Active Commitments</TabsTrigger>
                  <TabsTrigger value="completed">Completed Commitments</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="space-y-4">
                  <CommitmentManager
                    studentId={studentId}
                    classId={classId}
                    activities={processedActivities}
                    commitments={filteredCommitments}
                    onCommitmentCreated={handleCommitmentCreated}
                  />
                </TabsContent>
                <TabsContent value="completed" className="space-y-4">
                  {filteredCommitments.length > 0 ? (
                    <CommitmentManager
                      studentId={studentId}
                      classId={classId}
                      activities={processedActivities}
                      commitments={filteredCommitments}
                      onCommitmentCreated={handleCommitmentCreated}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        You haven't completed any commitments yet.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
