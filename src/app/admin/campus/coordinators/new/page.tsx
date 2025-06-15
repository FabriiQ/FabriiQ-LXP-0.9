'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, Loader2, Plus, X, Eye, EyeOff } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NewCoordinatorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialCampusId = searchParams.get('campusId');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPrograms, setSelectedPrograms] = useState<{id: string, name: string, campusId: string, programId: string}[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedCourses, setSelectedCourses] = useState<{id: string, name: string, campusId: string, programId: string}[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [createManualAccount, setCreateManualAccount] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Get current user
  const { isLoading: isLoadingUser } = api.user.getCurrent.useQuery(undefined, {
    retry: false
  });

  // Get campus details for the initial campus
  const { data: initialCampus } = api.campus.findById.useQuery(
    { campusId: initialCampusId as string },
    { enabled: !!initialCampusId }
  );

  // Get programs for the initial campus
  const { data: campusPrograms } = api.program.getProgramCampusesByCampus.useQuery(
    { campusId: initialCampusId as string },
    { enabled: !!initialCampusId }
  );

  // Get courses for the selected program and campus
  const { data: campusCourses, isLoading: isLoadingCampusCourses } = api.course.getByCampus.useQuery(
    {
      campusId: initialCampusId as string,
      programId: selectedProgramId
    },
    { enabled: !!initialCampusId && !!selectedProgramId }
  );

  // Use the initial campus ID as the primary campus ID
  const primaryCampusId = initialCampusId;

  // Create coordinator mutation
  const createCoordinator = api.user.create.useMutation({
    onSuccess: (data) => {
      // Create coordinator profile
      createCoordinatorProfile.mutate({
        userId: data.id,
        department: department || undefined
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        description: error.message || 'Failed to create coordinator',
        variant: 'error'
      });
    }
  });

  // Create coordinator profile mutation
  const createCoordinatorProfile = api.user.createCoordinatorProfile.useMutation({
    onSuccess: (profile) => {
      // Assign selected programs to the coordinator if any
      if (selectedPrograms.length > 0) {
        selectedPrograms.forEach(program => {
          assignProgram.mutate({
            coordinatorId: profile.userId,
            programId: program.id,
            campusId: program.campusId,
            role: 'PROGRAM_COORDINATOR',
            responsibilities: []
          });
        });
      }

      // Assign selected courses to the coordinator if any
      if (selectedCourses.length > 0) {
        selectedCourses.forEach(course => {
          assignCourse.mutate({
            coordinatorId: profile.userId,
            courseId: course.id,
            campusId: course.campusId
          });
        });
      }

      setIsSubmitting(false);
      toast({
        description: 'Coordinator created successfully',
        variant: 'success'
      });
      router.push('/admin/campus/coordinators');
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        description: error.message || 'Failed to create coordinator profile',
        variant: 'error'
      });
    }
  });



  // Assign program to coordinator mutation
  const assignProgram = api.coordinator.assignProgram.useMutation({
    onError: (error) => {
      toast({
        description: error.message || 'Failed to assign program to coordinator',
        variant: 'error'
      });
    }
  });

  // Assign course to coordinator mutation
  const assignCourse = api.coordinator.assignCourse.useMutation({
    onError: (error) => {
      toast({
        description: error.message || 'Failed to assign course to coordinator',
        variant: 'error'
      });
    }
  });



  // Handle adding a program to the selected list
  const handleAddProgram = (programId: string) => {
    if (!programId || !initialCampusId || selectedPrograms.some(p => p.id === programId)) return;

    const programCampus = campusPrograms?.find(pc => pc.programId === programId);
    if (programCampus) {
      setSelectedPrograms([...selectedPrograms, {
        id: programCampus.programId,
        name: programCampus.program.name,
        campusId: initialCampusId,
        programId: programCampus.programId
      }]);
      // Reset the selected program ID
      setSelectedProgramId('');
    }
  };

  // Handle removing a program from the selected list
  const handleRemoveProgram = (programId: string) => {
    setSelectedPrograms(selectedPrograms.filter(p => p.id !== programId));
    // Also remove any courses associated with this program
    setSelectedCourses(selectedCourses.filter(c => c.programId !== programId));
  };

  // Handle adding a course to the selected list
  const handleAddCourse = (courseId: string) => {
    if (!courseId || !initialCampusId || !selectedProgramId || selectedCourses.some(c => c.id === courseId)) return;

    const course = campusCourses?.find(c => c.id === courseId);
    if (course) {
      setSelectedCourses([...selectedCourses, {
        id: course.id,
        name: course.name,
        campusId: initialCampusId,
        programId: selectedProgramId
      }]);
      // Reset the selected course ID
      setSelectedCourseId('');
    }
  };

  // Handle removing a course from the selected list
  const handleRemoveCourse = (courseId: string) => {
    setSelectedCourses(selectedCourses.filter(c => c.id !== courseId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      toast({
        description: 'Please fill in all required fields',
        variant: 'error'
      });
      return;
    }



    // Validate manual credentials if enabled
    if (createManualAccount) {
      if (!username) {
        toast({
          description: 'Please enter a username',
          variant: 'error'
        });
        return;
      }

      if (!password || password.length < 8) {
        toast({
          description: 'Password must be at least 8 characters',
          variant: 'error'
        });
        return;
      }
    }

    setIsSubmitting(true);

    // Create the coordinator user
    createCoordinator.mutate({
      name,
      email,
      userType: 'CAMPUS_COORDINATOR',
      campusId: primaryCampusId,
      generateCredentials: !createManualAccount,
      username: createManualAccount ? username : undefined,
      password: createManualAccount ? password : undefined
    });
  };

  if (isLoadingUser) {
    return (
      <div className="container mx-auto py-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campus/coordinators">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Add New Coordinator</h1>
        </div>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create Coordinator</CardTitle>
          <CardDescription>
            Add a new coordinator and assign campuses and courses
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="credentials">Credentials</TabsTrigger>
                <TabsTrigger value="courses">Programs & Courses</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter department (optional)"
                  />
                </div>


              </TabsContent>

              <TabsContent value="credentials" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createManualAccount"
                      checked={createManualAccount}
                      onCheckedChange={(checked) => setCreateManualAccount(checked as boolean)}
                    />
                    <Label htmlFor="createManualAccount">Create manual username and password</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If unchecked, credentials will be automatically generated.
                  </p>

                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username {createManualAccount && '*'}</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        disabled={!createManualAccount}
                        required={createManualAccount}
                      />
                      <p className="text-sm text-muted-foreground">
                        {createManualAccount ? 'Enter a username for this coordinator' : 'Username will be auto-generated'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password {createManualAccount && '*'}</Label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            disabled={!createManualAccount}
                            required={createManualAccount}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={!createManualAccount}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {createManualAccount ? 'Password must be at least 8 characters' : 'Password will be auto-generated'}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>



              <TabsContent value="courses" className="space-y-4 mt-4">
                <div className="space-y-4">
                  {initialCampus && (
                    <div className="space-y-6">
                      <div className="mb-4">
                        <p className="text-sm font-medium">Campus: <span className="font-bold">{initialCampus.name}</span></p>
                      </div>

                      {/* Programs Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Program Assignment</h3>
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={setSelectedProgramId} name="program">
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a program" />
                            </SelectTrigger>
                            <SelectContent>
                              {campusPrograms?.filter(p => !selectedPrograms.some(sp => sp.id === p.programId)).map(programCampus => (
                                <SelectItem key={programCampus.programId} value={programCampus.programId}>{programCampus.program.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" onClick={() => handleAddProgram(selectedProgramId)} disabled={!selectedProgramId}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>

                        <div className="border rounded-md">
                          <div className="bg-muted p-2 font-medium">Selected Programs</div>
                          <ScrollArea className="h-[150px] p-2">
                            {selectedPrograms.length === 0 ? (
                              <div className="p-4 text-center text-muted-foreground">
                                No programs selected for this campus
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {selectedPrograms.map(program => (
                                  <div key={program.id} className="flex items-center justify-between p-2 border rounded-md">
                                    <span>{program.name}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveProgram(program.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </div>

                      {/* Courses Section */}
                      {selectedPrograms.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Course Assignment</h3>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="programSelect">Select Program</Label>
                              <Select onValueChange={setSelectedProgramId} name="programSelect">
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a program" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedPrograms.map(program => (
                                    <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedProgramId && (
                              <div className="flex items-center space-x-2">
                                <Select onValueChange={setSelectedCourseId} name="course">
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a course" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {campusCourses?.filter(c =>
                                      c.programId === selectedProgramId &&
                                      !selectedCourses.some(sc => sc.id === c.id)
                                    ).map(course => (
                                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button type="button" onClick={() => handleAddCourse(selectedCourseId)} disabled={isLoadingCampusCourses || !selectedCourseId}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="border rounded-md">
                            <div className="bg-muted p-2 font-medium">Selected Courses</div>
                            <ScrollArea className="h-[150px] p-2">
                              {selectedCourses.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                  No courses selected
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {selectedCourses.map(course => (
                                    <div key={course.id} className="flex items-center justify-between p-2 border rounded-md">
                                      <span>{course.name}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveCourse(course.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/campus/coordinators')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Coordinator'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
