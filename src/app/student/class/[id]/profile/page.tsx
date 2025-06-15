'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClassProfile } from '@/components/student/ClassProfile';
import { api } from '@/trpc/react';
import { useState, useEffect } from 'react';
import { SystemStatus } from '@prisma/client';
import { SubmissionStatus } from '@/server/api/constants';
import type { Prisma } from '@prisma/client';

// Use Prisma.JsonValue instead of JsonValue
type JsonValue = Prisma.JsonValue;

// Define interfaces for our API data models
interface ApiAchievement {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  progress: number;
  total: number;
  unlocked: boolean;
  type: string;
  status: SystemStatus;
  studentId: string;
  classId: string | null;
  subjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  partitionKey: string | null;
  unlockedAt: Date | null;
}

interface ApiLearningGoal {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  total: number;
  status: SystemStatus;
  studentId: string;
  classId: string | null;
  subjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  partitionKey: string | null;
  isCustom: boolean;
}

// Points history is handled directly in the component

interface ApiJourneyEvent {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  metadata: JsonValue;
  type: string;
  status: SystemStatus;
  studentId: string;
  date: Date;
  classId: string | null;
  subjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  partitionKey: string | null;
}

interface ApiPersonalBest {
  id: string;
  title: string;
  icon: string | null;
  metadata: JsonValue;
  type: string;
  value: string;
  status: SystemStatus;
  studentId: string;
  date: Date;
  classId: string | null;
  subjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  partitionKey: string | null;
}

interface ApiCommitmentContract {
  id: string;
  title: string;
  description: string | null;
  metadata: JsonValue;
  status: SystemStatus;
  studentId: string;
  classId: string | null;
  subjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deadline: Date;
  partitionKey: string | null;
  completedAt: Date | null;
}

// Define interfaces that match the component's expected types
interface Achievement {
  id: string;
  title: string;
  description: string;
  type: string;
  progress: number;
  total: number;
  unlocked: boolean;
  unlockedAt?: Date;
  icon?: string;
  classId?: string;
  className?: string;
  subjectId?: string;
  subjectName?: string;
  newlyUnlocked?: boolean;
}

interface LearningGoal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  total: number;
  createdAt: Date;
  isCustom: boolean;
}

interface PointsHistory {
  id: string;
  amount: number;
  source: string;
  description: string;
  createdAt: Date;
  className?: string;
  subjectName?: string;
}

interface JourneyEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'achievement' | 'level' | 'activity' | 'enrollment' | 'milestone';
  icon?: string;
}

interface PersonalBest {
  id: string;
  title: string;
  value: string | number;
  date: Date;
  type: string;
  icon?: string;
}

interface CommitmentContract {
  id: string;
  title: string;
  description: string;
  type: 'activity_completion' | 'grade_achievement' | 'points_earning' | 'leaderboard_position' | 'custom';
  targetValue: number;
  currentValue?: number;
  deadline: Date;
  isCompleted: boolean;
  isVerified: boolean;
  completedAt?: Date;
  createdAt: Date;
  pointsAwarded?: number;
  classId?: string;
  subjectId?: string;
}

// Adapter functions to transform API data to component-expected types
function adaptAchievement(apiAchievement: ApiAchievement): Achievement {
  return {
    id: apiAchievement.id,
    title: apiAchievement.title,
    description: apiAchievement.description,
    type: apiAchievement.type,
    progress: apiAchievement.progress,
    total: apiAchievement.total,
    unlocked: apiAchievement.unlocked,
    unlockedAt: apiAchievement.unlockedAt || undefined,
    icon: apiAchievement.icon || undefined,
    classId: apiAchievement.classId || undefined,
    subjectId: apiAchievement.subjectId || undefined,
  };
}

function adaptLearningGoal(apiLearningGoal: ApiLearningGoal): LearningGoal {
  return {
    id: apiLearningGoal.id,
    title: apiLearningGoal.title,
    description: apiLearningGoal.description || undefined,
    progress: apiLearningGoal.progress,
    total: apiLearningGoal.total,
    createdAt: apiLearningGoal.createdAt,
    isCustom: apiLearningGoal.isCustom,
  };
}

// Points history adapter function is used inline in the component

function adaptJourneyEvent(apiEvent: ApiJourneyEvent): JourneyEvent {
  // Map string type to the expected union type
  const mappedType = (apiEvent.type === 'achievement' ||
                      apiEvent.type === 'level' ||
                      apiEvent.type === 'activity' ||
                      apiEvent.type === 'enrollment' ||
                      apiEvent.type === 'milestone')
                      ? apiEvent.type
                      : 'activity' as const;

  return {
    id: apiEvent.id,
    title: apiEvent.title,
    description: apiEvent.description,
    date: apiEvent.date,
    type: mappedType,
    icon: apiEvent.icon || undefined,
  };
}

function adaptPersonalBest(apiBest: ApiPersonalBest): PersonalBest {
  return {
    id: apiBest.id,
    title: apiBest.title,
    value: apiBest.value,
    date: apiBest.date,
    type: apiBest.type,
    icon: apiBest.icon || undefined,
  };
}

function adaptCommitmentContract(apiContract: ApiCommitmentContract): CommitmentContract {
  // Extract metadata if available
  const metadata = typeof apiContract.metadata === 'object' && apiContract.metadata !== null
    ? apiContract.metadata as Record<string, any>
    : {};

  return {
    id: apiContract.id,
    title: apiContract.title,
    description: apiContract.description || "No description provided",
    type: metadata.type || 'custom',
    targetValue: metadata.targetValue || 1,
    currentValue: metadata.currentValue,
    deadline: apiContract.deadline,
    isCompleted: apiContract.completedAt !== null,
    isVerified: metadata.isVerified || false,
    completedAt: apiContract.completedAt || undefined,
    createdAt: apiContract.createdAt,
    pointsAwarded: metadata.pointsAwarded,
    classId: apiContract.classId || undefined,
    subjectId: apiContract.subjectId || undefined
  };
}

/**
 * Profile page for a specific class in the student portal
 *
 * Features:
 * - Uses enhanced ClassProfile component with UX psychology principles
 * - Clear page title for location awareness
 * - Consistent layout with other class pages
 * - Uses direct API calls instead of ClassContext for better reliability
 * - Implements IKEA Effect, Sunk Cost Effect, and other UX principles
 */
export default function ClassProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const classId = params?.id as string || "";

  // Define type for class data
  type ClassData = {
    className?: string;
    courseName?: string;
    termName?: string;
    averageGrade?: number;
    leaderboardPosition?: number;
    points?: number;
    level?: number;
    attendance?: {
      present: number;
      total: number;
    };
    achievements?: Array<{
      id?: string;
      title?: string;
      description?: string;
    }>;
  };

  // Direct API call for class details
  const {
    data: classData,
    isLoading: isLoadingClass,
    error: classError,
    refetch: refetchClass
  } = api.student.getClassDetails.useQuery(
    { classId },
    {
      enabled: !!classId,
      retry: 1
    }
  ) as { data: ClassData | undefined, isLoading: boolean, error: any, refetch: () => void };

  // State for achievements, learning goals, and points history
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [journeyEvents, setJourneyEvents] = useState<JourneyEvent[]>([]);
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [commitmentContracts, setCommitmentContracts] = useState<CommitmentContract[]>([]);
  const [lastActive, setLastActive] = useState<Date | undefined>(undefined);

  // Get user ID from session
  const userId = session?.user?.id || '';

  // Get student profile using tRPC
  const { data: studentProfile } = api.user.getProfile.useQuery(
    { userId, userType: 'CAMPUS_STUDENT' },
    { enabled: !!userId }
  );

  // Use the actual student profile ID for queries
  const studentId = studentProfile?.id || '';

  // Fetch achievements using tRPC
  const { isLoading: isLoadingAchievements } = api.achievement.getStudentAchievements.useQuery(
    {
      studentId,
      classId
    },
    {
      enabled: !!studentId && !!classId,
      onSuccess: (data) => {
        if (data) {
          // Transform API data to component-expected format
          const adaptedAchievements = data.map(adaptAchievement);
          setAchievements(adaptedAchievements);
        }
      }
    }
  );

  // Fetch points history using tRPC
  const { isLoading: isLoadingPoints } = api.points.getPointsHistory.useQuery(
    {
      studentId,
      classId,
      limit: 10
    },
    {
      enabled: !!studentId && !!classId,
      onSuccess: (data) => {
        if (data) {
          // Transform API data to component-expected format
          // Manual transformation instead of using map with adapter function
          const adaptedPoints = data.map(point => ({
            id: point.id,
            amount: point.amount,
            source: point.source,
            description: point.description || "Points earned",
            createdAt: point.createdAt,
            className: point.classId ? "Your Class" : undefined,
          }));
          setPointsHistory(adaptedPoints);
        }
      }
    }
  );

  // Fetch learning goals using tRPC
  const { isLoading: isLoadingLearningGoals } = api.learningGoal.getStudentLearningGoals.useQuery(
    {
      studentId,
      classId
    },
    {
      enabled: !!studentId && !!classId,
      onSuccess: (data) => {
        if (data) {
          // Transform API data to component-expected format
          const adaptedGoals = data.map(adaptLearningGoal);
          setLearningGoals(adaptedGoals);
        }
      }
    }
  );

  // Fetch journey events using tRPC
  const { isLoading: isLoadingJourneyEvents } = api.journeyEvent.getStudentJourneyEvents.useQuery(
    {
      studentId,
      classId,
      limit: 10
    },
    {
      enabled: !!studentId && !!classId,
      onSuccess: (data) => {
        if (data) {
          // Transform API data to component-expected format
          const adaptedEvents = data.map(adaptJourneyEvent);
          setJourneyEvents(adaptedEvents);
        }
      }
    }
  );

  // Fetch personal bests using tRPC
  const { isLoading: isLoadingPersonalBests } = api.personalBest.getStudentPersonalBests.useQuery(
    {
      studentId,
      classId
    },
    {
      enabled: !!studentId && !!classId,
      onSuccess: (data) => {
        if (data) {
          // Transform API data to component-expected format
          const adaptedBests = data.map(adaptPersonalBest);
          setPersonalBests(adaptedBests);
        }
      }
    }
  );

  // Fetch commitment contracts using tRPC
  const { isLoading: isLoadingCommitmentContracts } = api.commitmentContract.getStudentCommitmentContracts.useQuery(
    {
      studentId,
      classId
    },
    {
      enabled: !!studentId && !!classId,
      onSuccess: (data) => {
        if (data) {
          // Transform API data to component-expected format
          const adaptedContracts = data.map(adaptCommitmentContract);
          setCommitmentContracts(adaptedContracts);
        }
      }
    }
  );

  // Fetch last active date from activity attempts
  const { data: activityAttempts } = api.activityGrade.list.useQuery(
    {
      studentId,
      classId,
      take: 1,
    },
    {
      enabled: !!studentId && !!classId,
      onSuccess: (data) => {
        if (data && data.length > 0) {
          setLastActive(new Date(data[0].updatedAt));
        }
      }
    }
  );

  // tRPC mutations
  const createLearningGoalMutation = api.learningGoal.createLearningGoal.useMutation();
  const updateLearningGoalMutation = api.learningGoal.updateLearningGoal.useMutation();
  const createCommitmentContractMutation = api.commitmentContract.createCommitmentContract.useMutation();
  const completeCommitmentContractMutation = api.commitmentContract.completeCommitmentContract.useMutation();
  const checkAndUpdatePersonalBestMutation = api.personalBest.checkAndUpdatePersonalBest.useMutation();
  const createJourneyEventMutation = api.journeyEvent.createJourneyEvent.useMutation();

  // Handlers for ClassProfile component
  const handleAchievementClick = (achievement: Achievement) => {
    // Show a modal with achievement details
    // This could be implemented with a modal component
    console.log('Achievement clicked:', achievement);
  };

  const handleGoalCreate = (goal: { title: string; description?: string; progress: number; total: number; isCustom: boolean }) => {
    // Create a new learning goal using the tRPC mutation
    createLearningGoalMutation.mutate({
      studentId,
      title: goal.title,
      description: goal.description, // Let it be undefined if not provided
      progress: goal.progress,
      total: goal.total,
      classId,
      isCustom: true
    }, {
      onSuccess: (newGoal) => {
        // Add the new goal to the state
        const adaptedGoal = adaptLearningGoal(newGoal);
        setLearningGoals([adaptedGoal, ...learningGoals]);
      }
    });
  };

  const handleGoalEdit = (goal: LearningGoal) => {
    // Update a learning goal using the tRPC mutation
    updateLearningGoalMutation.mutate({
      id: goal.id,
      title: goal.title,
      description: goal.description, // Let it be undefined if not provided
      progress: goal.progress,
      total: goal.total
    }, {
      onSuccess: (updatedGoal) => {
        // Update the goal in the state
        const adaptedGoal = adaptLearningGoal(updatedGoal);
        setLearningGoals(
          learningGoals.map(g => g.id === adaptedGoal.id ? adaptedGoal : g)
        );
      }
    });
  };

  const handleAvatarChange = (avatarId: string) => {
    // In a real implementation, this would call an API to update the avatar
    // For now, we'll just log it
    console.log('Avatar changed to:', avatarId);
  };

  const handleCommitmentCreate = (commitment: { title: string; description?: string; deadline: Date }) => {
    // Create a new commitment contract using the tRPC mutation
    createCommitmentContractMutation.mutate({
      studentId,
      title: commitment.title,
      description: commitment.description, // Let it be undefined if not provided
      deadline: commitment.deadline,
      classId
    }, {
      onSuccess: (newCommitment) => {
        // Add the new commitment to the state
        const adaptedCommitment = adaptCommitmentContract(newCommitment);
        setCommitmentContracts([adaptedCommitment, ...commitmentContracts]);

        // Check if this is a personal best (e.g., first commitment of this type)
        checkAndUpdatePersonalBestMutation.mutate({
          studentId,
          title: 'Commitments Made',
          value: commitmentContracts.length + 1,
          type: 'commitment_count',
          classId,
          compareFunction: 'greater'
        });
      }
    });
  };

  const handleCommitmentToggle = (id: string, isCompleted: boolean) => {
    if (isCompleted) {
      // Complete a commitment contract using the tRPC mutation
      completeCommitmentContractMutation.mutate(id, {
        onSuccess: (completedCommitment) => {
          // Update the commitment in the state
          const adaptedCommitment = adaptCommitmentContract(completedCommitment);
          setCommitmentContracts(
            commitmentContracts.map(c => c.id === adaptedCommitment.id ? adaptedCommitment : c)
          );

          // Check if this is a personal best (e.g., fastest commitment completion)
          const commitment = commitmentContracts.find(c => c.id === id);
          if (commitment) {
            const completionTime = new Date().getTime() - new Date(commitment.createdAt).getTime();
            const completionDays = Math.floor(completionTime / (1000 * 60 * 60 * 24));

            checkAndUpdatePersonalBestMutation.mutate({
              studentId,
              title: 'Fastest Commitment Completion',
              value: completionDays,
              type: 'commitment_speed',
              classId,
              compareFunction: 'lesser'
            });
          }
        }
      });
    } else {
      // For non-completion, we should use a different mutation
      // This is a placeholder since the original code was using updateLearningGoalMutation
      // which doesn't seem right for commitment contracts
      console.log('Uncommitting commitment:', id);
      // In a real implementation, you would use a proper mutation here
    }
  };

  // Handler for creating journey events
  const handleJourneyEventCreate = (event: Omit<JourneyEvent, 'id'>) => {
    // Create a new journey event using the tRPC mutation
    createJourneyEventMutation.mutate({
      studentId,
      title: event.title,
      description: event.description,
      date: event.date,
      type: event.type,
      classId,
      icon: event.icon,
    }, {
      onSuccess: (newEvent) => {
        // Add the new event to the state
        const adaptedEvent = adaptJourneyEvent(newEvent);
        setJourneyEvents([adaptedEvent, ...journeyEvents]);
      }
    });
  };

  // Determine overall loading state
  const isLoading = isLoadingClass ||
                   isLoadingAchievements ||
                   isLoadingPoints ||
                   isLoadingLearningGoals ||
                   isLoadingJourneyEvents ||
                   isLoadingPersonalBests ||
                   isLoadingCommitmentContracts;

  // Determine if there's an error
  const hasError = !!classError;

  // Get completed activities count
  const { data: completedActivitiesCount } = api.activityGrade.getStudentActivityCount.useQuery(
    {
      studentId,
      classId,
      status: "SUBMITTED" as SubmissionStatus // Using the string value with type assertion
    },
    {
      enabled: !!studentId && !!classId,
    }
  );

  // Get total activities count for the class
  const { data: totalActivitiesData } = api.class.listActivities.useQuery(
    {
      classId,
      status: "ACTIVE" as SystemStatus,
    },
    {
      enabled: !!classId,
    }
  );

  // Get student level data
  const { data: levelData } = api.level.getStudentLevel.useQuery(
    {
      studentId,
      classId,
    },
    {
      enabled: !!studentId && !!classId,
    }
  );

  // Calculate level progress
  const calculateLevelProgress = () => {
    if (levelData) {
      const { currentExp, expToNextLevel } = levelData;
      return Math.min(Math.round((currentExp / expToNextLevel) * 100), 100);
    }
    // Fallback calculation based on points if level data is not available
    if (classData?.points) {
      const currentLevel = classData.level || 1;
      const pointsForCurrentLevel = 100 * (currentLevel - 1) * (currentLevel - 1);
      const pointsForNextLevel = 100 * currentLevel * currentLevel;
      const pointsNeeded = pointsForNextLevel - pointsForCurrentLevel;
      const currentPoints = classData.points - pointsForCurrentLevel;
      return Math.min(Math.round((currentPoints / pointsNeeded) * 100), 100);
    }
    return 0;
  };

  // Prepare stats for ClassProfile component
  const stats = {
    totalPoints: classData?.points || 0,
    level: classData?.level || (levelData?.level || 1),
    levelProgress: calculateLevelProgress(),
    levelTotal: 100,
    attendanceRate: classData?.attendance ?
      (classData.attendance.present / classData.attendance.total) * 100 : 0,
    averageGrade: classData?.averageGrade || 'N/A',
    // Add values for activities with real data
    completedActivities: completedActivitiesCount || 0,
    totalActivities: totalActivitiesData?.items?.length || 0,
    timeInvested: 0 // We don't have real-time data for this yet, so we'll set it to 0
  };

  return (
    <>
      {/* Page title for SEO and browser tab */}
      <Head>
        <title>{classData?.className ? `${classData.className} - Profile` : 'Class Profile'}</title>
      </Head>

      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            View your achievements and progress
          </p>
        </div>

        {isLoading ? (
          // Loading state
          <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center border border-dashed rounded-lg">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg font-medium mb-2">Loading your profile...</p>
            <p className="text-muted-foreground max-w-md">
              Did you know? Tracking your progress helps reinforce learning and increases motivation.
            </p>
          </div>
        ) : hasError ? (
          // Error state with empathetic messaging
          <div className="p-6 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle className="h-4 w-4" />
              <h3 className="font-medium">Unable to load profile</h3>
            </div>
            <p className="text-red-600 mb-3">
              {"We're having trouble loading your profile. This doesn't affect your progress."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchClass()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          // Enhanced ClassProfile component
          <ClassProfile
            classId={classId}
            className={classData?.className || 'Your Class'}
            studentId={studentId}
            studentName={session?.user?.name || 'Student'}
            studentImage={undefined} // User image is not available in the current session type
            achievements={achievements}
            learningGoals={learningGoals}
            pointsHistory={pointsHistory}
            journeyEvents={journeyEvents}
            personalBests={personalBests}
            commitmentContracts={commitmentContracts}
            lastActive={lastActive}
            stats={stats}
            onAchievementClick={handleAchievementClick}
            onGoalCreate={handleGoalCreate}
            onGoalEdit={handleGoalEdit}
            onAvatarChange={handleAvatarChange}
            onCommitmentCreate={handleCommitmentCreate}
            onCommitmentToggle={handleCommitmentToggle}
            onJourneyEventCreate={handleJourneyEventCreate}
          />
        )}
      </div>
    </>
  );
}
