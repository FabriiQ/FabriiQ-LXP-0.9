'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityTypeIcon } from './ActivityTypeIcons';
import { ActivityStatusIcon } from './ActivityTypeIcons';
import { LearningActivityType } from '@/server/api/constants';

interface ActivityCardExampleProps {
  title: string;
  type: string;
  status: 'completed' | 'in-progress' | 'pending' | 'overdue';
  dueDate?: Date;
  score?: number;
  totalScore?: number;
  isNew?: boolean;
}

/**
 * Example Activity Card component that uses the custom activity type icons
 */
export function ActivityCardExample({
  title,
  type,
  status,
  dueDate,
  score,
  totalScore = 100,
  isNew = false,
}: ActivityCardExampleProps) {
  // Determine if activity is completed or in progress
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in-progress';
  
  // Format due date
  const formatDueDate = () => {
    if (!dueDate) return 'No due date';
    
    // If it's today, show "Today"
    const today = new Date();
    if (dueDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // If it's tomorrow, show "Tomorrow"
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dueDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // Otherwise show month/day
    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-primary-green/10 text-primary-green';
      case 'in-progress':
        return 'bg-medium-teal/10 text-medium-teal';
      case 'overdue':
        return 'bg-red/10 text-red';
      default:
        return 'bg-light-mint/30 text-primary-green';
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = score !== undefined ? (score / totalScore) * 100 : 0;
  
  return (
    <Card className="overflow-hidden h-full relative group flex flex-col hover:border-primary-green/70 transition-all">
      {/* Status and Type Tags (top-right corner) */}
      <div className="absolute top-0 right-0 flex gap-1 p-1 z-10">
        {/* Status Tag */}
        <Badge variant="outline" className={`text-xs capitalize rounded-sm ${getStatusColor()}`}>
          {status}
        </Badge>
        
        {/* New Tag - only show if activity is new */}
        {isNew && (
          <Badge variant="default" className="text-xs rounded-sm bg-orange text-white">
            NEW
          </Badge>
        )}
      </div>
      
      {/* Card Header - Title and activity type icon */}
      <CardHeader className="p-3 pb-1 pt-4 flex-shrink-0 flex items-start gap-2">
        <div className={`p-1.5 rounded-full ${
          isCompleted ? "bg-primary-green/10" : 
          isInProgress ? "bg-medium-teal/10" : 
          "bg-light-mint/30"
        }`}>
          <ActivityTypeIcon 
            type={type} 
            className="h-4 w-4" 
            color={
              isCompleted ? "#1F504B" : 
              isInProgress ? "#5A8A84" : 
              "#1F504B"
            } 
          />
        </div>
        
        <div className="flex-1">
          <CardTitle className="text-base group-hover:text-primary-green transition-colors line-clamp-2">
            {title}
          </CardTitle>
          
          {/* Activity type as small text */}
          <CardDescription className="text-xs capitalize mt-0.5">
            {type.replace(/_/g, ' ').toLowerCase()}
          </CardDescription>
        </div>
      </CardHeader>
      
      {/* Card Content - Progress or Score */}
      <CardContent className="p-3 pt-1 flex-grow">
        {isCompleted && score !== undefined ? (
          <div className="mt-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Score</span>
              <span className="font-medium">{score}/{totalScore}</span>
            </div>
            <div className="mt-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-green rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-muted-foreground">
            {isInProgress ? 'Continue your progress' : 'Start this activity'}
          </div>
        )}
      </CardContent>
      
      {/* Card Footer - Due Date */}
      <CardFooter className="p-3 pt-1 border-t text-xs text-muted-foreground flex justify-between items-center">
        <div className="flex items-center">
          <span className="mr-1">Due:</span>
          <span className="font-medium">{formatDueDate()}</span>
        </div>
        
        {/* Status icon */}
        <ActivityStatusIcon 
          status={status} 
          className="h-4 w-4" 
          color={
            isCompleted ? "#1F504B" : 
            isInProgress ? "#5A8A84" : 
            status === 'overdue' ? "#D92632" : 
            "#757575"
          }
        />
      </CardFooter>
    </Card>
  );
}

/**
 * Example component that displays multiple activity cards with different types
 */
export function ActivityCardExamples() {
  // Sample activities
  const activities = [
    {
      title: "Multiple Choice Quiz on Cell Biology",
      type: LearningActivityType.MULTIPLE_CHOICE,
      status: 'pending' as const,
      dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      isNew: true,
    },
    {
      title: "True/False Assessment on Scientific Method",
      type: LearningActivityType.TRUE_FALSE,
      status: 'in-progress' as const,
      dueDate: new Date(Date.now() + 86400000), // 1 day from now
    },
    {
      title: "Matching Exercise on Chemical Elements",
      type: LearningActivityType.MATCHING,
      status: 'completed' as const,
      dueDate: new Date(Date.now() - 86400000), // 1 day ago
      score: 85,
      totalScore: 100,
    },
    {
      title: "Fill in the Blanks on Historical Events",
      type: LearningActivityType.FILL_IN_THE_BLANKS,
      status: 'overdue' as const,
      dueDate: new Date(Date.now() - 86400000 * 3), // 3 days ago
    },
    {
      title: "Reading Assignment: Chapter 5",
      type: LearningActivityType.READING,
      status: 'pending' as const,
      dueDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
    },
    {
      title: "Video Lesson on Photosynthesis",
      type: LearningActivityType.VIDEO,
      status: 'completed' as const,
      dueDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
      score: 100,
      totalScore: 100,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.map((activity, index) => (
        <ActivityCardExample
          key={index}
          title={activity.title}
          type={activity.type}
          status={activity.status}
          dueDate={activity.dueDate}
          score={activity.score}
          totalScore={activity.totalScore}
          isNew={activity.isNew}
        />
      ))}
    </div>
  );
}
