import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import StudentGradesListClient from "@/components/shared/entities/students/StudentGradesListClient";
import { logger } from "@/server/api/utils/logger";
import { SystemStatus, SubmissionStatus } from "@prisma/client";
import { unstable_cache } from 'next/cache';

export const metadata: Metadata = {
  title: "Grades",
  description: "View and track your academic performance",
};

// Cache durations in seconds
const CACHE_TTL = {
  USER: 24 * 60 * 60, // 24 hours
  STUDENT_PROFILE: 24 * 60 * 60, // 24 hours
  GRADES: 24 * 60 * 60, // 24 hours
};

// Cached function to get user data
const getCachedUser = unstable_cache(
  async (userId: string) => {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          userType: true,
          primaryCampusId: true,
        },
      });
    } catch (error) {
      logger.error(`User cache error: ${error instanceof Error ? error.message : 'Unknown error'}`, { error, userId });
      throw error;
    }
  },
  ['user-data'],
  { revalidate: CACHE_TTL.USER, tags: ['user'] }
);

// Cached function to get student profile
const getCachedStudentProfile = unstable_cache(
  async (userId: string) => {
    try {
      return await prisma.studentProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          enrollmentNumber: true,
          enrollments: {
            where: { status: SystemStatus.ACTIVE },
            select: {
              id: true,
              classId: true,
              class: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Student profile cache error: ${error instanceof Error ? error.message : 'Unknown error'}`, { error, userId });
      throw error;
    }
  },
  ['student-profile'],
  { revalidate: CACHE_TTL.STUDENT_PROFILE, tags: ['student'] }
);

// Cached function to get student grades
const getCachedStudentGrades = unstable_cache(
  async (userId: string) => {
    try {
    // First get the student profile to get the student ID
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!studentProfile) {
      return [];
    }

    // Get activity grades
    const activityGrades = await prisma.activityGrade.findMany({
      where: {
        studentId: studentProfile.id,
        status: SubmissionStatus.GRADED,
        score: { not: null },
      },
      include: {
        activity: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        gradedAt: 'desc',
      },
    });

    // Get student grades from grade book
    const studentGrades = await prisma.studentGrade.findMany({
      where: {
        studentId: studentProfile.id,
        status: SystemStatus.ACTIVE,
      },
      include: {
        gradeBook: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Map activity grades to the expected format
    const mappedActivityGrades = activityGrades.map((grade) => {
      // Convert numeric score to letter grade
      let letterGrade = "N/A";
      if (grade.score !== null) {
        const score = grade.score;
        const maxScore = grade.activity.maxScore || 100;
        const percentage = (score / maxScore) * 100;

        if (percentage >= 90) letterGrade = "A";
        else if (percentage >= 80) letterGrade = "B+";
        else if (percentage >= 70) letterGrade = "B";
        else if (percentage >= 60) letterGrade = "C+";
        else if (percentage >= 50) letterGrade = "C";
        else letterGrade = "D";
      }

      return {
        id: grade.id,
        title: grade.activity.title,
        subject: grade.activity.subject?.name || 'Unknown Subject',
        type: grade.activity.learningType || 'Activity',
        date: grade.gradedAt || grade.updatedAt,
        score: grade.score || 0,
        totalScore: grade.activity.maxScore || 100,
        grade: letterGrade,
        feedback: grade.feedback || '',
        classId: grade.activity.classId,
        className: grade.activity.class?.name || 'Unknown Class',
        term: 'Current Term', // This would come from the academic term in a real implementation
      };
    });

    // Map student grades to the expected format
    const mappedStudentGrades = studentGrades.map((grade) => {
      // Convert numeric grade to letter grade
      let letterGrade = "N/A";
      if (grade.finalGrade !== null) {
        const percentage = grade.finalGrade;

        if (percentage >= 90) letterGrade = "A";
        else if (percentage >= 80) letterGrade = "B+";
        else if (percentage >= 70) letterGrade = "B";
        else if (percentage >= 60) letterGrade = "C+";
        else if (percentage >= 50) letterGrade = "C";
        else letterGrade = "D";
      }

      return {
        id: grade.id,
        title: `${grade.gradeBook.class?.name || 'Unknown Class'} Final Grade`,
        subject: grade.gradeBook.class?.name || 'Unknown Subject',
        type: 'Final Grade',
        date: grade.updatedAt,
        score: grade.finalGrade || 0,
        totalScore: 100,
        grade: letterGrade,
        feedback: grade.comments || '',
        classId: grade.gradeBook.classId,
        className: grade.gradeBook.class?.name || 'Unknown Class',
        term: 'Current Term', // This would come from the academic term in a real implementation
      };
    });

    // Combine and sort by date
    return [...mappedActivityGrades, ...mappedStudentGrades].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    } catch (error) {
      logger.error(`Student grades cache error: ${error instanceof Error ? error.message : 'Unknown error'}`, { error, userId });
      throw error;
    }
  },
  ['student-grades'],
  { revalidate: CACHE_TTL.GRADES, tags: ['grades'] }
);

export default async function StudentGradesPage() {
  try {
    logger.debug("Student grades page accessed");
    const session = await getSessionCache();

    if (!session?.user?.id) {
      logger.warn("No session or user ID found in student grades");
      return redirect("/login");
    }

    // Get user details from database using cached function
    const user = await getCachedUser(session.user.id);

    logger.debug("User data retrieved for student grades", {
      found: !!user,
      userType: user?.userType
    });

    // Check if user exists
    if (!user) {
      logger.warn("User not found in database", { userId: session.user.id });
      return redirect("/login");
    }

    // Check if user is a student (either CAMPUS_STUDENT or STUDENT)
    const isStudent = user.userType === 'CAMPUS_STUDENT' || user.userType === 'STUDENT';

    if (!isStudent) {
      logger.warn("User is not a student", {
        userId: user.id,
        actualUserType: user.userType
      });
      return redirect("/login");
    }

    // Get student profile to verify it exists
    const studentProfile = await getCachedStudentProfile(user.id);

    if (!studentProfile) {
      logger.warn("Student profile not found", { userId: user.id });
      return redirect("/login");
    }

    // Get real grades data from the database using cached function
    const grades = await getCachedStudentGrades(user.id);

    logger.debug("Retrieved student grades", { count: grades.length });

    return (
      <div className="container mx-auto py-6">
        <StudentGradesListClient grades={grades} />
      </div>
    );
  } catch (error) {
    logger.error("Error in student grades page", { error });

    // Return a simple error message
    return (
      <div className="container mx-auto py-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error Loading Grades</h2>
          <p className="text-gray-600 mb-4">There was an error loading your grades. Please try again later.</p>
          <p className="text-sm text-gray-500">Error details: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}
