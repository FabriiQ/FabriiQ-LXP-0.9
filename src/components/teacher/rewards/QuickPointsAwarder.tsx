'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/atoms/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { cn } from '@/lib/utils';
import {
  ThumbsUp,
  GraduationCap,
  ClipboardList,
  Users,
  Plus,
  CheckCircle2
} from 'lucide-react';

interface QuickPointsAwarderProps {
  classId: string;
}

/**
 * QuickPointsAwarder
 *
 * A minimalist, friction-free interface to award points to students with psychological principles applied:
 * - Picture Superiority Effect: Visual information is remembered better than text
 * - Recognition over Recall: Icons help teachers recognize options rather than recall them
 * - Hick's Law: Reduce choices to speed up decision-making
 * - Fitts's Law: Make touch targets appropriately sized and positioned
 * - Paradox of Choice: Fewer options lead to faster decisions and greater satisfaction
 */
export function QuickPointsAwarder({ classId }: QuickPointsAwarderProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('individual');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(1);
  const [showAllStudents, setShowAllStudents] = useState<boolean>(false);
  const [isAwarding, setIsAwarding] = useState<boolean>(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch students in class
  const { data: classData, isLoading: isLoadingClass } = api.class.getById.useQuery(
    {
      classId,
      include: {
        students: true
      }
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Award points mutation
  const awardPointsMutation = api.points.awardPoints.useMutation({
    onSuccess: () => {
      toast({
        title: 'Points awarded',
        description: activeTab === 'individual'
          ? 'Points have been awarded to the student'
          : activeTab === 'group'
            ? 'Points have been awarded to the selected students'
            : 'Points have been awarded to the whole class',
      });

      // Reset selections
      setSelectedStudent(null);
      setSelectedStudents([]);
      setIsAwarding(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to award points',
        variant: 'error',
      });
      setIsAwarding(false);
    },
  });

  // Handle awarding points
  const handleAwardPoints = async () => {
    setIsAwarding(true);

    try {
      if (activeTab === 'individual' && selectedStudent) {
        await awardPointsMutation.mutateAsync({
          studentId: selectedStudent,
          classId,
          amount: points,
          source: selectedCategory || 'other',
          description: `Awarded ${points} points for ${selectedCategory || 'activity'}`
        });
      } else if (activeTab === 'group' && selectedStudents.length > 0) {
        // Award points to multiple students one by one
        const description = `Awarded ${points} points for ${selectedCategory || 'activity'}`;

        // Process each student sequentially
        for (const studentId of selectedStudents) {
          await awardPointsMutation.mutateAsync({
            studentId,
            classId,
            amount: points,
            source: selectedCategory || 'other',
            description
          });
        }
      } else if (activeTab === 'whole-class' && classData?.students) {
        // Award points to all students in class one by one
        const description = `Awarded ${points} points to whole class for ${selectedCategory || 'activity'}`;
        const allStudentIds = classData.students.map(enrollment => enrollment.studentId);

        // Process each student sequentially
        for (const studentId of allStudentIds) {
          await awardPointsMutation.mutateAsync({
            studentId,
            classId,
            amount: points,
            source: selectedCategory || 'other',
            description
          });
        }
      } else {
        toast({
          title: 'Error',
          description: 'Please select students to award points',
          variant: 'error',
        });
        setIsAwarding(false);
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      toast({
        title: 'Error',
        description: 'Failed to award points',
        variant: 'error',
      });
      setIsAwarding(false);
    }
  };

  // Toggle student selection for group tab
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Check if award button should be enabled
  const canAwardPoints = () => {
    if (isAwarding) return false;

    if (activeTab === 'individual') {
      return !!selectedStudent && !!selectedCategory && points > 0;
    } else if (activeTab === 'group') {
      return selectedStudents.length > 0 && !!selectedCategory && points > 0;
    } else if (activeTab === 'whole-class') {
      return !!selectedCategory && points > 0;
    }

    return false;
  };

  if (isLoadingClass) {
    return <LoadingSkeleton />;
  }

  // Transform student enrollment data to a simpler format
  const students = classData?.students?.map(enrollment => {
    // Get the student ID from the enrollment
    const studentId = enrollment.studentId;

    // Get student data from the user object if available
    const studentName = enrollment.student?.user?.name || 'Student';
    const profileImage = enrollment.student?.user?.profileData?.profileImage;

    return {
      id: studentId,
      name: studentName,
      profileImage: profileImage
    };
  }) || [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Award Points</CardTitle>
        <CardDescription className="text-xs">
          Recognize student achievements with points
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="individual" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="individual" className="text-xs">Individual</TabsTrigger>
            <TabsTrigger value="group" className="text-xs">Group</TabsTrigger>
            <TabsTrigger value="whole-class" className="text-xs">Whole Class</TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            <div className="mt-3">
              {/* Student selection with avatars for visual recognition */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Student</Label>
                  {selectedStudent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => setSelectedStudent(null)}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Visual student selection - Picture Superiority Effect */}
                <div className="flex flex-wrap gap-2">
                  {students.slice(0, 8).map(student => (
                    <div
                      key={student.id}
                      className={cn(
                        "flex flex-col items-center cursor-pointer transition-all p-1 rounded-md",
                        selectedStudent === student.id
                          ? "bg-primary/10 ring-1 ring-primary"
                          : "hover:bg-accent"
                      )}
                      onClick={() => setSelectedStudent(student.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.profileImage} alt={student.name} />
                        <AvatarFallback>{student.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs mt-1 max-w-[60px] text-center truncate">{student.name}</span>
                    </div>
                  ))}

                  {students.length > 8 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 rounded-full"
                      onClick={() => setShowAllStudents(true)}
                    >
                      +{students.length - 8}
                    </Button>
                  )}
                </div>
              </div>

              {/* Visual category selection - Recognition over Recall */}
              <div className="mb-3">
                <Label className="text-xs mb-1 block">Category</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'participation', icon: <ThumbsUp className="h-4 w-4" />, label: 'Participation' },
                    { id: 'behavior', icon: <ThumbsUp className="h-4 w-4" />, label: 'Behavior' },
                    { id: 'academic', icon: <GraduationCap className="h-4 w-4" />, label: 'Academic' },
                    { id: 'homework', icon: <ClipboardList className="h-4 w-4" />, label: 'Homework' },
                    { id: 'teamwork', icon: <Users className="h-4 w-4" />, label: 'Teamwork' },
                    { id: 'other', icon: <Plus className="h-4 w-4" />, label: 'Other' }
                  ].map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      className="h-auto py-2 flex flex-col items-center justify-center gap-1"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.icon}
                      <span className="text-xs">{category.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick point selection - Hick's Law */}
              <div className="mb-3">
                <Label className="text-xs mb-1 block">Points</Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 5, 10].map(value => (
                    <Button
                      key={value}
                      variant={points === value ? "default" : "outline"}
                      size="sm"
                      className="flex-1 min-w-[60px]"
                      onClick={() => setPoints(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="group">
            <div className="mt-3">
              {/* Group student selection */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Select Students</Label>
                  {selectedStudents.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => setSelectedStudents([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {students.map(student => (
                    <div
                      key={student.id}
                      className={cn(
                        "flex flex-col items-center cursor-pointer transition-all p-1 rounded-md relative",
                        selectedStudents.includes(student.id)
                          ? "bg-primary/10 ring-1 ring-primary"
                          : "hover:bg-accent"
                      )}
                      onClick={() => toggleStudentSelection(student.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.profileImage} alt={student.name} />
                        <AvatarFallback>{student.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      {selectedStudents.includes(student.id) && (
                        <CheckCircle2 className="absolute top-0 right-0 h-4 w-4 text-primary bg-white rounded-full" />
                      )}
                      <span className="text-xs mt-1 max-w-[60px] text-center truncate">{student.name}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {selectedStudents.length} students selected
                </div>
              </div>

              {/* Same category and points selection as individual tab */}
              <div className="mb-3">
                <Label className="text-xs mb-1 block">Category</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'participation', icon: <ThumbsUp className="h-4 w-4" />, label: 'Participation' },
                    { id: 'behavior', icon: <ThumbsUp className="h-4 w-4" />, label: 'Behavior' },
                    { id: 'academic', icon: <GraduationCap className="h-4 w-4" />, label: 'Academic' },
                    { id: 'homework', icon: <ClipboardList className="h-4 w-4" />, label: 'Homework' },
                    { id: 'teamwork', icon: <Users className="h-4 w-4" />, label: 'Teamwork' },
                    { id: 'other', icon: <Plus className="h-4 w-4" />, label: 'Other' }
                  ].map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      className="h-auto py-2 flex flex-col items-center justify-center gap-1"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.icon}
                      <span className="text-xs">{category.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <Label className="text-xs mb-1 block">Points</Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 5, 10].map(value => (
                    <Button
                      key={value}
                      variant={points === value ? "default" : "outline"}
                      size="sm"
                      className="flex-1 min-w-[60px]"
                      onClick={() => setPoints(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whole-class">
            <div className="mt-3">
              {/* Whole class info */}
              <div className="mb-3 bg-muted/30 p-3 rounded-md">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium">{classData?.name || 'Class'}</h4>
                    <p className="text-xs text-muted-foreground">{students.length} students</p>
                  </div>
                </div>
              </div>

              {/* Same category and points selection as other tabs */}
              <div className="mb-3">
                <Label className="text-xs mb-1 block">Category</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'participation', icon: <ThumbsUp className="h-4 w-4" />, label: 'Participation' },
                    { id: 'behavior', icon: <ThumbsUp className="h-4 w-4" />, label: 'Behavior' },
                    { id: 'academic', icon: <GraduationCap className="h-4 w-4" />, label: 'Academic' },
                    { id: 'homework', icon: <ClipboardList className="h-4 w-4" />, label: 'Homework' },
                    { id: 'teamwork', icon: <Users className="h-4 w-4" />, label: 'Teamwork' },
                    { id: 'other', icon: <Plus className="h-4 w-4" />, label: 'Other' }
                  ].map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      className="h-auto py-2 flex flex-col items-center justify-center gap-1"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.icon}
                      <span className="text-xs">{category.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <Label className="text-xs mb-1 block">Points</Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 5, 10].map(value => (
                    <Button
                      key={value}
                      variant={points === value ? "default" : "outline"}
                      size="sm"
                      className="flex-1 min-w-[60px]"
                      onClick={() => setPoints(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          onClick={handleAwardPoints}
          disabled={!canAwardPoints() || isAwarding}
          className="w-full"
        >
          {isAwarding ? 'Awarding...' : 'Award Points'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-60 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-full mb-4" />
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-14" />
            ))}
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
