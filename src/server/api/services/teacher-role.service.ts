/**
 * Teacher Role Service
 * Handles operations related to teacher roles (class teacher vs subject teacher)
 */

import { SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ServiceBase } from "./service-base";
import { logger } from "../utils/logger";

export class TeacherRoleService extends ServiceBase {
  private logger = logger;
  /**
   * Check if a teacher is a class teacher for a specific class
   * @param teacherId The teacher's profile ID
   * @param classId The class ID
   * @returns Boolean indicating if the teacher is a class teacher
   */
  async isClassTeacher(teacherId: string, classId: string): Promise<boolean> {
    try {
      this.logger.debug("Checking if teacher is assigned to class", { teacherId, classId });

      // First check if the teacher is the primary class teacher
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
        select: { classTeacherId: true }
      });

      if (!classEntity) {
        this.logger.warn("Class not found when checking teacher assignment", { classId });
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Check if teacher is the primary class teacher
      const isPrimaryTeacher = classEntity.classTeacherId === teacherId;

      if (isPrimaryTeacher) {
        this.logger.debug("Teacher is the primary class teacher", { teacherId, classId });
        return true;
      }

      // If not the primary teacher, check if teacher is assigned to this class
      const teacherAssignment = await this.prisma.teacherAssignment.findFirst({
        where: {
          teacherId: teacherId,
          classId: classId,
          status: 'ACTIVE'
        }
      });

      const isAssigned = !!teacherAssignment;

      this.logger.debug("Teacher assignment check result", {
        teacherId,
        classId,
        isAssigned,
        assignmentId: teacherAssignment?.id
      });

      return isAssigned;
    } catch (error) {
      this.logger.error("Error checking if teacher is class teacher", { error, teacherId, classId });
      return false;
    }
  }

  /**
   * Check if a teacher is a subject teacher for a specific class
   * @param teacherId The teacher's profile ID
   * @param classId The class ID
   * @returns Boolean indicating if the teacher is a subject teacher
   */
  async isSubjectTeacher(teacherId: string, classId: string): Promise<boolean> {
    try {
      // Get the class and its associated course and subjects
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
        include: {
          courseCampus: {
            include: {
              course: {
                include: {
                  subjects: true
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

      // Get the subject IDs for this class
      const subjectIds = classEntity.courseCampus.course.subjects.map(subject => subject.id);

      // Check if the teacher has any subject qualifications for these subjects
      const subjectQualifications = await this.prisma.teacherSubjectQualification.findMany({
        where: {
          teacherId: teacherId,
          subjectId: { in: subjectIds },
          isVerified: true
        }
      });

      return subjectQualifications.length > 0;
    } catch (error) {
      this.logger.error("Error checking if teacher is subject teacher", { error, teacherId, classId });
      return false;
    }
  }

  /**
   * Get all classes where a teacher is a class teacher
   * @param teacherId The teacher's profile ID
   * @returns Array of classes where the teacher is a class teacher
   */
  async getClassTeacherClasses(teacherId: string) {
    try {
      return this.prisma.class.findMany({
        where: {
          classTeacherId: teacherId,
          status: "ACTIVE" as SystemStatus
        },
        include: {
          courseCampus: {
            include: {
              campus: true,
              course: {
                include: {
                  subjects: true,
                  program: true
                }
              }
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
    } catch (error) {
      this.logger.error("Error getting class teacher classes", { error, teacherId });
      return [];
    }
  }

  /**
   * Get all classes where a teacher is a subject teacher
   * @param teacherId The teacher's profile ID
   * @returns Array of classes where the teacher is a subject teacher
   */
  async getSubjectTeacherClasses(teacherId: string) {
    try {
      // Get the teacher's subject qualifications
      const subjectQualifications = await this.prisma.teacherSubjectQualification.findMany({
        where: {
          teacherId: teacherId,
          isVerified: true
        },
        select: {
          subjectId: true
        }
      });

      const subjectIds = subjectQualifications.map(qual => qual.subjectId);

      // Get all active classes that include these subjects
      return this.prisma.class.findMany({
        where: {
          status: "ACTIVE" as SystemStatus,
          courseCampus: {
            course: {
              subjects: {
                some: {
                  id: { in: subjectIds }
                }
              }
            }
          }
        },
        include: {
          courseCampus: {
            include: {
              campus: true,
              course: {
                include: {
                  subjects: {
                    where: {
                      id: { in: subjectIds }
                    }
                  },
                  program: true
                }
              }
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
    } catch (error) {
      this.logger.error("Error getting subject teacher classes", { error, teacherId });
      return [];
    }
  }

  /**
   * Get all subjects a teacher is qualified to teach
   * @param teacherId The teacher's profile ID
   * @returns Array of subjects the teacher is qualified to teach
   */
  async getTeacherSubjects(teacherId: string) {
    try {
      const qualifications = await this.prisma.teacherSubjectQualification.findMany({
        where: {
          teacherId: teacherId,
          isVerified: true
        },
        include: {
          subject: true
        }
      });

      return qualifications.map(qual => qual.subject);
    } catch (error) {
      this.logger.error("Error getting teacher subjects", { error, teacherId });
      return [];
    }
  }

  /**
   * Check if a teacher has access to an activity
   * @param teacherId The teacher's profile ID
   * @param activityId The activity ID
   * @returns Boolean indicating if the teacher has access
   */
  async hasActivityAccess(teacherId: string, activityId: string): Promise<boolean> {
    try {
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          class: true
        }
      });

      if (!activity) {
        return false;
      }

      // Class teachers have access to all activities in their class
      const isClassTeacher = await this.isClassTeacher(teacherId, activity.classId);
      if (isClassTeacher) {
        return true;
      }

      // Subject teachers only have access to activities for their subjects
      const isSubjectTeacher = await this.isSubjectTeacher(teacherId, activity.classId);
      if (isSubjectTeacher) {
        // Check if the activity is for a subject they teach
        const teacherSubjects = await this.getTeacherSubjects(teacherId);
        return teacherSubjects.some(subject => subject.id === activity.subjectId);
      }

      return false;
    } catch (error) {
      this.logger.error("Error checking activity access", { error, teacherId, activityId });
      return false;
    }
  }
}
