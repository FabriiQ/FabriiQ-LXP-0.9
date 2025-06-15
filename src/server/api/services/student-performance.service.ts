/**
 * Student Performance Service
 * Handles operations related to tracking student performance
 */

import { SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Student performance query schema
export const studentPerformanceQuerySchema = z.object({
  studentId: z.string().optional(),
  enrollmentId: z.string().optional(),
  programId: z.string().optional(),
  courseId: z.string().optional(),
  classId: z.string().optional(),
  campusId: z.string().optional(),
  termId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export class StudentPerformanceService extends ServiceBase {
  /**
   * Gets performance data for a student
   * @param query Query parameters
   * @returns Student performance data
   */
  async getStudentPerformance(query: z.infer<typeof studentPerformanceQuerySchema>) {
    try {
      // Ensure we have either studentId or enrollmentId
      if (!query.studentId && !query.enrollmentId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either studentId or enrollmentId is required",
        });
      }

      // Get student enrollment
      let enrollment;
      if (query.enrollmentId) {
        enrollment = await this.prisma.studentEnrollment.findUnique({
          where: { id: query.enrollmentId },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true
                  }
                }
              }
            },
            class: {
              include: {
                programCampus: {
                  include: {
                    program: true,
                    campus: true
                  }
                }
              }
            }
          }
        });
      } else if (query.studentId && query.programId) {
        // Find enrollment for specific student and program
        enrollment = await this.prisma.studentEnrollment.findFirst({
          where: {
            studentId: query.studentId,
            class: {
              programCampusId: query.programId,
              ...(query.campusId ? { campusId: query.campusId } : {})
            },
            status: SystemStatus.ACTIVE
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true
                  }
                }
              }
            },
            class: {
              include: {
                programCampus: {
                  include: {
                    program: true,
                    campus: true
                  }
                }
              }
            }
          }
        });
      } else if (query.studentId) {
        // Find the most recent enrollment for this student
        enrollment = await this.prisma.studentEnrollment.findFirst({
          where: {
            studentId: query.studentId,
            status: SystemStatus.ACTIVE
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true
                  }
                }
              }
            },
            class: {
              include: {
                programCampus: {
                  include: {
                    program: true,
                    campus: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }

      if (!enrollment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student enrollment not found",
        });
      }

      // Get student classes
      const classesWhere: any = {
        students: {
          some: {
            studentId: enrollment.studentId
          }
        },
        status: SystemStatus.ACTIVE
      };

      if (query.courseId) {
        classesWhere.courseCampus = {
          courseId: query.courseId
        };
      }

      if (query.termId) {
        classesWhere.termId = query.termId;
      }

      const classes = await this.prisma.class.findMany({
        where: classesWhere,
        include: {
          courseCampus: {
            include: {
              course: true,
              campus: true
            }
          },
          term: true,
          classTeacher: {
            select: {
              id: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      // Get student grades
      const gradesWhere: any = {
        studentId: enrollment.studentId,
        status: SystemStatus.ACTIVE
      };

      if (query.courseId) {
        gradesWhere.activity = {
          class: {
            courseCampus: {
              courseId: query.courseId
            }
          }
        };
      }

      if (query.classId) {
        gradesWhere.activity = {
          classId: query.classId
        };
      }

      if (query.startDate || query.endDate) {
        gradesWhere.createdAt = {};
        if (query.startDate) {
          gradesWhere.createdAt.gte = query.startDate;
        }
        if (query.endDate) {
          gradesWhere.createdAt.lte = query.endDate;
        }
      }

      const grades = await this.prisma.activityGrade.findMany({
        where: gradesWhere,
        include: {
          activity: {
            include: {
              class: {
                include: {
                  courseCampus: {
                    include: {
                      course: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Get student attendance
      const attendanceWhere: any = {
        studentId: enrollment.studentId,
        status: SystemStatus.ACTIVE
      };

      if (query.courseId) {
        attendanceWhere.class = {
          courseCampus: {
            courseId: query.courseId
          }
        };
      }

      if (query.classId) {
        attendanceWhere.classId = query.classId;
      }

      if (query.startDate || query.endDate) {
        attendanceWhere.date = {};
        if (query.startDate) {
          attendanceWhere.date.gte = query.startDate;
        }
        if (query.endDate) {
          attendanceWhere.date.lte = query.endDate;
        }
      }

      // Note: This is a placeholder. In a real implementation, you would have an attendance model
      // For now, we'll generate sample attendance data
      const attendanceRate = Math.random() * 20 + 80; // Random between 80% and 100%
      const totalSessions = Math.floor(Math.random() * 50) + 20; // Random between 20 and 70
      const attendedSessions = Math.floor(totalSessions * (attendanceRate / 100));

      // Calculate performance metrics
      // const totalGrades = grades.length; // Unused variable
      let totalPoints = 0;
      let totalMaxPoints = 0;

      grades.forEach(grade => {
        // Type assertion for grade with points
        const gradeWithPoints = grade as unknown as {
          points: number,
          activity: { maxPoints: number }
        };
        totalPoints += gradeWithPoints.points;
        totalMaxPoints += gradeWithPoints.activity.maxPoints;
      });

      const averageGradePercentage = totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 100 : 0;

      // Group grades by course
      const courseGrades = grades.reduce((acc, grade) => {
        const courseId = grade.activity.class.courseCampus.courseId;
        const courseName = grade.activity.class.courseCampus.course.name;

        if (!acc[courseId]) {
          acc[courseId] = {
            courseId,
            courseName,
            totalPoints: 0,
            totalMaxPoints: 0,
            grades: []
          };
        }

        // Type assertion for grade with points
        const gradeWithPoints = grade as unknown as {
          points: number,
          activity: { maxPoints: number }
        };
        acc[courseId].totalPoints += gradeWithPoints.points;
        acc[courseId].totalMaxPoints += gradeWithPoints.activity.maxPoints;
        acc[courseId].grades.push(grade);

        return acc;
      }, {} as Record<string, { courseId: string, courseName: string, totalPoints: number, totalMaxPoints: number, grades: any[] }>);

      // Calculate course grade percentages
      const coursePerformance = Object.values(courseGrades).map(course => ({
        courseId: course.courseId,
        courseName: course.courseName,
        gradePercentage: course.totalMaxPoints > 0 ? (course.totalPoints / course.totalMaxPoints) * 100 : 0,
        totalActivities: course.grades.length
      }));

      // Generate recent activity data
      const recentActivities = grades
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(grade => {
          // Add type assertion for activity grade properties
          const gradeWithPoints = grade as unknown as {
            id: string,
            points: number,
            activity: {
              name: string,
              maxPoints: number,
              class: {
                courseCampus: {
                  course: { name: string }
                }
              }
            }
          };

          return {
            id: gradeWithPoints.id,
            activityName: gradeWithPoints.activity.name,
            courseName: gradeWithPoints.activity.class.courseCampus.course.name,
            points: gradeWithPoints.points,
            maxPoints: gradeWithPoints.activity.maxPoints,
            percentage: (gradeWithPoints.points / gradeWithPoints.activity.maxPoints) * 100,
            date: grade.createdAt
          };
        });

      // Type assertion for enrollment with student and programCampus
      const enrollmentWithDetails = enrollment as unknown as {
        id: string,
        createdAt: Date,
        student: {
          id: string,
          enrollmentNumber: string,
          user: {
            name: string,
            email: string,
            username: string
          }
        },
        class: {
          programCampus: {
            program: { name: string },
            campus: { name: string }
          }
        }
      };

      return {
        success: true,
        student: {
          id: enrollmentWithDetails.student.id,
          name: enrollmentWithDetails.student.user.name,
          email: enrollmentWithDetails.student.user.email || enrollmentWithDetails.student.user.username,
          enrollmentNumber: enrollmentWithDetails.student.enrollmentNumber
        },
        enrollment: {
          id: enrollmentWithDetails.id,
          program: enrollmentWithDetails.class.programCampus.program.name,
          campus: enrollmentWithDetails.class.programCampus.campus.name,
          startDate: enrollmentWithDetails.createdAt
        },
        performance: {
          overallGrade: averageGradePercentage,
          attendanceRate,
          totalSessions,
          attendedSessions,
          coursePerformance,
          recentActivities,
          classes
        }
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get student performance",
        cause: error,
      });
    }
  }

  /**
   * Gets cohort performance data
   * @param query Query parameters
   * @returns Cohort performance data
   */
  async getCohortPerformance(query: z.infer<typeof studentPerformanceQuerySchema>) {
    try {
      // Build where clause for enrollments
      const enrollmentsWhere: any = {
        status: SystemStatus.ACTIVE
      };

      if (query.programId) {
        enrollmentsWhere.programCampus = {
          programId: query.programId
        };
      }

      if (query.campusId) {
        enrollmentsWhere.programCampus = {
          ...(enrollmentsWhere.programCampus || {}),
          campusId: query.campusId
        };
      }

      // Get student enrollments
      const enrollments = await this.prisma.studentEnrollment.findMany({
        where: enrollmentsWhere,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          class: {
            include: {
              programCampus: {
                include: {
                  program: true,
                  campus: true
                }
              }
            }
          }
        },
        take: 100 // Limit to 100 students for performance
      });

      if (enrollments.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No student enrollments found",
        });
      }

      // Type assertion for enrollments with class and programCampus
      const enrollmentsWithDetails = enrollments as unknown as Array<{
        studentId: string,
        class: {
          programCampus: {
            program: { id: string, name: string },
            campus: { id: string, name: string }
          }
        }
      }>;

      // Get program and campus details
      const program = enrollmentsWithDetails[0].class.programCampus.program;
      const campus = enrollmentsWithDetails[0].class.programCampus.campus;

      // Get student IDs
      const studentIds = enrollments.map(e => e.studentId);

      // Get grades for all students
      const gradesWhere: any = {
        studentId: {
          in: studentIds
        },
        status: SystemStatus.ACTIVE
      };

      if (query.courseId) {
        gradesWhere.activity = {
          class: {
            courseCampus: {
              courseId: query.courseId
            }
          }
        };
      }

      if (query.classId) {
        gradesWhere.activity = {
          classId: query.classId
        };
      }

      if (query.startDate || query.endDate) {
        gradesWhere.createdAt = {};
        if (query.startDate) {
          gradesWhere.createdAt.gte = query.startDate;
        }
        if (query.endDate) {
          gradesWhere.createdAt.lte = query.endDate;
        }
      }

      const grades = await this.prisma.activityGrade.findMany({
        where: gradesWhere,
        include: {
          activity: {
            include: {
              class: {
                include: {
                  courseCampus: {
                    include: {
                      course: true
                    }
                  }
                }
              }
            }
          },
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      // Calculate overall cohort performance
      // const totalGrades = grades.length; // Unused variable
      let totalPoints = 0;
      let totalMaxPoints = 0;

      grades.forEach(grade => {
        // Type assertion for grade with points
        const gradeWithPoints = grade as unknown as {
          points: number,
          activity: { maxPoints: number }
        };
        totalPoints += gradeWithPoints.points;
        totalMaxPoints += gradeWithPoints.activity.maxPoints;
      });

      const averageGradePercentage = totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 100 : 0;

      // Group grades by student
      const studentGrades = grades.reduce((acc, grade) => {
        const studentId = grade.studentId;
        const studentName = grade.student.user.name || 'Unknown';

        if (!acc[studentId]) {
          acc[studentId] = {
            studentId,
            studentName,
            totalPoints: 0,
            totalMaxPoints: 0,
            grades: []
          };
        }

        // Type assertion for grade with points
        const gradeWithPoints = grade as unknown as {
          points: number,
          activity: { maxPoints: number }
        };
        acc[studentId].totalPoints += gradeWithPoints.points;
        acc[studentId].totalMaxPoints += gradeWithPoints.activity.maxPoints;
        acc[studentId].grades.push(grade);

        return acc;
      }, {} as Record<string, { studentId: string, studentName: string, totalPoints: number, totalMaxPoints: number, grades: any[] }>);

      // Calculate student grade percentages
      const studentPerformance = Object.values(studentGrades).map(student => ({
        studentId: student.studentId,
        studentName: student.studentName,
        gradePercentage: student.totalMaxPoints > 0 ? (student.totalPoints / student.totalMaxPoints) * 100 : 0,
        totalActivities: student.grades.length
      }));

      // Group grades by course
      const courseGrades = grades.reduce((acc, grade) => {
        const courseId = grade.activity.class.courseCampus.courseId;
        const courseName = grade.activity.class.courseCampus.course.name;

        if (!acc[courseId]) {
          acc[courseId] = {
            courseId,
            courseName,
            totalPoints: 0,
            totalMaxPoints: 0,
            grades: []
          };
        }

        // Type assertion for grade with points
        const gradeWithPoints = grade as unknown as {
          points: number,
          activity: { maxPoints: number }
        };
        acc[courseId].totalPoints += gradeWithPoints.points;
        acc[courseId].totalMaxPoints += gradeWithPoints.activity.maxPoints;
        acc[courseId].grades.push(grade);

        return acc;
      }, {} as Record<string, { courseId: string, courseName: string, totalPoints: number, totalMaxPoints: number, grades: any[] }>);

      // Calculate course grade percentages
      const coursePerformance = Object.values(courseGrades).map(course => ({
        courseId: course.courseId,
        courseName: course.courseName,
        gradePercentage: course.totalMaxPoints > 0 ? (course.totalPoints / course.totalMaxPoints) * 100 : 0,
        totalActivities: course.grades.length
      }));

      // Calculate grade distribution
      const gradeRanges = [
        { range: '90-100', count: 0 },
        { range: '80-89', count: 0 },
        { range: '70-79', count: 0 },
        { range: '60-69', count: 0 },
        { range: '0-59', count: 0 }
      ];

      studentPerformance.forEach(student => {
        const grade = student.gradePercentage;
        if (grade >= 90) {
          gradeRanges[0].count++;
        } else if (grade >= 80) {
          gradeRanges[1].count++;
        } else if (grade >= 70) {
          gradeRanges[2].count++;
        } else if (grade >= 60) {
          gradeRanges[3].count++;
        } else {
          gradeRanges[4].count++;
        }
      });

      // Generate attendance data (placeholder)
      const attendanceRate = Math.random() * 15 + 80; // Random between 80% and 95%

      return {
        success: true,
        cohort: {
          program: {
            id: program.id,
            name: program.name
            // code property doesn't exist in the type assertion
          },
          campus: {
            id: campus.id,
            name: campus.name
            // code property doesn't exist in the type assertion
          },
          totalStudents: enrollments.length
        },
        performance: {
          overallGrade: averageGradePercentage,
          attendanceRate,
          gradeDistribution: gradeRanges,
          studentPerformance: studentPerformance.sort((a, b) => b.gradePercentage - a.gradePercentage),
          coursePerformance,
          topPerformers: studentPerformance
            .sort((a, b) => b.gradePercentage - a.gradePercentage)
            .slice(0, 5)
        }
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get cohort performance",
        cause: error,
      });
    }
  }
}
