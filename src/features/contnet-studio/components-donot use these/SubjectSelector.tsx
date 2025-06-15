'use client';

/**
 * SubjectSelector Component
 *
 * This component provides a UI for selecting a subject.
 * It fetches subjects based on the selected class and allows selection.
 */

import React, { useState } from 'react';
import { api } from '@/utils/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Search } from 'lucide-react';


interface SubjectSelectorProps {
  selectedSubjectId?: string;
  classId?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function SubjectSelector({ selectedSubjectId, classId, onSelect, disabled = false }: SubjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch class details to get associated subjects if classId is provided
  const { data: classData } = api.class.getById.useQuery(
    {
      classId: classId || "",
      includeEnrollments: false
    },
    {
      enabled: !!classId,
      refetchOnWindowFocus: false
    }
  );

  // Fetch all subjects if no classId is provided
  const { data: subjectsData, isLoading: isLoadingAllSubjects } = api.subject.list.useQuery(
    {
      skip: 0,
      take: 100
    },
    {
      enabled: !classId,
      refetchOnWindowFocus: false
    }
  );

  // Fetch class-specific subjects if classId is provided
  const { data: classSubjects, isLoading: isLoadingClassSubjects } = api.class.getSubjects.useQuery(
    {
      classId: classId || ""
    },
    {
      enabled: !!classId,
      refetchOnWindowFocus: false
    }
  );

  // Determine which subjects to use and loading state
  const subjects = classId ? (classSubjects || []) : (subjectsData?.items || []);
  const isLoading = classId ? isLoadingClassSubjects : isLoadingAllSubjects;

  // Filter subjects based on search query
  const filteredSubjects = subjects?.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle subject selection
  const handleSelectSubject = (id: string) => {
    if (!disabled) {
      onSelect(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled || isLoading}
        />
      </div>

      <ScrollArea className="h-[calc(100%-40px)] max-h-[400px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="cursor-not-allowed" data-testid="loading-skeleton">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <Card
                key={subject.id}
                className={`cursor-pointer transition-colors hover:bg-muted ${
                  selectedSubjectId === subject.id ? 'border-primary bg-primary/5' : ''
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleSelectSubject(subject.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">{subject.code}</span>
                    <span className="text-lg font-medium">{subject.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No subjects found matching "${searchQuery}"`
                  : 'No subjects available for this class'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
