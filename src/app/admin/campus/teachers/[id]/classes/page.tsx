'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { PageLayout } from '@/components/layout/page-layout';
import { ArrowLeft, CalendarDays, Users, UserPlus, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { format } from 'date-fns';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '@/server/api/root';
import type { Class } from '@prisma/client';

export default function TeacherClassesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const teacherId = params?.id as string;
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch teacher details
  const { data: teacher, isLoading: isLoadingTeacher, error: teacherError } = api.teacher.getTeacherById.useQuery(
    { id: teacherId },
    { 
      enabled: !!teacherId,
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        console.error('Error loading teacher:', error);
        toast({
          title: 'Error',
          description: `Failed to load teacher: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );
  
  // Fetch classes assigned to this teacher
  const { data: teacherClasses, isLoading: isLoadingClasses, error: classesError, refetch: refetchTeacherClasses } = api.teacher.getTeacherClasses.useQuery(
    { teacherId },
    {
      enabled: !!teacherId,
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        console.error('Error loading classes:', error);
        toast({
          title: 'Error',
          description: `Failed to load classes: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );
  
  // Fetch available classes for assignment
  const { data: availableClasses, isLoading: isLoadingAvailable, refetch: refetchAvailableClasses } = api.class.getAvailableClassesForTeacher.useQuery(
    { 
      teacherId,
      campusId: teacher?.user?.primaryCampusId || undefined
    },
    {
      enabled: !!teacherId && !!teacher?.user?.primaryCampusId,
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        console.error('Error loading available classes:', error);
        toast({
          title: 'Error',
          description: `Failed to load available classes: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );

  // Update teacher assignments mutation
  const updateAssignmentsMutation = api.class.updateTeacherAssignment.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Class assignments updated successfully',
        variant: 'success',
      });
      // Reset selected classes
      setSelectedClasses([]);
      // Refetch data
      void refetchTeacherClasses();
      void refetchAvailableClasses();
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast({
        title: 'Error',
        description: `Failed to update class assignments: ${error.message}`,
        variant: 'error',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Toggle class selection
  const toggleClassSelection = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId) 
        : [...prev, classId]
    );
  };

  // Handle assigning selected classes to teacher
  const handleAssignClasses = () => {
    if (selectedClasses.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select at least one class to assign',
        variant: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    updateAssignmentsMutation.mutate({
      teacherId,
      assignedClassIds: selectedClasses,
    });
  };

  // Handle unassigning a class from teacher
  const handleUnassignClass = (classId: string) => {
    setIsSubmitting(true);
    updateAssignmentsMutation.mutate({
      teacherId,
      assignedClassIds: [],
      unassignedClassIds: [classId],
    });
  };

  // Loading state
  if (isLoadingTeacher || isLoadingClasses) {
    return (
      <PageLayout
        title="Loading..."
        description="Loading teacher classes"
        breadcrumbs={[
          { label: 'Teachers', href: '/admin/campus/teachers' },
          { label: 'Loading...', href: '#' },
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (teacherError || classesError) {
    return (
      <PageLayout
        title="Error"
        description="Failed to load data"
        breadcrumbs={[
          { label: 'Teachers', href: '/admin/campus/teachers' },
          { label: 'Error', href: '#' },
        ]}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground mb-6">
                {teacherError?.message || classesError?.message || 'An unknown error occurred'}
              </p>
              <Button asChild>
                <Link href="/admin/campus/teachers">Back to Teachers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Classes for ${teacher?.user?.name || 'Teacher'}`}
      description={`Manage class assignments for ${teacher?.user?.email || ''}`}
      breadcrumbs={[
        { label: 'Teachers', href: '/admin/campus/teachers' },
        { label: teacher?.user?.name || 'Teacher', href: `/admin/campus/teachers/${teacherId}` },
        { label: 'Classes', href: '#' },
      ]}
      actions={
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/campus/teachers/${teacherId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="assigned" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assigned">Assigned Classes ({teacherClasses?.length || 0})</TabsTrigger>
          <TabsTrigger value="available">Available Classes ({availableClasses?.length || 0})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assigned" className="space-y-6">
          {teacherClasses && teacherClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherClasses.map((classItem: Class) => (
                <Card key={classItem.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{classItem.name}</CardTitle>
                        <CardDescription>{classItem.code}</CardDescription>
                      </div>
                      <Badge 
                        variant={classItem.status === 'ACTIVE' ? 'success' : 'secondary'}
                      >
                        {classItem.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Created: {format(new Date(classItem.createdAt), 'PPP')}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Students: {classItem.currentCount || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleUnassignClass(classItem.id)}
                        disabled={isSubmitting}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Unassign
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/campus/classes/${classItem.id}`}>
                          View Class
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No Classes Assigned</h3>
                  <p className="text-muted-foreground mb-6">
                    This teacher is not assigned to any classes.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="available" className="space-y-6">
          {isLoadingAvailable ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {selectedClasses.length > 0 && (
                <div className="flex items-center justify-between bg-muted p-4 rounded-lg mb-4">
                  <div>
                    <span className="font-medium">{selectedClasses.length} classes selected</span>
                  </div>
                  <Button 
                    onClick={handleAssignClasses}
                    disabled={isSubmitting}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Assign Selected Classes
                  </Button>
                </div>
              )}
              
              {availableClasses && availableClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableClasses.map((classItem: Class) => (
                    <Card 
                      key={classItem.id} 
                      className={`overflow-hidden ${selectedClasses.includes(classItem.id) ? 'border-2 border-primary' : ''}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{classItem.name}</CardTitle>
                            <CardDescription>{classItem.code}</CardDescription>
                          </div>
                          <Badge 
                            variant={classItem.status === 'ACTIVE' ? 'success' : 'secondary'}
                          >
                            {classItem.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Created: {format(new Date(classItem.createdAt), 'PPP')}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Students: {classItem.currentCount || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between mt-4">
                          <Button 
                            size="sm" 
                            variant={selectedClasses.includes(classItem.id) ? "default" : "outline"}
                            onClick={() => toggleClassSelection(classItem.id)}
                            disabled={isSubmitting}
                          >
                            {selectedClasses.includes(classItem.id) ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Selected
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Select
                              </>
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/campus/classes/${classItem.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium mb-2">No Available Classes</h3>
                      <p className="text-muted-foreground mb-6">
                        There are no available classes that this teacher can be assigned to.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
} 