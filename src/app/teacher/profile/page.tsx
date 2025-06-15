import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { ProfileDetails } from "@/components/teacher/profile/ProfileDetails";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Edit, BookOpen, Users, School } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and manage your profile information",
};

export default async function TeacherProfilePage() {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      return redirect("/login");
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: true
      }
    }) as any;

    if (!user) {
      logger.error("User not found", { userId: session.user.id });
      return redirect("/login");
    }

    if (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== 'TEACHER') {
      logger.error("Unauthorized user type", { userType: user.userType });
      return redirect("/unauthorized");
    }

    if (!user.teacherProfile) {
      logger.error("Teacher profile not found", { userId: user.id });
      return redirect("/unauthorized");
    }

    // Extract profile data from user.profileData
    const profileData = user.profileData as Record<string, any> || {};

    // Get teacher's campus
    const campus = user.primaryCampusId ? await prisma.campus.findUnique({
      where: { id: user.primaryCampusId },
      select: {
        id: true,
        name: true,
        code: true,
      },
    }) : undefined;

    // Get teacher's classes
    const teacherClasses = await prisma.class.findMany({
      where: {
        teachers: {
          some: {
            teacherId: user.teacherProfile.id,
          },
        },
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
        students: true,
      },
      take: 5,
    });

    // Get subjects taught - using a simpler approach
    // Extract subjects from the classes the teacher is assigned to
    const subjectsMap = new Map<string, { id: string; name: string }>();

    // Loop through teacher classes and extract unique subjects
    teacherClasses.forEach(classItem => {
      classItem.courseCampus.course.subjects.forEach(subject => {
        if (!subjectsMap.has(subject.id)) {
          subjectsMap.set(subject.id, { id: subject.id, name: subject.name });
        }
      });
    });

    // Convert map to array
    const subjects = Array.from(subjectsMap.values());

    // Get student count
    const studentCount = await prisma.studentEnrollment.count({
      where: {
        class: {
          teachers: {
            some: {
              teacherId: user.teacherProfile.id
            }
          }
        }
      }
    });

    // Prepare teacher data
    const teacherData = {
      id: user.teacherProfile.id,
      name: user.name || 'Teacher',
      email: user.email,
      image: user.image,
      bio: profileData.bio || user.teacherProfile.specialization || '',
      location: profileData.location || (campus ? campus.name : undefined),
      joinedDate: user.createdAt.toISOString(),
      subjects: subjects,
      classCount: teacherClasses.length,
      studentCount,
      language: profileData.language || 'English',
      timezone: profileData.timezone || 'UTC',
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              View and manage your profile information
            </p>
          </div>

          <Button asChild>
            <Link href="/teacher/settings">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <ProfileDetails
              teacher={teacherData}
              isEditable={true}
              onEdit={() => redirect("/teacher/settings")}
            />
          </div>

          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <School className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Classes</p>
                      <p className="text-xl font-bold">{teacherClasses.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Subjects</p>
                      <p className="text-xl font-bold">{subjects.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Students</p>
                      <p className="text-xl font-bold">{studentCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Classes */}
            <Card>
              <CardHeader>
                <CardTitle>Current Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teacherClasses.length === 0 ? (
                  <p className="text-muted-foreground">No classes assigned.</p>
                ) : (
                  teacherClasses.map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <div className="font-medium">{classItem.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {classItem.courseCampus.course.subjects[0]?.name || "No subject"} • {classItem.term.name}
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {classItem.students.length} students
                      </div>
                    </div>
                  ))
                )}

                {teacherClasses.length > 0 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/teacher/classes">
                      View All Classes
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account Type</span>
                    <span className="text-sm font-medium">Teacher</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="text-sm font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error("Error in TeacherProfilePage", { error });
    return redirect("/error");
  }
}