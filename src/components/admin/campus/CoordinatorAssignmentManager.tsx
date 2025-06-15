'use client';

import { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  BookOpen,
  GraduationCap,
  Users,
  Plus,
  Trash2,
  Loader2,
  School,
  Calendar,
  Layers
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CoordinatorAssignmentManagerProps {
  coordinatorId: string;
  campusId: string;
  onAssignmentComplete?: () => void;
}

export function CoordinatorAssignmentManager({
  coordinatorId,
  campusId,
  onAssignmentComplete
}: CoordinatorAssignmentManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('programs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isAssigningProgram, setIsAssigningProgram] = useState(false);
  const [isAssigningCourse, setIsAssigningCourse] = useState(false);
  const [isAssigningClasses, setIsAssigningClasses] = useState(false);

  // Fetch coordinator details
  const { data: coordinator, isLoading: isLoadingCoordinator } = api.user.getById.useQuery(coordinatorId);

  // Fetch programs for this campus
  const { data: programsData, isLoading: isLoadingPrograms } = api.program.getByCampus.useQuery({
    campusId: campusId,
  }, {
    enabled: !!campusId
  });

  // Fetch courses for this campus
  const { data: coursesData, isLoading: isLoadingCourses } = api.course.getByCampus.useQuery({
    campusId: campusId,
  }, {
    enabled: !!campusId
  });

  // Fetch classes for selected course
  const { data: classesData, isLoading: isLoadingClasses } = api.class.getByCourseCampus.useQuery(
    {
      courseCampusId: selectedCourseId,
      includeEnrollments: true
    },
    {
      enabled: !!selectedCourseId
    }
  );

  // Mutations
  const assignProgramMutation = api.coordinator.assignProgram.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          description: `Program assigned to coordinator successfully with ${data.coursesAssigned || 0} courses`,
          variant: 'success'
        });
        setIsAssigningProgram(false);
        if (onAssignmentComplete) {
          onAssignmentComplete();
        }
      } else if (data.alreadyAssigned) {
        toast({
          description: data.message || 'Program is already assigned to this coordinator',
          variant: 'warning'
        });
        setIsAssigningProgram(false);
      }
    },
    onError: (error) => {
      toast({
        description: error.message || 'Failed to assign program to coordinator',
        variant: 'error'
      });
      setIsAssigningProgram(false);
    },
  });

  const assignCourseMutation = api.coordinator.assignCourse.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          description: 'Course assigned to coordinator successfully',
          variant: 'success'
        });
        setIsAssigningCourse(false);
        if (onAssignmentComplete) {
          onAssignmentComplete();
        }
      } else if (data.alreadyAssigned) {
        toast({
          description: data.message || 'Course is already assigned to this coordinator',
          variant: 'warning'
        });
        setIsAssigningCourse(false);
      }
    },
    onError: (error) => {
      toast({
        description: error.message || 'Failed to assign course to coordinator',
        variant: 'error'
      });
      setIsAssigningCourse(false);
    },
  });

  const unassignProgramMutation = api.coordinator.unassignProgram.useMutation({
    onSuccess: () => {
      toast({
        description: 'Program unassigned from coordinator successfully',
        variant: 'success'
      });
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    },
    onError: (error) => {
      toast({
        description: error.message || 'Failed to unassign program from coordinator',
        variant: 'error'
      });
    },
  });

  const unassignCourseMutation = api.coordinator.unassignCourse.useMutation({
    onSuccess: () => {
      toast({
        description: 'Course unassigned from coordinator successfully',
        variant: 'success'
      });
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    },
    onError: (error) => {
      toast({
        description: error.message || 'Failed to unassign course from coordinator',
        variant: 'error'
      });
    },
  });

  const assignClassesMutation = api.coordinator.assignClasses.useMutation({
    onSuccess: () => {
      toast({
        description: 'Classes assigned to coordinator successfully',
        variant: 'success'
      });
      setIsAssigningClasses(false);
      setSelectedClassIds([]);
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    },
    onError: (error) => {
      toast({
        description: error.message || 'Failed to assign classes to coordinator',
        variant: 'error'
      });
      setIsAssigningClasses(false);
    },
  });

  const unassignClassMutation = api.coordinator.unassignClass.useMutation({
    onSuccess: () => {
      toast({
        description: 'Class unassigned from coordinator successfully',
        variant: 'success'
      });
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    },
    onError: (error) => {
      toast({
        description: error.message || 'Failed to unassign class from coordinator',
        variant: 'error'
      });
    },
  });

  // Get managed programs for this coordinator
  const getManagedPrograms = () => {
    if (!coordinator?.coordinatorProfile?.managedPrograms) return [];
    return coordinator.coordinatorProfile.managedPrograms as any[];
  };

  // Get managed courses for this coordinator
  const getManagedCourses = () => {
    if (!coordinator?.coordinatorProfile?.managedCourses) return [];
    return coordinator.coordinatorProfile.managedCourses as any[];
  };

  // Get managed classes for this coordinator
  const getManagedClasses = () => {
    if (!coordinator?.coordinatorProfile?.managedCourses) return [];

    const managedCourses = coordinator.coordinatorProfile.managedCourses as any[];
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

  // Check if a program is already assigned to the coordinator
  const isProgramAssigned = (programId: string) => {
    const managedPrograms = getManagedPrograms();
    return managedPrograms.some(program => program.programId === programId && program.campusId === campusId);
  };

  // Check if a course is already assigned to the coordinator
  const isCourseAssigned = (courseId: string) => {
    const managedCourses = getManagedCourses();
    return managedCourses.some(course => course.courseId === courseId && course.campusId === campusId);
  };

  // Check if a class is already assigned to the coordinator
  const isClassAssigned = (classId: string) => {
    const managedClasses = getManagedClasses();
    return managedClasses.some(cls => cls.classId === classId);
  };

  // Handle assigning a program to the coordinator
  const handleAssignProgram = () => {
    if (!selectedProgramId) {
      toast({
        description: 'Please select a program',
        variant: 'error'
      });
      return;
    }

    setIsAssigningProgram(true);
    assignProgramMutation.mutate({
      coordinatorId,
      programId: selectedProgramId,
      campusId,
      role: 'PROGRAM_COORDINATOR',
      responsibilities: []
    });
  };

  // Handle unassigning a program from the coordinator
  const handleUnassignProgram = (programId: string) => {
    unassignProgramMutation.mutate({
      coordinatorId,
      programId,
      campusId
    });
  };

  // Handle assigning a course to the coordinator
  const handleAssignCourse = () => {
    if (!selectedCourseId) {
      toast({
        description: 'Please select a course',
        variant: 'error'
      });
      return;
    }

    setIsAssigningCourse(true);
    assignCourseMutation.mutate({
      coordinatorId,
      courseId: selectedCourseId,
      campusId
    });
  };

  // Handle unassigning a course from the coordinator
  const handleUnassignCourse = (courseId: string) => {
    unassignCourseMutation.mutate({
      coordinatorId,
      courseId,
      campusId
    });
  };

  // Handle assigning classes to the coordinator
  const handleAssignClasses = () => {
    if (selectedClassIds.length === 0) {
      toast({
        description: 'Please select at least one class',
        variant: 'error'
      });
      return;
    }

    // Get all managed courses for debugging
    const allManagedCourses = getManagedCourses();
    console.log('All managed courses:', allManagedCourses);
    console.log('Selected course ID (courseCampusId):', selectedCourseId);

    // Find the course details from the selected courseCampusId
    // First try to find by courseCampusId
    let selectedCourse = assignedCourses.find(course => course.courseCampusId === selectedCourseId);

    // If not found, try to find by courseId (for backward compatibility)
    if (!selectedCourse) {
      selectedCourse = assignedCourses.find(course => course.courseId === selectedCourseId);
    }

    if (!selectedCourse) {
      toast({
        description: 'Please select a valid course that is assigned to this coordinator',
        variant: 'error'
      });
      return;
    }

    console.log('Selected course found:', selectedCourse);

    setIsAssigningClasses(true);
    assignClassesMutation.mutate({
      coordinatorId,
      classIds: selectedClassIds,
      courseId: selectedCourse.courseId,
      campusId
    });
  };

  // Handle unassigning a class from the coordinator
  const handleUnassignClass = (classId: string, courseId: string) => {
    unassignClassMutation.mutate({
      coordinatorId,
      classId,
      courseId,
      campusId
    });
  };

  // Toggle class selection
  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  // Filter courses based on search query
  const filteredCourses = coursesData?.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get available courses (not already assigned)
  const availableCourses = filteredCourses.filter(course => !isCourseAssigned(course.id));

  // Get assigned courses
  const assignedCourses = getManagedCourses().filter(course => course.campusId === campusId);

  // Get assigned classes
  const assignedClasses = getManagedClasses();

  if (isLoadingCoordinator) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!coordinator) {
    return (
      <div className="p-4 bg-destructive/10 rounded-md">
        <p className="text-destructive">Coordinator not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="programs">
            <Layers className="h-4 w-4 mr-2" />
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

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Assigned Programs</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search programs..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Assigned Programs List */}
          {getManagedPrograms().filter(p => p.campusId === campusId).length === 0 ? (
            <EmptyState
              title="No Programs Assigned"
              description="This coordinator doesn't have any programs assigned yet"
              icon={<Layers className="h-10 w-10" />}
            />
          ) : (
            <div className="space-y-2">
              {getManagedPrograms()
                .filter(p => p.campusId === campusId)
                .map((program, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <h4 className="font-medium">{program.programName}</h4>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <School className="h-3.5 w-3.5 mr-1" />
                          <span>{program.programCode}</span>
                          <Badge className="ml-2" variant="outline">{program.role}</Badge>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unassign Program</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to unassign this program from the coordinator?
                              This will also remove all course and class assignments for this program.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnassignProgram(program.programId)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Unassign
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
            </div>
          )}

          <Separator className="my-4" />

          {/* Add Program Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Add Program</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Select
                  value={selectedProgramId}
                  onValueChange={setSelectedProgramId}
                  disabled={isAssigningProgram}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingPrograms ? (
                      <div className="flex justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : !programsData || programsData.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No available programs
                      </div>
                    ) : (
                      programsData
                        .filter(program => !isProgramAssigned(program.id))
                        .map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name} ({program.code})
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAssignProgram}
                disabled={isAssigningProgram || !selectedProgramId}
              >
                {isAssigningProgram ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Program
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Assigned Courses</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search courses..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Assigned Courses List */}
          {assignedCourses.length === 0 ? (
            <EmptyState
              title="No Courses Assigned"
              description="This coordinator doesn't have any courses assigned yet"
              icon={<BookOpen className="h-10 w-10" />}
            />
          ) : (
            <div className="space-y-2">
              {assignedCourses.map((course, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-medium">{course.courseName}</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <School className="h-3.5 w-3.5 mr-1" />
                        <span>{course.courseCode}</span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unassign Course</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to unassign this course from the coordinator?
                            This will also remove all class assignments for this course.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleUnassignCourse(course.courseId)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Unassign
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          {/* Add Course Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Add Course</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Select
                  value={selectedCourseId}
                  onValueChange={setSelectedCourseId}
                  disabled={isAssigningCourse || availableCourses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCourses ? (
                      <div className="flex justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : availableCourses.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No available courses
                      </div>
                    ) : (
                      availableCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAssignCourse}
                disabled={isAssigningCourse || !selectedCourseId}
              >
                {isAssigningCourse ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Course
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Assigned Classes</h3>
          </div>

          {/* Assigned Classes List */}
          {assignedClasses.length === 0 ? (
            <EmptyState
              title="No Classes Assigned"
              description="This coordinator doesn't have any classes assigned yet"
              icon={<Users className="h-10 w-10" />}
            />
          ) : (
            <div className="space-y-2">
              {assignedClasses.map((cls, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-medium">{cls.className}</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <BookOpen className="h-3.5 w-3.5 mr-1" />
                        <span>{cls.courseName}</span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unassign Class</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to unassign this class from the coordinator?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleUnassignClass(cls.classId, cls.courseId)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Unassign
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          {/* Add Classes Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Add Classes</h3>

            <div className="space-y-3">
              <div>
                <Select
                  value={selectedCourseId}
                  onValueChange={(value) => {
                    setSelectedCourseId(value);
                    setSelectedClassIds([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCourses ? (
                      <div className="flex justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : assignedCourses.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No courses assigned yet
                      </div>
                    ) : (
                      assignedCourses.map((course, index) => (
                        <SelectItem key={index} value={course.courseCampusId}>
                          {course.courseName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedCourseId && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Available Classes</CardTitle>
                      <CardDescription>
                        Select classes to assign to this coordinator
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[40vh] overflow-y-auto">
                      {isLoadingClasses ? (
                        <div className="flex justify-center p-4">
                          <LoadingSpinner />
                        </div>
                      ) : !classesData || classesData.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No classes available for this course
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {classesData.map((cls) => {
                            const isAssigned = isClassAssigned(cls.id);
                            return (
                              <div
                                key={cls.id}
                                className={`flex items-center justify-between p-3 border rounded-md ${
                                  isAssigned ? 'bg-muted/50' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`class-${cls.id}`}
                                    checked={selectedClassIds.includes(cls.id) || isAssigned}
                                    onCheckedChange={() => toggleClassSelection(cls.id)}
                                    disabled={isAssigned}
                                  />
                                  <div>
                                    <label
                                      htmlFor={`class-${cls.id}`}
                                      className="font-medium cursor-pointer"
                                    >
                                      {cls.name}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                                      <div className="flex items-center">
                                        <Users className="h-3.5 w-3.5 mr-1" />
                                        <span>{cls._count?.students || 0} students</span>
                                      </div>
                                      {cls.term && (
                                        <div className="flex items-center">
                                          <Calendar className="h-3.5 w-3.5 mr-1" />
                                          <span>{cls.term.name}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {isAssigned && (
                                  <Badge variant="outline">Already Assigned</Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleAssignClasses}
                      disabled={
                        isAssigningClasses ||
                        selectedClassIds.length === 0 ||
                        !selectedCourseId
                      }
                    >
                      {isAssigningClasses ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Assign Selected Classes
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
