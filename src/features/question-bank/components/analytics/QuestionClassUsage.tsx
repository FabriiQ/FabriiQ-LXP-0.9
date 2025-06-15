'use client';

import React, { useState } from 'react';
import { api } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Info } from 'lucide-react';

interface QuestionClassUsageProps {
  questionId: string;
  className?: string;
}

/**
 * Question Class Usage Component
 * 
 * This component displays which classes have used a specific question
 * and provides insights about usage patterns across different classes.
 */
export const QuestionClassUsage: React.FC<QuestionClassUsageProps> = ({
  questionId,
  className = '',
}) => {
  // Fetch question class usage
  const { data: classUsage, isLoading } = api.questionUsage.getQuestionClassUsage.useQuery({
    questionId,
  }, {
    enabled: !!questionId,
  });

  // Format date for display
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Class Usage</CardTitle>
              <CardDescription>
                Classes that have used this question
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>This shows which classes have used this question in activities. 
                  Questions used multiple times in the same class may indicate high effectiveness.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !classUsage || classUsage.classes.length === 0 ? (
            <div className="p-6 text-center border rounded-md">
              <p className="text-muted-foreground">
                This question has not been used in any classes yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {classUsage.classes.map((classItem) => (
                <div key={classItem.classId} className="p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{classItem.className}</div>
                      <div className="text-sm text-muted-foreground">
                        {classItem.courseName} • {classItem.subjectName}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant={classItem.usageCount > 1 ? 'default' : 'outline'}>
                        Used {classItem.usageCount} {classItem.usageCount === 1 ? 'time' : 'times'}
                      </Badge>
                      {classItem.correctPercentage !== null && (
                        <span className="text-xs mt-1 text-muted-foreground">
                          {classItem.correctPercentage}% correct answers
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {classItem.activities.map((activity) => (
                      <Tooltip key={activity.activityId}>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="outline" 
                            className="text-xs cursor-help"
                          >
                            {activity.activityTitle.length > 20 
                              ? `${activity.activityTitle.substring(0, 20)}...` 
                              : activity.activityTitle}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">{activity.activityTitle}</p>
                            <p className="text-xs">Used {formatDate(activity.lastUsedAt)}</p>
                            {activity.correctPercentage !== null && (
                              <p className="text-xs">{activity.correctPercentage}% correct in this activity</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              ))}

              {/* Usage Warning */}
              {classUsage.reusedInClasses && classUsage.reusedInClasses.length > 0 && (
                <div className="p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/50 rounded-md mt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-300">Question Reuse Warning</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        This question has been used multiple times in {classUsage.reusedInClasses.length} {classUsage.reusedInClasses.length === 1 ? 'class' : 'classes'}.
                        Students may have seen this question before.
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {classUsage.reusedInClasses.map((className, index) => (
                          <Badge key={index} variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700">
                            {className}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
