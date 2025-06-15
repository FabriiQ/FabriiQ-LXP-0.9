/**
 * Curriculum Service
 * Handles operations related to curriculum management, including courses, subjects, and learning materials
 */

import { SystemStatus } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Course creation schema
export const createCourseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1"),
  durationUnit: z.string(),
  level: z.string().optional(),
  credits: z.number().optional(),
  prerequisites: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Course update schema
export const updateCourseSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  code: z.string().min(1, "Code is required").optional(),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1").optional(),
  durationUnit: z.string().optional(),
  level: z.string().optional(),
  credits: z.number().optional(),
  prerequisites: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Subject creation schema
export const createSubjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  credits: z.number().optional(),
  courseId: z.string(),
  learningOutcomes: z.array(z.string()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Subject update schema
export const updateSubjectSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  code: z.string().min(1, "Code is required").optional(),
  description: z.string().optional(),
  credits: z.number().optional(),
  learningOutcomes: z.array(z.string()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Learning material creation schema
export const createLearningMaterialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.string(),
  url: z.string().url("Invalid URL").optional(),
  fileKey: z.string().optional(),
  subjectId: z.string(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Learning material update schema
export const updateLearningMaterialSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  url: z.string().url("Invalid URL").optional(),
  fileKey: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

export class CurriculumService extends ServiceBase {
  // Add userId property to the class if it doesn't exist
  private userId: string;

  constructor(prisma: PrismaClient, userId: string) {
    super({ prisma });
    this.userId = userId;
  }

  /**
   * Creates a new course
   * @param data Course data
   * @returns Created course
   */
  async createCourse(data: z.infer<typeof createCourseSchema>) {
    try {
      // Check if course code already exists
      const existingCourse = await this.prisma.course.findFirst({
        where: {
          code: data.code,
          status: {
            not: SystemStatus.DELETED,
          },
        },
      });

      if (existingCourse) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Course with this code already exists",
        });
      }

      // Get the first available program or use a default
      const program = await this.prisma.program.findFirst({
        where: { status: SystemStatus.ACTIVE }
      });

      if (!program) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active program found to associate with the course",
        });
      }

      // Create course with only valid properties
      const course = await this.prisma.course.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description,
          level: data.level ? parseInt(data.level as string, 10) : undefined,
          credits: data.credits || 1.0, // Default from schema
          settings: data.learningOutcomes ? { learningOutcomes: data.learningOutcomes } : undefined,
          status: data.status || SystemStatus.ACTIVE,
          program: {
            connect: {
              id: program.id
            }
          }
        },
        include: {
          program: true,
          subjects: true,
          prerequisites: true,
        },
      });

      return {
        success: true,
        course,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
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
          program: true,
          subjects: {
            where: {
              status: {
                not: SystemStatus.DELETED,
              },
            },
          },
          prerequisites: {
            include: {
              prerequisite: true
            }
          }
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
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get course",
        cause: error,
      });
    }
  }

  /**
   * Updates a course
   * @param id Course ID
   * @param data Course data
   * @returns Updated course
   */
  async updateCourse(id: string, data: z.infer<typeof updateCourseSchema>) {
    try {
      // Check if course exists
      const existingCourse = await this.prisma.course.findUnique({
        where: { id },
      });

      if (!existingCourse) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if code is being updated and if it already exists
      if (data.code && data.code !== existingCourse.code) {
        const codeExists = await this.prisma.course.findFirst({
          where: {
            code: data.code,
            id: {
              not: id,
            },
            status: {
              not: SystemStatus.DELETED,
            },
          },
        });

        if (codeExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Course with this code already exists",
          });
        }
      }

      // Update course
      const course = await this.prisma.course.update({
        where: { id },
        data: {
          ...data,
          level: data.level ? parseInt(data.level as string, 10) : undefined,
          prerequisites: undefined,
        },
        include: {
          program: true,
          subjects: true,
          prerequisites: true,
        },
      });

      return {
        success: true,
        course,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
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
          subjects: {
            where: {
              status: {
                not: SystemStatus.DELETED,
              },
            },
            include: {
              assessments: {
                where: {
                  status: SystemStatus.ACTIVE,
                },
              },
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

      // Check if course has active classes/assessments
      const hasActiveAssessments = existingCourse.subjects.some(
        (subject) => subject.assessments && subject.assessments.length > 0
      );

      if (hasActiveAssessments) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete course with active assessments",
        });
      }

      // Soft delete course
      await this.prisma.course.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
        },
      });

      // Soft delete subjects
      if (existingCourse.subjects.length > 0) {
        await this.prisma.subject.updateMany({
          where: {
            courseId: id,
          },
          data: {
            status: SystemStatus.DELETED,
          },
        });
      }

      return {
        success: true,
        message: "Course deleted successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete course",
        cause: error,
      });
    }
  }

  /**
   * Gets all courses
   * @returns Courses
   */
  async getAllCourses() {
    try {
      const courses = await this.prisma.course.findMany({
        where: {
          status: {
            not: SystemStatus.DELETED,
          },
        },
        include: {
          _count: {
            select: {
              subjects: true,
              prerequisites: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return {
        success: true,
        courses,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get courses",
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

      // Check if subject code already exists
      const existingSubject = await this.prisma.subject.findFirst({
        where: {
          code: data.code,
          status: {
            not: SystemStatus.DELETED,
          },
        },
      });

      if (existingSubject) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subject with this code already exists",
        });
      }

      // Create subject with valid properties
      const subject = await this.prisma.subject.create({
        data: {
          name: data.name,
          code: data.code,
          syllabus: data.description ? { description: data.description } : undefined,
          credits: data.credits || 1.0, // Default from schema
          status: data.status || SystemStatus.ACTIVE,
          course: {
            connect: { id: data.courseId },
          },
        },
        include: {
          course: true,
        },
      });

      return {
        success: true,
        subject,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
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
          course: true,
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
                      email: true,
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
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subject",
        cause: error,
      });
    }
  }

  /**
   * Updates a subject
   * @param id Subject ID
   * @param data Subject data
   * @returns Updated subject
   */
  async updateSubject(id: string, data: z.infer<typeof updateSubjectSchema>) {
    try {
      // Check if subject exists
      const existingSubject = await this.prisma.subject.findUnique({
        where: { id },
      });

      if (!existingSubject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found",
        });
      }

      // Check if code is being updated and if it already exists
      if (data.code && data.code !== existingSubject.code) {
        const codeExists = await this.prisma.subject.findFirst({
          where: {
            code: data.code,
            id: {
              not: id,
            },
            status: {
              not: SystemStatus.DELETED,
            },
          },
        });

        if (codeExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Subject with this code already exists",
          });
        }
      }

      // Update subject
      const subject = await this.prisma.subject.update({
        where: { id },
        data,
        include: {
          course: true,
        },
      });

      return {
        success: true,
        subject,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
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
          assessments: {
            where: {
              status: SystemStatus.ACTIVE,
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

      // Check if subject has active assessments
      if (existingSubject.assessments.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete subject with active assessments",
        });
      }

      // Soft delete subject
      await this.prisma.subject.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
        },
      });

      return {
        success: true,
        message: "Subject deleted successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete subject",
        cause: error,
      });
    }
  }

  /**
   * Gets subjects by course ID
   * @param courseId Course ID
   * @returns Subjects
   */
  async getSubjectsByCourse(courseId: string) {
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

      const subjects = await this.prisma.subject.findMany({
        where: {
          courseId,
          status: {
            not: SystemStatus.DELETED,
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return {
        success: true,
        subjects,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subjects by course",
        cause: error,
      });
    }
  }

  /**
   * Creates a new learning material
   * @param data Learning material data
   * @returns Created learning material
   */
  async createLearningMaterial(data: z.infer<typeof createLearningMaterialSchema>) {
    try {
      // Check if subject exists
      const subject = await this.prisma.subject.findUnique({
        where: { id: data.subjectId },
      });

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found",
        });
      }

      // Create resource instead of learning material
      const resource = await this.prisma.resource.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type as any, // Cast to ResourceType
          url: data.url,
          tags: [subject.code], // Add subject code as a tag
          access: "PRIVATE", // Default access
          settings: data.fileKey ? { fileKey: data.fileKey } : undefined,
          status: data.status || SystemStatus.ACTIVE,
          owner: {
            connect: { id: this.userId } // Connect to current user
          },
        },
      });

      return {
        success: true,
        resource,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create learning material",
        cause: error,
      });
    }
  }

  /**
   * Gets a learning material by ID
   * @param id Learning material ID
   * @returns Learning material
   */
  async getLearningMaterial(id: string) {
    try {
      const resource = await this.prisma.resource.findUnique({
        where: { id },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Learning material not found",
        });
      }

      return {
        success: true,
        resource,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get learning material",
        cause: error,
      });
    }
  }

  /**
   * Updates a learning material
   * @param id Learning material ID
   * @param data Learning material data
   * @returns Updated learning material
   */
  async updateLearningMaterial(id: string, data: z.infer<typeof updateLearningMaterialSchema>) {
    try {
      // Check if resource exists
      const existingResource = await this.prisma.resource.findUnique({
        where: { id },
      });

      if (!existingResource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Learning material not found",
        });
      }

      // Prepare settings object
      let newSettings = undefined;
      if (data.fileKey) {
        // Create a new settings object with the fileKey
        if (existingResource.settings) {
          // Parse existing settings if it's a string or use as is if it's an object
          const currentSettings = typeof existingResource.settings === 'string' 
            ? JSON.parse(existingResource.settings) 
            : existingResource.settings;
          
          // Create a new object with all properties
          newSettings = { 
            ...currentSettings,
            fileKey: data.fileKey 
          };
        } else {
          newSettings = { fileKey: data.fileKey };
        }
      }

      // Update resource
      const resource = await this.prisma.resource.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          type: data.type as any, // Cast to ResourceType
          url: data.url,
          status: data.status,
          settings: newSettings,
        },
      });

      return {
        success: true,
        resource,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update learning material",
        cause: error,
      });
    }
  }

  /**
   * Deletes a learning material (soft delete)
   * @param id Learning material ID
   * @returns Success status
   */
  async deleteLearningMaterial(id: string) {
    try {
      // Check if resource exists
      const existingResource = await this.prisma.resource.findUnique({
        where: { id },
      });

      if (!existingResource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Learning material not found",
        });
      }

      // Soft delete resource
      await this.prisma.resource.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
        },
      });

      return {
        success: true,
        message: "Learning material deleted successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete learning material",
        cause: error,
      });
    }
  }

  /**
   * Gets learning materials by subject ID
   * @param subjectId Subject ID
   * @returns Learning materials
   */
  async getLearningMaterialsBySubject(subjectId: string) {
    try {
      // Check if subject exists
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found",
        });
      }

      // Find resources with subject code in tags
      const resources = await this.prisma.resource.findMany({
        where: {
          tags: {
            has: subject.code,
          },
          status: {
            not: SystemStatus.DELETED,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        resources,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get learning materials by subject",
        cause: error,
      });
    }
  }
} 