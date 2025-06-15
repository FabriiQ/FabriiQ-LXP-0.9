import { TRPCError } from "@trpc/server";
import { Prisma, SystemStatus, SubmissionStatus } from "@prisma/client";
import {
  CreateGradeBookInput,
  UpdateGradeBookInput,
  GradeBookFilters,
  CreateStudentGradeInput,
  UpdateStudentGradeInput,
  StudentGradeFilters,
  GradeServiceConfig
} from "../types/grade";

export class GradeService {
  constructor(private config: GradeServiceConfig) {}

  // GradeBook CRUD Operations
  async createGradeBook(input: CreateGradeBookInput) {
    const { prisma } = this.config;

    // Validate class
    const classData = await prisma.class.findUnique({
      where: { id: input.classId }
    });

    if (!classData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Class not found"
      });
    }

    // Check if a gradebook already exists for this class and term
    const existingGradebook = await prisma.gradeBook.findFirst({
      where: {
        classId: input.classId,
        termId: input.termId,
      }
    });

    if (existingGradebook) {
      console.log('Gradebook already exists for this class and term:', existingGradebook.id);
      return existingGradebook;
    }

    console.log('Creating new gradebook for class:', input.classId, 'with termId:', input.termId);

    // Create grade book
    const gradeBook = await prisma.gradeBook.create({
      data: {
        classId: input.classId,
        termId: input.termId,
        calculationRules: input.calculationRules as Prisma.InputJsonValue,
        createdById: input.createdById
      },
      include: {
        class: true,
        studentGrades: {
          include: {
            student: true
          }
        }
      }
    });

    // Initialize empty grades for existing activities
    try {
      // Get all students enrolled in the class
      const enrollments = await prisma.studentEnrollment.findMany({
        where: {
          classId: input.classId,
          status: 'ACTIVE',
        },
        select: {
          studentId: true,
        },
      });

      // Get all gradable activities for the class
      const activities = await prisma.activity.findMany({
        where: {
          classId: input.classId,
          isGradable: true,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      });

      // Initialize empty grades for all students and activities
      if (enrollments.length > 0 && activities.length > 0) {
        const gradeData = [];
        for (const enrollment of enrollments) {
          for (const activity of activities) {
            gradeData.push({
              studentId: enrollment.studentId,
              activityId: activity.id,
              score: null,
              status: SubmissionStatus.DRAFT,
            });
          }
        }

        // Bulk create the grade records if there are any to create
        if (gradeData.length > 0) {
          await prisma.activityGrade.createMany({
            data: gradeData,
            skipDuplicates: true,
          });
        }
      }
    } catch (error) {
      console.error('Error initializing grades for new gradebook:', error);
      // Don't throw here - the gradebook is created, we just couldn't initialize grades
    }

    return gradeBook;
  }

  async getGradeBook(id: string) {
    const { prisma } = this.config;

    const gradeBook = await prisma.gradeBook.findUnique({
      where: { id },
      include: {
        class: true,
        term: true,
        studentGrades: {
          include: {
            student: true
          }
        }
      }
    });

    if (!gradeBook) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Grade book not found"
      });
    }

    return gradeBook;
  }

  async updateGradeBook(id: string, input: UpdateGradeBookInput) {
    const { prisma } = this.config;

    // Validate grade book
    const existingGradeBook = await prisma.gradeBook.findUnique({
      where: { id }
    });

    if (!existingGradeBook) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Grade book not found"
      });
    }

    // Update grade book
    const gradeBook = await prisma.gradeBook.update({
      where: { id },
      data: {
        calculationRules: input.calculationRules as Prisma.InputJsonValue,
        updatedById: input.updatedById
      },
      include: {
        class: true,
        studentGrades: {
          include: {
            student: true
          }
        }
      }
    });

    return gradeBook;
  }

  async deleteGradeBook(id: string) {
    const { prisma } = this.config;
    return prisma.gradeBook.delete({ where: { id } });
  }

  async listGradeBooks(filters: GradeBookFilters, skip?: number, take?: number) {
    const { prisma } = this.config;
    const { classId, termId, search } = filters;

    const where: Prisma.GradeBookWhereInput = {};

    if (classId) {
      where.classId = classId;
    }

    if (termId) {
      where.termId = termId;
    }

    // Search in class name
    if (search) {
      where.class = {
        name: {
          contains: search,
          mode: "insensitive" as Prisma.QueryMode
        }
      };
    }

    const [total, items] = await Promise.all([
      prisma.gradeBook.count({ where }),
      prisma.gradeBook.findMany({
        where,
        include: {
          class: true,
          term: true,
          studentGrades: {
            include: {
              student: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take
      })
    ]);

    return {
      items,
      total,
      page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
      pageSize: take || 10,
      pageCount: Math.ceil(total / (take || 10))
    };
  }

  // StudentGrade CRUD Operations
  async createStudentGrade(input: CreateStudentGradeInput) {
    const { prisma } = this.config;

    // Validate grade book
    const gradeBook = await prisma.gradeBook.findUnique({
      where: { id: input.gradeBookId }
    });

    if (!gradeBook) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Grade book not found"
      });
    }

    // Validate student
    const student = await prisma.studentProfile.findUnique({
      where: { id: input.studentId }
    });

    if (!student) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student not found"
      });
    }

    // Check if student grade already exists
    const existingGrade = await prisma.studentGrade.findUnique({
      where: {
        gradeBookId_studentId: {
          gradeBookId: input.gradeBookId,
          studentId: input.studentId
        }
      }
    });

    if (existingGrade) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Student grade already exists"
      });
    }

    // Create student grade
    const studentGrade = await prisma.studentGrade.create({
      data: {
        gradeBookId: input.gradeBookId,
        studentId: input.studentId,
        assessmentGrades: input.assessmentGrades as Prisma.InputJsonValue,
        finalGrade: input.finalGrade,
        letterGrade: input.letterGrade,
        attendance: input.attendance,
        comments: input.comments,
        status: SystemStatus.ACTIVE
      },
      include: {
        gradeBook: {
          include: {
            class: true,
            term: true
          }
        },
        student: {
          include: {
            user: true
          }
        }
      }
    });

    return studentGrade;
  }

  async updateStudentGrade(id: string, input: UpdateStudentGradeInput) {
    const { prisma } = this.config;

    // Validate student grade
    const existingGrade = await prisma.studentGrade.findUnique({
      where: { id }
    });

    if (!existingGrade) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student grade not found"
      });
    }

    // Update student grade
    const studentGrade = await prisma.studentGrade.update({
      where: { id },
      data: {
        assessmentGrades: input.assessmentGrades as Prisma.InputJsonValue,
        finalGrade: input.finalGrade,
        letterGrade: input.letterGrade,
        attendance: input.attendance,
        comments: input.comments,
        status: input.status
      },
      include: {
        gradeBook: {
          include: {
            class: true,
            term: true
          }
        },
        student: {
          include: {
            user: true
          }
        }
      }
    });

    return studentGrade;
  }

  async listStudentGrades(filters: StudentGradeFilters, skip?: number, take?: number) {
    const { prisma } = this.config;
    const { gradeBookId, studentId, finalGrade, status } = filters;

    const where: Prisma.StudentGradeWhereInput = {};

    if (gradeBookId) {
      where.gradeBookId = gradeBookId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (finalGrade !== undefined) {
      where.finalGrade = finalGrade;
    }

    if (status) {
      where.status = status;
    }

    const [total, items] = await Promise.all([
      prisma.studentGrade.count({ where }),
      prisma.studentGrade.findMany({
        where,
        include: {
          gradeBook: {
            include: {
              class: true
            }
          },
          student: {
            include: {
              user: true
            }
          }
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take
      })
    ]);

    return {
      items,
      total,
      page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
      pageSize: take || 10,
      pageCount: Math.ceil(total / (take || 10))
    };
  }

  async getStudentGrade(id: string) {
    const { prisma } = this.config;

    const studentGrade = await prisma.studentGrade.findUnique({
      where: { id },
      include: {
        gradeBook: {
          include: {
            class: true,
            term: true
          }
        },
        student: {
          include: {
            user: true
          }
        }
      }
    });

    if (!studentGrade) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student grade not found"
      });
    }

    return studentGrade;
  }

  // Helper methods for calculating grades
  /**
   * Helper method to calculate overall score based on assessment and activity scores
   */
  private calculateOverallScore(assessmentScore: number, activityScore: number): number {
    // Default weightage: 70% for assessments, 30% for activities
    const assessmentWeight = 0.7;
    const activityWeight = 0.3;

    return (assessmentScore * assessmentWeight) + (activityScore * activityWeight);
  }

  /**
   * Helper method to calculate letter grade based on score
   */
  private calculateLetterGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}