'use client';

import { useState, useEffect } from 'react';
import { useClass } from '@/contexts/class-context';
import { Achievement } from '@/contexts/class-context/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  TrendingUp,
  XCircle
} from 'lucide-react';
// Import custom icon implementations for Star and Trophy
import { Star } from '@/components/ui/icons/reward-icons';
import { Trophy } from '@/components/ui/icons/reward-icons';
import { cn } from '@/lib/utils';

/**
 * ClassDashboard component for the student portal
 *
 * Features:
 * - Progressive disclosure of information by importance
 * - Metric cards with meaningful icons (Picture Superiority Effect)
 * - Visual chunking of related metrics (Miller's Law)
 * - Entrance animations for card appearance
 * - Color psychology for progress indicators
 * - Loading states with "calculating progress" animations
 * - Empathetic error states with recovery options
 * - Micro-interactions on hover/focus
 * - Time-based indicators for urgency
 * - Incomplete task indicators (Zeigarnik Effect)
 * - "Continue learning" section (Goal Gradient Effect)
 * - Effort tracking visualizations (Labor Illusion)
 */
export function ClassDashboard() {
  // Get class data from context
  const {
    classId,
    className,
    loading,
    error,
    errorMessage,
    data,
    learningFact,
    retry
  } = useClass();

  // State for animation control
  const [animatedItems, setAnimatedItems] = useState<Record<string, boolean>>({});

  // Trigger staggered animations after component mounts or data changes
  useEffect(() => {
    // Reset animations when data changes
    setAnimatedItems({});

    const sections = ['metrics', 'continue-learning', 'achievements', 'investment'];

    // Stagger the animations by 150ms each
    sections.forEach((section, index) => {
      setTimeout(() => {
        setAnimatedItems(prev => ({ ...prev, [section]: true }));
      }, 100 + (index * 100)); // Faster animations for better UX
    });

    return () => {
      // Cleanup if needed
    };
  }, [data?.className]); // Re-run when class name changes

  // If loading, show skeleton UI with educational facts
  if (loading) {
    return <ClassDashboardSkeleton learningFact={learningFact} />;
  }

  // If error, show empathetic error state with recovery option
  if (error) {
    return (
      <div className="mb-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load your dashboard</AlertTitle>
          <AlertDescription>
            {errorMessage || "We're having trouble loading your class data. This doesn't affect your progress."}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          size="sm"
          onClick={retry}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // If no data, show empty state
  if (!data) {
    return (
      <div className="mb-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No class data is available at this time. Please check back later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate attendance percentage
  const attendancePercentage = Math.round((data.attendance.present / data.attendance.total) * 100) || 0;

  // Get color based on value (color psychology)
  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-green-500";
    if (value >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Class header with basic info */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{data.className}</h1>
        <p className="text-muted-foreground">
          {data.courseName} {data.termName ? `• ${data.termName}` : ''}
        </p>
      </div>

      {/* Primary metrics - most important information first (Progressive Disclosure) */}
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500",
          animatedItems['metrics'] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {/* Grade Card */}
        <Card
          className="overflow-hidden transition-all duration-300 hover:shadow-md transform hover:scale-[1.02]"
          style={{
            transitionDelay: animatedItems['metrics'] ? '50ms' : '0ms'
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-primary" />
              <span>Average Grade</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{data.averageGrade}%</div>
            <Progress
              value={data.averageGrade}
              className="h-2 mb-2"
              indicatorClassName={getProgressColor(data.averageGrade)}
            />
            <div className="text-sm text-muted-foreground flex items-center">
              <Trophy className="h-4 w-4 mr-1" />
              <span>Leaderboard Position: #{data.leaderboardPosition}</span>
            </div>
          </CardContent>
        </Card>

        {/* Points Card */}
        <Card
          className="overflow-hidden transition-all duration-300 hover:shadow-md transform hover:scale-[1.02]"
          style={{
            transitionDelay: animatedItems['metrics'] ? '100ms' : '0ms'
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-primary" />
              <span>Points & Level</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{data.points}</div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Level {data.level}</span>
              <span className="text-sm">{data.points % 100}/100 to next level</span>
            </div>
            <Progress
              value={data.points % 100}
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Attendance Card */}
        <Card
          className="overflow-hidden transition-all duration-300 hover:shadow-md transform hover:scale-[1.02]"
          style={{
            transitionDelay: animatedItems['metrics'] ? '150ms' : '0ms'
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <span>Attendance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{attendancePercentage}%</div>
            <Progress
              value={attendancePercentage}
              className="h-2 mb-2"
              indicatorClassName={getProgressColor(attendancePercentage)}
            />
            <div className="text-sm text-muted-foreground">
              Present: {data.attendance.present}/{data.attendance.total} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section (Goal Gradient Effect) */}
      <div
        className={cn(
          "mt-8 transition-all duration-500",
          animatedItems['continue-learning'] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-primary" />
          Continue Learning
        </h2>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Mock incomplete activities - would be real data in production */}
              {[
                {
                  id: '1',
                  title: 'Introduction to Algebra',
                  type: 'Multiple Choice',
                  progress: 60,
                  lastActive: '2 hours ago'
                },
                {
                  id: '2',
                  title: 'Reading: The Solar System',
                  type: 'Book',
                  progress: 30,
                  lastActive: '1 day ago'
                }
              ].map((activity, index) => (
                <div
                  key={activity.id}
                  className="border rounded-md p-4 transition-all duration-300 hover:shadow-md transform hover:scale-[1.01] cursor-pointer"
                  style={{
                    transitionDelay: animatedItems['continue-learning'] ? `${50 * (index + 1)}ms` : '0ms'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground">{activity.type}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.lastActive}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{activity.progress}%</span>
                    </div>
                    <Progress value={activity.progress} className="h-1" />
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full mt-2">
                View All Activities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements Section */}
      <div
        className={cn(
          "mt-8 transition-all duration-500",
          animatedItems['achievements'] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-primary" />
          Recent Achievements
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.achievements.slice(0, 3).map((achievement: Achievement, index) => (
            <Card
              key={achievement.id || index}
              className="overflow-hidden transition-all duration-300 hover:shadow-md transform hover:scale-[1.02]"
              style={{
                transitionDelay: animatedItems['achievements'] ? `${50 * (index + 1)}ms` : '0ms'
              }}
            >
              <CardContent className="p-4 flex items-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {data.achievements.length === 0 && (
            <Card
              className="col-span-full transition-all duration-300"
              style={{
                transitionDelay: animatedItems['achievements'] ? '50ms' : '0ms'
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Award className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">No Achievements Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete activities to earn achievements
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Time Investment Tracking (Sunk Cost Effect) */}
      <div
        className={cn(
          "mt-8 transition-all duration-500",
          animatedItems['investment'] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-primary" />
          Your Learning Investment
        </h2>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { value: '12h', label: 'This Week', delay: 50 },
                { value: '48h', label: 'This Month', delay: 100 },
                { value: '156h', label: 'Total Time', delay: 150 }
              ].map((item, index) => (
                <div
                  key={index}
                  className="text-center transition-all duration-300 transform hover:scale-[1.05]"
                  style={{
                    transitionDelay: animatedItems['investment'] ? `${item.delay}ms` : '0ms'
                  }}
                >
                  <div className="text-3xl font-bold text-primary">{item.value}</div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>

            <div
              className="mt-6 transition-all duration-300"
              style={{
                transitionDelay: animatedItems['investment'] ? '200ms' : '0ms'
              }}
            >
              <div className="flex justify-between text-sm mb-1">
                <span>Weekly Goal (15 hours)</span>
                <span>12/15 hours</span>
              </div>
              <Progress value={80} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                You're 3 hours away from reaching your weekly goal!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for ClassDashboard
 * Shows loading animation with educational facts (Labor Illusion)
 */
function ClassDashboardSkeleton({ learningFact }: { learningFact: string }) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Educational fact during loading (Labor Illusion) */}
      <div className="bg-muted p-4 rounded-md mb-6">
        <div className="flex items-center">
          <div className="mr-3 relative">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <CheckCircle className="h-4 w-4 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <p className="text-sm font-medium">Calculating your progress...</p>
            <p className="text-xs text-muted-foreground">Did you know? {learningFact}</p>
          </div>
        </div>
      </div>

      {/* Metric card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Continue Learning section skeleton */}
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <Skeleton className="h-5 w-5 mr-2 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>

                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              ))}

              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements section skeleton */}
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <Skeleton className="h-5 w-5 mr-2 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4 flex items-center">
                <Skeleton className="h-12 w-12 rounded-full mr-4" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Time Investment section skeleton */}
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <Skeleton className="h-5 w-5 mr-2 rounded-full" />
          <Skeleton className="h-6 w-56" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex justify-between mb-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full mb-2" />
              <Skeleton className="h-3 w-56" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
