/**
 * Course Service
 * Handles operations related to courses, subjects, and curriculum management
 */

import { SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Course creation schema
export const createCourseSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  level: z.number().int().min(1).optional(),
  credits: z.number().min(0).optional(),
  programId: z.string(),
  settings: z.record(z.any()).optional(),
  syllabus: z.record(z.any()).optional(),
});

// Course update schema
export const updateCourseSchema = z.object({
  id: z.string(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  level: z.number().int().min(1).optional(),
  credits: z.number().min(0).optional(),
  settings: z.record(z.any()).optional(),
  syllabus: z.record(z.any()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Course query schema
export const courseQuerySchema = z.object({
  programId: z.string().optional(),
  level: z.number().int().min(1).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Subject creation schema
export const createSubjectSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  credits: z.number().min(0).optional(),
  courseId: z.string(),
  syllabus: z.record(z.any()).optional(),
});

// Subject update schema
export const updateSubjectSchema = z.object({
  id: z.string(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  credits: z.number().min(0).optional(),
  syllabus: z.record(z.any()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Course campus creation schema
export const createCourseCampusSchema = z.object({
  courseId: z.string(),
  campusId: z.string(),
  programCampusId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
});

// Course campus update schema
export const updateCourseCampusSchema = z.object({
  id: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Course prerequisite schema
export const coursePrerequisiteSchema = z.object({
  courseId: z.string(),
  prerequisiteId: z.string(),
});

export class CourseService extends ServiceBase {
  /**
   * Creates a new course
   * @param data Course data
   * @returns Created course
   */
  async createCourse(data: z.infer<typeof createCourseSchema>) {
    try {
      // Check if program exists
      const program = await this.prisma.program.findUnique({
        where: { id: data.programId },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Check if course code is unique
      const existingCourse = await this.prisma.course.findUnique({
        where: { code: data.code },
      });

      if (existingCourse) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Course code already exists",
        });
      }

      // Create the course
      const course = await this.prisma.course.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          level: data.level || 1,
          credits: data.credits || 1.0,
          program: {
            connect: { id: data.programId },
          },
          settings: data.settings || {},
          syllabus: data.syllabus || {},
          status: SystemStatus.ACTIVE,
        },
      });

      return {
        success: true,
        course,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create course",
        cause: error,
      });
    }
  }

  /**
   * Gets a course by ID
   * @param id Course ID
   * @returns Course
   */
  async getCourse(id: string) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id },
        include: {
          program: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          subjects: {
            where: {
              status: SystemStatus.ACTIVE,
            },
            orderBy: {
              code: "asc",
            },
          },
          campusOfferings: {
            where: {
              status: SystemStatus.ACTIVE,
            },
            include: {
              campus: true,
            },
          },
          prerequisites: {
            include: {
              prerequisite: true,
            },
          },
        },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      return {
        success: true,
        course,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get course",
        cause: error,
      });
    }
  }

  /**
   * Updates a course
   * @param data Course update data
   * @returns Updated course
   */
  async updateCourse(data: z.infer<typeof updateCourseSchema>) {
    try {
      // Check if course exists
      const existingCourse = await this.prisma.course.findUnique({
        where: { id: data.id },
      });

      if (!existingCourse) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if code is being changed and if it's unique
      if (data.code && data.code !== existingCourse.code) {
        const codeExists = await this.prisma.course.findUnique({
          where: { code: data.code },
        });

        if (codeExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Course code already exists",
          });
        }
      }

      // Update the course
      const course = await this.prisma.course.update({
        where: { id: data.id },
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          level: data.level,
          credits: data.credits,
          settings: data.settings,
          syllabus: data.syllabus,
          status: data.status,
        },
        include: {
          program: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return {
        success: true,
        course,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update course",
        cause: error,
      });
    }
  }

  /**
   * Deletes a course (soft delete)
   * @param id Course ID
   * @returns Success status
   */
  async deleteCourse(id: string) {
    try {
      // Check if course exists
      const existingCourse = await this.prisma.course.findUnique({
        where: { id },
        include: {
          campusOfferings: {
            where: {
              status: SystemStatus.ACTIVE,
            },
          },
          subjects: {
            where: {
              status: SystemStatus.ACTIVE,
            },
          },
        },
      });

      if (!existingCourse) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if course has active campus offerings
      if (existingCourse.campusOfferings.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete course with active campus offerings",
        });
      }

      // Soft delete the course and its subjects
      await this.prisma.$transaction([
        this.prisma.subject.updateMany({
          where: {
            courseId: id,
            status: SystemStatus.ACTIVE,
          },
          data: {
            status: SystemStatus.DELETED,
          },
        }),
        this.prisma.course.update({
          where: { id },
          data: {
            status: SystemStatus.DELETED,
            deletedAt: new Date(),
          },
        }),
      ]);

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete course",
        cause: error,
      });
    }
  }

  /**
   * Gets courses by query
   * @param query Course query
   * @returns Courses
   */
  async getCoursesByQuery(query: z.infer<typeof courseQuerySchema>) {
    try {
      const whereClause: any = {};

      if (query.programId) {
        whereClause.programId = query.programId;
      }

      if (query.level) {
        whereClause.level = query.level;
      }

      if (query.status) {
        whereClause.status = query.status;
      } else {
        whereClause.status = SystemStatus.ACTIVE;
      }

      const courses = await this.prisma.course.findMany({
        where: whereClause,
        include: {
          program: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              subjects: true,
              campusOfferings: true,
            },
          },
        },
        orderBy: [
          { level: "asc" },
          { code: "asc" },
        ],
      });

      return {
        success: true,
        courses,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get courses by query",
        cause: error,
      });
    }
  }

  /**
   * Gets courses by program
   * @param programId Program ID
   * @returns Courses
   */
  async getCoursesByProgram(programId: string) {
    try {
      const courses = await this.prisma.course.findMany({
        where: {
          programId,
          status: SystemStatus.ACTIVE,
        },
        orderBy: [
          { level: "asc" },
          { code: "asc" },
        ],
      });

      return {
        success: true,
        courses,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get courses by program",
        cause: error,
      });
    }
  }

  /**
   * Creates a new subject
   * @param data Subject data
   * @returns Created subject
   */
  async createSubject(data: z.infer<typeof createSubjectSchema>) {
    try {
      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id: data.courseId },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if subject code is unique
      const existingSubject = await this.prisma.subject.findUnique({
        where: { code: data.code },
      });

      if (existingSubject) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subject code already exists",
        });
      }

      // Create the subject
      const subject = await this.prisma.subject.create({
        data: {
          code: data.code,
          name: data.name,
          credits: data.credits || 1.0,
          course: {
            connect: { id: data.courseId },
          },
          syllabus: data.syllabus || {},
          status: SystemStatus.ACTIVE,
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return {
        success: true,
        subject,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create subject",
        cause: error,
      });
    }
  }

  /**
   * Gets a subject by ID
   * @param id Subject ID
   * @returns Subject
   */
  async getSubject(id: string) {
    try {
      const subject = await this.prisma.subject.findUnique({
        where: { id },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
              program: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          teacherQualifications: {
            where: {
              isVerified: true,
            },
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found",
        });
      }

      return {
        success: true,
        subject,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subject",
        cause: error,
      });
    }
  }

  /**
   * Updates a subject
   * @param data Subject update data
   * @returns Updated subject
   */
  async updateSubject(data: z.infer<typeof updateSubjectSchema>) {
    try {
      // Check if subject exists
      const existingSubject = await this.prisma.subject.findUnique({
        where: { id: data.id },
      });

      if (!existingSubject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found",
        });
      }

      // Check if code is being changed and if it's unique
      if (data.code && data.code !== existingSubject.code) {
        const codeExists = await this.prisma.subject.findUnique({
          where: { code: data.code },
        });

        if (codeExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Subject code already exists",
          });
        }
      }

      // Update the subject
      const subject = await this.prisma.subject.update({
        where: { id: data.id },
        data: {
          code: data.code,
          name: data.name,
          credits: data.credits,
          syllabus: data.syllabus,
          status: data.status,
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return {
        success: true,
        subject,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update subject",
        cause: error,
      });
    }
  }

  /**
   * Deletes a subject (soft delete)
   * @param id Subject ID
   * @returns Success status
   */
  async deleteSubject(id: string) {
    try {
      // Check if subject exists
      const existingSubject = await this.prisma.subject.findUnique({
        where: { id },
        include: {
          teacherQualifications: {
            where: {
              campusAssignments: {
                some: {
                  status: SystemStatus.ACTIVE,
                },
              },
            },
          },
        },
      });

      if (!existingSubject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found",
        });
      }

      // Check if subject has active teacher assignments
      if (existingSubject.teacherQualifications.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete subject with active teacher assignments",
        });
      }

      // Soft delete the subject
      await this.prisma.subject.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete subject",
        cause: error,
      });
    }
  }

  /**
   * Gets subjects by course
   * @param courseId Course ID
   * @returns Subjects
   */
  async getSubjectsByCourse(courseId: string) {
    try {
      const subjects = await this.prisma.subject.findMany({
        where: {
          courseId,
          status: SystemStatus.ACTIVE,
        },
        orderBy: {
          code: "asc",
        },
      });

      return {
        success: true,
        subjects,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subjects by course",
        cause: error,
      });
    }
  }

  /**
   * Associates existing subjects with a course
   * @param courseId Course ID
   * @param subjectIds Array of subject IDs to associate
   * @returns Result of the operation
   */
  async associateSubjectsWithCourse(courseId: string, subjectIds: string[]) {
    try {
      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if all subjects exist
      const subjects = await this.prisma.subject.findMany({
        where: {
          id: { in: subjectIds },
        },
      });

      if (subjects.length !== subjectIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more subjects not found",
        });
      }

      // Update each subject to associate with the course
      const updatePromises = subjectIds.map(subjectId =>
        this.prisma.subject.update({
          where: { id: subjectId },
          data: { courseId },
        })
      );

      await Promise.all(updatePromises);

      return {
        success: true,
        message: `${subjectIds.length} subjects associated with the course successfully`,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to associate subjects with course",
        cause: error,
      });
    }
  }

  /**
   * Creates a new course campus offering
   * @param data Course campus data
   * @returns Created course campus
   */
  async createCourseCampus(data: z.infer<typeof createCourseCampusSchema>) {
    try {
      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id: data.courseId },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if campus exists
      const campus = await this.prisma.campus.findUnique({
        where: { id: data.campusId },
      });

      if (!campus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campus not found",
        });
      }

      // Check if program campus exists
      const programCampus = await this.prisma.programCampus.findUnique({
        where: { id: data.programCampusId },
      });

      if (!programCampus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program campus not found",
        });
      }

      // Check if course campus already exists
      const existingCourseCampus = await this.prisma.courseCampus.findFirst({
        where: {
          courseId: data.courseId,
          campusId: data.campusId,
          programCampusId: data.programCampusId,
          status: SystemStatus.ACTIVE,
        },
      });

      if (existingCourseCampus) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Course is already offered at this campus",
        });
      }

      // Create the course campus
      const courseCampus = await this.prisma.courseCampus.create({
        data: {
          course: {
            connect: { id: data.courseId },
          },
          campus: {
            connect: { id: data.campusId },
          },
          programCampus: {
            connect: { id: data.programCampusId },
          },
          startDate: data.startDate,
          endDate: data.endDate,
          status: SystemStatus.ACTIVE,
        },
        include: {
          course: true,
          campus: true,
          programCampus: {
            include: {
              program: true,
            },
          },
        },
      });

      return {
        success: true,
        courseCampus,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create course campus",
        cause: error,
      });
    }
  }

  /**
   * Updates a course campus offering
   * @param data Course campus update data
   * @returns Updated course campus
   */
  async updateCourseCampus(data: z.infer<typeof updateCourseCampusSchema>) {
    try {
      // Check if course campus exists
      const existingCourseCampus = await this.prisma.courseCampus.findUnique({
        where: { id: data.id },
      });

      if (!existingCourseCampus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course campus not found",
        });
      }

      // Update the course campus
      const courseCampus = await this.prisma.courseCampus.update({
        where: { id: data.id },
        data: {
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
        },
        include: {
          course: true,
          campus: true,
          programCampus: {
            include: {
              program: true,
            },
          },
        },
      });

      return {
        success: true,
        courseCampus,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update course campus",
        cause: error,
      });
    }
  }

  /**
   * Adds a prerequisite to a course
   * @param data Course prerequisite data
   * @returns Success status
   */
  async addCoursePrerequisite(data: z.infer<typeof coursePrerequisiteSchema>) {
    try {
      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id: data.courseId },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if prerequisite course exists
      const prerequisiteCourse = await this.prisma.course.findUnique({
        where: { id: data.prerequisiteId },
      });

      if (!prerequisiteCourse) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prerequisite course not found",
        });
      }

      // Check if prerequisite already exists
      const existingPrerequisite = await this.prisma.coursePrerequisite.findFirst({
        where: {
          courseId: data.courseId,
          prerequisiteId: data.prerequisiteId,
        },
      });

      if (existingPrerequisite) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Prerequisite already exists",
        });
      }

      // Create the prerequisite
      await this.prisma.coursePrerequisite.create({
        data: {
          course: {
            connect: { id: data.courseId },
          },
          prerequisite: {
            connect: { id: data.prerequisiteId },
          },
          type: "REQUIRED", // Default type
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add course prerequisite",
        cause: error,
      });
    }
  }

  /**
   * Removes a prerequisite from a course
   * @param courseId Course ID
   * @param prerequisiteId Prerequisite course ID
   * @returns Success status
   */
  async removeCoursePrerequisite(courseId: string, prerequisiteId: string) {
    try {
      // Check if prerequisite exists
      const existingPrerequisite = await this.prisma.coursePrerequisite.findFirst({
        where: {
          courseId,
          prerequisiteId,
        },
      });

      if (!existingPrerequisite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prerequisite not found",
        });
      }

      // Delete the prerequisite
      await this.prisma.coursePrerequisite.delete({
        where: {
          id: existingPrerequisite.id,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove course prerequisite",
        cause: error,
      });
    }
  }
}