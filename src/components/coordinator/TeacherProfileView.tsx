'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeacherProfileCard } from '@/components/teachers/teacher-profile-card';
import { TeacherOverviewTab } from '@/components/teachers/teacher-overview-tab';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, GraduationCap, Plus, MessageSquare } from 'lucide-react';
import { Star, WifiOff, RefreshCw } from '@/components/ui/icons/custom-icons';
import { TeacherFeedbackDialog } from './TeacherFeedbackDialog';
import { FeedbackResponseDialog } from './FeedbackResponseDialog';
import { api } from '@/utils/api';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { useToast } from '@/components/ui/use-toast';

interface TeacherProfileViewProps {
  teacher: any;
  feedback: any[];
  campusId?: string;
}

export function TeacherProfileView({ teacher, feedback: initialFeedback, campusId }: TeacherProfileViewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string>('');
  const [feedbackList, setFeedbackList] = useState(initialFeedback || []);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use offline storage hook
  const {
    isOnline,
    getData: getOfflineData,
    saveData: saveOfflineData,
    sync
  } = useOfflineStorage(OfflineStorageType.TEACHERS);

  // Cache teacher data when component mounts
  useEffect(() => {
    if (isOnline && teacher && campusId) {
      saveOfflineData(teacher.id, teacher);
    }
  }, [isOnline, teacher, campusId, saveOfflineData]);

  // Fetch teacher feedback
  const { refetch: refetchFeedback } = api.feedback.getTeacherFeedback.useQuery(
    { teacherId: teacher.id },
    {
      enabled: isOnline, // Only fetch when online
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

  // Handle refresh
  const handleRefresh = async () => {
    if (!isOnline) {
      // If offline, try to sync
      toast({
        title: 'Offline Mode',
        description: 'You are currently offline. Using cached data.',
        variant: 'warning',
      });

      try {
        await sync();
      } catch (error) {
        console.error('Error syncing data:', error);
      }

      return;
    }

    setIsRefreshing(true);
    try {
      await refetchFeedback();
      toast({
        title: 'Data refreshed',
        description: 'Teacher data has been updated',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh teacher data',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-md flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <div>
            <p className="font-medium">Offline Mode</p>
            <p className="text-xs">You're viewing cached teacher data. Some features may be limited.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Teacher Profile Card */}
        <TeacherProfileCard teacher={teacher} />

        {/* Quick Stats */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Key performance metrics for this teacher</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Classes</p>
                <p className="text-2xl font-bold">{teacher.assignments?.length || 0}</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Subjects</p>
                <p className="text-2xl font-bold">{teacher.subjectQualifications?.length || 0}</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Feedback</p>
                <p className="text-2xl font-bold">{feedbackList?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <TeacherOverviewTab teacher={teacher} />
        </TabsContent>

        <TabsContent value="classes" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Assignments</CardTitle>
              <CardDescription>Classes this teacher is assigned to teach</CardDescription>
            </CardHeader>
            <CardContent>
              {teacher.assignments && teacher.assignments.length > 0 ? (
                <div className="space-y-4">
                  {teacher.assignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{assignment.class.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.class.courseCampus?.course?.name || 'Unknown course'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/coordinator/classes/${assignment.classId}`}>
                          View Class
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">This teacher is not assigned to any classes yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subject Qualifications</CardTitle>
              <CardDescription>Subjects this teacher is qualified to teach</CardDescription>
            </CardHeader>
            <CardContent>
              {teacher.subjectQualifications && teacher.subjectQualifications.length > 0 ? (
                <div className="space-y-4">
                  {teacher.subjectQualifications.map((qualification: any) => (
                    <div key={qualification.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{qualification.subject.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Level: {qualification.level || 'Standard'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/coordinator/subjects/${qualification.subject.id}`}>
                          View Subject
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">This teacher doesn't have any subject qualifications yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance & Punctuality */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle>Attendance & Punctuality</CardTitle>
                  </div>
                  <Badge variant="outline">Last 30 days</Badge>
                </div>
                <CardDescription>Teacher's attendance and punctuality metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Attendance Rate</span>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Punctuality</span>
                      <span className="text-sm font-medium">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Class Completion</span>
                      <span className="text-sm font-medium">98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grading & Feedback */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle>Grading & Feedback</CardTitle>
                  </div>
                  <Badge variant="outline">Last 30 days</Badge>
                </div>
                <CardDescription>Teacher's grading and feedback metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Grading Timeliness</span>
                      <span className="text-sm font-medium">2.1 days avg.</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Feedback Quality</span>
                      <span className="text-sm font-medium">Good</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Grading Consistency</span>
                      <span className="text-sm font-medium">High</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Performance */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <CardTitle>Student Performance</CardTitle>
                  </div>
                  <Badge variant="outline">Current Term</Badge>
                </div>
                <CardDescription>Performance of students under this teacher</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Grade</span>
                      <span className="text-sm font-medium">83%</span>
                    </div>
                    <Progress value={83} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pass Rate</span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Student Improvement</span>
                      <span className="text-sm font-medium">+12%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teaching Quality */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    <CardTitle>Teaching Quality</CardTitle>
                  </div>
                  <Badge variant="outline">Peer Review</Badge>
                </div>
                <CardDescription>Teaching quality assessment metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Lesson Planning</span>
                      <span className="text-sm font-medium">Excellent</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Classroom Management</span>
                      <span className="text-sm font-medium">Very Good</span>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Student Engagement</span>
                      <span className="text-sm font-medium">Good</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Teacher Feedback</h2>
            <Button onClick={() => setIsFeedbackDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Feedback
            </Button>
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
              <CardDescription>Feedback provided to this teacher</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackList.length > 0 ? (
                <div className="space-y-4">
                  {feedbackList.map((item: any) => (
                    <div key={item.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{item.feedbackBase.title}</h3>
                        <Badge
                          variant={item.feedbackBase.severity === 'POSITIVE' ? 'success' :
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
                        <span>By {item.feedbackBase.createdBy?.name || 'Unknown'} on {new Date(item.feedbackBase.createdAt).toLocaleDateString()}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => handleOpenResponseDialog(item.id)}
                        >
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
                                  {response.responder?.name || 'Unknown'} - {new Date(response.createdAt).toLocaleDateString()}
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
                  <p className="text-muted-foreground">No feedback has been provided for this teacher yet.</p>
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
          <TeacherFeedbackDialog
            teacherId={teacher.id}
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
