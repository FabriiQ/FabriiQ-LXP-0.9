'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BookOpen, Calendar, Check } from 'lucide-react';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';

interface ClassSelectorProps {
  teacherId: string | null;
  selectedClassId: string;
  onSelect: (classId: string) => void;
  isLoading: boolean;
}

export function ClassSelector({
  teacherId,
  selectedClassId,
  onSelect,
  isLoading
}: ClassSelectorProps) {
  // Fetch teacher's classes
  const { data: classes, isLoading: classesLoading } = api.classTeacher.getByTeacher.useQuery(
    { teacherId: teacherId || '' },
    { enabled: !!teacherId }
  );

  if (isLoading || classesLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Select a Class</h3>
          <p className="text-muted-foreground">
            Choose the class where you want to create this assessment.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="cursor-pointer">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Classes Found</h3>
        <p className="text-muted-foreground mb-4">
          You don't have any classes assigned yet. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Select a Class</h3>
        <p className="text-muted-foreground">
          Choose the class where you want to create this assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classItem) => (
          <Card
            key={classItem.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedClassId === classItem.id
                ? "ring-2 ring-primary border-primary bg-primary/5"
                : "hover:border-primary/50"
            )}
            onClick={() => onSelect(classItem.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {classItem.name}
                    {selectedClassId === classItem.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {classItem.section && `Section ${classItem.section}`}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {classItem.grade}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{classItem._count?.students || 0} students</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{classItem._count?.subjects || 0} subjects</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {classItem.term?.name || 'Current Term'}
                  </span>
                </div>
              </div>

              {classItem.description && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                  {classItem.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedClassId && (
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Check className="h-4 w-4" />
            <span className="font-medium">
              Class selected: {classes.find(c => c.id === selectedClassId)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
