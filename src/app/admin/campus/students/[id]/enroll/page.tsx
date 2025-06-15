import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EnrollmentForm } from "./enrollment-form";

export default async function EnrollStudentPage(props: { params: { id: string } | Promise<{ id: string }> }) {
  // Await params to ensure it's properly resolved
  const resolvedParams = await props.params;
  const studentId: string = resolvedParams.id;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      userType: true,
      primaryCampusId: true,
    },
  });

  if (!user || user.userType !== 'CAMPUS_ADMIN' || !user.primaryCampusId) {
    redirect("/login");
  }

  // Get student details
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      profileData: true,
      studentProfile: true,
    },
  });

  if (!student) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campus/students">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Student Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>The requested student profile could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student.studentProfile) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campus/students">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Student Profile Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>This user does not have a student profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get active classes for this campus
  const classes = await prisma.class.findMany({
    where: {
      campusId: user.primaryCampusId,
      status: 'ACTIVE',
    },
    include: {
      courseCampus: {
        include: {
          course: {
            select: {
              name: true,
            }
          }
        }
      },
      term: {
        select: {
          name: true,
        }
      }
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Get existing enrollments to avoid duplicates
  // Using Prisma instead of raw SQL query
  const existingEnrollments = await prisma.studentEnrollment.findMany({
    where: {
      studentId: student.studentProfile.id,
      class: {
        campusId: user.primaryCampusId
      }
    },
    select: {
      id: true,
      classId: true
    }
  });

  const existingClassIds = existingEnrollments.map(e => e.classId);

  // Filter out classes the student is already enrolled in
  const availableClasses = classes.filter(c => !existingClassIds.includes(c.id));

  const studentName = student.name || `Student #${student.id}`;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/campus/students/${studentId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Enroll Student</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enroll {studentName}</CardTitle>
          <CardDescription>Select a class to enroll this student</CardDescription>
        </CardHeader>
        <CardContent>
          <EnrollmentForm
            studentId={student.studentProfile.id}
            studentName={studentName}
            classes={availableClasses}
            adminId={user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}