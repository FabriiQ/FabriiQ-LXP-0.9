import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { ArrowLeftIcon, PlusIcon, UserIcon, BookOpenIcon, GraduationCapIcon, CalendarIcon } from "lucide-react";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { formatDate } from "@/utils/format";

interface StudentManagePageProps {
  params: {
    id: string;
    accessId: string;
  };
}

export default async function StudentManagePage({ params }: StudentManagePageProps) {
  const session = await getSessionCache();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      userType: true,
    },
  });

  if (!user || user.userType !== 'SYSTEM_ADMIN') {
    redirect("/login");
  }

  // Get campus details
  const campus = await prisma.campus.findUnique({
    where: { id: params.id },
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  if (!campus) {
    notFound();
  }

  // Get student access details
  const studentAccess = await prisma.userCampusAccess.findUnique({
    where: { id: params.accessId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          studentProfile: {
            include: {
              _count: {
                select: {
                  enrollments: true,
                  grades: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!studentAccess || studentAccess.campusId !== params.id) {
    notFound();
  }

  // Get student enrollments
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      studentId: studentAccess.user.studentProfile?.id,
      class: {
        courseCampus: {
          campusId: params.id,
        },
      },
    },
    include: {
      class: {
        include: {
          courseCampus: {
            include: {
              course: true,
            },
          },
          term: true,
          programCampus: {
            include: {
              program: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        class: {
          term: {
            startDate: 'desc',
          },
        },
      },
      {
        createdAt: 'desc',
      },
    ],
  });

  // Get available programs for this campus
  const programCampuses = await prisma.programCampus.findMany({
    where: {
      campusId: params.id,
      status: 'ACTIVE',
    },
    include: {
      program: true,
      _count: {
        select: {
          classes: true,
        },
      },
    },
    orderBy: {
      program: {
        name: 'asc',
      },
    },
  });

  // Group enrollments by term
  const enrollmentsByTerm: Record<string, typeof enrollments> = {};
  
  enrollments.forEach(enrollment => {
    if (!enrollmentsByTerm[enrollment.class.termId]) {
      enrollmentsByTerm[enrollment.class.termId] = [];
    }
    enrollmentsByTerm[enrollment.class.termId].push(enrollment);
  });

  // Get user campus access details
  const userAccess = await prisma.userCampusAccess.findUnique({
    where: {
      id: params.accessId,
    },
    include: {
      user: true,
    },
  });

  if (!userAccess) {
    notFound();
  }

  // Create a combined object with user data
  const access = {
    ...userAccess,
    user: userAccess.user,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${params.id}/students`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Manage Student - ${studentAccess.user.name}`}
          description={`Manage enrollments for ${studentAccess.user.email} at ${campus.name} campus`}
        />
      </div>
      
      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{studentAccess.user.name}</CardTitle>
              <CardDescription>{studentAccess.user.email}</CardDescription>
            </div>
            <Badge variant="secondary">Student</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <BookOpenIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Enrollments</div>
                <div className="text-2xl font-bold">{studentAccess.user.studentProfile?._count.enrollments || 0}</div>
              </div>
            </div>
            <div className="flex items-center">
              <GraduationCapIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Grades</div>
                <div className="text-2xl font-bold">{studentAccess.user.studentProfile?._count.grades || 0}</div>
              </div>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Enrolled Since</div>
                <div className="text-lg font-medium">{formatDate(studentAccess.startDate)}</div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={`/admin/system/users/${studentAccess.user.id}`}>
            <Button variant="outline">View Full Profile</Button>
          </Link>
          <Link href={`/admin/system/campuses/${params.id}/students/${params.accessId}/remove`}>
            <Button variant="destructive">Remove from Campus</Button>
          </Link>
        </CardFooter>
      </Card>
      
      {/* Enrollments Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Enrollments</h2>
        <Link href={`/admin/system/campuses/${params.id}/students/${params.accessId}/enroll-class`}>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Enrollment
          </Button>
        </Link>
      </div>
      
      {enrollments.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(enrollmentsByTerm).map(([termId, termEnrollments]) => {
            const term = termEnrollments[0]?.class.term;
            return (
              <div key={termId} className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  {term?.name} ({formatDate(term?.startDate)} - {formatDate(term?.endDate)})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {termEnrollments.map((enrollment) => (
                    <Card key={enrollment.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{enrollment.class.name}</CardTitle>
                          <Badge variant="outline">{enrollment.class.code}</Badge>
                        </div>
                        <CardDescription>
                          {enrollment.class.courseCampus.course.name} ({enrollment.class.courseCampus.course.code})
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          {enrollment.class.programCampus && (
                            <div className="flex items-center text-sm">
                              <BookOpenIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Program: {enrollment.class.programCampus.program.name}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm">
                            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Enrolled: {formatDate(enrollment.createdAt)}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Badge variant={enrollment.status === 'ACTIVE' ? 'success' : 'secondary'}>
                              {enrollment.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 flex justify-between">
                        <Link href={`/admin/system/classes/${enrollment.class.id}`}>
                          <Button variant="outline" size="sm">View Class</Button>
                        </Link>
                        <Link href={`/admin/system/enrollments/${enrollment.id}/edit`}>
                          <Button variant="secondary" size="sm">Manage</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No enrollments found</h3>
          <p className="text-sm text-gray-500 mt-1">
            This student is not enrolled in any classes at this campus.
          </p>
          <Link href={`/admin/system/campuses/${params.id}/students/${params.accessId}/enroll-class`} className="mt-4">
            <Button>Add Enrollment</Button>
          </Link>
        </div>
      )}
      
      {/* Available Programs Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Available Programs</h2>
        {programCampuses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programCampuses.map((pc) => (
              <Card key={pc.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{pc.program.name}</CardTitle>
                  <CardDescription>{pc.program.code}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <BookOpenIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Classes: {pc._count.classes}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Start: {formatDate(pc.startDate)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Link 
                    href={`/admin/system/campuses/${params.id}/students/${params.accessId}/enroll-program?programId=${pc.id}`}
                    className="w-full"
                  >
                    <Button className="w-full">Enroll in Program</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <BookOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No programs available</h3>
            <p className="text-sm text-gray-500 mt-1">
              There are no active programs at this campus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 