'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { ArrowLeftCircle, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';

// Define the schema for student activity points
const studentActivityPointsSchema = z.object({
  quiz: z.number().min(0).default(20),
  multipleChoice: z.number().min(0).default(20),
  multipleResponse: z.number().min(0).default(25),
  fillInTheBlanks: z.number().min(0).default(30),
  matching: z.number().min(0).default(35),
  sequence: z.number().min(0).default(35),
  dragAndDrop: z.number().min(0).default(40),
  dragTheWords: z.number().min(0).default(40),
  numeric: z.number().min(0).default(30),
  trueFalse: z.number().min(0).default(15),
  reading: z.number().min(0).default(10),
  video: z.number().min(0).default(15),
  h5p: z.number().min(0).default(25),
  flashCards: z.number().min(0).default(20),
  assignment: z.number().min(0).default(30),
  project: z.number().min(0).default(50),
  discussion: z.number().min(0).default(15),
});

// Define the schema for student achievement points
const studentAchievementPointsSchema = z.object({
  perfectScore: z.number().min(0).default(50),
  loginStreak: z.number().min(0).default(5),
  loginStreakBonus: z.number().min(0).default(5),
  highAchiever5: z.number().min(0).default(10),
  highAchiever10: z.number().min(0).default(20),
  highAchiever25: z.number().min(0).default(50),
  highAchiever50: z.number().min(0).default(100),
  highAchiever100: z.number().min(0).default(200),
});

// Define the schema for teacher points
const teacherPointsSchema = z.object({
  lessonPlanCreation: z.number().min(0).default(20),
  lessonPlanApproval: z.number().min(0).default(10),
  activityCreation: z.number().min(0).default(15),
  h5pContentCreation: z.number().min(0).default(25),
  gradeSubmission: z.number().min(0).default(5),
  perfectAttendance: z.number().min(0).default(50),
  studentFeedback: z.number().min(0).default(10),
  classPerformanceBonus: z.number().min(0).default(100),
});

// Define the schema for coordinator points
const coordinatorPointsSchema = z.object({
  lessonPlanReview: z.number().min(0).default(15),
  teacherObservation: z.number().min(0).default(25),
  programDevelopment: z.number().min(0).default(50),
  teacherMentoring: z.number().min(0).default(30),
  parentMeeting: z.number().min(0).default(20),
  studentCounseling: z.number().min(0).default(15),
});

// Combine all schemas
const rewardPointsConfigSchema = z.object({
  studentActivityPoints: studentActivityPointsSchema,
  studentAchievementPoints: studentAchievementPointsSchema,
  teacherPoints: teacherPointsSchema,
  coordinatorPoints: coordinatorPointsSchema,
});

type RewardPointsConfigFormValues = z.infer<typeof rewardPointsConfigSchema>;

/**
 * Reward Points Configuration Page
 *
 * This page allows system administrators to configure point values for various
 * activities, achievements, and rewards in the system.
 */
export default function RewardPointsConfigPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with default values
  const form = useForm<RewardPointsConfigFormValues>({
    resolver: zodResolver(rewardPointsConfigSchema),
    defaultValues: {
      studentActivityPoints: {
        quiz: 20,
        multipleChoice: 20,
        multipleResponse: 25,
        fillInTheBlanks: 30,
        matching: 35,
        sequence: 35,
        dragAndDrop: 40,
        dragTheWords: 40,
        numeric: 30,
        trueFalse: 15,
        reading: 10,
        video: 15,
        h5p: 25,
        flashCards: 20,
        assignment: 30,
        project: 50,
        discussion: 15,
      },
      studentAchievementPoints: {
        perfectScore: 50,
        loginStreak: 5,
        loginStreakBonus: 5,
        highAchiever5: 10,
        highAchiever10: 20,
        highAchiever25: 50,
        highAchiever50: 100,
        highAchiever100: 200,
      },
      teacherPoints: {
        lessonPlanCreation: 20,
        lessonPlanApproval: 10,
        activityCreation: 15,
        h5pContentCreation: 25,
        gradeSubmission: 5,
        perfectAttendance: 50,
        studentFeedback: 10,
        classPerformanceBonus: 100,
      },
      coordinatorPoints: {
        lessonPlanReview: 15,
        teacherObservation: 25,
        programDevelopment: 50,
        teacherMentoring: 30,
        parentMeeting: 20,
        studentCounseling: 15,
      },
    },
  });

  // Get the current reward points configuration
  const { data: configData, isLoading: isLoadingConfig } = api.rewardConfig.getRewardPointsConfig.useQuery(
    undefined,
    {
      onSuccess: (data) => {
        // Update form with the retrieved configuration
        form.reset(data);
      },
      onError: (error) => {
        console.error("Error loading reward points configuration:", error);
        toast({
          title: "Error loading settings",
          description: "There was a problem loading the reward points configuration.",
          variant: "error",
        });
      },
    }
  );

  // Update reward points configuration mutation
  const updateConfig = api.rewardConfig.updateRewardPointsConfig.useMutation({
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Reward points configuration has been updated successfully.",
      });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Error saving reward points configuration:", error);
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your reward points configuration.",
        variant: "error",
      });
      setIsSaving(false);
    },
  });

  // Handle form submission
  const onSubmit = async (data: RewardPointsConfigFormValues) => {
    setIsSaving(true);
    updateConfig.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Reward Points Configuration"
          description="Configure point values for activities, achievements, and rewards"
        />
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/system/settings">
            <ArrowLeftCircle className="h-4 w-4 mr-2" />
            Back to Settings
          </Link>
        </Button>
      </div>

      {isLoadingConfig && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading reward points configuration...</p>
          </div>
        </Card>
      )}

      {!isLoadingConfig && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="student-activity" className="space-y-6">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <TabsTrigger value="student-activity">Student Activities</TabsTrigger>
                <TabsTrigger value="student-achievement">Student Achievements</TabsTrigger>
                <TabsTrigger value="teacher">Teacher Rewards</TabsTrigger>
                <TabsTrigger value="coordinator">Coordinator Rewards</TabsTrigger>
              </TabsList>

            <TabsContent value="student-activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Activity Points</CardTitle>
                  <CardDescription>
                    Configure point values awarded to students for completing different types of activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentActivityPoints.quiz"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormDescription>Points awarded for completing a quiz</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="studentActivityPoints.multipleChoice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Multiple Choice</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormDescription>Points awarded for multiple choice questions</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Add more student activity point fields here */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="student-achievement" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Achievement Points</CardTitle>
                  <CardDescription>
                    Configure point values awarded to students for unlocking achievements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentAchievementPoints.perfectScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perfect Score</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormDescription>Bonus points for achieving a perfect score</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="studentAchievementPoints.loginStreak"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Login Streak (Base)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormDescription>Base points for daily login</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Add more student achievement point fields here */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teacher" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Reward Points</CardTitle>
                  <CardDescription>
                    Configure point values awarded to teachers for various activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="teacherPoints.lessonPlanCreation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesson Plan Creation</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormDescription>Points awarded for creating a lesson plan</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="teacherPoints.activityCreation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity Creation</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormDescription>Points awarded for creating an activity</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Add more teacher point fields here */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coordinator" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Coordinator Reward Points</CardTitle>
                  <CardDescription>
                    Configure point values awarded to coordinators for various activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="coordinatorPoints.lessonPlanReview"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesson Plan Review</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormDescription>Points awarded for reviewing a lesson plan</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coordinatorPoints.teacherObservation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teacher Observation</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormDescription>Points awarded for observing a teacher</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Add more coordinator point fields here */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
      )}
    </div>
  );
}
