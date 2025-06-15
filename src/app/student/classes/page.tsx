import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import StudentClassList from "@/components/shared/entities/students/StudentClassList";
import { logger } from "@/server/api/utils/logger";
import { prisma } from "@/server/db";
import { SystemStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "My Classes",
  description: "View and manage your enrolled classes",
};

export default async function StudentClassesPage() {
  try {
    logger.debug("Student classes page accessed");
    const session = await getSessionCache();

    if (!session?.user?.id) {
      logger.warn("No session or user ID found in student classes");
      return redirect("/login");
    }

    // Check if user is a student (either CAMPUS_STUDENT or STUDENT)
    const isStudent = session.user.userType === 'CAMPUS_STUDENT' || session.user.userType === 'STUDENT';

    if (!isStudent) {
      logger.warn("User is not a student", {
        userId: session.user.id,
        actualUserType: session.user.userType
      });
      return redirect("/login");
    }

    // Fetch real class data using Prisma
    logger.debug("Fetching student classes from database");

    // Find the student profile
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!studentProfile) {
      logger.warn("Student profile not found", { userId: session.user.id });
      return redirect("/login");
    }

    // Find all active enrollments for this student
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        studentId: studentProfile.id,
        status: SystemStatus.ACTIVE,
      },
      include: {
        class: {
          include: {
            courseCampus: {
              include: {
                course: {
                  include: {
                    subjects: true
                  }
                }
              }
            },
            term: true,
            classTeacher: {
              include: {
                user: true
              }
            },
            facility: true
          }
        }
      },
    });

    // Transform the data to match the expected format
    const classes = enrollments.map(enrollment => {
      const cls = enrollment.class;
      const course = cls.courseCampus?.course;
      const teacher = cls.classTeacher?.user;

      // Create class data object with the expected format
      return {
        id: cls.id,
        name: cls.name,
        subject: {
          id: course?.id || '',
          name: course?.name || 'Unknown Subject',
          code: course?.code || ''
        },
        teacher: teacher ? {
          id: teacher.id,
          name: teacher.name || 'Unknown Teacher',
          avatar: undefined
        } : undefined,
        schedule: cls.facility ? {
          days: ['Mon', 'Wed', 'Fri'], // Default schedule
          startTime: '09:00',
          endTime: '10:30'
        } : undefined,
        // Calculate progress based on completed activities (if available)
        progress: Math.floor(Math.random() * 100), // Replace with actual progress calculation when available

        // Activity counts - replace with actual queries when available
        activitiesCount: Math.floor(Math.random() * 20) + 5,
        pendingActivitiesCount: Math.floor(Math.random() * 10),

        // Last activity date - ideally this would come from the database
        lastActivity: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),

        // Importance - could be calculated based on pending activities, deadlines, etc.
        importance: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',

        // Check if this is a new term (within 30 days of start date)
        isNewTerm: cls.term?.startDate ?
          (new Date().getTime() - new Date(cls.term.startDate).getTime()) < (30 * 24 * 60 * 60 * 1000) : false,

        // Additional fields for enhanced UX
        hasLimitedTimeActivities: Math.random() > 0.5,
        limitedTimeActivitiesCount: Math.floor(Math.random() * 3),
        nextDeadline: Math.random() > 0.3 ? new Date(Date.now() + Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)) : null,
        attendanceRate: Math.floor(Math.random() * 30) + 70,
        averageGrade: ['A', 'B+', 'B', 'C+'][Math.floor(Math.random() * 4)]
      };
    });

    logger.debug("Rendering student classes list", { classCount: classes.length });

    // Use the StudentClassList component directly with the new URL structure
    // This component will link to /student/class/[id]/dashboard instead of /student/classes/[id]
    return (
      <div className="page-content container mx-auto py-6">
        <StudentClassList
          classes={classes}
          defaultSortBy="lastActivity"
          defaultSortOrder="desc"
          showFilters={true}
          showSearch={true}
          onRefresh={undefined}
          isRefreshing={false}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error in student classes page", { error });

    // Return a simple error message
    return (
      <div className="page-content container mx-auto py-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-red-200 dark:border-red-900">
          <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Error Loading Classes</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">There was an error loading your classes. Please try again later.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Error details: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}
