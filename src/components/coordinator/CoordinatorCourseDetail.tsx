'use client';

import React, { useState, useEffect } from "react";
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  Home as Building,
  Calendar,
  Clock,
  FileText,
  Settings,
  ChevronLeft,
  Edit,
  List,
  BookOpen as BookMark,
  Award as TrophyIcon,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";

interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  level: number;
  credits: number;
  status: SystemStatus;
  programId: string;
  settings: any;
  syllabus: any;
  campusOfferings: {
    id: string;
    campusId: string;
    campus: {
      id: string;
      name: string;
      code: string;
    };
  }[];
  subjects: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    status: SystemStatus;
  }[];
}

interface CoordinatorCourseDetailProps {
  courseId: string;
  course?: Course;
  isLoading?: boolean;
  programName?: string;
}

export function CoordinatorCourseDetail({
  courseId,
  course: initialCourse,
  isLoading: initialLoading = false,
  programName: initialProgramName = "Program"
}: CoordinatorCourseDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [course, setCourse] = useState<Course | undefined>(initialCourse);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [programName, setProgramName] = useState(initialProgramName);
  const [editFormData, setEditFormData] = useState({
    name: initialCourse?.name || "",
    description: initialCourse?.description || "",
    credits: initialCourse?.credits || 0,
    level: initialCourse?.level || 0
  });

  // Use offline storage for course data
  const {
    isOnline,
    getData: getCourseData,
    saveData: saveCourseData
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Fetch course data
  useEffect(() => {
    if (initialCourse) {
      setCourse(initialCourse);
      return;
    }

    const fetchCourseData = async () => {
      setIsLoading(true);

      try {
        // In a real implementation, this would be an API call
        // For now, we'll simulate it with a timeout
        setTimeout(() => {
          // Mock course data
          const mockCourse: Course = {
            id: courseId,
            name: "Mathematics 101",
            code: "MATH101",
            description: "Introduction to basic mathematical concepts and principles",
            level: 1,
            credits: 3,
            status: SystemStatus.ACTIVE,
            programId: "prog-1",
            settings: {},
            syllabus: {
              overview: "This course provides an introduction to basic mathematical concepts and principles.",
              objectives: [
                "Understand basic algebraic operations",
                "Solve linear equations and inequalities",
                "Apply mathematical concepts to real-world problems"
              ],
              topics: [
                "Numbers and operations",
                "Algebraic expressions",
                "Linear equations",
                "Inequalities",
                "Functions and graphs"
              ],
              assessmentMethods: "Quizzes, midterm exam, final exam, and homework assignments"
            },
            campusOfferings: [
              {
                id: "co-1",
                campusId: "campus-1",
                campus: {
                  id: "campus-1",
                  name: "Main Campus",
                  code: "MC"
                }
              },
              {
                id: "co-2",
                campusId: "campus-2",
                campus: {
                  id: "campus-2",
                  name: "Downtown Campus",
                  code: "DC"
                }
              }
            ],
            subjects: [
              {
                id: "subj-1",
                name: "Algebra",
                code: "ALG",
                description: "Basic algebraic operations and equations",
                status: SystemStatus.ACTIVE
              },
              {
                id: "subj-2",
                name: "Functions",
                code: "FUNC",
                description: "Introduction to functions and their graphs",
                status: SystemStatus.ACTIVE
              }
            ]
          };

          setCourse(mockCourse);
          setProgramName("Science Program");

          // Update edit form data
          setEditFormData({
            name: mockCourse.name,
            description: mockCourse.description || "",
            credits: mockCourse.credits,
            level: mockCourse.level
          });

          // Save to offline storage
          saveCourseData('course', courseId, mockCourse);

          setIsLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error fetching course data:', error);

        // Try to get data from offline storage
        try {
          const offlineCourse = await getCourseData('course', courseId);
          if (offlineCourse) {
            setCourse(offlineCourse);
            setProgramName("Science Program"); // This would come from the API in a real implementation

            // Update edit form data
            setEditFormData({
              name: offlineCourse.name,
              description: offlineCourse.description || "",
              credits: offlineCourse.credits,
              level: offlineCourse.level
            });
          }
        } catch (offlineError) {
          console.error('Error getting offline course data:', offlineError);
          toast({
            title: "Error",
            description: "Failed to load course data",
            variant: "error",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCourseData();
  }, [courseId, initialCourse]);

  // Update course mutation
  const updateCourse = api.course.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course updated successfully",
        variant: "success",
      });
      setIsEditDialogOpen(false);
      // Refresh the page to show updated data
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update course",
        variant: "error",
      });
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!course) {
    return (
      <EmptyState
        title="Course Not Found"
        description="The requested course could not be found or you don't have access to it."
        icon={<BookOpen className="h-10 w-10" />}
      />
    );
  }

  // Get course settings and syllabus
  const settings = course.settings || {};
  const syllabus = course.syllabus || {};
  const description = course.description || "No description available";

  // Handle opening the edit dialog
  const handleEditClick = () => {
    setEditFormData({
      name: course.name,
      description: course.description || "",
      credits: course.credits,
      level: course.level
    });
    setIsEditDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'credits' || name === 'level' ? parseFloat(value) : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateCourse.mutateAsync({
        id: course.id,
        name: editFormData.name,
        description: editFormData.description,
        credits: editFormData.credits,
        level: editFormData.level
      });
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error("Error updating course:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.push(`/admin/coordinator/programs/${course.programId}/courses`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{course.name}</h1>
            <p className="text-muted-foreground">{programName} • Course Code: {course.code}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/coordinator/courses/${course.id}/leaderboard`)}
          >
            <TrophyIcon className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
          <Button
            variant="outline"
            onClick={handleEditClick}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Course
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Course Code</p>
                  <p className="font-medium">{course.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="font-medium">{course.level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits</p>
                  <p className="font-medium">{course.credits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Subjects</p>
                    <p className="text-2xl font-bold">{course.subjects?.length || 0}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Campuses</p>
                    <p className="text-2xl font-bold">{course.campusOfferings?.length || 0}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={course.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {course.status}
                    </Badge>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Program</p>
                    <p className="text-lg font-medium truncate">{programName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campus Offerings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {course.campusOfferings && course.campusOfferings.length > 0 ? (
                  course.campusOfferings.map((offering) => (
                    <div key={offering.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{offering.campus.name}</span>
                      </div>
                      <Badge variant="outline">{offering.campus.code}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No campus offerings available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Course Subjects</h2>
            <Button onClick={() => router.push(`/admin/coordinator/courses/${course.id}/subjects`)}>
              Manage Subjects
            </Button>
          </div>

          {course.subjects && course.subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.subjects.map((subject) => (
                <Card key={subject.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription>{subject.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      {subject.description || "No description available"}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/admin/coordinator/subjects/${subject.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Subjects"
              description="This course doesn't have any subjects yet."
              icon={<BookOpen className="h-10 w-10" />}
              action={
                <Button onClick={() => router.push(`/admin/coordinator/courses/${course.id}/subjects`)}>
                  Add Subject
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Syllabus</CardTitle>
              <CardDescription>
                Syllabus and learning objectives for {course.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {syllabus && Object.keys(syllabus).length > 0 ? (
                <>
                  {syllabus.overview && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Overview</h3>
                      <p className="text-muted-foreground">{syllabus.overview}</p>
                    </div>
                  )}

                  {syllabus.objectives && syllabus.objectives.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Learning Objectives</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {syllabus.objectives.map((objective: string, index: number) => (
                          <li key={index} className="text-muted-foreground">{objective}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {syllabus.topics && syllabus.topics.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Topics Covered</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {syllabus.topics.map((topic: string, index: number) => (
                          <li key={index} className="text-muted-foreground">{topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {syllabus.assessmentMethods && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Assessment Methods</h3>
                      <p className="text-muted-foreground">{syllabus.assessmentMethods}</p>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="No Syllabus"
                  description="This course doesn't have a syllabus yet."
                  icon={<BookMark className="h-10 w-10" />}
                  action={
                    <Button onClick={handleEditClick}>
                      Add Syllabus
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Schedule</CardTitle>
              <CardDescription>
                Class schedules for {course.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="No Schedule"
                description="No class schedules are available for this course."
                icon={<Calendar className="h-10 w-10" />}
                action={
                  <Button onClick={() => router.push(`/admin/coordinator/schedules?courseId=${course.id}`)}>
                    View Schedules
                  </Button>
                }
              />
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/coordinator/schedules/new?courseId=${course.id}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update the course details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credits" className="text-right">
                  Credits
                </Label>
                <Input
                  id="credits"
                  name="credits"
                  type="number"
                  value={editFormData.credits}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="level" className="text-right">
                  Level
                </Label>
                <Input
                  id="level"
                  name="level"
                  type="number"
                  value={editFormData.level}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCourse.isLoading}>
                {updateCourse.isLoading ? <LoadingSpinner /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
