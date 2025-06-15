'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

// Import custom icons to replace missing Lucide icons
import { Target, Star, Zap, Trophy } from '@/components/ui/icons/reward-icons';
import { PlusCircle } from '@/components/ui/icons-fix';

// Custom icon for Coins
const Coins = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="8" cy="8" r="6" />
    <circle cx="16" cy="16" r="6" />
  </svg>
);

// Custom icon for GraduationCap
const GraduationCap = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

// Custom icon implementations for missing icons
const Lock = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const Sparkles = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3l1.88 5.76a1 1 0 0 0 .95.69h6.08a1 1 0 0 1 .59 1.8l-4.93 3.58a1 1 0 0 0-.36 1.12l1.88 5.76a1 1 0 0 1-1.54 1.12l-4.93-3.58a1 1 0 0 0-1.18 0l-4.93 3.58a1 1 0 0 1-1.54-1.12l1.88-5.76a1 1 0 0 0-.36-1.12l-4.93-3.58a1 1 0 0 1 .59-1.8h6.08a1 1 0 0 0 .95-.69L12 3z" />
  </svg>
);

const History = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import existing components we'll reuse
import { LazyAchievementGrid } from '@/components/rewards/LazyAchievementGrid';
import { LineChart } from '@/components/ui/charts/LineChart';
import { JourneyGenerator } from './JourneyGenerator';

// Import Lucide icons
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Edit,
  TrendingUp,
  User
} from 'lucide-react';

// Define interfaces for our component
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
  targetValue: number; // e.g., number of activities, grade percentage, points to earn
  currentValue?: number; // current progress toward the target
  deadline: Date;
  isCompleted: boolean;
  isVerified: boolean; // whether the completion has been verified
  completedAt?: Date;
  createdAt: Date;
  pointsAwarded?: number;
  classId?: string;
  subjectId?: string;
}

interface ClassProfileProps {
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  studentImage?: string;
  achievements: Achievement[];
  learningGoals: LearningGoal[];
  pointsHistory: PointsHistory[];
  journeyEvents?: JourneyEvent[];
  personalBests?: PersonalBest[];
  commitmentContracts?: CommitmentContract[];
  lastActive?: Date;
  stats: {
    totalPoints: number;
    level: number;
    levelProgress: number;
    levelTotal: number;
    attendanceRate: number;
    averageGrade: string | number;
    completedActivities: number;
    totalActivities: number;
    timeInvested?: number; // in minutes
  };
  onAchievementClick?: (achievement: Achievement) => void;
  onGoalCreate?: (goal: Omit<LearningGoal, 'id' | 'createdAt'>) => void;
  onGoalEdit?: (goal: LearningGoal) => void;
  onAvatarChange?: (avatarId: string) => void;
  onCommitmentCreate?: (commitment: Omit<CommitmentContract, 'id' | 'createdAt' | 'isCompleted' | 'isVerified' | 'completedAt' | 'pointsAwarded'>) => void;
  onCommitmentToggle?: (id: string, isCompleted: boolean) => void;
  onJourneyEventCreate?: (event: Omit<JourneyEvent, 'id'>) => void;
  onPointsAward?: (studentId: string, amount: number, source: string, description: string) => void;
}

/**
 * ClassProfile component displays a student's profile for a specific class
 * Implements UX psychology principles:
 * - IKEA Effect: Customizable avatar and learning goals
 * - Sunk Cost Effect: Showing accumulated points and achievements
 * - Endowed Progress Effect: Showing partially completed achievements
 * - Goal Gradient Effect: "X away from unlocking" messages
 * - Chunking: Grouping achievements into themed collections
 */
export function ClassProfile({
  classId,
  className,
  studentId,
  studentName,
  studentImage,
  achievements = [],
  learningGoals = [],
  pointsHistory = [],
  journeyEvents = [],
  personalBests = [],
  commitmentContracts = [],
  lastActive,
  stats,
  onAchievementClick,
  onGoalCreate,
  onGoalEdit,
  onAvatarChange,
  onCommitmentCreate,
  onCommitmentToggle,
  onJourneyEventCreate,
  onPointsAward
}: ClassProfileProps) {
  // Session is not needed in this component
  const { toast } = useToast();

  // State for avatar customization
  const [isCustomizingAvatar, setIsCustomizingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(studentImage);

  // State for learning goals
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalTotal, setNewGoalTotal] = useState(100);

  // State for commitment contracts
  const [isAddingCommitment, setIsAddingCommitment] = useState(false);
  const [newCommitmentTitle, setNewCommitmentTitle] = useState('');
  const [newCommitmentDescription, setNewCommitmentDescription] = useState('');
  const [newCommitmentType, setNewCommitmentType] = useState<'activity_completion' | 'grade_achievement' | 'points_earning' | 'leaderboard_position' | 'custom'>('activity_completion');
  const [newCommitmentTargetValue, setNewCommitmentTargetValue] = useState(5); // Default to 5 activities
  const [newCommitmentDeadline, setNewCommitmentDeadline] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 1 week from now

  // Handler for commitment completion
  const handleCommitmentComplete = async (id: string, isCompleted: boolean) => {
    // Find the commitment that was completed
    const commitment = commitmentContracts?.find(c => c.id === id);

    if (!commitment) return;

    // Determine if the commitment has been fulfilled based on its type and target
    let isVerified = false;
    let verificationMessage = '';

    if (isCompleted) {
      const completedAt = new Date();

      // Verify different commitment types
      switch (commitment.type) {
        case 'activity_completion':
          // Check if the student has completed enough activities
          const activitiesCompleted = stats.completedActivities;
          isVerified = activitiesCompleted >= commitment.targetValue;
          verificationMessage = isVerified
            ? `You've completed ${activitiesCompleted} activities, meeting your goal of ${commitment.targetValue}!`
            : `You've only completed ${activitiesCompleted} activities out of your goal of ${commitment.targetValue}.`;
          break;

        case 'grade_achievement':
          // Check if the student has achieved the target grade
          // This is simplified - in a real app, you'd convert letter grades to numbers if needed
          const currentGrade = typeof stats.averageGrade === 'number' ? stats.averageGrade : 0;
          isVerified = currentGrade >= commitment.targetValue;
          verificationMessage = isVerified
            ? `You've achieved a grade of ${stats.averageGrade}, meeting your goal of ${commitment.targetValue}!`
            : `Your current grade is ${stats.averageGrade}, below your goal of ${commitment.targetValue}.`;
          break;

        case 'points_earning':
          // Check if the student has earned enough points
          isVerified = stats.totalPoints >= commitment.targetValue;
          verificationMessage = isVerified
            ? `You've earned ${stats.totalPoints} points, meeting your goal of ${commitment.targetValue}!`
            : `You've only earned ${stats.totalPoints} points out of your goal of ${commitment.targetValue}.`;
          break;

        case 'leaderboard_position':
          // This would need to be implemented with actual leaderboard position data
          // For now, we'll just use a placeholder
          const currentPosition = 5; // Placeholder
          isVerified = currentPosition <= commitment.targetValue;
          verificationMessage = isVerified
            ? `You've reached position ${currentPosition} on the leaderboard, meeting your goal of ${commitment.targetValue}!`
            : `Your current position is ${currentPosition}, which hasn't reached your goal of ${commitment.targetValue} yet.`;
          break;

        case 'custom':
          // Custom commitments require manual verification
          isVerified = true; // Auto-verify custom commitments when marked complete
          verificationMessage = `Your custom commitment has been marked as complete!`;
          break;
      }

      // Calculate points to award based on commitment type and difficulty
      const basePoints = 50;
      const difficultyMultiplier = commitment.type === 'grade_achievement' ? 2 :
                                  commitment.type === 'leaderboard_position' ? 1.5 : 1;
      const pointsToAward = Math.round(basePoints * difficultyMultiplier);

      // Call the original toggle handler with verification status
      onCommitmentToggle?.(id, isCompleted);

      if (isVerified) {
        // Create a journey event for the verified commitment
        if (onJourneyEventCreate) {
          onJourneyEventCreate({
            title: "Commitment Fulfilled",
            description: `${verificationMessage}`,
            date: completedAt,
            type: 'milestone'
          });
        }

        // Award points for completing the verified commitment
        if (onPointsAward) {
          onPointsAward(
            studentId,
            pointsToAward,
            'commitment',
            `Completed commitment: ${commitment.title}`
          );

          // Show success toast
          toast({
            title: "Commitment Verified!",
            description: `${verificationMessage} You earned ${pointsToAward} points!`,
            duration: 5000
          });
        }
      } else {
        // Show a toast explaining why the commitment couldn't be verified
        toast({
          title: "Commitment Not Yet Fulfilled",
          description: verificationMessage,
          variant: "error",
          duration: 5000
        });
      }
    }
  };

  // State for showing "investment protected" message
  const [showInvestmentMessage, setShowInvestmentMessage] = useState(false);

  // State for achievement sharing
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');

  // Check if user has been inactive for a while (Sunk Cost Effect)
  useEffect(() => {
    if (lastActive) {
      const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceActive > 7) { // If inactive for more than a week
        setShowInvestmentMessage(true);
      }
    }
  }, [lastActive]);

  // Generate share URL for achievements
  const generateShareUrl = (achievement: Achievement) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/achievement/${achievement.id}?student=${encodeURIComponent(studentName)}&class=${encodeURIComponent(className)}`;
  };

  // Handle share button click
  const handleShareAchievement = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShareUrl(generateShareUrl(achievement));
  };

  // Copy share URL to clipboard
  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          toast({
            title: "Link Copied!",
            description: "Share link has been copied to clipboard",
            duration: 3000
          });
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          toast({
            title: "Copy Failed",
            description: "Could not copy the link. Please try again.",
            variant: "error",
            duration: 3000
          });
        });
    }
  };

  // Share achievement to social media
  const shareToSocial = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    if (!selectedAchievement || !shareUrl) return;

    const text = `I just earned the "${selectedAchievement.title}" achievement in ${className}!`;
    let socialUrl = '';

    switch (platform) {
      case 'twitter':
        socialUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        socialUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(text)}`;
        break;
    }

    if (socialUrl) {
      window.open(socialUrl, '_blank', 'width=600,height=400');
    }
  };

  // Group achievements by type (Chunking principle)
  const achievementTypes = Array.from(new Set(achievements.map(a => a.type)));

  // Calculate next milestone (Goal Gradient Effect)
  const nextAchievement = achievements
    .filter(a => !a.unlocked)
    .sort((a, b) => (b.progress / b.total) - (a.progress / a.total))[0];

  // Calculate points trend
  const pointsTrend = pointsHistory.length > 1
    ? pointsHistory[0].amount - pointsHistory[1].amount
    : 0;

  // Format points history data for the line chart
  const pointsTrendData = React.useMemo(() => {
    // Group points by date (day)
    const pointsByDate = pointsHistory.reduce((acc, point) => {
      const date = new Date(point.createdAt).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, total: 0 };
      }
      acc[date].total += point.amount;
      return acc;
    }, {} as Record<string, { date: string; total: number }>);

    // Convert to array and sort by date
    return Object.values(pointsByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Show last 7 days with data
  }, [pointsHistory]);

  // Format time invested
  const formatTimeInvested = (minutes?: number) => {
    if (!minutes) return 'N/A';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes} minutes`;
    if (remainingMinutes === 0) return `${hours} hours`;
    return `${hours} hours, ${remainingMinutes} minutes`;
  };

  return (
    <div className="space-y-6">
      {/* Achievement Sharing Dialog */}
      <Dialog>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Achievement</DialogTitle>
            <DialogDescription>
              {selectedAchievement && (
                <div className="text-center py-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-3">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{selectedAchievement.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAchievement.description}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 mb-4">
            <div className="grid flex-1 gap-2">
              <label htmlFor="share-link" className="sr-only">Share link</label>
              <input
                id="share-link"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={shareUrl}
                readOnly
              />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={copyShareUrl}>
              <span className="sr-only">Copy</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM11 2V2.25C11 2.66421 10.6642 3 10.25 3H4.75C4.33579 3 4 2.66421 4 2.25V2H3.5C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Button>
          </div>

          <div className="flex justify-center space-x-4 mt-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700"
                    onClick={() => shareToSocial('twitter')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share on Twitter</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-blue-800 text-white hover:bg-blue-900"
                    onClick={() => shareToSocial('facebook')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8.615v-6.96h-2.338v-2.725h2.338v-2c0-2.325 1.42-3.592 3.5-3.592.699-.002 1.399.034 2.095.107v2.42h-1.435c-1.128 0-1.348.538-1.348 1.325v1.735h2.697l-.35 2.725h-2.348V21H20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share on Facebook</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => shareToSocial('linkedin')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share on LinkedIn</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogContent>
      </Dialog>

      {/* Investment Protected Message (Sunk Cost Effect) */}
      <AnimatePresence>
        {showInvestmentMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="rounded-full p-2 bg-amber-100 text-amber-600 flex-shrink-0">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-amber-800">Welcome Back!</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    You've already invested {formatTimeInvested(stats.timeInvested)} in this class.
                    Your progress is protected and ready for you to continue your learning journey.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                    onClick={() => setShowInvestmentMessage(false)}
                  >
                    Continue Learning
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto p-1 h-auto text-amber-700 hover:bg-amber-100"
                  onClick={() => setShowInvestmentMessage(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Information Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <Avatar className="h-16 w-16 mr-4">
              {studentImage ? (
                <AvatarImage src={studentImage} alt={studentName} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">
                  {studentName ? studentName.substring(0, 2).toUpperCase() : 'ST'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{studentName}</h3>
              <p className="text-sm text-muted-foreground">{className}</p>

              {/* IKEA Effect: Allow avatar customization */}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setIsCustomizingAvatar(!isCustomizingAvatar)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Customize Avatar
              </Button>
            </div>
          </div>

          {/* Avatar customization options (IKEA Effect) */}
          {isCustomizingAvatar && (
            <div className="mt-4 p-4 border rounded-md">
              <h4 className="font-medium mb-2">Choose Your Avatar</h4>
              <div className="flex flex-wrap gap-2">
                {/* Placeholder for avatar options */}
                {['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5'].map((avatarId) => (
                  <Avatar
                    key={avatarId}
                    className={cn(
                      "h-12 w-12 cursor-pointer transition-all",
                      selectedAvatar === avatarId && "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      setSelectedAvatar(avatarId);
                      onAvatarChange?.(avatarId);
                    }}
                  >
                    <AvatarImage src={`/avatars/${avatarId}.png`} alt={`Avatar ${avatarId}`} />
                    <AvatarFallback>{avatarId.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCustomizingAvatar(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Performance stats - Mobile responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-3">
              {/* Level and Progress - Animated on mobile */}
              <motion.div
                className="flex justify-between items-center"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-sm text-muted-foreground">Level</span>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">Level {stats.level}</Badge>
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
              </motion.div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-xs sm:text-sm">Progress to Level {stats.level + 1}</span>
                  <span className="text-xs sm:text-sm">{stats.levelProgress}/{stats.levelTotal}</span>
                </div>
                <Progress
                  value={(stats.levelProgress / stats.levelTotal) * 100}
                  className="h-2"
                />
              </div>

              <motion.div
                className="flex justify-between items-center pt-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-sm text-muted-foreground">Total Points</span>
                <div className="flex items-center">
                  <span className="font-medium">{stats.totalPoints}</span>
                  {pointsTrend > 0 && (
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{pointsTrend}
                    </Badge>
                  )}
                </div>
              </motion.div>

              {/* Sunk Cost Effect: Display time invested */}
              {stats.timeInvested && (
                <motion.div
                  className="flex justify-between items-center pt-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="text-sm text-muted-foreground">Time Invested</span>
                  <div className="flex items-center">
                    <span className="font-medium">{formatTimeInvested(stats.timeInvested)}</span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-3">
              <motion.div
                className="flex justify-between items-center"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-sm text-muted-foreground">Attendance Rate</span>
                <Badge
                  variant="outline"
                  className={cn(
                    stats.attendanceRate >= 90 ? "bg-green-50 text-green-700 border-green-200" :
                    stats.attendanceRate >= 75 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-red-50 text-red-700 border-red-200"
                  )}
                >
                  {stats.attendanceRate}%
                </Badge>
              </motion.div>

              <motion.div
                className="flex justify-between items-center"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-sm text-muted-foreground">Average Grade</span>
                <Badge variant="outline">{stats.averageGrade}</Badge>
              </motion.div>

              <motion.div
                className="flex justify-between items-center"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-sm text-muted-foreground">Activities Completed</span>
                <span className="font-medium">{stats.completedActivities}/{stats.totalActivities}</span>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content tabs - Mobile responsive */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-0">
          <TabsTrigger value="achievements" className="text-xs sm:text-sm">Achievements</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs sm:text-sm">Learning Goals</TabsTrigger>
          <TabsTrigger value="points" className="text-xs sm:text-sm">Points</TabsTrigger>
          <TabsTrigger value="journey" className="text-xs sm:text-sm">Journey</TabsTrigger>
          <TabsTrigger value="bests" className="text-xs sm:text-sm">Personal Bests</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          {/* Next milestone section (Goal Gradient Effect) */}
          {nextAchievement && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Next Achievement
                </CardTitle>
                <CardDescription>
                  You're getting close to unlocking a new achievement!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-blue-100 text-blue-600">
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{nextAchievement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{nextAchievement.description}</p>

                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{nextAchievement.progress} of {nextAchievement.total}</span>
                        <span className="text-blue-600 font-medium">
                          {/* Goal Gradient Effect: X away from unlocking */}
                          {nextAchievement.total - nextAchievement.progress} away from unlocking!
                        </span>
                      </div>
                      <Progress
                        value={(nextAchievement.progress / nextAchievement.total) * 100}
                        className="h-2 bg-blue-100"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievement categories (Chunking principle) */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              {achievementTypes.map(type => (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type.replace('-', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <LazyAchievementGrid
                achievements={achievements}
                onAchievementClick={onAchievementClick}
                onAchievementShare={handleShareAchievement}
                showShareButtons={true}
              />
            </TabsContent>

            {achievementTypes.map(type => (
              <TabsContent key={type} value={type}>
                <LazyAchievementGrid
                  achievements={achievements.filter(a => a.type === type)}
                  onAchievementClick={onAchievementClick}
                  onAchievementShare={handleShareAchievement}
                  showShareButtons={true}
                />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* Learning Goals Tab (IKEA Effect) */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  My Learning Goals
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsAddingGoal(true)}
                  disabled={isAddingGoal}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>
              <CardDescription>
                Set and track your personal learning goals for this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Form to add new goal (IKEA Effect) */}
              {isAddingGoal && (
                <div className="mb-6 p-4 border rounded-md">
                  <h4 className="font-medium mb-3">Create New Learning Goal</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Goal Title</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="e.g., Master algebra equations"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                      <textarea
                        className="w-full p-2 border rounded-md"
                        value={newGoalDescription}
                        onChange={(e) => setNewGoalDescription(e.target.value)}
                        placeholder="Describe your goal in more detail"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Target Value</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md"
                        value={newGoalTotal}
                        onChange={(e) => setNewGoalTotal(parseInt(e.target.value) || 100)}
                        min={1}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingGoal(false);
                          setNewGoalTitle('');
                          setNewGoalDescription('');
                          setNewGoalTotal(100);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newGoalTitle.trim()) {
                            onGoalCreate?.({
                              title: newGoalTitle,
                              description: newGoalDescription,
                              progress: 0,
                              total: newGoalTotal,
                              isCustom: true
                            });
                            setIsAddingGoal(false);
                            setNewGoalTitle('');
                            setNewGoalDescription('');
                            setNewGoalTotal(100);
                          }
                        }}
                        disabled={!newGoalTitle.trim()}
                      >
                        Create Goal
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Display learning goals */}
              {learningGoals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium">No Learning Goals Yet</h3>
                  <p className="mt-1">Create your first learning goal to track your progress</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {learningGoals.map(goal => (
                    <div key={goal.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium flex items-center">
                            {goal.title}
                            {goal.isCustom && (
                              <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
                                Custom
                              </Badge>
                            )}
                          </h4>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                        </div>
                        {goal.isCustom && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => onGoalEdit?.(goal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress: {goal.progress} of {goal.total}</span>
                          <span>{Math.round((goal.progress / goal.total) * 100)}%</span>
                        </div>
                        <Progress value={(goal.progress / goal.total) * 100} className="h-2" />
                      </div>

                      {/* Goal Gradient Effect: Show how close they are */}
                      {goal.progress < goal.total && (
                        <p className="text-sm text-blue-600 mt-2">
                          {goal.total - goal.progress} more to reach your goal!
                        </p>
                      )}

                      {goal.progress >= goal.total && (
                        <div className="flex items-center text-green-600 mt-2 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Goal completed!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Points History Tab (Sunk Cost Effect) */}
        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Zap className="h-5 w-5 mr-2 text-primary" />
                Points History
              </CardTitle>
              <CardDescription>
                Track your points earned in this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pointsHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium">No Points History Yet</h3>
                  <p className="mt-1">Complete activities to earn points</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Points trend visualization */}
                  <Card className="bg-gradient-to-r from-teal-50 to-green-50 border-teal-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-teal-600" />
                        Points Trend
                      </h4>

                      {pointsTrendData.length > 0 ? (
                        <LineChart
                          data={pointsTrendData}
                          lines={[
                            { dataKey: 'total', name: 'Points', color: '#0d9488' }
                          ]}
                          xAxisKey="date"
                          height={150}
                          showLegend={false}
                        />
                      ) : (
                        <div className="h-32 bg-white rounded-md border flex items-center justify-center">
                          <p className="text-muted-foreground">Not enough data to show trend</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent points history */}
                  <div>
                    <h4 className="font-medium mb-3">Recent Points</h4>
                    <div className="space-y-3">
                      {pointsHistory.slice(0, 5).map(point => (
                        <div key={point.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "rounded-full p-2 flex items-center justify-center",
                              point.source === 'activity' ? "bg-blue-100 text-blue-600" :
                              point.source === 'login' ? "bg-green-100 text-green-600" :
                              point.source === 'streak' ? "bg-purple-100 text-purple-600" :
                              "bg-gray-100 text-gray-600"
                            )}>
                              {point.source === 'activity' ? <BookOpen className="h-4 w-4" /> :
                               point.source === 'login' ? <Clock className="h-4 w-4" /> :
                               point.source === 'streak' ? <Calendar className="h-4 w-4" /> :
                               <Star className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {/* Positive framing */}
                                {point.description || `Earned points from ${point.source}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(point.createdAt).toLocaleDateString()}
                                {point.className && ` • ${point.className}`}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                            +{point.amount}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {pointsHistory.length > 5 && (
                      <div className="flex justify-center mt-4">
                        <Button variant="outline" size="sm">
                          View All Points History
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Journey Tab (Storytelling Effect) */}
        <TabsContent value="journey" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <History className="h-5 w-5 mr-2 text-primary" />
                Your Learning Journey
              </CardTitle>
              <CardDescription>
                Track your progress over time in this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              {journeyEvents && journeyEvents.length > 0 ? (
                <div className="relative pb-4">
                  {/* Enhanced timeline with gradient using primary color */}
                  <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/70 to-primary/30 rounded-full"></div>

                  {/* Add journey generator at the top if we have completed activities */}
                  {studentId && classId && stats.completedActivities > journeyEvents.length && (
                    <div className="mb-8">
                      <JourneyGenerator
                        studentId={studentId}
                        classId={classId}
                        onComplete={onJourneyEventCreate ? () => {
                          toast({
                            title: "Journey Updated",
                            description: "Your learning journey has been updated with your completed activities.",
                            duration: 3000
                          });
                        } : undefined}
                      />
                    </div>
                  )}

                  <div className="space-y-8">
                    {journeyEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        className="relative pl-12"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        {/* Enhanced timeline node with event type icon and color */}
                        <div className={cn(
                          "absolute left-0 top-1 h-9 w-9 rounded-full shadow-md flex items-center justify-center",
                          event.type === 'achievement' ? "bg-gradient-to-br from-amber-500 to-amber-600" :
                          event.type === 'level' ? "bg-gradient-to-br from-purple-500 to-purple-600" :
                          event.type === 'activity' ? "bg-gradient-to-br from-primary to-primary/70" :
                          event.type === 'enrollment' ? "bg-gradient-to-br from-green-500 to-green-600" :
                          "bg-gradient-to-br from-teal-500 to-teal-600"
                        )}>
                          {event.type === 'achievement' && <Trophy className="h-4 w-4 text-white" />}
                          {event.type === 'level' && <Zap className="h-4 w-4 text-white" />}
                          {event.type === 'activity' && <BookOpen className="h-4 w-4 text-white" />}
                          {event.type === 'enrollment' && <GraduationCap className="h-4 w-4 text-white" />}
                          {event.type === 'milestone' && <Star className="h-4 w-4 text-white" />}
                        </div>

                        {/* Enhanced event card with subtle animation and aligned colors */}
                        <motion.div
                          className={cn(
                            "p-4 rounded-lg shadow-sm border",
                            event.type === 'achievement' ? "bg-amber-50 border-amber-200" :
                            event.type === 'level' ? "bg-purple-50 border-purple-200" :
                            event.type === 'activity' ? "bg-primary/5 border-primary/20" :
                            event.type === 'enrollment' ? "bg-green-50 border-green-200" :
                            "bg-teal-50 border-teal-200"
                          )}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className={cn(
                              "font-medium",
                              event.type === 'achievement' ? "text-amber-800" :
                              event.type === 'level' ? "text-purple-800" :
                              event.type === 'activity' ? "text-primary" :
                              event.type === 'enrollment' ? "text-green-800" :
                              "text-teal-800"
                            )}>
                              {event.title}
                            </span>
                            <Badge variant="outline" className={cn(
                              event.type === 'achievement' ? "bg-amber-100 text-amber-800 border-amber-200" :
                              event.type === 'level' ? "bg-purple-100 text-purple-800 border-purple-200" :
                              event.type === 'activity' ? "bg-primary/10 text-primary border-primary/20" :
                              event.type === 'enrollment' ? "bg-green-100 text-green-800 border-green-200" :
                              "bg-teal-100 text-teal-800 border-teal-200"
                            )}>
                              {new Date(event.date).toLocaleDateString()}
                            </Badge>
                          </div>
                          <p className={cn(
                            "text-sm",
                            event.type === 'achievement' ? "text-amber-700" :
                            event.type === 'level' ? "text-purple-700" :
                            event.type === 'activity' ? "text-primary/80" :
                            event.type === 'enrollment' ? "text-green-700" :
                            "text-teal-700"
                          )}>
                            {event.description}
                          </p>
                        </motion.div>
                      </motion.div>
                    ))}

                    {/* Enhanced "What's next?" entry with animation */}
                    <motion.div
                      className="relative pl-12"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: journeyEvents.length * 0.1, duration: 0.4 }}
                    >
                      <div className="absolute left-0 top-1 h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary-dark shadow-md flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <motion.div
                        className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 p-4 rounded-lg shadow-sm"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-primary">What's next on your journey?</span>
                        </div>
                        <p className="text-sm text-primary/80">
                          Continue your learning journey by completing more activities and unlocking new achievements!
                        </p>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <History className="h-16 w-16 mx-auto mb-4 text-primary/40" />
                      <h3 className="text-xl font-medium mb-2">Your Journey Is Just Beginning</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Complete activities to build your learning timeline and watch your progress unfold
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          // This would navigate to activities in a real implementation
                          toast({
                            title: "Ready to start your journey?",
                            description: "Head to the Activities tab to begin your learning adventure!",
                            duration: 3000
                          });
                        }}
                      >
                        Start Your Journey
                      </Button>
                    </motion.div>
                  </div>

                  {/* Journey Generator - only show if we have a studentId and classId */}
                  {studentId && classId && stats.completedActivities > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <JourneyGenerator
                        studentId={studentId}
                        classId={classId}
                        onComplete={onJourneyEventCreate ? () => {
                          toast({
                            title: "Journey Updated",
                            description: "Your learning journey has been updated with your completed activities.",
                            duration: 3000
                          });
                        } : undefined}
                      />
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commitment Contracts (Commitment & Consistency) */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  Commitment Contracts
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsAddingCommitment(true)}
                  disabled={isAddingCommitment}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Commitment
                </Button>
              </div>
              <CardDescription>
                Make a commitment to yourself to achieve your learning goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Form to add new commitment contract */}
              {isAddingCommitment && (
                <div className="mb-6 p-4 border rounded-md">
                  <h4 className="font-medium mb-3">Create New Commitment</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Commitment Type</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={newCommitmentType}
                        onChange={(e) => {
                          setNewCommitmentType(e.target.value as any);
                          // Set default target values based on type
                          switch (e.target.value) {
                            case 'activity_completion':
                              setNewCommitmentTargetValue(5);
                              break;
                            case 'grade_achievement':
                              setNewCommitmentTargetValue(90);
                              break;
                            case 'points_earning':
                              setNewCommitmentTargetValue(100);
                              break;
                            case 'leaderboard_position':
                              setNewCommitmentTargetValue(3);
                              break;
                            default:
                              setNewCommitmentTargetValue(1);
                          }
                        }}
                      >
                        <option value="activity_completion">Complete Activities</option>
                        <option value="grade_achievement">Achieve Grade</option>
                        <option value="points_earning">Earn Points</option>
                        <option value="leaderboard_position">Reach Leaderboard Position</option>
                        <option value="custom">Custom Commitment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {newCommitmentType === 'activity_completion' ? 'Number of Activities' :
                         newCommitmentType === 'grade_achievement' ? 'Target Grade (%)' :
                         newCommitmentType === 'points_earning' ? 'Target Points' :
                         newCommitmentType === 'leaderboard_position' ? 'Target Position' :
                         'Target Value'}
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md"
                        value={newCommitmentTargetValue}
                        onChange={(e) => setNewCommitmentTargetValue(parseInt(e.target.value) || 0)}
                        min={1}
                        max={newCommitmentType === 'grade_achievement' ? 100 :
                             newCommitmentType === 'leaderboard_position' ? 50 : 1000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {newCommitmentType === 'activity_completion' ? 'How many activities do you commit to complete?' :
                         newCommitmentType === 'grade_achievement' ? 'What grade percentage do you aim to achieve?' :
                         newCommitmentType === 'points_earning' ? 'How many points do you commit to earn?' :
                         newCommitmentType === 'leaderboard_position' ? 'What position do you aim to reach? (1 is highest)' :
                         'Set your target value for this commitment'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Commitment Title (Optional)</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md"
                        value={newCommitmentTitle}
                        onChange={(e) => setNewCommitmentTitle(e.target.value)}
                        placeholder={
                          newCommitmentType === 'activity_completion' ? `Complete ${newCommitmentTargetValue} activities` :
                          newCommitmentType === 'grade_achievement' ? `Achieve a grade of ${newCommitmentTargetValue}%` :
                          newCommitmentType === 'points_earning' ? `Earn ${newCommitmentTargetValue} points` :
                          newCommitmentType === 'leaderboard_position' ? `Reach position ${newCommitmentTargetValue} on the leaderboard` :
                          "Enter a title for your commitment"
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to use the default title based on your commitment type</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                      <textarea
                        className="w-full p-2 border rounded-md"
                        value={newCommitmentDescription}
                        onChange={(e) => setNewCommitmentDescription(e.target.value)}
                        placeholder="Why is this commitment important to you?"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Deadline</label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded-md"
                        value={newCommitmentDeadline.toISOString().split('T')[0]}
                        onChange={(e) => setNewCommitmentDeadline(new Date(e.target.value))}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingCommitment(false);
                          setNewCommitmentTitle('');
                          setNewCommitmentDescription('');
                          setNewCommitmentDeadline(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newCommitmentTitle.trim()) {
                            // Generate a descriptive title based on commitment type if not provided
                            let finalTitle = newCommitmentTitle;
                            if (!finalTitle.trim()) {
                              switch (newCommitmentType) {
                                case 'activity_completion':
                                  finalTitle = `Complete ${newCommitmentTargetValue} activities`;
                                  break;
                                case 'grade_achievement':
                                  finalTitle = `Achieve a grade of ${newCommitmentTargetValue}`;
                                  break;
                                case 'points_earning':
                                  finalTitle = `Earn ${newCommitmentTargetValue} points`;
                                  break;
                                case 'leaderboard_position':
                                  finalTitle = `Reach position ${newCommitmentTargetValue} on the leaderboard`;
                                  break;
                                default:
                                  finalTitle = "Custom commitment";
                              }
                            }

                            // Create the commitment
                            onCommitmentCreate?.({
                              title: finalTitle,
                              description: newCommitmentDescription,
                              type: newCommitmentType,
                              targetValue: newCommitmentTargetValue,
                              currentValue: 0, // Start at 0 progress
                              deadline: newCommitmentDeadline,
                              classId: classId
                            });

                            // Create a journey event for making a commitment
                            if (onJourneyEventCreate) {
                              let eventDescription = '';
                              switch (newCommitmentType) {
                                case 'activity_completion':
                                  eventDescription = `You committed to complete ${newCommitmentTargetValue} activities by ${newCommitmentDeadline.toLocaleDateString()}`;
                                  break;
                                case 'grade_achievement':
                                  eventDescription = `You committed to achieve a grade of ${newCommitmentTargetValue} by ${newCommitmentDeadline.toLocaleDateString()}`;
                                  break;
                                case 'points_earning':
                                  eventDescription = `You committed to earn ${newCommitmentTargetValue} points by ${newCommitmentDeadline.toLocaleDateString()}`;
                                  break;
                                case 'leaderboard_position':
                                  eventDescription = `You committed to reach position ${newCommitmentTargetValue} on the leaderboard by ${newCommitmentDeadline.toLocaleDateString()}`;
                                  break;
                                default:
                                  eventDescription = `You made a custom commitment: ${finalTitle}`;
                              }

                              onJourneyEventCreate({
                                title: "New Commitment Made",
                                description: eventDescription,
                                date: new Date(),
                                type: 'milestone'
                              });
                            }

                            // Award points for making a commitment (smaller amount than completion)
                            if (onPointsAward) {
                              onPointsAward(
                                studentId,
                                10, // Smaller amount for making a commitment
                                'commitment-created',
                                `Made a new commitment: ${finalTitle}`
                              );
                            }

                            // Reset form
                            setIsAddingCommitment(false);
                            setNewCommitmentTitle('');
                            setNewCommitmentDescription('');
                            setNewCommitmentType('activity_completion');
                            setNewCommitmentTargetValue(5);
                            setNewCommitmentDeadline(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

                            toast({
                              title: "Commitment Created",
                              description: "Your commitment has been recorded. You're more likely to achieve goals you commit to!",
                              duration: 5000
                            });
                          }
                        }}
                        disabled={newCommitmentType === 'custom' && !newCommitmentTitle.trim()}
                      >
                        Make Commitment
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Display commitment contracts */}
              {(!commitmentContracts || commitmentContracts.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium">No Commitments Yet</h3>
                  <p className="mt-1">Create your first commitment to boost your motivation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commitmentContracts.map(contract => (
                    <div key={contract.id} className={cn(
                      "border rounded-md p-4",
                      contract.isCompleted && contract.isVerified ? "bg-green-50 border-green-200" :
                      contract.isCompleted && !contract.isVerified ? "bg-yellow-50 border-yellow-200" :
                      new Date() > contract.deadline ? "bg-red-50 border-red-200" : ""
                    )}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium flex items-center flex-wrap gap-2">
                            {contract.title}

                            {/* Commitment type badge */}
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              contract.type === 'activity_completion' ? "bg-blue-50 text-blue-700 border-blue-200" :
                              contract.type === 'grade_achievement' ? "bg-purple-50 text-purple-700 border-purple-200" :
                              contract.type === 'points_earning' ? "bg-teal-50 text-teal-700 border-teal-200" :
                              contract.type === 'leaderboard_position' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-gray-50 text-gray-700 border-gray-200"
                            )}>
                              {contract.type === 'activity_completion' ? "Activities" :
                               contract.type === 'grade_achievement' ? "Grade" :
                               contract.type === 'points_earning' ? "Points" :
                               contract.type === 'leaderboard_position' ? "Leaderboard" :
                               "Custom"}
                            </Badge>

                            {/* Status badges */}
                            {contract.isCompleted && contract.isVerified && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Verified
                              </Badge>
                            )}
                            {contract.isCompleted && !contract.isVerified && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                Pending Verification
                              </Badge>
                            )}
                            {!contract.isCompleted && new Date() > contract.deadline && (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                Overdue
                              </Badge>
                            )}
                          </h4>

                          {contract.description && (
                            <p className="text-sm text-muted-foreground mt-1">{contract.description}</p>
                          )}

                          {/* Progress indicator */}
                          {!contract.isCompleted && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress: {contract.currentValue || 0} of {contract.targetValue}</span>
                                <span>{Math.round(((contract.currentValue || 0) / contract.targetValue) * 100)}%</span>
                              </div>
                              <Progress
                                value={((contract.currentValue || 0) / contract.targetValue) * 100}
                                className="h-1.5"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center">
                          {!contract.isCompleted && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => handleCommitmentComplete(contract.id, true)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {contract.type === 'custom' ? 'Complete' : 'Verify'}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            {contract.isCompleted ?
                              "Completed on " + (contract.completedAt ? new Date(contract.completedAt).toLocaleDateString() : new Date().toLocaleDateString()) :
                              "Due by " + new Date(contract.deadline).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Target value indicator */}
                        <div className="flex items-center">
                          {contract.type === 'activity_completion' && (
                            <>
                              <BookOpen className="h-4 w-4 mr-1 text-blue-600" />
                              <span className="text-blue-600">Target: {contract.targetValue} activities</span>
                            </>
                          )}
                          {contract.type === 'grade_achievement' && (
                            <>
                              <GraduationCap className="h-4 w-4 mr-1 text-purple-600" />
                              <span className="text-purple-600">Target: {contract.targetValue}%</span>
                            </>
                          )}
                          {contract.type === 'points_earning' && (
                            <>
                              <Coins className="h-4 w-4 mr-1 text-teal-600" />
                              <span className="text-teal-600">Target: {contract.targetValue} points</span>
                            </>
                          )}
                          {contract.type === 'leaderboard_position' && (
                            <>
                              <Trophy className="h-4 w-4 mr-1 text-amber-600" />
                              <span className="text-amber-600">Target: Position {contract.targetValue}</span>
                            </>
                          )}
                        </div>

                        {/* Points awarded */}
                        {contract.isCompleted && contract.isVerified && contract.pointsAwarded && (
                          <div className="flex items-center text-teal-600">
                            <Coins className="h-4 w-4 mr-1" />
                            <span>+{contract.pointsAwarded} points</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Bests Tab (Peak-End Rule & Recognition Over Recall) */}
        <TabsContent value="bests" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-primary" />
                Personal Bests
              </CardTitle>
              <CardDescription>
                Celebrate your top achievements in this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              {personalBests && personalBests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personalBests.map(best => (
                    <Card key={best.id} className="bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full p-2 bg-amber-100 text-amber-600 flex-shrink-0">
                            <Trophy className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{best.title}</h4>
                            <div className="flex items-center mt-1">
                              <span className="text-lg font-bold text-amber-700">{best.value}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(best.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Secret Achievement (Curiosity Gap & Delighters) */}
                  <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200 relative overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full p-2 bg-purple-100 text-purple-600 flex-shrink-0">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Secret Achievement</h4>
                          <p className="text-sm text-purple-700 mt-1">
                            Keep exploring to unlock this hidden achievement!
                          </p>
                        </div>
                      </div>
                      <div className="absolute -bottom-6 -right-6 h-20 w-20 bg-purple-200 rounded-full opacity-30"></div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium">No Personal Bests Yet</h3>
                  <p className="mt-1">Complete activities to set your personal records</p>
                </div>
              )}

              {/* Encouraging message (Peak-End Rule) */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-blue-100 text-blue-600 flex-shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700">Keep Going!</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      Every activity you complete brings you closer to setting new personal bests.
                      Your progress is being tracked and celebrated!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
