'use client';

import React, { useState } from 'react';
import { ClassProfile } from '@/components/student/ClassProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

export default function ClassProfileExample() {
  // Mock data for the example
  const [mockAchievements, setMockAchievements] = useState([
    {
      id: '1',
      title: 'Perfect Attendance',
      description: 'Attend all classes for a month',
      type: 'attendance',
      progress: 25,
      total: 30,
      unlocked: false,
      icon: 'calendar',
      classId: 'class-1',
      className: 'Mathematics 101'
    },
    {
      id: '2',
      title: 'Quiz Master',
      description: 'Score 90% or higher on 5 quizzes',
      type: 'academic',
      progress: 3,
      total: 5,
      unlocked: false,
      icon: 'star',
      classId: 'class-1',
      className: 'Mathematics 101'
    },
    {
      id: '3',
      title: 'Participation Champion',
      description: 'Participate actively in 10 class discussions',
      type: 'participation',
      progress: 10,
      total: 10,
      unlocked: true,
      unlockedAt: new Date('2023-05-15'),
      icon: 'message-circle',
      classId: 'class-1',
      className: 'Mathematics 101'
    },
    {
      id: '4',
      title: 'Homework Hero',
      description: 'Complete 20 homework assignments on time',
      type: 'academic',
      progress: 15,
      total: 20,
      unlocked: false,
      icon: 'book',
      classId: 'class-1',
      className: 'Mathematics 101'
    },
    {
      id: '5',
      title: 'Early Bird',
      description: 'Arrive early to class 5 times',
      type: 'attendance',
      progress: 5,
      total: 5,
      unlocked: true,
      unlockedAt: new Date('2023-04-10'),
      icon: 'clock',
      classId: 'class-1',
      className: 'Mathematics 101'
    },
    {
      id: '6',
      title: 'Math Wizard',
      description: 'Score 100% on a difficult math test',
      type: 'academic',
      progress: 1,
      total: 1,
      unlocked: true,
      unlockedAt: new Date('2023-06-01'),
      icon: 'zap',
      classId: 'class-1',
      className: 'Mathematics 101'
    }
  ]);

  const [mockLearningGoals, setMockLearningGoals] = useState([
    {
      id: '1',
      title: 'Master Algebra Equations',
      description: 'Be able to solve complex algebraic equations',
      progress: 70,
      total: 100,
      createdAt: new Date('2023-04-01'),
      isCustom: false
    },
    {
      id: '2',
      title: 'Complete All Practice Problems',
      description: 'Finish all the extra practice problems in the textbook',
      progress: 45,
      total: 100,
      createdAt: new Date('2023-04-15'),
      isCustom: true
    },
    {
      id: '3',
      title: 'Improve Test Scores',
      description: 'Raise my average test score by 10%',
      progress: 100,
      total: 100,
      createdAt: new Date('2023-03-10'),
      isCustom: true
    }
  ]);

  const mockPointsHistory = [
    {
      id: '1',
      amount: 50,
      source: 'activity',
      description: 'Completed quiz with 90% score',
      createdAt: new Date('2023-06-10'),
      className: 'Mathematics 101'
    },
    {
      id: '2',
      amount: 25,
      source: 'login',
      description: 'Daily login streak bonus',
      createdAt: new Date('2023-06-09')
    },
    {
      id: '3',
      amount: 100,
      source: 'activity',
      description: 'Perfect score on midterm exam',
      createdAt: new Date('2023-06-05'),
      className: 'Mathematics 101'
    },
    {
      id: '4',
      amount: 15,
      source: 'participation',
      description: 'Active participation in class discussion',
      createdAt: new Date('2023-06-03'),
      className: 'Mathematics 101'
    },
    {
      id: '5',
      amount: 30,
      source: 'streak',
      description: '7-day login streak bonus',
      createdAt: new Date('2023-06-02')
    },
    {
      id: '6',
      amount: 45,
      source: 'activity',
      description: 'Completed all homework assignments',
      createdAt: new Date('2023-05-30'),
      className: 'Mathematics 101'
    }
  ];

  const mockStats = {
    totalPoints: 1250,
    level: 5,
    levelProgress: 65,
    levelTotal: 100,
    attendanceRate: 92,
    averageGrade: 'A-',
    completedActivities: 28,
    totalActivities: 35
  };

  // Handlers for component interactions
  const handleAchievementClick = (achievement) => {
    toast({
      title: achievement.unlocked ? 'Achievement Unlocked' : 'Achievement In Progress',
      description: achievement.description,
      duration: 3000
    });
  };

  const handleGoalCreate = (goal) => {
    const newGoal = {
      ...goal,
      id: `goal-${mockLearningGoals.length + 1}`,
      createdAt: new Date()
    };
    setMockLearningGoals([newGoal, ...mockLearningGoals]);
    
    toast({
      title: 'Learning Goal Created',
      description: `Your new goal "${goal.title}" has been created.`,
      duration: 3000
    });
  };

  const handleGoalEdit = (goal) => {
    toast({
      title: 'Edit Learning Goal',
      description: `Editing goal: ${goal.title}`,
      duration: 3000
    });
  };

  const handleAvatarChange = (avatarId) => {
    toast({
      title: 'Avatar Updated',
      description: `Your avatar has been updated to ${avatarId}.`,
      duration: 3000
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Class Profile Example</h1>
        <p className="text-muted-foreground">
          This example demonstrates the ClassProfile component with UX psychology principles
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>UX Psychology Principles</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>IKEA Effect:</strong> Customizable avatar and learning goals</li>
            <li><strong>Sunk Cost Effect:</strong> Showing accumulated points and achievements</li>
            <li><strong>Endowed Progress Effect:</strong> Showing partially completed achievements</li>
            <li><strong>Goal Gradient Effect:</strong> "X away from unlocking" messages</li>
            <li><strong>Chunking:</strong> Grouping achievements into themed collections</li>
          </ul>
        </CardContent>
      </Card>

      <ClassProfile
        classId="class-1"
        className="Mathematics 101"
        studentId="student-1"
        studentName="John Doe"
        studentImage="https://avatar.vercel.sh/johndoe"
        achievements={mockAchievements}
        learningGoals={mockLearningGoals}
        pointsHistory={mockPointsHistory}
        stats={mockStats}
        onAchievementClick={handleAchievementClick}
        onGoalCreate={handleGoalCreate}
        onGoalEdit={handleGoalEdit}
        onAvatarChange={handleAvatarChange}
      />
    </div>
  );
}
