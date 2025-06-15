import React from "react";
import { getSessionCache } from "@/utils/session-cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from "@/server/api/utils/logger";
import { UserType } from "@prisma/client";
import { SubjectTopicTreeReadonly } from "@/components/subjects/subject-topic-tree-readonly";

export default async function ClassSubjectsPage({
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

    // Get class details with subjects
    const classDetails = await prisma.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        courseCampus: {
          include: {
            course: {
              include: {
                subjects: {
                  include: {
                    topics: {
                      where: {
                        parentTopicId: null, // Get only root topics
                      },
                      include: {
                        childTopics: {
                          include: {
                            childTopics: true, // Get up to 3 levels deep
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        teachers: {
          include: {
            teacher: true,
          },
        },
      },
    });

    if (!classDetails) {
      return redirect("/teacher/classes");
    }

    // Check if the teacher is assigned to this class
    const isTeacherAssigned = classDetails.teachers.some(
      (assignment) => assignment.teacherId === user.teacherProfile.id
    );

    if (!isTeacherAssigned) {
      return redirect("/teacher/classes");
    }

    const subjects = classDetails.courseCampus.course.subjects;

    return (
      <div>
        <PageHeader
          title="Class Subjects"
          description={`View subjects and topics for ${classDetails.name}`}
        />

        {subjects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p>No subjects found for this class.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={subjects[0].id} className="mt-6">
            <TabsList className="mb-4">
              {subjects.map((subject) => (
                <TabsTrigger key={subject.id} value={subject.id}>
                  {subject.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {subjects.map((subject) => (
              <TabsContent key={subject.id} value={subject.id}>
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Subject Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Subject Code</p>
                          <p className="font-medium">{subject.code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Credits</p>
                          <p className="font-medium">{subject.credits}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Topic Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {subject.topics && subject.topics.length > 0 ? (
                        <SubjectTopicTreeReadonly
                          topics={subject.topics}
                          subjectId={subject.id}
                          classId={classId}
                        />
                      ) : (
                        <p className="text-gray-500">No topics defined for this subject yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    );
  } catch (error) {
    logger.error("Error in ClassSubjectsPage", { error });
    return redirect("/error");
  }
}
