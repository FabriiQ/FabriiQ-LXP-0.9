'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  User, Mail, Phone, Calendar, BookOpen, Users, Award, TrendingUp,
  Star, GraduationCap, Clock, CheckCircle, XCircle, AlertCircle,
  BarChart, LineChart, ArrowUp, ArrowDown, MessageSquare, Plus, ArrowRight
} from "lucide-react";
import { StudentFeedbackDialog } from './StudentFeedbackDialog';
import { FeedbackResponseDialog } from './FeedbackResponseDialog';
import { StudentTransferButton } from './StudentTransferButton';
import { api } from '@/utils/api';

interface StudentProfileViewProps {
  student: any;
  leaderboard: {
    position: number;
    change: number;
    classRank: number;
    programRank: number;
    history: Array<{
      date: Date;
      position: number;
    }>;
  };
  performance: {
    academic: number;
    attendance: number;
    participation: number;
    improvement: number;
    strengths: string[];
    weaknesses: string[];
    recentGrades: Array<{
      id: string;
      subject: string;
      score: number;
      letterGrade: string;
      date: Date;
    }>;
    completionRate?: number;
    submissionRate?: number;
    improvementTrend?: Array<{
      date: Date;
      value: number;
    }>;
  };
  onAction?: (action: string, studentId: string) => void;
}

export function StudentProfileView({ student, leaderboard, performance, onAction }: StudentProfileViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string>('');
  const [feedbackList, setFeedbackList] = useState(student.feedback || []);

  // Fetch student feedback
  const { refetch: refetchFeedback } = api.feedback.getStudentFeedback.useQuery(
    { studentId: student.id },
    {
      enabled: false,
      onSuccess: (data) => {
        setFeedbackList(data || []);
      },
    }
  );

  // Handle opening response dialog
  const handleOpenResponseDialog = (feedbackId: string) => {
    setSelectedFeedbackId(feedbackId);
    setIsResponseDialogOpen(true);
  };

  // Handle feedback added
  const handleFeedbackAdded = () => {
    void refetchFeedback();
  };

  // Handle response added
  const handleResponseAdded = () => {
    void refetchFeedback();
  };

  // Handle action button clicks
  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, student.id);
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date
  const formatDate = (date: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get attendance status icon
  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'LATE':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'EXCUSED':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://avatar.vercel.sh/${student.user.name}`} alt={student.user.name} />
                <AvatarFallback>{getInitials(student.user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{student.user.name || 'Unnamed Student'}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {student.enrollmentNumber}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2 justify-end">
                <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Rank #{leaderboard.position}
                  {leaderboard.change !== 0 && (
                    <span className={leaderboard.change > 0 ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                      {leaderboard.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(leaderboard.change)}
                    </span>
                  )}
                </Badge>
                <Badge variant={student.user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {student.user.status}
                </Badge>
              </div>

              {onAction && (
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('sendMessage')}
                    className="flex items-center gap-1"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('editProfile')}
                    className="flex items-center gap-1"
                  >
                    <User className="h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('viewGrades')}
                    className="flex items-center gap-1"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    View Grades
                  </Button>
                  <StudentTransferButton
                    studentId={student.id}
                    studentName={student.user.name}
                    variant="outline"
                    size="sm"
                  />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{student.user.email || 'No email'}</span>
              </div>
              {student.user.phoneNumber && (
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{student.user.phoneNumber}</span>
                </div>
              )}
              {student.user.dateOfBirth && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{formatDate(student.user.dateOfBirth)}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Academic Score</p>
                <p className="text-2xl font-bold">{performance.academic.toFixed(1)}%</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold">{performance.attendance.toFixed(1)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Participation</p>
                <p className="text-2xl font-bold">{performance.participation.toFixed(1)}%</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Improvement</p>
                <p className="text-2xl font-bold">
                  <span className={performance.improvement >= 0 ? "text-green-500" : "text-red-500"}>
                    {performance.improvement >= 0 ? "+" : ""}{performance.improvement.toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enrollments Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Enrollments</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge>{student.enrollments.length}</Badge>
                    <StudentTransferButton
                      studentId={student.id}
                      studentName={student.user.name}
                      variant="outline"
                      size="sm"
                    />
                  </div>
                </div>
                <CardDescription>Classes the student is currently enrolled in</CardDescription>
              </CardHeader>
              <CardContent>
                {student.enrollments.length > 0 ? (
                  <div className="space-y-4">
                    {student.enrollments.map((enrollment: any) => (
                      <div key={enrollment.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{enrollment.class.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.class.courseCampus.course.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Program: {enrollment.class.courseCampus.course.program.name}
                            </p>
                          </div>
                          <Badge variant="outline">{enrollment.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No current enrollments</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Performance Summary</CardTitle>
                  <Badge variant="outline">Current Term</Badge>
                </div>
                <CardDescription>Student's academic performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Academic Performance</span>
                      <span className={`text-sm font-medium ${
                        performance.academic >= 80 ? "text-green-600" :
                        performance.academic >= 60 ? "text-yellow-600" :
                        "text-red-600"
                      }`}>{performance.academic.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={performance.academic}
                      className="h-2"
                      color={
                        performance.academic >= 80 ? "bg-green-600" :
                        performance.academic >= 60 ? "bg-yellow-600" :
                        "bg-red-600"
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Attendance Rate</span>
                      <span className={`text-sm font-medium ${
                        performance.attendance >= 90 ? "text-green-600" :
                        performance.attendance >= 75 ? "text-yellow-600" :
                        "text-red-600"
                      }`}>{performance.attendance.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={performance.attendance}
                      className="h-2"
                      color={
                        performance.attendance >= 90 ? "bg-green-600" :
                        performance.attendance >= 75 ? "bg-yellow-600" :
                        "bg-red-600"
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Participation</span>
                      <span className={`text-sm font-medium ${
                        performance.participation >= 80 ? "text-green-600" :
                        performance.participation >= 60 ? "text-yellow-600" :
                        "text-red-600"
                      }`}>{performance.participation.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={performance.participation}
                      className="h-2"
                      color={
                        performance.participation >= 80 ? "bg-green-600" :
                        performance.participation >= 60 ? "bg-yellow-600" :
                        "bg-red-600"
                      }
                    />
                  </div>

                  {performance.completionRate !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Assignment Completion</span>
                        <span className={`text-sm font-medium ${
                          performance.completionRate >= 90 ? "text-green-600" :
                          performance.completionRate >= 70 ? "text-yellow-600" :
                          "text-red-600"
                        }`}>{performance.completionRate.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={performance.completionRate}
                        className="h-2"
                        color={
                          performance.completionRate >= 90 ? "bg-green-600" :
                          performance.completionRate >= 70 ? "bg-yellow-600" :
                          "bg-red-600"
                        }
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Strengths</h4>
                    <div className="flex flex-wrap gap-1">
                      {performance.strengths.map((strength, index) => (
                        <Badge key={index} variant="secondary">{strength}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Areas for Improvement</h4>
                    <div className="flex flex-wrap gap-1">
                      {performance.weaknesses.map((weakness, index) => (
                        <Badge key={index} variant="outline">{weakness}</Badge>
                      ))}
                    </div>
                  </div>

                  {onAction && (
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('viewPerformance')}
                        className="flex items-center gap-1"
                      >
                        <BarChart className="h-3.5 w-3.5" />
                        Detailed Performance
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Position Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leaderboard Rankings</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  #{leaderboard.position} Overall
                </Badge>
              </div>
              <CardDescription>Student's ranking across different categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Class Ranking</h3>
                  <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span className="text-lg font-bold">#{leaderboard.classRank}</span>
                    </div>
                    <Badge variant="outline">Class</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Program Ranking</h3>
                  <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span className="text-lg font-bold">#{leaderboard.programRank}</span>
                    </div>
                    <Badge variant="outline">Program</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Improvement Trend</h3>
                  <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span className={`text-lg font-bold ${performance.improvement >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {performance.improvement >= 0 ? "+" : ""}{performance.improvement.toFixed(1)}%
                      </span>
                    </div>
                    <Badge variant="outline">Trend</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <CardTitle>Academic Performance</CardTitle>
                </div>
                <Badge variant="outline">Current Term</Badge>
              </div>
              <CardDescription>Student's grades and academic achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Grades</h3>
                  {performance.recentGrades.length > 0 ? (
                    <div className="space-y-3">
                      {performance.recentGrades.map((grade) => (
                        <div key={grade.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{grade.subject}</h4>
                              <p className="text-xs text-muted-foreground">{formatDate(grade.date)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge>{grade.letterGrade}</Badge>
                              <span className="font-bold">{grade.score.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No recent grades available</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Overall GPA</span>
                        <span className="font-medium">{(performance.academic / 20).toFixed(1)}</span>
                      </div>
                      <Progress value={performance.academic} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Assignment Completion</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Quiz Average</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Project Quality</span>
                        <span className="font-medium">88%</span>
                      </div>
                      <Progress value={88} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Attendance Record</CardTitle>
                </div>
                <Badge variant="outline">Last 30 Days</Badge>
              </div>
              <CardDescription>Student's attendance history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    <p className="text-2xl font-bold">{performance.attendance.toFixed(1)}%</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Present Days</p>
                    <p className="text-2xl font-bold">{Math.round(student.attendance.length * (performance.attendance / 100))}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Absent Days</p>
                    <p className="text-2xl font-bold">{Math.round(student.attendance.length * (1 - performance.attendance / 100))}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Attendance</h3>
                  {student.attendance.length > 0 ? (
                    <div className="space-y-3">
                      {student.attendance.slice(0, 10).map((record: any) => (
                        <div key={record.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {getAttendanceIcon(record.status)}
                              <div>
                                <p className="font-medium">{formatDate(record.date)}</p>
                                {record.remarks && (
                                  <p className="text-xs text-muted-foreground">{record.remarks}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant={
                              record.status === 'PRESENT' ? 'default' :
                              record.status === 'ABSENT' ? 'destructive' :
                              record.status === 'LATE' ? 'warning' : 'secondary'
                            }>
                              {record.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No attendance records available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold">Student Feedback</h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsFeedbackDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Feedback
              </Button>
              {onAction && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('exportFeedback')}
                    className="flex items-center gap-1"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('shareFeedback')}
                    className="flex items-center gap-1"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle>Feedback History</CardTitle>
                </div>
                <Badge variant="outline">{feedbackList?.length || 0} Items</Badge>
              </div>
              <CardDescription>Feedback provided to this student</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackList?.length > 0 ? (
                <div className="space-y-4">
                  {feedbackList.map((item: any) => (
                    <div key={item.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{item.feedbackBase.title}</h3>
                        <Badge
                          variant={item.feedbackBase.severity === 'POSITIVE' ? 'default' :
                                 item.feedbackBase.severity === 'NEUTRAL' ? 'secondary' :
                                 item.feedbackBase.severity === 'CONCERN' ? 'warning' : 'destructive'}
                        >
                          {item.feedbackBase.severity}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{item.feedbackBase.description}</p>
                      {item.feedbackBase.tags && item.feedbackBase.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.feedbackBase.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground flex justify-between items-center mt-2">
                        <span>By {item.feedbackBase.createdBy?.name || 'Unknown'} on {formatDate(item.feedbackBase.createdAt)}</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleOpenResponseDialog(item.id)}>
                          Reply
                        </Button>
                      </div>

                      {/* Responses section */}
                      {item.responses && item.responses.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-2">Responses:</p>
                          <div className="space-y-2">
                            {item.responses.map((response: any) => (
                              <div key={response.id} className="bg-muted p-2 rounded-md text-sm">
                                <p>{response.content}</p>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {response.responder?.name || 'Unknown'} - {formatDate(response.createdAt)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No feedback has been provided for this student yet.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsFeedbackDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Feedback
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Dialog */}
          <StudentFeedbackDialog
            studentId={student.id}
            isOpen={isFeedbackDialogOpen}
            onClose={() => setIsFeedbackDialogOpen(false)}
            onFeedbackAdded={handleFeedbackAdded}
          />

          {/* Response Dialog */}
          <FeedbackResponseDialog
            feedbackId={selectedFeedbackId}
            isOpen={isResponseDialogOpen}
            onClose={() => setIsResponseDialogOpen(false)}
            onResponseAdded={handleResponseAdded}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
