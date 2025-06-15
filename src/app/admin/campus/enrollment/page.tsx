import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { EnrollmentClient } from "./client";

export const metadata: Metadata = {
  title: "Enrollment Management | Campus Admin",
  description: "Manage student enrollments for your campus",
};

export type Enrollment = {
  id: string;
  studentName: string;
  studentEmail: string;
  className: string;
  programName: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  paymentStatus: string;
};

export default async function EnrollmentPage() {
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

  // Get enrollments for this campus
  const enrollmentsData = await prisma.studentEnrollment.findMany({
    where: {
      class: {
        programCampus: {
          campusId: user.primaryCampusId,
        }
      }
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      },
      class: {
        include: {
          programCampus: {
            include: {
              program: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      startDate: 'desc',
    },
    take: 100,
  });

  // Transform the data to match the expected Enrollment interface
  const enrollments: Enrollment[] = enrollmentsData.map(enrollment => ({
    id: enrollment.id,
    studentName: enrollment.student.user.name || '',
    studentEmail: enrollment.student.user.email || '',
    className: enrollment.class.name,
    programName: enrollment.class.programCampus?.program.name || '',
    startDate: enrollment.startDate,
    endDate: enrollment.endDate,
    status: enrollment.status,
    paymentStatus: 'PENDING', // Default payment status
  }));

  // Get active classes for this campus
  const classesData = await prisma.class.findMany({
    where: {
      status: 'ACTIVE',
      programCampus: {
        campusId: user.primaryCampusId,
      }
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const classes = classesData.map(c => ({
    id: c.id,
    name: c.name,
  }));

  // Get programs for this campus
  const programsData = await prisma.program.findMany({
    where: {
      campusOfferings: {
        some: {
          campusId: user.primaryCampusId,
        }
      }
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const programs = programsData.map(p => ({
    id: p.id,
    name: p.name,
  }));

  // Calculate enrollment statistics
  const activeEnrollments = enrollments.filter(e => e.status === "ACTIVE").length;
  const pendingEnrollments = enrollments.filter(e => e.status === "PENDING").length;
  const completedEnrollments = enrollments.filter(e => e.status === "COMPLETED").length;
  const withdrawnEnrollments = enrollments.filter(e => e.status === "WITHDRAWN").length;

  return (
    <EnrollmentClient
      enrollments={enrollments}
      activeEnrollments={activeEnrollments}
      pendingEnrollments={pendingEnrollments}
      completedEnrollments={completedEnrollments}
      withdrawnEnrollments={withdrawnEnrollments}
    />
  );
}