'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { QuestionType, DifficultyLevel, SystemStatus } from '../../models/types';
import { api } from '@/utils/api';
import { X } from 'lucide-react';

interface QuestionFilterProps {
  filters: {
    questionType?: QuestionType;
    difficulty?: DifficultyLevel;
    subjectId?: string;
    courseId?: string;
    topicId?: string;
    gradeLevel?: number;
    year?: number;
    status?: SystemStatus;
  };
  onChange: (filters: QuestionFilterProps['filters']) => void;
  className?: string;
}

/**
 * Question Filter Component
 *
 * This component provides filtering options for questions in the question bank.
 */
export const QuestionFilter: React.FC<QuestionFilterProps> = ({
  filters,
  onChange,
  className = '',
}) => {
  // Fetch subjects
  const { data: subjects } = api.subject.list.useQuery(
    { status: SystemStatus.ACTIVE },
    { enabled: true }
  );

  // Fetch courses based on selected subject
  const { data: courses } = api.course.list.useQuery(
    {
      subjectId: filters.subjectId,
      status: SystemStatus.ACTIVE
    },
    { enabled: !!filters.subjectId }
  );

  // Fetch topics based on selected subject and course
  const { data: topics } = api.subjectTopic.list.useQuery(
    {
      subjectId: filters.subjectId,
      courseId: filters.courseId,
      status: SystemStatus.ACTIVE
    },
    { enabled: !!filters.subjectId }
  );

  // Handle filter changes
  const handleFilterChange = (key: keyof QuestionFilterProps['filters'], value: any) => {
    // If changing subject, reset course and topic
    if (key === 'subjectId') {
      onChange({
        ...filters,
        subjectId: value,
        courseId: undefined,
        topicId: undefined,
      });
      return;
    }

    // If changing course, reset topic
    if (key === 'courseId') {
      onChange({
        ...filters,
        courseId: value,
        topicId: undefined,
      });
      return;
    }

    // Otherwise, just update the specified filter
    onChange({
      ...filters,
      [key]: value,
    });
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    onChange({
      status: SystemStatus.ACTIVE,
    });
  };

  // Check if any filters are applied
  const hasFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'status' && value === SystemStatus.ACTIVE) return false;
    return value !== undefined;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters</h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Question Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="questionType">Question Type</Label>
          <Select
            value={filters.questionType || ''}
            onValueChange={(value) => handleFilterChange('questionType', value || undefined)}
          >
            <SelectTrigger id="questionType">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {Object.values(QuestionType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Filter */}
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            value={filters.difficulty || ''}
            onValueChange={(value) => handleFilterChange('difficulty', value || undefined)}
          >
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Difficulties</SelectItem>
              {Object.values(DifficultyLevel).map((level) => (
                <SelectItem key={level} value={level}>
                  {level.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject Filter */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select
            value={filters.subjectId || ''}
            onValueChange={(value) => handleFilterChange('subjectId', value || undefined)}
          >
            <SelectTrigger id="subject">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Subjects</SelectItem>
              {Array.isArray(subjects) ? subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
        </div>

        {/* Course Filter */}
        <div className="space-y-2">
          <Label htmlFor="course">Course</Label>
          <Select
            value={filters.courseId || ''}
            onValueChange={(value) => handleFilterChange('courseId', value || undefined)}
            disabled={!filters.subjectId}
          >
            <SelectTrigger id="course">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {Array.isArray(courses) ? courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
        </div>

        {/* Topic Filter */}
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Select
            value={filters.topicId || ''}
            onValueChange={(value) => handleFilterChange('topicId', value || undefined)}
            disabled={!filters.subjectId}
          >
            <SelectTrigger id="topic">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Topics</SelectItem>
              {topics?.data && Array.isArray(topics.data) ? topics.data.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
        </div>

        {/* Grade Level Filter */}
        <div className="space-y-2">
          <Label htmlFor="gradeLevel">Grade Level</Label>
          <Select
            value={filters.gradeLevel?.toString() || ''}
            onValueChange={(value) => handleFilterChange('gradeLevel', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger id="gradeLevel">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Grades</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                <SelectItem key={grade} value={grade.toString()}>
                  Grade {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Filter */}
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Select
            value={filters.year?.toString() || ''}
            onValueChange={(value) => handleFilterChange('year', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger id="year">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Years</SelectItem>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status || SystemStatus.ACTIVE}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(SystemStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default QuestionFilter;
