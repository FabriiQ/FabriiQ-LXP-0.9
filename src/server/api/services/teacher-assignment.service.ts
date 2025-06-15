/**
 * Teacher Assignment Service
 * Handles operations related to assigning teachers to classes
 */

import { SystemStatus, UserType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Teacher assignment schema
export const assignTeacherSchema = z.object({
  classId: z.string(),
  teacherId: z.string(),
});

// Teacher assignment query schema
export const teacherAssignmentQuerySchema = z.object({
  teacherId: z.string().optional(),
  classId: z.string().optional(),
  programId: z.string().optional(),
  courseId: z.string().optional(),
  campusId: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

export class TeacherAssignmentService extends ServiceBase {
  /**
   * Assigns a teacher to a class
   * @param data Assignment data
   * @returns Updated class
   */
  async assignTeacher(data: z.infer<typeof assignTeacherSchema>) {
    try {
      // Check if class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: data.classId },
        include: {
          courseCampus: {
            include: {
              campus: true,
              course: {
                include: {
                  program: true
                }
              }
            }
          }
        }
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Check if teacher exists and is a teacher
      const teacher = await this.prisma.user.findUnique({
        where: {
          id: data.teacherId,
          userType: UserType.CAMPUS_TEACHER
        },
        include: {
          teacherProfile: true,
          activeCampuses: true
        }
      });

      if (!teacher || !teacher.teacherProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher not found",
        });
      }

      // Check if teacher is active in the campus
      const isTeacherInCampus = teacher.activeCampuses.some(
        ac => ac.campusId === classEntity.campusId
      );

      if (!isTeacherInCampus) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Teacher is not active in this campus",
        });
      }

      // Update the class with the assigned teacher
      const updatedClass = await this.prisma.class.update({
        where: { id: data.classId },
        data: {
          classTeacherId: data.teacherId,
        },
        include: {
          courseCampus: {
            include: {
              campus: true,
              course: {
                include: {
                  program: true
                }
              }
            }
          },
          classTeacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      return {
        success: true,
        class: updatedClass,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to assign teacher to class",
        cause: error,
      });
    }
  }

  /**
   * Unassigns a teacher from a class
   * @param classId Class ID
   * @returns Updated class
   */
  async unassignTeacher(classId: string) {
    try {
      // Check if class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Update the class to remove the teacher
      const updatedClass = await this.prisma.class.update({
        where: { id: classId },
        data: {
          classTeacherId: null,
        },
        include: {
          courseCampus: {
            include: {
              campus: true,
              course: {
                include: {
                  program: true
                }
              }
            }
          }
        }
      });

      return {
        success: true,
        class: updatedClass,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to unassign teacher from class",
        cause: error,
      });
    }
  }

  /**
   * Gets teacher assignments
   * @param query Query parameters
   * @returns Teacher assignments
   */
  async getTeacherAssignments(query: z.infer<typeof teacherAssignmentQuerySchema>) {
    try {
      // Build where clause
      const whereClause: any = {
        status: query.status || SystemStatus.ACTIVE,
      };

      if (query.teacherId) {
        whereClause.classTeacherId = query.teacherId;
      }

      if (query.classId) {
        whereClause.id = query.classId;
      }

      if (query.campusId) {
        whereClause.campusId = query.campusId;
      }

      if (query.programId || query.courseId) {
        whereClause.courseCampus = {};

        if (query.courseId) {
          whereClause.courseCampus.courseId = query.courseId;
        }

        if (query.programId) {
          whereClause.courseCampus.course = {
            programId: query.programId
          };
        }
      }

      // Get classes with assigned teachers
      const classes = await this.prisma.class.findMany({
        where: whereClause,
        include: {
          courseCampus: {
            include: {
              campus: true,
              course: {
                include: {
                  program: true
                }
              }
            }
          },
          classTeacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          term: true,
          _count: {
            select: {
              students: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      });

      return {
        success: true,
        assignments: classes,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get teacher assignments",
        cause: error,
      });
    }
  }

  /**
   * Gets available teachers for a class
   * @param classId Class ID
   * @returns Available teachers
   */
  async getAvailableTeachers(classId: string) {
    try {
      // Check if class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
        select: {
          campusId: true,
          courseCampus: {
            select: {
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  level: true
                }
              }
            }
          }
        }
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Get teachers active in the campus
      const teachers = await this.prisma.user.findMany({
        where: {
          userType: UserType.CAMPUS_TEACHER,
          status: SystemStatus.ACTIVE,
          activeCampuses: {
            some: {
              campusId: classEntity.campusId,
              status: SystemStatus.ACTIVE
            }
          }
        },
        include: {
          teacherProfile: true
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      // Get current teaching load for each teacher
      const teacherIds = teachers.map(t => t.id);
      const teachingLoads = await this.prisma.class.groupBy({
        by: ['classTeacherId'],
        where: {
          classTeacherId: {
            in: teacherIds
          },
          status: SystemStatus.ACTIVE
        },
        _count: {
          id: true
        }
      });

      // Create a map of teacher ID to teaching load
      const teachingLoadMap = new Map<string, number>();
      teachingLoads.forEach(load => {
        if (load.classTeacherId) {
          teachingLoadMap.set(load.classTeacherId, load._count.id);
        }
      });

      // Format teacher data with teaching load
      const formattedTeachers = teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name || 'Unknown',
        email: teacher.email || teacher.username,
        specialization: teacher.teacherProfile?.specialization || null,
        expertise: teacher.teacherProfile?.expertise || [],
        currentLoad: teachingLoadMap.get(teacher.id) || 0
      }));

      return {
        success: true,
        teachers: formattedTeachers,
        courseInfo: classEntity.courseCampus?.course
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get available teachers",
        cause: error,
      });
    }
  }

  /**
   * Gets teacher workload
   * @param teacherId Teacher ID
   * @returns Teacher workload
   */
  async getTeacherWorkload(teacherId: string) {
    try {
      // Check if teacher exists
      const teacher = await this.prisma.user.findUnique({
        where: {
          id: teacherId,
          userType: UserType.CAMPUS_TEACHER
        },
        include: {
          teacherProfile: true
        }
      });

      if (!teacher) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher not found",
        });
      }

      // Get classes assigned to the teacher
      const classes = await this.prisma.class.findMany({
        where: {
          classTeacherId: teacherId,
          status: SystemStatus.ACTIVE
        },
        include: {
          courseCampus: {
            include: {
              campus: true,
              course: true
            }
          },
          term: true,
          _count: {
            select: {
              students: true,
              activities: true,
              assessments: true
            }
          }
        }
      });

      // Calculate workload metrics
      const totalClasses = classes.length;
      const totalStudents = classes.reduce((sum, c) => sum + c._count.students, 0);
      const totalActivities = classes.reduce((sum, c) => sum + c._count.activities, 0);
      const totalAssessments = classes.reduce((sum, c) => sum + c._count.assessments, 0);

      // Group classes by course
      const courseGroups = classes.reduce((groups, c) => {
        const courseId = c.courseCampus.courseId;
        if (!groups[courseId]) {
          groups[courseId] = {
            courseId,
            courseName: c.courseCampus.course.name,
            courseCode: c.courseCampus.course.code,
            classes: []
          };
        }
        groups[courseId].classes.push(c);
        return groups;
      }, {} as Record<string, { courseId: string, courseName: string, courseCode: string, classes: any[] }>);

      // Group classes by campus
      const campusGroups = classes.reduce((groups, c) => {
        const campusId = c.campusId;
        if (!groups[campusId]) {
          groups[campusId] = {
            campusId,
            campusName: c.courseCampus.campus.name,
            campusCode: c.courseCampus.campus.code,
            classes: []
          };
        }
        groups[campusId].classes.push(c);
        return groups;
      }, {} as Record<string, { campusId: string, campusName: string, campusCode: string, classes: any[] }>);

      return {
        success: true,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          specialization: teacher.teacherProfile?.specialization,
          expertise: teacher.teacherProfile?.expertise
        },
        workload: {
          totalClasses,
          totalStudents,
          totalActivities,
          totalAssessments,
          courseDistribution: Object.values(courseGroups),
          campusDistribution: Object.values(campusGroups),
          classes
        }
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get teacher workload",
        cause: error,
      });
    }
  }
}
