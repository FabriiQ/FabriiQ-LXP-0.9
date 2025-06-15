/**
 * Assignment Service
 * Handles operations related to assignments and student submissions
 */

import { ActivityType, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Assignment creation schema
export const createAssignmentSchema = z.object({
  title: z.string().min(1).max(100),
  type: z.nativeEnum(ActivityType),
  subjectId: z.string(),
  classId: z.string(),
  content: z.record(z.any()),
  dueDate: z.date().optional(),
  maxScore: z.number().optional(),
  instructions: z.string().optional(),
  attachments: z.array(z.record(z.any())).optional(),
});

// Assignment update schema
export const updateAssignmentSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100).optional(),
  content: z.record(z.any()).optional(),
  dueDate: z.date().optional(),
  maxScore: z.number().optional(),
  instructions: z.string().optional(),
  attachments: z.array(z.record(z.any())).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Assignment submission schema
export const assignmentSubmissionSchema = z.object({
  activityId: z.string(),
  studentId: z.string(),
  content: z.record(z.any()),
  attachments: z.array(z.record(z.any())).optional(),
  comments: z.string().optional(),
});

// Assignment grading schema
export const assignmentGradingSchema = z.object({
  activityId: z.string(),
  studentId: z.string(),
  score: z.number(),
  feedback: z.string().optional(),
  comments: z.string().optional(),
});

export class AssignmentService extends ServiceBase {
  /**
   * Creates a new assignment
   * @param data Assignment data
   * @returns Created assignment
   */
  async createAssignment(data: z.infer<typeof createAssignmentSchema>) {
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

      // Check if class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: data.classId },
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Create the assignment
      const assignment = await this.prisma.activity.create({
        data: {
          title: data.title,
          type: data.type,
          subject: {
            connect: { id: data.subjectId },
          },
          class: {
            connect: { id: data.classId },
          },
          content: {
            ...data.content,
            dueDate: data.dueDate,
            maxScore: data.maxScore,
            instructions: data.instructions,
            attachments: data.attachments || [],
          },
          status: SystemStatus.ACTIVE,
        },
      });

      return {
        success: true,
        assignment,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create assignment",
        cause: error,
      });
    }
  }

  /**
   * Gets an assignment by ID
   * @param id Assignment ID
   * @returns Assignment
   */
  async getAssignment(id: string) {
    try {
      const assignment = await this.prisma.activity.findUnique({
        where: { id },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      return {
        success: true,
        assignment,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get assignment",
        cause: error,
      });
    }
  }

  /**
   * Updates an assignment
   * @param data Assignment update data
   * @returns Updated assignment
   */
  async updateAssignment(data: z.infer<typeof updateAssignmentSchema>) {
    try {
      // Check if assignment exists
      const existingAssignment = await this.prisma.activity.findUnique({
        where: { id: data.id },
      });

      if (!existingAssignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      // Update the assignment
      const assignment = await this.prisma.activity.update({
        where: { id: data.id },
        data: {
          title: data.title,
          content: data.content
            ? {
                ...(existingAssignment.content as Record<string, unknown>),
                ...data.content,
                dueDate: data.dueDate,
                maxScore: data.maxScore,
                instructions: data.instructions,
                attachments: data.attachments,
              }
            : undefined,
          status: data.status,
        },
      });

      return {
        success: true,
        assignment,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update assignment",
        cause: error,
      });
    }
  }

  /**
   * Deletes an assignment
   * @param id Assignment ID
   * @returns Success status
   */
  async deleteAssignment(id: string) {
    try {
      // Check if assignment exists
      const existingAssignment = await this.prisma.activity.findUnique({
        where: { id },
      });

      if (!existingAssignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      // Soft delete the assignment
      await this.prisma.activity.update({
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
        message: "Failed to delete assignment",
        cause: error,
      });
    }
  }

  /**
   * Gets assignments by class ID
   * @param classId Class ID
   * @returns Assignments
   */
  async getAssignmentsByClass(classId: string) {
    try {
      const assignments = await this.prisma.activity.findMany({
        where: {
          classId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        assignments,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get assignments by class",
        cause: error,
      });
    }
  }

  /**
   * Gets assignments by subject ID
   * @param subjectId Subject ID
   * @returns Assignments
   */
  async getAssignmentsBySubject(subjectId: string) {
    try {
      const assignments = await this.prisma.activity.findMany({
        where: {
          subjectId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        assignments,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get assignments by subject",
        cause: error,
      });
    }
  }

  /**
   * Submits an assignment
   * @param data Assignment submission data
   * @returns Submission status
   */
  async submitAssignment(data: z.infer<typeof assignmentSubmissionSchema>) {
    try {
      // Check if assignment exists
      const assignment = await this.prisma.activity.findUnique({
        where: { id: data.activityId },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      // Check if student exists
      const student = await this.prisma.studentProfile.findUnique({
        where: { id: data.studentId },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      // Check if student is enrolled in the class
      const enrollment = await this.prisma.studentEnrollment.findFirst({
        where: {
          studentId: data.studentId,
          classId: assignment.classId,
          status: SystemStatus.ACTIVE,
        },
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Student is not enrolled in this class",
        });
      }

      // Check if submission already exists
      let existingSubmissions = assignment.submissions as Record<string, any>[] || [];
      const existingSubmissionIndex = existingSubmissions.findIndex(
        (s) => s.studentId === data.studentId
      );

      if (existingSubmissionIndex !== -1) {
        // Update existing submission
        existingSubmissions[existingSubmissionIndex] = {
          ...existingSubmissions[existingSubmissionIndex],
          content: data.content,
          attachments: data.attachments || [],
          comments: data.comments,
          submittedAt: new Date(),
          status: "SUBMITTED",
        };
      } else {
        // Add new submission
        existingSubmissions.push({
          studentId: data.studentId,
          content: data.content,
          attachments: data.attachments || [],
          comments: data.comments,
          submittedAt: new Date(),
          status: "SUBMITTED",
        });
      }

      // Update the assignment with the new submission
      const updatedAssignment = await this.prisma.activity.update({
        where: { id: data.activityId },
        data: {
          submissions: existingSubmissions,
        },
      });

      return {
        success: true,
        submission: existingSubmissions.find((s) => s.studentId === data.studentId),
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to submit assignment",
        cause: error,
      });
    }
  }

  /**
   * Grades an assignment submission
   * @param data Assignment grading data
   * @returns Grading status
   */
  async gradeAssignment(data: z.infer<typeof assignmentGradingSchema>) {
    try {
      // Check if assignment exists
      const assignment = await this.prisma.activity.findUnique({
        where: { id: data.activityId },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      // Check if student exists
      const student = await this.prisma.studentProfile.findUnique({
        where: { id: data.studentId },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      // Check if submission exists
      let existingSubmissions = assignment.submissions as Record<string, any>[] || [];
      const existingSubmissionIndex = existingSubmissions.findIndex(
        (s) => s.studentId === data.studentId
      );

      if (existingSubmissionIndex === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      // Update submission with grade
      existingSubmissions[existingSubmissionIndex] = {
        ...existingSubmissions[existingSubmissionIndex],
        score: data.score,
        feedback: data.feedback,
        comments: data.comments,
        gradedAt: new Date(),
        status: "GRADED",
      };

      // Update the assignment with the graded submission
      const updatedAssignment = await this.prisma.activity.update({
        where: { id: data.activityId },
        data: {
          submissions: existingSubmissions,
        },
      });

      return {
        success: true,
        submission: existingSubmissions[existingSubmissionIndex],
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to grade assignment",
        cause: error,
      });
    }
  }

  /**
   * Gets a student's submission for an assignment
   * @param activityId Assignment ID
   * @param studentId Student ID
   * @returns Submission
   */
  async getStudentSubmission(activityId: string, studentId: string) {
    try {
      // Check if assignment exists
      const assignment = await this.prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      // Check if student exists
      const student = await this.prisma.studentProfile.findUnique({
        where: { id: studentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      // Find the student's submission
      const submissions = assignment.submissions as Record<string, any>[] || [];
      const submission = submissions.find((s) => s.studentId === studentId);

      return {
        success: true,
        assignment,
        student,
        submission,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get student submission",
        cause: error,
      });
    }
  }

  /**
   * Gets all submissions for an assignment
   * @param activityId Assignment ID
   * @returns Submissions
   */
  async getAssignmentSubmissions(activityId: string) {
    try {
      // Check if assignment exists
      const assignment = await this.prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      // Get all students enrolled in the class
      const enrollments = await this.prisma.studentEnrollment.findMany({
        where: {
          classId: assignment.classId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          student: {
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
      });

      // Get submissions
      const submissions = assignment.submissions as Record<string, any>[] || [];

      // Combine student info with submissions
      const submissionsWithStudentInfo = enrollments.map((enrollment) => {
        const submission = submissions.find((s) => s.studentId === enrollment.studentId);
        
        return {
          studentId: enrollment.studentId,
          studentName: enrollment.student.user.name || 'Unknown',
          studentEmail: enrollment.student.user.email || 'Unknown',
          submission: submission || null,
          status: submission ? submission.status : "NOT_SUBMITTED",
        };
      });

      return {
        success: true,
        assignment,
        submissions: submissionsWithStudentInfo,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get assignment submissions",
        cause: error,
      });
    }
  }
} 