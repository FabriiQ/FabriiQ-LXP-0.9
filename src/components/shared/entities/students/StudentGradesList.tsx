'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  AlertCircle,
  ChevronRight,
  Filter,
  BarChart,
  GraduationCap,
  FileText,
  Calendar
} from 'lucide-react';
import { RefreshCw, WifiOff } from './icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface Grade {
  id: string;
  title: string;
  subject: string;
  type: string;
  date: Date;
  score: number;
  totalScore: number;
  grade: string;
  feedback?: string;
  classId: string;
  className: string;
  term?: string;
}

export interface StudentGradesListProps {
  grades: Grade[];
  isLoading?: boolean;
  error?: string;
  className?: string;
  onRefresh?: () => void;
  isOffline?: boolean;
}

/**
 * StudentGradesList component with mobile-first design
 *
 * Features:
 * - List view of grades
 * - Filtering and searching
 * - Grade indicators
 * - Loading and error states
 *
 * @example
 * ```tsx
 * <StudentGradesList
 *   grades={grades}
 * />
 * ```
 */
export const StudentGradesList: React.FC<StudentGradesListProps> = ({
  grades,
  isLoading = false,
  error,
  className,
  onRefresh,
  isOffline = false,
}) => {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');

  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get grade badge variant
  const getGradeVariant = (grade: string) => {
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'secondary';
    if (grade.startsWith('C')) return 'warning';
    if (grade.startsWith('D')) return 'warning';
    if (grade.startsWith('F')) return 'destructive';
    return 'outline';
  };

  // Get percentage from score and totalScore
  const getPercentage = (score: number, totalScore: number) => {
    return Math.round((score / totalScore) * 100);
  };

  // Get unique grade types
  const gradeTypes = ['all', ...Array.from(new Set(grades.map(g => g.type)))];

  // Get unique classes
  const classes = ['all', ...Array.from(new Set(grades.map(g => g.className)))];

  // Get unique terms
  const terms = ['all', ...Array.from(new Set(grades.map(g => g.term || 'Current Term')))];

  // Filter grades
  const filteredGrades = grades.filter(grade => {
    // Search filter
    const matchesSearch =
      grade.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.className.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    const matchesType = typeFilter === 'all' || grade.type === typeFilter;

    // Class filter
    const matchesClass = classFilter === 'all' || grade.className === classFilter;

    // Term filter
    const matchesTerm = termFilter === 'all' || (grade.term || 'Current Term') === termFilter;

    return matchesSearch && matchesType && matchesClass && matchesTerm;
  });

  // Calculate overall statistics
  const overallStats = {
    totalGrades: filteredGrades.length,
    averageScore: filteredGrades.length > 0
      ? Math.round(filteredGrades.reduce((sum, grade) => sum + getPercentage(grade.score, grade.totalScore), 0) / filteredGrades.length)
      : 0,
    highestGrade: filteredGrades.length > 0
      ? filteredGrades.reduce((highest, grade) => {
          const percentage = getPercentage(grade.score, grade.totalScore);
          return percentage > highest ? percentage : highest;
        }, 0)
      : 0,
    lowestGrade: filteredGrades.length > 0
      ? filteredGrades.reduce((lowest, grade) => {
          const percentage = getPercentage(grade.score, grade.totalScore);
          return percentage < lowest || lowest === 0 ? percentage : lowest;
        }, 0)
      : 0,
  };

  // Group grades by subject
  const gradesBySubject = filteredGrades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = [];
    }
    acc[grade.subject].push(grade);
    return acc;
  }, {} as Record<string, Grade[]>);

  // Calculate subject averages
  const subjectAverages = Object.entries(gradesBySubject).map(([subject, subjectGrades]) => {
    const average = Math.round(subjectGrades.reduce((sum, grade) => sum + getPercentage(grade.score, grade.totalScore), 0) / subjectGrades.length);
    return { subject, average };
  }).sort((a, b) => b.average - a.average);

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Skeleton className="h-10 w-24 flex-shrink-0" />
            <Skeleton className="h-10 w-24 flex-shrink-0" />
            <Skeleton className="h-10 w-24 flex-shrink-0" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium">Error Loading Grades</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Grades</h1>
            <p className="text-muted-foreground">
              View and track your academic performance
            </p>
          </div>
          {isOffline && (
            <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-800 border-yellow-300">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
        <div className="w-full md:w-auto flex gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isOffline}
              title={isOffline ? "Cannot refresh while offline" : "Refresh grades"}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search grades..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {gradeTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[150px]">
            <BookOpen className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map(cls => (
              <SelectItem key={cls} value={cls}>
                {cls === 'all' ? 'All Classes' : cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Term" />
          </SelectTrigger>
          <SelectContent>
            {terms.map(term => (
              <SelectItem key={term} value={term}>
                {term === 'all' ? 'All Terms' : term}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageScore}%</div>
            <Progress value={overallStats.averageScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Highest Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.highestGrade}%</div>
            <Progress value={overallStats.highestGrade} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalGrades}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across {Object.keys(gradesBySubject).length} subjects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
          <CardDescription>Your average scores by subject</CardDescription>
        </CardHeader>
        <CardContent>
          {subjectAverages.length > 0 ? (
            <div className="space-y-4">
              {subjectAverages.map(({ subject, average }) => (
                <div key={subject} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{subject}</span>
                    <span>{average}%</span>
                  </div>
                  <Progress value={average} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BarChart className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No grades to display</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grades List */}
      <Card>
        <CardHeader>
          <CardTitle>Grade History</CardTitle>
          <CardDescription>
            All your grades and assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="subject">Subject View</TabsTrigger>
              </TabsList>
            </div>

            {/* List View */}
            <TabsContent value="list" className="m-0">
              {filteredGrades.length > 0 ? (
                <div className="space-y-4">
                  {filteredGrades
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(grade => (
                      <div key={grade.id} className="border rounded-lg p-4 hover:bg-muted/50">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                          <div>
                            <h3 className="font-medium">{grade.title}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">{grade.className}</span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{grade.type}</span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{formatDate(grade.date)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-medium">{grade.score}/{grade.totalScore}</div>
                              <div className="text-sm text-muted-foreground">{getPercentage(grade.score, grade.totalScore)}%</div>
                            </div>
                            <Badge variant={getGradeVariant(grade.grade)} className="ml-2">
                              {grade.grade}
                            </Badge>
                          </div>
                        </div>
                        {grade.feedback && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-1">Feedback:</p>
                            <p className="text-sm">{grade.feedback}</p>
                          </div>
                        )}
                        <div className="mt-3">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/student/grades/${grade.id}`}>
                              View Details
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Grades Found</h3>
                  <p className="text-muted-foreground mt-2">
                    {searchTerm || typeFilter !== 'all' || classFilter !== 'all' || termFilter !== 'all'
                      ? "Try adjusting your filters"
                      : "You don't have any grades yet"}
                  </p>
                  {(searchTerm || typeFilter !== 'all' || classFilter !== 'all' || termFilter !== 'all') && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                        setClassFilter('all');
                        setTermFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Subject View */}
            <TabsContent value="subject" className="m-0">
              {Object.keys(gradesBySubject).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(gradesBySubject).map(([subject, subjectGrades]) => {
                    const subjectAverage = Math.round(subjectGrades.reduce((sum, grade) => sum + getPercentage(grade.score, grade.totalScore), 0) / subjectGrades.length);

                    return (
                      <Card key={subject}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{subject}</CardTitle>
                            <Badge variant="outline" className="ml-2">
                              Average: {subjectAverage}%
                            </Badge>
                          </div>
                          <CardDescription>{subjectGrades.length} assessments</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {subjectGrades
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map(grade => (
                                <div key={grade.id} className="border rounded-lg p-3 hover:bg-muted/50">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm">{grade.title}</h4>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-xs text-muted-foreground">{grade.type}</span>
                                        <span className="text-xs text-muted-foreground">•</span>
                                        <span className="text-xs text-muted-foreground">{formatDate(grade.date)}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <div className="text-sm font-medium">{grade.score}/{grade.totalScore}</div>
                                        <div className="text-xs text-muted-foreground">{getPercentage(grade.score, grade.totalScore)}%</div>
                                      </div>
                                      <Badge variant={getGradeVariant(grade.grade)} className="ml-2">
                                        {grade.grade}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Grades Found</h3>
                  <p className="text-muted-foreground mt-2">
                    {searchTerm || typeFilter !== 'all' || classFilter !== 'all' || termFilter !== 'all'
                      ? "Try adjusting your filters"
                      : "You don't have any grades yet"}
                  </p>
                  {(searchTerm || typeFilter !== 'all' || classFilter !== 'all' || termFilter !== 'all') && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                        setClassFilter('all');
                        setTermFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentGradesList;
