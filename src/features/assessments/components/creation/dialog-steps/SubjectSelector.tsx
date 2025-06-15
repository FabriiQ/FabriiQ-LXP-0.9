'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Award, Check, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  color?: string | null;
  _count?: {
    topics?: number;
    learningOutcomes?: number;
    rubrics?: number;
  };
}

interface SubjectSelectorProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSelect: (subjectId: string) => void;
  isLoading: boolean;
}

export function SubjectSelector({
  subjects,
  selectedSubjectId,
  onSelect,
  isLoading
}: SubjectSelectorProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Select a Subject</h3>
          <p className="text-muted-foreground">
            Choose the subject for this assessment.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
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

  if (!subjects || subjects.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Subjects Found</h3>
        <p className="text-muted-foreground mb-4">
          No subjects are available for this class. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Select a Subject *</h3>
        <p className="text-muted-foreground">
          Choose the subject for this assessment. This will determine available topics and learning outcomes.
          <span className="text-red-600 font-medium"> This field is required.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Card
            key={subject.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedSubjectId === subject.id
                ? "ring-2 ring-primary border-primary bg-primary/5"
                : "hover:border-primary/50"
            )}
            onClick={() => onSelect(subject.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color || '#6366f1' }}
                    />
                    {subject.name}
                    {selectedSubjectId === subject.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CardTitle>
                  {subject.code && (
                    <CardDescription className="text-sm">
                      Code: {subject.code}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {subject.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {subject.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <List className="h-4 w-4" />
                  <span>{subject._count?.topics || 0} topics</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>{subject._count?.learningOutcomes || 0} learning outcomes</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{subject._count?.rubrics || 0} rubrics</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSubjectId && (
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Check className="h-4 w-4" />
            <span className="font-medium">
              Subject selected: {subjects.find(s => s.id === selectedSubjectId)?.name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            You can now select a topic and its associated learning outcomes.
          </p>
        </div>
      )}
    </div>
  );
}
