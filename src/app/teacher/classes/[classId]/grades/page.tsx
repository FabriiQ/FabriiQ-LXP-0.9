import React from "react";
import { getSessionCache } from "@/utils/session-cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/atoms/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from "@/server/api/utils/logger";
import { UserType } from "@prisma/client";
import Link from "next/link";
import { Download, Plus } from "lucide-react";

export default async function ClassGradesPage({
  params,
}: {
  params: { classId: string };
}) {
  const { classId } = params;
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      return redirect("/login");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        userType: true,
        teacherProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== 'TEACHER') || !user.teacherProfile) {
      return redirect("/login");
    }

    // Get class details
    const classDetails = await prisma.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        term: true,
        courseCampus: {
          include: {
            course: {
              include: {
                subjects: true
              }
            }
          }
        },
        teachers: {
          include: {
            teacher: true,
          },
        },
        students: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!classDetails) {
      return redirect("/teacher/classes");
    }

    // Check if the teacher is assigned to this class
    const isTeacherAssigned = classDetails.teachers.some(
      (assignment) => assignment.teacherId === user.teacherProfile?.id
    );

    if (!isTeacherAssigned) {
      return redirect("/teacher/classes");
    }

    // Get gradebook for this class
    console.log('Looking for gradebook with classId:', classId, 'and termId:', classDetails.termId);

    let gradebook = await prisma.gradeBook.findFirst({
      where: {
        classId: classId,
        // The termId condition might be causing issues if the termId doesn't match
        // Let's make it optional for debugging
        // termId: classDetails.termId,
      },
      include: {
        studentGrades: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    console.log('Gradebook found:', gradebook ? 'Yes' : 'No');
    if (gradebook) {
      console.log('Gradebook ID:', gradebook.id);
      console.log('Gradebook termId:', gradebook.termId);
      console.log('Class termId:', classDetails.termId);
    } else {
      // Let's check if there's any gradebook for this class regardless of term
      const anyGradebook = await prisma.gradeBook.findFirst({
        where: {
          classId: classId,
        },
        include: {
          studentGrades: {
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });
      console.log('Any gradebook found for this class:', anyGradebook ? 'Yes' : 'No');
      if (anyGradebook) {
        console.log('Any gradebook termId:', anyGradebook.termId);
        // Use this gradebook instead
        gradebook = anyGradebook;
      }
    }

    // Get activities for this class with detailed grade information
    const activities = await prisma.activity.findMany({
      where: {
        classId: classId,
        isGradable: true,
      },
      include: {
        subject: true,
        topic: true,
        activityGrades: {
          include: {
            student: {
              include: {
                user: true
              }
            },
            // Learning time is now stored directly in ActivityGrade model
            // No need to include learningTimeRecords as a relation
          }
        },
        _count: {
          select: {
            activityGrades: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process activities to include analytics
    const activitiesWithAnalytics = activities.map(activity => {
      // Ensure activityGrades is defined
      const grades = activity._count?.activityGrades ? activity.activityGrades : [];

      // Calculate analytics
      const totalSubmissions = grades.length;
      const gradedSubmissions = grades.filter(grade =>
        grade.status === 'GRADED'
      ).length;
      const averageScore = grades.length > 0
        ? grades.reduce((sum, grade) => sum + (grade.score || 0), 0) / totalSubmissions
        : 0;

      // Calculate total learning time
      const totalLearningTime = grades.reduce(
        (sum, grade) => {
          // Check if time is stored in content
          if (grade.content && typeof grade.content === 'object' && 'timeSpent' in grade.content) {
            return sum + (grade.content as any).timeSpent;
          }
          return sum;
        },
        0
      );

      // Calculate average attempts
      const totalAttempts = grades.reduce(
        (sum, grade) => {
          if (grade.content && typeof grade.content === 'object' && 'attempts' in grade.content) {
            return sum + (grade.content as any).attempts;
          }
          return sum;
        },
        0
      );
      const averageAttempts = totalSubmissions > 0 ? totalAttempts / totalSubmissions : 0;

      return {
        ...activity,
        analytics: {
          totalSubmissions,
          gradedSubmissions,
          averageScore,
          totalLearningTime,
          averageAttempts
        }
      };
    });

    // Get assessments for this class with detailed submission information
    const assessments = await prisma.assessment.findMany({
      where: {
        classId: classId,
      },
      include: {
        subject: true,
        submissions: {
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process assessments to include analytics
    const assessmentsWithAnalytics = assessments.map(assessment => {
      // Calculate analytics
      const totalSubmissions = assessment.submissions?.length || 0;
      const gradedSubmissions = assessment.submissions?.filter(submission =>
        submission.status === 'GRADED'
      ).length || 0;
      const averageScore = totalSubmissions > 0
        ? assessment.submissions?.reduce((sum, submission) => sum + (submission.score || 0), 0) / totalSubmissions
        : 0;

      return {
        ...assessment,
        analytics: {
          totalSubmissions,
          gradedSubmissions,
          averageScore
        }
      };
    });

    // Format student data
    const students = classDetails.students.map((enrollment) => ({
      id: enrollment.studentId,
      name: enrollment.student.user.name || "",
      email: enrollment.student.user.email || "",
      enrollmentId: enrollment.id,
    }));

    return (
      <div>
        <PageHeader
          title="Class Grades"
          description={`Manage grades for ${classDetails.name}`}
        />

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Grades
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Import Grades
          </Button>
          {/* Gradebook creation is handled by administrators */}
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gradebook Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Students</p>
                        <p className="font-medium">{students.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Gradable Activities</p>
                        <p className="font-medium">{activities.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Assessments</p>
                        <p className="font-medium">{assessments.length}</p>
                      </div>
                    </div>

                    {gradebook && gradebook.termId !== classDetails.termId && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-700">
                          <strong>Note:</strong> This gradebook was created for a different term.
                          Some data may not be relevant to the current term.
                        </p>
                      </div>
                    )}

                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-2">Grade Distribution</h3>
                      <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                        {/* Placeholder for grade distribution visualization */}
                        <div className="flex h-full">
                          <div className="bg-green-500 h-full" style={{ width: "35%" }}></div>
                          <div className="bg-blue-500 h-full" style={{ width: "25%" }}></div>
                          <div className="bg-yellow-500 h-full" style={{ width: "20%" }}></div>
                          <div className="bg-orange-500 h-full" style={{ width: "15%" }}></div>
                          <div className="bg-red-500 h-full" style={{ width: "5%" }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>A</span>
                        <span>B</span>
                        <span>C</span>
                        <span>D</span>
                        <span>F</span>
                      </div>
                    </div>

                    {!gradebook && activities.length === 0 && assessments.length === 0 ? (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">
                          <strong>Getting Started:</strong> Create gradable activities or assessments to start tracking student grades.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-6">
                        <Link
                          href={`/teacher/classes/${classId}/grades/edit`}
                          className="text-primary hover:underline"
                          prefetch={false}
                        >
                          Edit Grading Settings
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activities">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gradable Activities</CardTitle>
                <Button size="sm" asChild>
                  <Link href={`/teacher/classes/${classId}/activities/create`}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Activity
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No gradable activities found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Title</th>
                          <th className="text-left py-3 px-4 font-medium">Subject</th>
                          <th className="text-left py-3 px-4 font-medium">Type</th>
                          <th className="text-left py-3 px-4 font-medium">Max Score</th>
                          <th className="text-left py-3 px-4 font-medium">Avg Score</th>
                          <th className="text-left py-3 px-4 font-medium">Graded</th>
                          <th className="text-left py-3 px-4 font-medium">Avg Attempts</th>
                          <th className="text-left py-3 px-4 font-medium">Learning Time</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activitiesWithAnalytics.map((activity) => (
                          <tr key={activity.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <Link
                                href={`/teacher/classes/${classId}/activities/${activity.id}`}
                                className="text-primary hover:underline font-medium"
                                prefetch={false}
                              >
                                {activity.title}
                              </Link>
                            </td>
                            <td className="py-3 px-4">{activity.subject ? activity.subject.name : "-"}</td>
                            <td className="py-3 px-4">{activity.purpose}</td>
                            <td className="py-3 px-4">{activity.maxScore || "-"}</td>
                            <td className="py-3 px-4">
                              {activity.analytics.averageScore > 0
                                ? activity.analytics.averageScore.toFixed(1)
                                : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {activity.analytics.gradedSubmissions}/{students.length}
                            </td>
                            <td className="py-3 px-4">
                              {activity.analytics.averageAttempts > 0
                                ? activity.analytics.averageAttempts.toFixed(1)
                                : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {activity.analytics.totalLearningTime > 0
                                ? (activity.analytics.totalLearningTime > 60
                                  ? `${Math.floor(activity.analytics.totalLearningTime / 60)}h ${activity.analytics.totalLearningTime % 60}m`
                                  : `${activity.analytics.totalLearningTime}m`)
                                : "-"}
                            </td>
                            <td className="py-3 px-4">
                              <Link
                                href={`/teacher/classes/${classId}/activities/${activity.id}/grade`}
                                className="text-primary hover:underline"
                                prefetch={false}
                              >
                                Grade
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Assessments</CardTitle>
                <Button size="sm" asChild>
                  <Link href={`/teacher/classes/${classId}/assessments/create`}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Assessment
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No assessments found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Title</th>
                          <th className="text-left py-3 px-4 font-medium">Subject</th>
                          <th className="text-left py-3 px-4 font-medium">Max Score</th>
                          <th className="text-left py-3 px-4 font-medium">Avg Score</th>
                          <th className="text-left py-3 px-4 font-medium">Graded</th>
                          <th className="text-left py-3 px-4 font-medium">Submissions</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessmentsWithAnalytics.map((assessment) => (
                          <tr key={assessment.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <Link
                                href={`/teacher/classes/${classId}/assessments/${assessment.id}`}
                                className="text-primary hover:underline font-medium"
                                prefetch={false}
                              >
                                {assessment.title}
                              </Link>
                            </td>
                            <td className="py-3 px-4">{assessment.subject?.name || "-"}</td>
                            <td className="py-3 px-4">{assessment.maxScore || "-"}</td>
                            <td className="py-3 px-4">
                              {assessment.analytics.averageScore > 0
                                ? assessment.analytics.averageScore.toFixed(1)
                                : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {assessment.analytics.gradedSubmissions}/{students.length}
                            </td>
                            <td className="py-3 px-4">
                              {assessment.analytics.totalSubmissions}/{students.length}
                            </td>
                            <td className="py-3 px-4">
                              <Link
                                href={`/teacher/classes/${classId}/assessments/${assessment.id}/grade`}
                                className="text-primary hover:underline"
                                prefetch={false}
                              >
                                Grade
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Grades</CardTitle>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No students enrolled in this class.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Student</th>
                          <th className="text-left py-3 px-4 font-medium">Activities Completed</th>
                          <th className="text-left py-3 px-4 font-medium">Assessments Completed</th>
                          <th className="text-left py-3 px-4 font-medium">Current Grade</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => {
                          const studentGrade = gradebook?.studentGrades.find(
                            (grade) => grade.studentId === student.id
                          );

                          return (
                            <tr key={student.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </td>
                              <td className="py-3 px-4">
                                {/* Count completed activities for this student */}
                                {activities.filter(activity =>
                                  activity.activityGrades &&
                                  Array.isArray(activity.activityGrades) &&
                                  activity.activityGrades.some(grade =>
                                    grade.studentId === student.id &&
                                    (grade.status === 'GRADED' || grade.status === 'COMPLETED')
                                  )
                                ).length}/{activities.length}
                              </td>
                              <td className="py-3 px-4">
                                {/* Count completed assessments for this student */}
                                {assessments.filter(assessment =>
                                  assessment.submissions?.some(submission =>
                                    submission.studentId === student.id &&
                                    submission.status === 'GRADED'
                                  )
                                ).length || 0}/{assessments.length}
                              </td>
                              <td className="py-3 px-4">
                                {studentGrade ? (
                                  <div>
                                    <span className="font-medium">{studentGrade.finalGrade || "-"}</span>
                                    {studentGrade.letterGrade && (
                                      <span className="ml-2 text-sm">({studentGrade.letterGrade})</span>
                                    )}
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <Link
                                  href={`/teacher/classes/${classId}/students/${student.id}/grades`}
                                  className="text-primary hover:underline"
                                  prefetch={false}
                                >
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    logger.error("Error in ClassGradesPage", { error });
    return redirect("/error");
  }
}
