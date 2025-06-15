'use client';

/**
 * Enhanced Batch Grading Component
 *
 * This component allows teachers to grade multiple assessment submissions
 * at once using batch operations with Bloom's Taxonomy integration.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Save,
  Filter,
  BarChart,
  Activity,
  CheckCircle,
  AlertCircle,
  Search,
  Download
} from 'lucide-react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';

interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submissionId?: string;
  currentScore?: number;
  status: 'submitted' | 'graded' | 'pending';
  submittedAt?: Date;
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
}

interface BatchGradeEntry {
  studentId: string;
  score: number;
  feedback: string;
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  criteriaGrades?: Array<{
    criterionId: string;
    levelId: string;
    score: number;
    feedback?: string;
  }>;
}

interface BatchGradingProps {
  students: StudentSubmission[];
  maxScore: number;
  gradingMethod: 'SCORE_BASED' | 'RUBRIC_BASED';
  bloomsDistribution?: Record<BloomsTaxonomyLevel, number>;
  onSave: (grades: BatchGradeEntry[]) => Promise<void>;
  isSaving?: boolean;
  showBloomsAnalysis?: boolean;
  className?: string;
}

export function BatchGrading({
  students,
  maxScore,
  gradingMethod,
  bloomsDistribution,
  onSave,
  isSaving = false,
  showBloomsAnalysis = true,
  className = '',
}: BatchGradingProps) {
  const [grades, setGrades] = useState<Record<string, BatchGradeEntry>>({});
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'grading' | 'analytics'>('grading');
  const [bulkScore, setBulkScore] = useState<string>('');
  const [bulkFeedback, setBulkFeedback] = useState<string>('');

  // Initialize grades from existing data
  useEffect(() => {
    const initialGrades: Record<string, BatchGradeEntry> = {};
    students.forEach(student => {
      initialGrades[student.studentId] = {
        studentId: student.studentId,
        score: student.currentScore || 0,
        feedback: '',
        bloomsLevelScores: student.bloomsLevelScores,
      };
    });
    setGrades(initialGrades);
    setSelectedStudents(new Set(students.map(s => s.studentId)));
  }, [students]);

  // Filter students based on search and status
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'graded' && student.status === 'graded') ||
                         (filterStatus === 'ungraded' && student.status !== 'graded');

    return matchesSearch && matchesStatus;
  });

  // Calculate analytics
  const getAnalytics = () => {
    const totalStudents = filteredStudents.length;
    const gradedStudents = filteredStudents.filter(s => s.status === 'graded').length;
    const averageScore = filteredStudents.reduce((sum, s) => sum + (grades[s.studentId]?.score || 0), 0) / totalStudents;

    const bloomsAnalysis = bloomsDistribution ? Object.values(BloomsTaxonomyLevel).map(level => {
      if (!bloomsDistribution[level]) return null;

      const scores = filteredStudents.map(s => grades[s.studentId]?.bloomsLevelScores?.[level] || 0);
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const maxPossible = (maxScore * bloomsDistribution[level]) / 100;

      return {
        level,
        average,
        maxPossible,
        percentage: maxPossible > 0 ? (average / maxPossible) * 100 : 0,
      };
    }).filter(Boolean) : [];

    return {
      totalStudents,
      gradedStudents,
      averageScore,
      bloomsAnalysis,
    };
  };

  // Handle individual grade change
  const handleGradeChange = (studentId: string, field: keyof BatchGradeEntry, value: any) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  // Calculate Bloom's scores from total score
  const calculateBloomsScores = (totalScore: number): Record<BloomsTaxonomyLevel, number> => {
    if (!bloomsDistribution) return {} as Record<BloomsTaxonomyLevel, number>;

    const scores: Record<BloomsTaxonomyLevel, number> = {} as any;
    const percentage = totalScore / maxScore;

    Object.entries(bloomsDistribution).forEach(([level, distribution]) => {
      const levelMaxScore = (maxScore * distribution) / 100;
      scores[level as BloomsTaxonomyLevel] = Math.round(levelMaxScore * percentage);
    });

    return scores;
  };

  // Handle bulk operations
  const applyBulkGrade = () => {
    if (!bulkScore) return;

    const score = parseFloat(bulkScore);
    if (isNaN(score) || score < 0 || score > maxScore) return;

    selectedStudents.forEach(studentId => {
      const bloomsScores = calculateBloomsScores(score);
      handleGradeChange(studentId, 'score', score);
      handleGradeChange(studentId, 'bloomsLevelScores', bloomsScores);
      if (bulkFeedback) {
        handleGradeChange(studentId, 'feedback', bulkFeedback);
      }
    });
  };

  // Handle student selection
  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAllFiltered = () => {
    setSelectedStudents(new Set(filteredStudents.map(s => s.studentId)));
  };

  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  // Handle save
  const handleSave = async () => {
    const gradesToSave = Object.values(grades).filter(grade =>
      selectedStudents.has(grade.studentId)
    );
    await onSave(gradesToSave);
  };

  const analytics = getAnalytics();

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grading">
            <Users className="h-4 w-4 mr-2" />
            Batch Grading
          </TabsTrigger>
          {showBloomsAnalysis && (
            <TabsTrigger value="analytics">
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="grading" className="space-y-4">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Batch Grading Controls
                </span>
                <Badge variant="outline">
                  {selectedStudents.size} of {filteredStudents.length} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="graded">Graded</SelectItem>
                    <SelectItem value="ungraded">Ungraded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selection Controls */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                  Select All Filtered
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>

              {/* Bulk Grading */}
              {gradingMethod === 'SCORE_BASED' && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Bulk Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Score</label>
                      <Input
                        type="number"
                        placeholder={`0-${maxScore}`}
                        value={bulkScore}
                        onChange={(e) => setBulkScore(e.target.value)}
                        min={0}
                        max={maxScore}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Feedback</label>
                      <Input
                        placeholder="Optional feedback for selected students"
                        value={bulkFeedback}
                        onChange={(e) => setBulkFeedback(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={applyBulkGrade}
                    disabled={!bulkScore || selectedStudents.size === 0}
                    size="sm"
                  >
                    Apply to Selected ({selectedStudents.size})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grading Table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Grades</CardTitle>
              <CardDescription>
                Grade individual students or use bulk actions above
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllFiltered();
                            } else {
                              clearSelection();
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Feedback</TableHead>
                      {showBloomsAnalysis && bloomsDistribution && <TableHead>Bloom's Levels</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const grade = grades[student.studentId];
                      return (
                        <TableRow key={student.studentId}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.has(student.studentId)}
                              onCheckedChange={() => toggleStudentSelection(student.studentId)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.studentName}</div>
                              <div className="text-xs text-muted-foreground">{student.studentEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.status === 'graded' ? 'default' :
                                student.status === 'submitted' ? 'secondary' : 'outline'
                              }
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={grade?.score || 0}
                              onChange={(e) => {
                                const newScore = parseFloat(e.target.value) || 0;
                                handleGradeChange(student.studentId, 'score', newScore);
                                if (bloomsDistribution) {
                                  handleGradeChange(student.studentId, 'bloomsLevelScores', calculateBloomsScores(newScore));
                                }
                              }}
                              min={0}
                              max={maxScore}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Textarea
                              value={grade?.feedback || ''}
                              onChange={(e) => handleGradeChange(
                                student.studentId,
                                'feedback',
                                e.target.value
                              )}
                              placeholder="Feedback..."
                              className="min-h-[60px] max-w-[200px]"
                            />
                          </TableCell>
                          {showBloomsAnalysis && bloomsDistribution && (
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(grade?.bloomsLevelScores || {}).map(([level, score]) => {
                                  const metadata = BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel];
                                  const maxLevelScore = (maxScore * (bloomsDistribution[level as BloomsTaxonomyLevel] || 0)) / 100;
                                  return (
                                    <Badge
                                      key={level}
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        backgroundColor: `${metadata.color}20`,
                                        borderColor: metadata.color,
                                      }}
                                    >
                                      {metadata.name}: {score}/{maxLevelScore.toFixed(0)}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Save Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedStudents.size} students selected for grading
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Grades
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || selectedStudents.size === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : `Save Grades (${selectedStudents.size})`}
              </Button>
            </div>
          </div>
        </TabsContent>

        {showBloomsAnalysis && (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{analytics.totalStudents}</div>
                  <div className="text-sm text-muted-foreground">Total Students</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{analytics.gradedStudents}</div>
                  <div className="text-sm text-muted-foreground">Graded</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{analytics.averageScore.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {((analytics.averageScore / maxScore) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average %</div>
                </CardContent>
              </Card>
            </div>

            {bloomsDistribution && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Bloom's Taxonomy Performance
                  </CardTitle>
                  <CardDescription>
                    Class performance across cognitive levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.bloomsAnalysis.map((item: any) => {
                      const metadata = BLOOMS_LEVEL_METADATA[item.level];
                      return (
                        <div key={item.level} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: metadata.color }}
                              />
                              <span className="font-medium">{metadata.name}</span>
                            </div>
                            <div className="text-sm">
                              {item.average.toFixed(1)}/{item.maxPossible.toFixed(1)} ({item.percentage.toFixed(1)}%)
                            </div>
                          </div>
                          <Progress
                            value={item.percentage}
                            className="h-2"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
