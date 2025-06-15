import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { UserType, SystemStatus } from "@prisma/client";
import { logger } from '@/server/api/utils/logger';
import { PageLayout } from "@/components/layout/page-layout";
import { StudentProfileView } from "@/components/coordinator";

interface PageProps {
  params: { id: string };
}

export default async function CoordinatorStudentProfilePage({ params }: PageProps) {
  // Await params to ensure it's fully resolved
  const { id } = params;

  try {
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

    logger.debug("Coordinator Student Profile Page - User found:", { userId: user?.id, userType: user?.userType });

    if (!user || user.userType !== UserType.CAMPUS_COORDINATOR) {
      redirect("/login");
    }

    // Get coordinator profile
    const coordinatorProfile = await prisma.coordinatorProfile.findUnique({
      where: { userId: user.id }
    });

    if (!coordinatorProfile) {
      redirect("/login");
    }

    // Get managed programs
    const managedPrograms = coordinatorProfile.managedPrograms as any[];

    if (managedPrograms.length === 0) {
      return (
        <PageLayout
          title="Student Profile"
          description="View student details"
        >
          <div className="container mx-auto py-6">
            <p className="text-muted-foreground mb-6">You don't have any programs assigned to you yet.</p>
          </div>
        </PageLayout>
      );
    }

    // Get student profile
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            dateOfBirth: true,
            status: true,
          }
        },
        enrollments: {
          where: {
            status: SystemStatus.ACTIVE,
          },
          include: {
            class: {
              include: {
                courseCampus: {
                  include: {
                    course: {
                      include: {
                        program: true
                      }
                    },
                    campus: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        grades: {
          take: 5,
          orderBy: {
            updatedAt: 'desc'
          }
        },
        feedback: {
          include: {
            feedbackBase: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            },
            responses: {
              include: {
                responder: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          },
          orderBy: {
            feedbackBase: {
              createdAt: 'desc'
            }
          }
        },
        attendance: {
          take: 30,
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!student) {
      logger.warn("Student not found", { studentId: id });
      return notFound();
    }

    // Check if student is in coordinator's managed programs
    const programIds = [...new Set(managedPrograms.map(p => p.programId))];
    const campusIds = [...new Set(managedPrograms.map(p => p.campusId))];

    // Check if any of the student's enrollments are in the coordinator's managed programs
    const hasAccess = student.enrollments.some(enrollment => {
      const programId = enrollment.class?.courseCampus?.course?.program?.id;
      const campusId = enrollment.class?.courseCampus?.campusId;
      return programIds.includes(programId) && campusIds.includes(campusId);
    });

    if (!hasAccess) {
      logger.warn("Coordinator does not have access to this student", {
        coordinatorId: user.id,
        studentId: id,
        programIds,
        campusIds
      });
      return notFound();
    }

    // Get leaderboard data (mock for now)
    const leaderboardData = {
      position: Math.floor(Math.random() * 50) + 1,
      change: Math.floor(Math.random() * 10) - 5,
      classRank: Math.floor(Math.random() * 30) + 1,
      programRank: Math.floor(Math.random() * 100) + 1,
      history: [
        { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), position: Math.floor(Math.random() * 50) + 1 },
        { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), position: Math.floor(Math.random() * 50) + 1 },
        { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), position: Math.floor(Math.random() * 50) + 1 },
        { date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), position: Math.floor(Math.random() * 50) + 1 },
        { date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), position: Math.floor(Math.random() * 50) + 1 },
      ]
    };

    // Get performance data
    const performanceData = {
      academic: student.academicScore || Math.floor(Math.random() * 30) + 70,
      attendance: student.attendanceRate || Math.floor(Math.random() * 20) + 80,
      participation: student.participationRate || Math.floor(Math.random() * 30) + 70,
      improvement: Math.floor(Math.random() * 20) - 5,
      strengths: ['Mathematics', 'Critical Thinking', 'Problem Solving'],
      weaknesses: ['Writing', 'Public Speaking'],
      recentGrades: student.grades.map(grade => ({
        id: grade.id,
        subject: 'Subject',
        score: grade.finalGrade || 0,
        letterGrade: grade.letterGrade || 'N/A',
        date: grade.updatedAt
      }))
    };

    return (
      <PageLayout
        title="Student Profile"
        description={`View profile for ${student.user.name || 'Student'}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/coordinator" },
          { label: "Students", href: "/admin/coordinator/students" },
          { label: student.user.name || 'Student', href: `/admin/coordinator/students/${id}` },
        ]}
      >
        <StudentProfileView
          student={student}
          leaderboard={leaderboardData}
          performance={performanceData}
        />
      </PageLayout>
    );
  } catch (error) {
    logger.error("Error in CoordinatorStudentProfilePage:", { error, studentId: id });
    return redirect("/error");
  }
}
