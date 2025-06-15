'use client';

/**
 * ClassContextTest Component
 * 
 * This component demonstrates the functionality of the ClassContext.
 * It shows loading states with educational micro-content, error states
 * with empathetic messaging, and the class data when available.
 */

import { useState } from 'react';
import { ClassProvider, useClass } from '@/contexts/class-context';
import { ViewTransitionLink, PageTransitionWrapper } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Award, Calendar, ChevronRight, Clock, GraduationCap, Trophy, User } from 'lucide-react';

// ClassContextDisplay component that uses the useClass hook
function ClassContextDisplay() {
  const classContext = useClass();
  
  // Show loading state with educational micro-content
  if (classContext.loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        
        <Alert className="bg-muted border-primary/20">
          <Clock className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm font-medium">Did you know?</AlertTitle>
          <AlertDescription className="text-sm">
            {classContext.learningFact}
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-8 w-[180px]" />
              <Skeleton className="h-4 w-[100px]" />
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Show error state with empathetic messaging
  if (classContext.error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {classContext.errorMessage}
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => classContext.retry()}
            >
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Show class data
  const { data } = classContext;
  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No class data is available. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data.className}</h1>
        <p className="text-muted-foreground">
          {data.courseName} • {data.termName}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Grade Card */}
        <Card className="p-4 flex flex-col">
          <div className="flex items-center text-muted-foreground mb-2">
            <GraduationCap className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Average Grade</span>
          </div>
          <div className="text-3xl font-bold mb-1">{data.averageGrade}%</div>
          <div className="text-sm text-muted-foreground mt-auto">
            Leaderboard Position: #{data.leaderboardPosition}
          </div>
        </Card>
        
        {/* Points Card */}
        <Card className="p-4 flex flex-col">
          <div className="flex items-center text-muted-foreground mb-2">
            <Trophy className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Points & Level</span>
          </div>
          <div className="text-3xl font-bold mb-1">{data.points} pts</div>
          <div className="text-sm text-muted-foreground mt-auto">
            Current Level: {data.level}
          </div>
        </Card>
        
        {/* Attendance Card */}
        <Card className="p-4 flex flex-col">
          <div className="flex items-center text-muted-foreground mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Attendance</span>
          </div>
          <div className="text-3xl font-bold mb-1">{data.attendance.percentage}%</div>
          <div className="text-sm text-muted-foreground mt-auto">
            Present: {data.attendance.present} • 
            Absent: {data.attendance.absent} • 
            Late: {data.attendance.late}
          </div>
        </Card>
        
        {/* Achievements Card */}
        <Card className="p-4 flex flex-col">
          <div className="flex items-center text-muted-foreground mb-2">
            <Award className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Achievements</span>
          </div>
          <div className="text-3xl font-bold mb-1">{data.achievements.length}</div>
          <div className="text-sm text-muted-foreground mt-auto">
            {data.achievements.length > 0 
              ? `Latest: ${data.achievements[0].name}`
              : 'No achievements yet'}
          </div>
        </Card>
      </div>
      
      {/* Achievements List */}
      {data.achievements.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Recent Achievements</h2>
          <div className="space-y-3">
            {data.achievements.slice(0, 3).map(achievement => (
              <Card key={achievement.id} className="p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </Card>
            ))}
            
            {data.achievements.length > 3 && (
              <Button variant="ghost" className="w-full justify-between">
                View All Achievements
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ClassContextTest component that wraps ClassContextDisplay with ClassProvider
interface ClassContextTestProps {
  classId?: string;
}

export function ClassContextTest({ classId }: ClassContextTestProps) {
  const [testClassId, setTestClassId] = useState(classId);
  
  return (
    <PageTransitionWrapper>
      <div className="space-y-6">
        {!testClassId ? (
          <div className="p-6 bg-muted rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Class Context Test</h2>
            <p className="mb-4">
              Enter a class ID to test the Class Context functionality.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Class ID"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setTestClassId(e.target.value)}
              />
              <Button 
                disabled={!testClassId} 
                onClick={() => setTestClassId(testClassId)}
              >
                Load Class
              </Button>
            </div>
          </div>
        ) : (
          <ClassProvider classId={testClassId}>
            <ClassContextDisplay />
          </ClassProvider>
        )}
      </div>
    </PageTransitionWrapper>
  );
}
