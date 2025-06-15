import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ServiceBase, type ServiceOptions } from "./service-base";
import { SystemStatus, PrismaClient } from "@prisma/client";

export class StudentService extends ServiceBase {
  constructor(options: ServiceOptions) {
    super(options);
  }

  /**
   * Get student enrollments for a specific campus
   * @param studentId Student ID
   * @param campusId Campus ID
   * @returns Student enrollments
   */
  async getStudentEnrollments(studentId: string, campusId: string) {
    try {
      // Get available programs for this campus that the student is not enrolled in
      const availablePrograms = await this.prisma.program.findMany({
        where: {
          campusOfferings: {
            some: {
              AND: [
                {
                  campusId,
                  status: SystemStatus.ACTIVE,
                },
                {
                  classes: {
                    none: {
                      students: {
                        some: {
                          studentId,
                          status: SystemStatus.ACTIVE,
                        }
                      }
                    }
                  }
                }
              ]
            }
          }
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      // Get active terms for this campus
      const activeTerms = await this.prisma.term.findMany({
        where: {
          // Use a join to find terms for this campus
          AND: [
            {
              id: {
                in: await this.prisma.term.findMany({
                  where: {
                    course: {
                      program: {
                        campusOfferings: {
                          some: {
                            campusId,
                          }
                        }
                      }
                    }
                  },
                  select: {
                    id: true,
                  },
                }).then((terms: { id: string }[]) => terms.map(t => t.id))
              }
            }
          ],
          status: SystemStatus.ACTIVE,
          endDate: {
            gte: new Date(),
          },
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
      });

      return {
        availablePrograms,
        activeTerms,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enroll a student to a campus program
   * @param data Enrollment data
   * @returns Enrollment details
   */
  async enrollStudentToCampus(data: {
    studentId: string;
    campusId: string;
    programId: string;
    termId: string;
  }) {
    try {
      // Find the class for this program, campus, and term
      const targetClass = await this.prisma.class.findFirst({
        where: {
          courseCampus: {
            programCampus: {
              programId: data.programId,
              campusId: data.campusId,
            }
          },
          termId: data.termId,
          status: SystemStatus.ACTIVE,
        },
      });

      if (!targetClass) {
        throw new Error("No active class found for the given program, campus, and term");
      }

      // Create student enrollment
      const enrollment = await this.prisma.studentEnrollment.create({
        data: {
          studentId: data.studentId,
          classId: targetClass.id,
          status: SystemStatus.ACTIVE,
          createdById: data.studentId, // Using student as creator for now
        },
      });

      return enrollment;
    } catch (error) {
      throw error;
    }
  }
} 