'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, Trash2, Users, BarChart, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityPurpose } from '@/server/api/constants';
import Link from 'next/link';
import ThemeWrapper from '@/features/activties/components/ui/ThemeWrapper';

// Import all activity viewers from the new architecture
import {
  MultipleChoiceViewer,
  TrueFalseViewer,
  MultipleResponseViewer,
  FillInTheBlanksViewer,
  MatchingViewer,
  SequenceViewer,
  DragAndDropViewer,
  DragTheWordsViewer,
  FlashCardsViewer,
  NumericViewer,
  QuizViewer,
  ReadingViewer,
  VideoViewer,
} from '@/features/activties';

interface ActivityViewerProps {
  activity: any;
  classId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onGrade?: () => void;
  onAnalytics?: () => void;
  className?: string;
}

export function ActivityViewer({
  activity,
  classId,
  onEdit,
  onDelete,
  onGrade,
  onAnalytics,
  className
}: ActivityViewerProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');

  // Get activity type name from the activity type
  const getActivityTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True/False',
      'multiple-response': 'Multiple Response',
      'fill-in-the-blanks': 'Fill in the Blanks',
      'matching': 'Matching',
      'sequence': 'Sequence',
      'drag-and-drop': 'Drag and Drop',
      'drag-the-words': 'Drag the Words',
      'flash-cards': 'Flash Cards',
      'numeric': 'Numeric',
      'quiz': 'Quiz',
      'reading': 'Reading',
      'video': 'Video'
    };

    return typeMap[type] || type;
  };

  // Render the appropriate viewer component based on activity type
  const renderViewer = () => {
    if (!activity) return null;

    const commonProps = {
      activity,
      mode: viewMode,
    };

    // Create the viewer component based on activity type
    const viewerComponent = (() => {
      switch (activity.activityType) {
        case 'multiple-choice':
          return <MultipleChoiceViewer {...commonProps} />;
        case 'true-false':
          return <TrueFalseViewer {...commonProps} />;
        case 'multiple-response':
          return <MultipleResponseViewer {...commonProps} />;
        case 'fill-in-the-blanks':
          return <FillInTheBlanksViewer {...commonProps} />;
        case 'matching':
          return <MatchingViewer {...commonProps} />;
        case 'sequence':
          return <SequenceViewer {...commonProps} />;
        case 'drag-and-drop':
          return <DragAndDropViewer {...commonProps} />;
        case 'drag-the-words':
          return <DragTheWordsViewer {...commonProps} />;
        case 'flash-cards':
          return <FlashCardsViewer {...commonProps} />;
        case 'numeric':
          return <NumericViewer {...commonProps} />;
        case 'quiz':
          return <QuizViewer {...commonProps} />;
        case 'reading':
          return <ReadingViewer {...commonProps} />;
        case 'video':
          return <VideoViewer {...commonProps} />;
        default:
          return <div>No viewer available for this activity type</div>;
      }
    })();

    // Wrap the viewer component with ThemeWrapper to ensure it respects the theme
    return <ThemeWrapper>{viewerComponent}</ThemeWrapper>;
  };

  if (!activity) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <p>Activity not found or failed to load</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure activity has the required properties
  if (!activity.activityType) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <p>Invalid activity format. Missing activity type.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/teacher/classes/${classId}/activities`}>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Back to Activities</span>
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold">{activity.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge>{getActivityTypeName(activity.activityType)}</Badge>
            <Badge variant={activity.purpose === ActivityPurpose.LEARNING ? "secondary" : "default"}>
              {activity.purpose === ActivityPurpose.LEARNING ? "Learning" : "Assessment"}
            </Badge>
            {activity.isGradable && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Gradable
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onGrade && (
            <Button variant="outline" size="sm" onClick={onGrade}>
              <Users className="h-4 w-4 mr-2" />
              Grade
            </Button>
          )}
          {onAnalytics && (
            <Button variant="outline" size="sm" onClick={onAnalytics}>
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {activity.description && (
        <p className="text-muted-foreground">{activity.description}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity Preview</CardTitle>
          <CardDescription>
            This is how the activity will appear to students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student">
            <TabsList>
              <TabsTrigger
                value="student"
                onClick={() => setViewMode('student')}
              >
                Student View
              </TabsTrigger>
              <TabsTrigger
                value="teacher"
                onClick={() => setViewMode('teacher')}
              >
                Teacher View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="mt-4">
              {renderViewer()}
            </TabsContent>

            <TabsContent value="teacher" className="mt-4">
              {renderViewer()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
