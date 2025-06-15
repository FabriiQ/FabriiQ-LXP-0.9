"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function CoordinatorProgramsUtilityPage() {
  const { toast } = useToast();
  const [coordinatorId, setCoordinatorId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [coordinator, setCoordinator] = useState<any>(null);

  // Get coordinator by ID
  const getCoordinator = api.user.getById.useQuery(
    coordinatorId,
    {
      enabled: false,
      onSuccess: (data) => {
        if (data) {
          setCoordinator(data);
          toast({
            title: "Success",
            description: `Found coordinator: ${data.name}`,
            variant: "success",
          });
        } else {
          toast({
            title: "Not Found",
            description: "No coordinator found with that ID",
            variant: "error",
          });
        }
        setIsLoading(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch coordinator",
          variant: "error",
        });
        setIsLoading(false);
      },
    }
  );

  const handleFetchCoordinator = () => {
    if (!coordinatorId) {
      toast({
        title: "Error",
        description: "Please enter a coordinator ID",
        variant: "error",
      });
      return;
    }

    setIsLoading(true);
    getCoordinator.refetch();
  };

  // Get managed programs
  const getManagedPrograms = () => {
    if (!coordinator?.coordinatorProfile?.managedPrograms) return [];
    return coordinator.coordinatorProfile.managedPrograms as any[];
  };

  // Get managed courses
  const getManagedCourses = () => {
    if (!coordinator?.coordinatorProfile?.managedCourses) return [];
    return coordinator.coordinatorProfile.managedCourses as any[];
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coordinator Programs Utility</h1>
          <p className="text-muted-foreground">Check coordinator program associations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check Coordinator Programs</CardTitle>
          <CardDescription>
            Enter a coordinator ID to check their program and course associations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Label htmlFor="coordinatorId">Coordinator ID</Label>
                <Input
                  id="coordinatorId"
                  value={coordinatorId}
                  onChange={(e) => setCoordinatorId(e.target.value)}
                  placeholder="Enter coordinator ID"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleFetchCoordinator} 
                  disabled={isLoading || !coordinatorId}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Loading...
                    </>
                  ) : (
                    "Check Programs"
                  )}
                </Button>
              </div>
            </div>

            {coordinator && (
              <div className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Coordinator Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Name</Label>
                          <p className="text-lg font-medium">{coordinator.name}</p>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <p className="text-lg">{coordinator.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>User Type</Label>
                          <p className="text-lg">
                            <Badge>{coordinator.userType}</Badge>
                          </p>
                        </div>
                        <div>
                          <Label>Has Coordinator Profile</Label>
                          <p className="text-lg">
                            {coordinator.coordinatorProfile ? (
                              <Badge variant="success">Yes</Badge>
                            ) : (
                              <Badge variant="destructive">No</Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {coordinator.coordinatorProfile && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Managed Programs ({getManagedPrograms().length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {getManagedPrograms().length === 0 ? (
                          <p className="text-muted-foreground">No managed programs found</p>
                        ) : (
                          <div className="space-y-4">
                            {getManagedPrograms().map((program, index) => (
                              <div key={index} className="border rounded-md p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Program Name</Label>
                                    <p className="text-lg font-medium">{program.programName}</p>
                                  </div>
                                  <div>
                                    <Label>Program Code</Label>
                                    <p className="text-lg">{program.programCode}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                  <div>
                                    <Label>Campus</Label>
                                    <p className="text-lg">{program.campusName}</p>
                                  </div>
                                  <div>
                                    <Label>Role</Label>
                                    <p className="text-lg">
                                      <Badge>{program.role}</Badge>
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <Label>Assigned At</Label>
                                  <p className="text-lg">{new Date(program.assignedAt).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Managed Courses ({getManagedCourses().length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {getManagedCourses().length === 0 ? (
                          <p className="text-muted-foreground">No managed courses found</p>
                        ) : (
                          <div className="space-y-4">
                            {getManagedCourses().map((course, index) => (
                              <div key={index} className="border rounded-md p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Course Name</Label>
                                    <p className="text-lg font-medium">{course.courseName}</p>
                                  </div>
                                  <div>
                                    <Label>Course Code</Label>
                                    <p className="text-lg">{course.courseCode}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                  <div>
                                    <Label>Campus</Label>
                                    <p className="text-lg">{course.campusName}</p>
                                  </div>
                                  <div>
                                    <Label>Program</Label>
                                    <p className="text-lg">{course.programName}</p>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <Label>Classes</Label>
                                  {course.classes && course.classes.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {course.classes.map((cls: any, clsIndex: number) => (
                                        <Badge key={clsIndex} variant="outline">
                                          {cls.className}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">No classes assigned</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
