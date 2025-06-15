'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/core/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/core/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/core/avatar';
import { Badge } from '@/components/ui/core/badge';
// TODO: Fix Progress import
// import { Progress } from '@/components/ui/core/progress';
import { Skeleton } from '@/components/ui/core/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import {
  Mail,
  Calendar,
  GraduationCap,
  BookOpen,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Phone } from './icons';
import { format } from 'date-fns';
import {
  StudentData,
  StudentStatus,
  StudentTab,
  UserRole
} from './types';
import { StudentActions } from './StudentActions';

export interface StudentProfileViewProps {
  /**
   * Student data
   */
  student: StudentData;

  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;

  /**
   * Array of tabs to display
   * @default ['overview', 'classes', 'performance', 'attendance', 'feedback', 'documents', 'notes']
   */
  tabs?: StudentTab[];

  /**
   * Default active tab
   * @default StudentTab.OVERVIEW
   */
  defaultTab?: StudentTab;

  /**
   * Tab change callback
   */
  onTabChange?: (tab: StudentTab) => void;

  /**
   * Action callback
   */
  onAction?: (action: string, student: StudentData) => void;

  /**
   * Children components to render in each tab
   */
  children?: React.ReactNode;

  /**
   * Overview tab content
   */
  overviewContent?: React.ReactNode;

  /**
   * Classes tab content
   */
  classesContent?: React.ReactNode;

  /**
   * Performance tab content
   */
  performanceContent?: React.ReactNode;

  /**
   * Mastery tab content
   */
  masteryContent?: React.ReactNode;

  /**
   * Attendance tab content
   */
  attendanceContent?: React.ReactNode;

  /**
   * Feedback tab content
   */
  feedbackContent?: React.ReactNode;

  /**
   * Documents tab content
   */
  documentsContent?: React.ReactNode;

  /**
   * Notes tab content
   */
  notesContent?: React.ReactNode;

  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Error message
   */
  error?: string;

  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * StudentProfileView component with mobile-first design
 *
 * Features:
 * - Role-based rendering
 * - Tabbed interface for different sections
 * - Student information display
 * - Performance metrics
 *
 * @example
 * ```tsx
 * <StudentProfileView
 *   student={student}
 *   userRole={UserRole.TEACHER}
 *   onAction={handleAction}
 *   overviewContent={<StudentOverview student={student} />}
 *   attendanceContent={<StudentAttendance student={student} />}
 * />
 * ```
 */
export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student,
  userRole,
  tabs = Object.values(StudentTab),
  defaultTab = StudentTab.OVERVIEW,
  onTabChange,
  onAction,
  children,
  overviewContent,
  classesContent,
  performanceContent,
  masteryContent,
  attendanceContent,
  feedbackContent,
  documentsContent,
  notesContent,
  isLoading = false,
  error,
  className,
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<StudentTab>(defaultTab);

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format score for display
  const formatScore = (score?: number) => {
    if (score === undefined) return 'N/A';
    return `${score.toFixed(1)}%`;
  };

  // Get status badge variant
  const getStatusVariant = (status: StudentStatus) => {
    switch (status) {
      case StudentStatus.ACTIVE:
        return 'success';
      case StudentStatus.INACTIVE:
        return 'secondary';
      case StudentStatus.SUSPENDED:
        return 'destructive';
      case StudentStatus.GRADUATED:
        return 'default';
      case StudentStatus.WITHDRAWN:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as StudentTab);
    if (onTabChange) {
      onTabChange(value as StudentTab);
    }
  };

  // Handle action
  const handleAction = (action: string, student: StudentData) => {
    if (onAction) {
      onAction(action, student);
    }
  };

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => {
    if (tab === StudentTab.NOTES && userRole === UserRole.STUDENT) {
      return false;
    }
    return true;
  });

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>

              <Skeleton className="h-10 w-full" />

              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={student.profileImage} alt={student.name} />
              <AvatarFallback className="text-xl">{getInitials(student.name)}</AvatarFallback>
            </Avatar>

            <div className="space-y-1 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <CardTitle className="text-2xl">{student.name}</CardTitle>
                <Badge variant={getStatusVariant(student.status)}>
                  {student.status}
                </Badge>
              </div>

              <CardDescription className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {student.enrollmentNumber}
              </CardDescription>

              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{student.email}</span>
                </div>

                {student.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{student.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {onAction && (
              <StudentActions
                student={student}
                userRole={userRole}
                onAction={handleAction}
                compact={true}
              />
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Performance metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {student.academicScore !== undefined && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <BookOpen className="h-8 w-8 mb-2 text-primary" />
                      <div className="text-2xl font-bold">{formatScore(student.academicScore)}</div>
                      <div className="text-sm text-muted-foreground">Academic Score</div>
                      {/* TODO: Fix Progress component */}
                      <div
                        className="h-1.5 mt-2 w-full bg-secondary rounded-full overflow-hidden"
                      >
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${student.academicScore}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {student.attendanceRate !== undefined && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <Calendar className="h-8 w-8 mb-2 text-primary" />
                      <div className="text-2xl font-bold">{formatScore(student.attendanceRate)}</div>
                      <div className="text-sm text-muted-foreground">Attendance Rate</div>
                      {/* TODO: Fix Progress component */}
                      <div
                        className="h-1.5 mt-2 w-full bg-secondary rounded-full overflow-hidden"
                      >
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${student.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {student.participationRate !== undefined && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <Clock className="h-8 w-8 mb-2 text-primary" />
                      <div className="text-2xl font-bold">{formatScore(student.participationRate)}</div>
                      <div className="text-sm text-muted-foreground">Participation Rate</div>
                      {/* TODO: Fix Progress component */}
                      <div
                        className="h-1.5 mt-2 w-full bg-secondary rounded-full overflow-hidden"
                      >
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${student.participationRate}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {student.classCount !== undefined && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <BookOpen className="h-8 w-8 mb-2 text-primary" />
                      <div className="text-2xl font-bold">{student.classCount}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.classCount === 1 ? 'Class' : 'Classes'} Enrolled
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 mb-6">
                {visibleTabs.includes(StudentTab.OVERVIEW) && (
                  <TabsTrigger value={StudentTab.OVERVIEW}>Overview</TabsTrigger>
                )}
                {visibleTabs.includes(StudentTab.CLASSES) && (
                  <TabsTrigger value={StudentTab.CLASSES}>Classes</TabsTrigger>
                )}
                {visibleTabs.includes(StudentTab.PERFORMANCE) && (
                  <TabsTrigger value={StudentTab.PERFORMANCE}>Performance</TabsTrigger>
                )}
                {visibleTabs.includes(StudentTab.MASTERY) && (
                  <TabsTrigger value={StudentTab.MASTERY}>Mastery</TabsTrigger>
                )}
                {visibleTabs.includes(StudentTab.ATTENDANCE) && (
                  <TabsTrigger value={StudentTab.ATTENDANCE}>Attendance</TabsTrigger>
                )}
                {visibleTabs.includes(StudentTab.FEEDBACK) && (
                  <TabsTrigger value={StudentTab.FEEDBACK}>Feedback</TabsTrigger>
                )}
                {visibleTabs.includes(StudentTab.DOCUMENTS) && (
                  <TabsTrigger value={StudentTab.DOCUMENTS}>Documents</TabsTrigger>
                )}
                {visibleTabs.includes(StudentTab.NOTES) && (
                  <TabsTrigger value={StudentTab.NOTES}>Notes</TabsTrigger>
                )}
              </TabsList>

              {visibleTabs.includes(StudentTab.OVERVIEW) && (
                <TabsContent value={StudentTab.OVERVIEW}>
                  {overviewContent || (
                    <div className="space-y-6">
                      {/* Personal Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                              <dd className="mt-1">{student.name}</dd>
                            </div>

                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                              <dd className="mt-1">{student.email}</dd>
                            </div>

                            {student.phone && (
                              <div>
                                <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                                <dd className="mt-1">{student.phone}</dd>
                              </div>
                            )}

                            {student.dateOfBirth && (
                              <div>
                                <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
                                <dd className="mt-1">{format(student.dateOfBirth, 'PPP')}</dd>
                              </div>
                            )}

                            {student.gender && (
                              <div>
                                <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
                                <dd className="mt-1">{student.gender}</dd>
                              </div>
                            )}

                            {student.address && (
                              <div className="md:col-span-2">
                                <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                                <dd className="mt-1">{student.address}</dd>
                              </div>
                            )}
                          </dl>
                        </CardContent>
                      </Card>

                      {/* Academic Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Academic Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Enrollment Number</dt>
                              <dd className="mt-1">{student.enrollmentNumber}</dd>
                            </div>

                            {student.joinDate && (
                              <div>
                                <dt className="text-sm font-medium text-muted-foreground">Join Date</dt>
                                <dd className="mt-1">{format(student.joinDate, 'PPP')}</dd>
                              </div>
                            )}

                            {student.campusName && (
                              <div>
                                <dt className="text-sm font-medium text-muted-foreground">Campus</dt>
                                <dd className="mt-1">{student.campusName}</dd>
                              </div>
                            )}

                            {student.programName && (
                              <div>
                                <dt className="text-sm font-medium text-muted-foreground">Program</dt>
                                <dd className="mt-1">{student.programName}</dd>
                              </div>
                            )}

                            {student.currentGrade && (
                              <div>
                                <dt className="text-sm font-medium text-muted-foreground">Current Grade</dt>
                                <dd className="mt-1">{student.currentGrade}</dd>
                              </div>
                            )}

                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                              <dd className="mt-1">
                                <Badge variant={getStatusVariant(student.status)}>
                                  {student.status}
                                </Badge>
                              </dd>
                            </div>
                          </dl>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              )}

              {visibleTabs.includes(StudentTab.CLASSES) && (
                <TabsContent value={StudentTab.CLASSES}>
                  {classesContent || (
                    <div className="text-center py-8 text-muted-foreground">
                      No class information available.
                    </div>
                  )}
                </TabsContent>
              )}

              {visibleTabs.includes(StudentTab.PERFORMANCE) && (
                <TabsContent value={StudentTab.PERFORMANCE}>
                  {performanceContent || (
                    <div className="text-center py-8 text-muted-foreground">
                      No performance data available.
                    </div>
                  )}
                </TabsContent>
              )}

              {visibleTabs.includes(StudentTab.MASTERY) && (
                <TabsContent value={StudentTab.MASTERY}>
                  {masteryContent || (
                    <div className="text-center py-8 text-muted-foreground">
                      No mastery data available.
                    </div>
                  )}
                </TabsContent>
              )}

              {visibleTabs.includes(StudentTab.ATTENDANCE) && (
                <TabsContent value={StudentTab.ATTENDANCE}>
                  {attendanceContent || (
                    <div className="text-center py-8 text-muted-foreground">
                      No attendance data available.
                    </div>
                  )}
                </TabsContent>
              )}

              {visibleTabs.includes(StudentTab.FEEDBACK) && (
                <TabsContent value={StudentTab.FEEDBACK}>
                  {feedbackContent || (
                    <div className="text-center py-8 text-muted-foreground">
                      No feedback available.
                    </div>
                  )}
                </TabsContent>
              )}

              {visibleTabs.includes(StudentTab.DOCUMENTS) && (
                <TabsContent value={StudentTab.DOCUMENTS}>
                  {documentsContent || (
                    <div className="text-center py-8 text-muted-foreground">
                      No documents available.
                    </div>
                  )}
                </TabsContent>
              )}

              {visibleTabs.includes(StudentTab.NOTES) && (
                <TabsContent value={StudentTab.NOTES}>
                  {notesContent || (
                    <div className="text-center py-8 text-muted-foreground">
                      No notes available.
                    </div>
                  )}
                </TabsContent>
              )}

              {children}
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfileView;
