import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EnrollmentForm } from "./enrollment-form";

export const metadata: Metadata = {
  title: "New Enrollment | Campus Admin",
  description: "Create a new student enrollment",
};

export default async function CreateEnrollmentPage() {
  const session = await getSessionCache();

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

  // Get campus details
  const campus = await prisma.campus.findUnique({
    where: { id: user.primaryCampusId },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
    },
  });

  if (!campus) {
    redirect("/login");
  }

  // Get active students for this campus
  const students = await prisma.studentProfile.findMany({
    where: {
      user: {
        userType: 'CAMPUS_STUDENT',
        status: 'ACTIVE',
        OR: [
          {
            activeCampuses: {
              some: {
                campusId: user.primaryCampusId,
                status: 'ACTIVE',
              }
            }
          },
          {
            primaryCampusId: user.primaryCampusId
          }
        ]
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    },
    orderBy: {
      user: {
        name: 'asc',
      }
    },
  });

  // Get active classes for this campus
  const classes = await prisma.class.findMany({
    where: {
      courseCampus: {
        campusId: user.primaryCampusId
      },
      status: 'ACTIVE'
    },
    include: {
      courseCampus: {
        include: {
          course: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Map classes to the expected format
  const formattedClasses = classes.map(cls => ({
    id: cls.id,
    name: cls.name,
    programName: cls.courseCampus.course.name
  }));

  // Map students to the expected format
  const formattedStudents = students.map(student => ({
    id: student.id, // Use student profile ID for enrollment
    name: student.user.name || 'Unknown',
    email: student.user.email || ''
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campus/enrollment">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">New Enrollment</h1>
        </div>
      </div>

      <EnrollmentForm
        campusId={user.primaryCampusId}
        campusName={campus.name}
        students={formattedStudents}
        classes={formattedClasses}
        userId={session.user.id}
      />
    </div>
  );
}