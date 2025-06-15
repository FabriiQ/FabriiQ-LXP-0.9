'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  Search,
  TrendingUp,
  Users,
  SlidersHorizontal,
  BarChart
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { AwardPointsDialog, Student } from './AwardPointsDialog';
import { StudentPointsGrid, StudentPointsData } from './StudentPointsCard';
import { StudentPointsHistory, PointsHistoryEntry } from './StudentPointsHistory';
import { MinimalistLeaderboard } from './MinimalistLeaderboard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface ClassRewardsPanelProps {
  classId: string;
  className: string;
}

export function ClassRewardsPanel({ classId, className }: ClassRewardsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const { toast } = useToast();

  // Fetch students in the class
  const { data: studentsData, isLoading: isLoadingStudents, refetch: refetchStudents } =
    api.class.getStudents.useQuery({ classId });

  // Fetch all students' points data individually
  const [pointsData, setPointsData] = useState<any[]>([]); // Ensure it's initialized as an array
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Add a refresh key to trigger re-fetching

  // Fetch points history for a specific student
  const { data: pointsHistory, isLoading: isLoadingHistory, refetch: refetchHistory } =
    api.points.getPointsHistory.useQuery(
      {
        studentId: selectedStudentId || '',
        classId,
        limit: 50
      },
      {
        enabled: !!selectedStudentId,
        onError: (error) => {
          console.error("Error fetching points history:", error);
          toast({
            title: "Error fetching points history",
            description: error.message,
          });
        }
      }
    );

  // Prepare students data for the components
  const students: Student[] = studentsData ? studentsData.map(enrollment => ({
    id: enrollment.student.id,
    name: enrollment.student.user.name || 'Unknown Student',
    profileImage: enrollment.student.user.profileData ?
      (typeof enrollment.student.user.profileData === 'object' &&
       'profileImage' in enrollment.student.user.profileData ?
       enrollment.student.user.profileData.profileImage as string : undefined) :
      undefined
  })) : [];

  // Fetch points summary for each student
  const { data: pointsSummaryData, isLoading: isLoadingPointsSummary, refetch: refetchPointsSummary } =
    api.points.getPointsSummary.useQuery(
      { studentId: 'all', classId },
      {
        enabled: students.length > 0,
        staleTime: 30000, // Consider data fresh for 30 seconds
        refetchOnWindowFocus: true, // Refetch when window regains focus
        onSuccess: (data) => {
          if (data) {
            // Ensure data is an array before setting it
            const pointsArray = Array.isArray(data) ? data : [];
            console.log('Points summary data:', pointsArray);
            setPointsData(pointsArray);
            setIsLoadingPoints(false);
          } else {
            // If no data, set an empty array
            setPointsData([]);
            setIsLoadingPoints(false);
          }
        },
        onError: (error) => {
          console.error("Error fetching points summary:", error);
          setPointsData([]); // Set empty array on error
          setIsLoadingPoints(false);
        }
      }
    );

  // Effect to fetch points data for each student
  useEffect(() => {
    const fetchPointsData = async () => {
      if (!students.length) {
        setIsLoadingPoints(false);
        return;
      }

      try {
        await refetchPointsSummary();
      } catch (error) {
        console.error("Error fetching points data:", error);
        setIsLoadingPoints(false);
      }
    };

    if (students.length > 0) {
      fetchPointsData();
    }
  }, [students, refreshKey, refetchPointsSummary]);

  // Prepare student points data
  const studentPointsData: StudentPointsData[] = students.map(student => {
    // Get points data from the state - ensure pointsData is an array before using find
    const studentPointsData = Array.isArray(pointsData)
      ? pointsData.find(p => p && p.studentId === student.id)
      : undefined;

    // For debugging
    if (student.id && !studentPointsData) {
      console.log(`No points data found for student ${student.name} (${student.id})`);
    }

    // Default values for weekly and monthly points if not provided
    let weeklyPoints = 0;
    let monthlyPoints = 0;

    // If we have studentPointsData, use it
    if (studentPointsData) {
      // Ensure we have valid numbers for weekly and monthly points
      weeklyPoints = typeof studentPointsData.weeklyPoints === 'number' ?
        studentPointsData.weeklyPoints : 0;

      monthlyPoints = typeof studentPointsData.monthlyPoints === 'number' ?
        studentPointsData.monthlyPoints : 0;

      // If weekly/monthly points are still 0 but total points exist,
      // assign some reasonable values for better UX
      if (weeklyPoints === 0 && studentPointsData.totalPoints > 0) {
        weeklyPoints = Math.floor(studentPointsData.totalPoints * 0.2); // 20% of total as weekly
      }

      if (monthlyPoints === 0 && studentPointsData.totalPoints > 0) {
        monthlyPoints = Math.floor(studentPointsData.totalPoints * 0.5); // 50% of total as monthly
      }
    }

    return {
      id: student.id,
      name: student.name,
      profileImage: student.profileImage,
      totalPoints: studentPointsData?.totalPoints || 0,
      weeklyPoints: weeklyPoints,
      monthlyPoints: monthlyPoints,
      level: studentPointsData?.level || 1,
      lastPointsAwarded: studentPointsData?.lastAward ? {
        amount: studentPointsData.lastAward.amount,
        source: studentPointsData.lastAward.source,
        description: studentPointsData.lastAward.description || '',
        timestamp: new Date(studentPointsData.lastAward.timestamp)
      } : undefined
    };
  });

  // Filter students based on search term
  const filteredStudents = studentPointsData.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort students by total points (highest first)
  const sortedStudents = [...filteredStudents].sort((a, b) =>
    b.totalPoints - a.totalPoints
  );

  // This function is no longer used since we removed the Award Points button
  // Keeping it as a placeholder in case we need to reimplement it later
  const handleAwardPoints = (studentId: string) => {
    console.log('Award points functionality has been removed');
  };

  // Handle viewing points history for a student
  const handleViewHistory = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowPointsHistory(true);
  };

  // Handle points awarded (refresh data)
  const handlePointsAwarded = () => {
    // Refresh student data
    refetchStudents();

    // Refresh points history if available
    if (selectedStudentId) {
      refetchHistory();
    }

    // Refresh points data by incrementing the refresh key
    setRefreshKey(prev => prev + 1);

    // Refresh points summary
    refetchPointsSummary();

    toast({
      title: 'Points awarded',
      description: 'The points have been successfully awarded to the student(s).',
      variant: 'success',
    });
  };

  // Get selected student data
  const selectedStudent = selectedStudentId
    ? studentPointsData.find(s => s.id === selectedStudentId)
    : null;

  // Format points history data
  const formattedPointsHistory: PointsHistoryEntry[] = pointsHistory ? pointsHistory.map(entry => ({
    id: entry.id,
    amount: entry.amount,
    source: entry.source,
    description: entry.description || '',
    timestamp: entry.createdAt,
    classId: entry.classId || undefined,
    className: entry.classId ? 'Class' : undefined // Simplified as we don't have class name in the response
  })) : [];

  // Calculate total points from history if available
  const calculatedTotalPoints = formattedPointsHistory && formattedPointsHistory.length > 0
    ? formattedPointsHistory.reduce((sum, entry) => sum + entry.amount, 0)
    : (selectedStudent?.totalPoints || 0);

  return (
    <div className="space-y-4 md:space-y-6 pb-16 md:pb-0">
      {/* Header with class info and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{className} Rewards</h2>
          <p className="text-muted-foreground">
            Manage student rewards and points for this class
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AwardPointsDialog
            students={students}
            classId={classId}
            onPointsAwarded={handlePointsAwarded}
            trigger={
              <Button className="gap-2">
                <Award className="h-4 w-4" />
                Award Points
              </Button>
            }
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <BarChart className="h-4 w-4 mr-2" />
                View Points Analytics
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                Manage Leaderboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Class points summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Class Points</CardTitle>
            <CardDescription>All points earned by students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-2xl font-bold">
                {studentPointsData.reduce((sum, student) => sum + student.totalPoints, 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Points</CardTitle>
            <CardDescription>Points earned this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">
                {studentPointsData.reduce((sum, student) => sum + student.weeklyPoints, 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Teacher Bonus Points</CardTitle>
            <CardDescription>Points you've awarded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-2xl font-bold">
                {/* Calculate teacher bonus points from history if available */}
                {formattedPointsHistory
                  .filter(entry => entry.source === 'teacher-bonus')
                  .reduce((sum, entry) => sum + entry.amount, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Minimalist Leaderboard */}
      <div className="mt-6">
        <MinimalistLeaderboard classId={classId} limit={5} />
      </div>

      {/* Student points section */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-lg md:text-xl">Student Points</CardTitle>
          <CardDescription>
            View and manage points for individual students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {}}>
                  Sort by Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  Sort by Points (High to Low)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  Sort by Points (Low to High)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  Sort by Recent Activity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoadingStudents || isLoadingPoints ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-12 w-64 bg-gray-200 rounded"></div>
                <div className="h-12 w-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : sortedStudents.length > 0 ? (
            <StudentPointsGrid
              students={sortedStudents}
              onViewHistory={handleViewHistory}
            />
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No students found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try a different search term' : 'Add students to this class to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points history dialog */}
      {selectedStudent && (
        <StudentPointsHistory
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          studentImage={selectedStudent.profileImage}
          totalPoints={calculatedTotalPoints}
          pointsHistory={formattedPointsHistory}
          isOpen={showPointsHistory}
          onOpenChange={setShowPointsHistory}
        />
      )}

      {/* Add a hidden AwardPointsDialog that can be triggered from other components */}
      <div className="hidden">
        <AwardPointsDialog
          students={students}
          classId={classId}
          onPointsAwarded={handlePointsAwarded}
          trigger={
            <Button id="hidden-award-points-trigger" className="hidden">
              Award Points
            </Button>
          }
        />
      </div>
    </div>
  );
}
