'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { CoordinatorAssignmentManager } from '@/components/admin/campus/CoordinatorAssignmentManager';
import {
  ArrowLeft,
  BookOpen,
  Building,
  GraduationCap,
  Mail,
  Phone,
  User,
  Users,
  Calendar,
  School
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export default function CoordinatorDetailPage() {
  const params = useParams();
  const coordinatorId = params.id as string;
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  // Get current user and their primary campus
  const { data: user, isLoading: isLoadingUser } = api.user.getCurrent.useQuery(undefined, {
    retry: false
  });
  const primaryCampusId = user?.primaryCampusId;

  // Get campus details
  const { data: campus, isLoading: isLoadingCampus } = api.campus.findById.useQuery(
    { campusId: primaryCampusId as string },
    { enabled: !!primaryCampusId }
  );

  // Get coordinator details
  const {
    data: coordinator,
    isLoading: isLoadingCoordinator,
    refetch: refetchCoordinator
  } = api.user.getById.useQuery(coordinatorId, {
    enabled: !!coordinatorId
  });

  // Get managed programs
  const getManagedPrograms = () => {
    if (!coordinator?.coordinatorProfile?.managedPrograms) return [];
    return (coordinator.coordinatorProfile.managedPrograms || []) as any[];
  };

  // Get managed courses
  const getManagedCourses = () => {
    if (!coordinator?.coordinatorProfile?.managedCourses) return [];
    return (coordinator.coordinatorProfile.managedCourses || []) as any[];
  };

  // Get managed classes
  const getManagedClasses = () => {
    if (!coordinator?.coordinatorProfile?.managedCourses) return [];

    const managedCourses = (coordinator.coordinatorProfile.managedCourses || []) as any[];
    const allClasses: any[] = [];

    managedCourses.forEach(course => {
      if (course.classes && Array.isArray(course.classes)) {
        course.classes.forEach((classItem: any) => {
          allClasses.push({
            ...classItem,
            courseName: course.courseName,
            courseId: course.courseId
          });
        });
      }
    });

    return allClasses;
  };

  if (isLoadingUser || isLoadingCampus || isLoadingCoordinator) {
    return (
      <div className="container mx-auto py-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!coordinator) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/10 p-4 rounded-md">
          <h2 className="text-lg font-semibold text-destructive">Error</h2>
          <p>Coordinator not found or you don't have access to this coordinator.</p>
        </div>
      </div>
    );
  }

  const managedPrograms = getManagedPrograms().filter(p => p.campusId === primaryCampusId);
  const managedCourses = getManagedCourses().filter(c => c.campusId === primaryCampusId);
  const managedClasses = getManagedClasses();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campus/coordinators">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Coordinator Profile</h1>
        </div>
        <Button onClick={() => setIsAssignmentDialogOpen(true)}>
          Manage Assignments
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={(coordinator as any).image || undefined} alt={coordinator.name || 'Coordinator'} />
                <AvatarFallback className="text-2xl">
                  {coordinator.name?.substring(0, 2).toUpperCase() || 'CO'}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4 text-center">{coordinator.name}</CardTitle>
              <CardDescription className="text-center">
                {coordinator.coordinatorProfile?.department || 'No department assigned'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{coordinator.email}</span>
              </div>
              {(coordinator as any).phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{(coordinator as any).phone}</span>
                </div>
              )}
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{campus?.name || 'No campus assigned'}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <Badge variant="outline">Coordinator</Badge>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Joined {new Date(coordinator.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="programs">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="programs">
                <GraduationCap className="h-4 w-4 mr-2" />
                Programs
              </TabsTrigger>
              <TabsTrigger value="courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="classes">
                <Users className="h-4 w-4 mr-2" />
                Classes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="programs" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Programs</CardTitle>
                  <CardDescription>
                    Programs assigned to this coordinator at {campus?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {managedPrograms.length === 0 ? (
                    <div className="text-center p-4 border rounded-md bg-muted/20">
                      <p>No programs assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {managedPrograms.map((program, index) => (
                        <div key={index} className="p-4 border rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{program.programName}</h3>
                              <p className="text-sm text-muted-foreground">{program.programCode}</p>
                            </div>
                            <Badge>{program.role}</Badge>
                          </div>
                          {program.responsibilities && program.responsibilities.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Responsibilities:</p>
                              <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
                                {program.responsibilities.map((resp: string, i: number) => (
                                  <li key={i}>{resp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Courses</CardTitle>
                  <CardDescription>
                    Courses assigned to this coordinator at {campus?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {managedCourses.length === 0 ? (
                    <div className="text-center p-4 border rounded-md bg-muted/20">
                      <p>No courses assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {managedCourses.map((course, index) => (
                        <div key={index} className="p-4 border rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{course.courseName}</h3>
                              <p className="text-sm text-muted-foreground">{course.courseCode}</p>
                            </div>
                            <div className="flex items-center">
                              <School className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">{course.programName}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm">
                              <span className="font-medium">Classes:</span>{' '}
                              {course.classes && course.classes.length > 0
                                ? `${course.classes.length} assigned`
                                : 'No classes assigned'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="classes" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Classes</CardTitle>
                  <CardDescription>
                    Classes assigned to this coordinator at {campus?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {managedClasses.length === 0 ? (
                    <div className="text-center p-4 border rounded-md bg-muted/20">
                      <p>No classes assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {managedClasses.map((cls, index) => (
                        <div key={index} className="p-4 border rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{cls.className}</h3>
                              <p className="text-sm text-muted-foreground">{cls.classCode}</p>
                            </div>
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">{cls.courseName}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Badge variant="outline">{cls.termName}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Coordinator Assignments</DialogTitle>
            <DialogDescription>
              Assign programs, courses and classes to this coordinator
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 pb-10">
            <CoordinatorAssignmentManager
              coordinatorId={coordinatorId}
              campusId={primaryCampusId as string}
              onAssignmentComplete={() => {
                setIsAssignmentDialogOpen(false);
                void refetchCoordinator();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
