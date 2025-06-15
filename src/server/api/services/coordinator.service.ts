/**
 * Coordinator Service
 * Handles operations related to campus coordinators
 */

import { SystemStatus, UserType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Program assignment schema
export const assignProgramSchema = z.object({
  coordinatorId: z.string(),
  programId: z.string(),
  campusId: z.string(),
  role: z.string().default("PROGRAM_COORDINATOR"),
  responsibilities: z.array(z.string()).optional(),
});

// Program coordinator data schema
export const programCoordinatorSchema = z.object({
  programId: z.string(),
  programName: z.string(),
  programCode: z.string(),
  campusId: z.string(),
  campusName: z.string(),
  role: z.string(),
  responsibilities: z.array(z.string()).optional(),
  assignedAt: z.date(),
});

// Course assignment schema
export const assignCourseSchema = z.object({
  coordinatorId: z.string(),
  courseId: z.string(),
  campusId: z.string(),
});

// Course coordinator data schema
export const courseCoordinatorSchema = z.object({
  courseId: z.string(),
  courseName: z.string(),
  courseCode: z.string(),
  campusId: z.string(),
  campusName: z.string(),
  courseCampusId: z.string(),
  programId: z.string(),
  programName: z.string(),
  classes: z.array(z.object({
    classId: z.string(),
    className: z.string(),
    classCode: z.string(),
    termId: z.string(),
    termName: z.string(),
    assignedAt: z.date(),
  })).optional(),
  assignedAt: z.date(),
});

// Class assignment schema
export const assignClassesSchema = z.object({
  coordinatorId: z.string(),
  courseId: z.string(),
  campusId: z.string(),
  classIds: z.array(z.string()),
});

export type ProgramCoordinatorData = z.infer<typeof programCoordinatorSchema>;
export type CourseCoordinatorData = z.infer<typeof courseCoordinatorSchema>;

export class CoordinatorService extends ServiceBase {
  /**
   * Assigns a program to a coordinator
   * @param data Assignment data
   * @returns Updated coordinator profile
   */
  async assignProgram(data: z.infer<typeof assignProgramSchema>) {
    try {
      // Check if coordinator exists
      const coordinator = await this.prisma.user.findUnique({
        where: {
          id: data.coordinatorId,
          OR: [
            { userType: UserType.CAMPUS_COORDINATOR },
            { userType: 'COORDINATOR' }
          ]
        },
        include: {
          coordinatorProfile: true
        }
      });

      if (!coordinator || !coordinator.coordinatorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coordinator not found",
        });
      }

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

      // Check if program is offered at the campus
      const programCampus = await this.prisma.programCampus.findUnique({
        where: {
          programId_campusId: {
            programId: data.programId,
            campusId: data.campusId,
          }
        },
      });

      if (!programCampus) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Program is not offered at this campus",
        });
      }

      // Get current managed programs
      const currentManagedPrograms = coordinator.coordinatorProfile.managedPrograms as ProgramCoordinatorData[] || [];
      const currentManagedCourses = coordinator.coordinatorProfile.managedCourses as CourseCoordinatorData[] || [];

      // Check if program is already assigned
      const existingAssignment = currentManagedPrograms.find(
        p => p.programId === data.programId && p.campusId === data.campusId
      );

      if (existingAssignment) {
        return {
          success: false,
          alreadyAssigned: true,
          message: "Program is already assigned to this coordinator",
          profile: coordinator.coordinatorProfile
        };
      }

      // Create new program assignment
      const newProgramAssignment: ProgramCoordinatorData = {
        programId: data.programId,
        programName: program.name,
        programCode: program.code,
        campusId: data.campusId,
        campusName: campus.name,
        role: data.role,
        responsibilities: data.responsibilities || [],
        assignedAt: new Date(),
      };

      // Find all courses in this program at this campus
      const courseCampuses = await this.prisma.courseCampus.findMany({
        where: {
          programCampus: {
            programId: data.programId,
            campusId: data.campusId
          }
        },
        include: {
          course: {
            include: {
              program: true
            }
          },
          classes: {
            include: {
              term: true
            }
          }
        }
      });

      // Create course assignments for all courses in the program
      const newCourseAssignments: CourseCoordinatorData[] = [];

      for (const courseCampus of courseCampuses) {
        // Skip if course is already assigned
        if (currentManagedCourses.some(c => c.courseId === courseCampus.courseId && c.campusId === data.campusId)) {
          continue;
        }

        const newCourseAssignment: CourseCoordinatorData = {
          courseId: courseCampus.courseId,
          courseName: courseCampus.course.name,
          courseCode: courseCampus.course.code,
          campusId: data.campusId,
          campusName: campus.name,
          courseCampusId: courseCampus.id,
          programId: data.programId,
          programName: program.name,
          classes: courseCampus.classes.map(cls => ({
            classId: cls.id,
            className: cls.name,
            classCode: cls.code,
            termId: cls.termId,
            termName: cls.term.name,
            assignedAt: new Date()
          })),
          assignedAt: new Date(),
        };

        newCourseAssignments.push(newCourseAssignment);
      }

      // Update coordinator profile with program and courses
      const updatedProfile = await this.prisma.coordinatorProfile.update({
        where: { id: coordinator.coordinatorProfile.id },
        data: {
          managedPrograms: [...currentManagedPrograms, newProgramAssignment],
          managedCourses: [...currentManagedCourses, ...newCourseAssignments],
        },
      });

      return {
        success: true,
        profile: updatedProfile,
        coursesAssigned: newCourseAssignments.length
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to assign program to coordinator",
        cause: error,
      });
    }
  }

  /**
   * Unassigns a program from a coordinator
   * @param coordinatorId Coordinator ID
   * @param programId Program ID
   * @param campusId Campus ID
   * @returns Updated coordinator profile
   */
  async unassignProgram(coordinatorId: string, programId: string, campusId: string) {
    try {
      // Check if coordinator exists
      const coordinator = await this.prisma.user.findUnique({
        where: {
          id: coordinatorId,
          userType: UserType.CAMPUS_COORDINATOR
        },
        include: {
          coordinatorProfile: true
        }
      });

      if (!coordinator || !coordinator.coordinatorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coordinator not found",
        });
      }

      // Get current managed programs
      const currentManagedPrograms = coordinator.coordinatorProfile.managedPrograms as ProgramCoordinatorData[];

      // Check if program is assigned
      const existingAssignmentIndex = currentManagedPrograms.findIndex(
        p => p.programId === programId && p.campusId === campusId
      );

      if (existingAssignmentIndex === -1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Program is not assigned to this coordinator",
        });
      }

      // Remove program assignment
      const updatedManagedPrograms = [...currentManagedPrograms];
      updatedManagedPrograms.splice(existingAssignmentIndex, 1);

      // Update coordinator profile
      const updatedProfile = await this.prisma.coordinatorProfile.update({
        where: { id: coordinator.coordinatorProfile.id },
        data: {
          managedPrograms: updatedManagedPrograms,
        },
      });

      return {
        success: true,
        profile: updatedProfile,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to unassign program from coordinator",
        cause: error,
      });
    }
  }

  /**
   * Gets programs assigned to a coordinator
   * @param coordinatorId Coordinator ID
   * @returns Programs assigned to the coordinator
   */
  async getAssignedPrograms(coordinatorId: string) {
    try {
      // Check if coordinator exists
      const coordinator = await this.prisma.user.findUnique({
        where: {
          id: coordinatorId,
          userType: UserType.CAMPUS_COORDINATOR
        },
        include: {
          coordinatorProfile: true
        }
      });

      if (!coordinator || !coordinator.coordinatorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coordinator not found",
        });
      }

      // Get managed programs
      const managedPrograms = coordinator.coordinatorProfile.managedPrograms as ProgramCoordinatorData[];

      // Get full program details
      const programIds = managedPrograms.map(p => p.programId);

      const programs = await this.prisma.program.findMany({
        where: {
          id: {
            in: programIds
          },
          status: SystemStatus.ACTIVE
        },
        include: {
          campusOfferings: {
            include: {
              campus: true
            }
          },
          _count: {
            select: {
              courses: true
            }
          }
        }
      });

      // Combine program details with coordinator assignment data
      const enrichedPrograms = programs.map(program => {
        const assignments = managedPrograms.filter(p => p.programId === program.id);

        return {
          ...program,
          coordinatorAssignments: assignments
        };
      });

      return {
        success: true,
        programs: enrichedPrograms,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get assigned programs",
        cause: error,
      });
    }
  }

  /**
   * Gets program details with coordinator-specific information
   * @param coordinatorId Coordinator ID
   * @param programId Program ID
   * @returns Program details with coordinator-specific information
   */
  async getCoordinatorProgramDetails(coordinatorId: string, programId: string) {
    try {
      // Check if coordinator exists
      const coordinator = await this.prisma.user.findUnique({
        where: {
          id: coordinatorId,
          userType: UserType.CAMPUS_COORDINATOR
        },
        include: {
          coordinatorProfile: true
        }
      });

      if (!coordinator || !coordinator.coordinatorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coordinator not found",
        });
      }

      // Get managed programs
      const managedPrograms = coordinator.coordinatorProfile.managedPrograms as ProgramCoordinatorData[];

      // Check if program is assigned to coordinator
      const programAssignments = managedPrograms.filter(p => p.programId === programId);

      if (programAssignments.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Program is not assigned to this coordinator",
        });
      }

      // Get program details
      const program = await this.prisma.program.findUnique({
        where: {
          id: programId,
          status: SystemStatus.ACTIVE
        },
        include: {
          campusOfferings: {
            include: {
              campus: true
            }
          },
          courses: {
            where: {
              status: SystemStatus.ACTIVE
            },
            include: {
              campusOfferings: true
            }
          }
        }
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Get campuses where the coordinator is assigned to this program
      const assignedCampusIds = programAssignments.map(a => a.campusId);

      // Filter program data to only include assigned campuses
      const filteredCampusOfferings = program.campusOfferings.filter(
        offering => assignedCampusIds.includes(offering.campusId)
      );

      // Get student enrollment counts for this program at assigned campuses
      // Using 'as any' to avoid TypeScript circular reference errors
      const studentCounts = await (this.prisma.studentEnrollment.groupBy as any)({
        by: ['programCampusId'],
        where: {
          programCampus: {
            programId,
            campusId: {
              in: assignedCampusIds
            }
          },
          status: SystemStatus.ACTIVE
        },
        _count: {
          id: true
        }
      });

      // Create a map of campus ID to student count
      const studentCountMap = studentCounts.reduce((map: Record<string, number>, item: any) => {
        map[item.programCampusId] = item._count.id;
        return map;
      }, {} as Record<string, number>);

      return {
        success: true,
        program: {
          ...program,
          campusOfferings: filteredCampusOfferings,
          coordinatorAssignments: programAssignments,
          studentCounts: studentCountMap
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get program details",
        cause: error,
      });
    }
  }

  /**
   * Assigns a course to a coordinator
   * @param data Assignment data
   * @returns Updated coordinator profile
   */
  async assignCourse(data: z.infer<typeof assignCourseSchema>) {
    try {
      // Check if coordinator exists
      const coordinator = await this.prisma.user.findUnique({
        where: {
          id: data.coordinatorId,
          OR: [
            { userType: UserType.CAMPUS_COORDINATOR },
            { userType: 'COORDINATOR' }
          ]
        },
        include: {
          coordinatorProfile: true
        }
      });

      if (!coordinator || !coordinator.coordinatorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coordinator not found",
        });
      }

      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id: data.courseId },
        include: {
          program: true
        }
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

      // Check if course is offered at the campus
      const courseCampus = await this.prisma.courseCampus.findFirst({
        where: {
          courseId: data.courseId,
          campusId: data.campusId,
        },
      });

      if (!courseCampus) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Course is not offered at this campus",
        });
      }

      // Get current managed courses
      const currentManagedCourses = coordinator.coordinatorProfile.managedCourses as CourseCoordinatorData[] || [];

      // Check if course is already assigned
      const existingAssignment = currentManagedCourses.find(
        c => c.courseId === data.courseId && c.campusId === data.campusId
      );

      if (existingAssignment) {
        return {
          success: false,
          alreadyAssigned: true,
          message: "Course is already assigned to this coordinator",
          profile: coordinator.coordinatorProfile
        };
      }

      // Create new course assignment
      const newCourseAssignment: CourseCoordinatorData = {
        courseId: data.courseId,
        courseName: course.name,
        courseCode: course.code,
        campusId: data.campusId,
        campusName: campus.name,
        courseCampusId: courseCampus.id,
        programId: course.programId,
        programName: course.program.name,
        classes: [],
        assignedAt: new Date(),
      };

      // Find all classes for this course at this campus
      const classes = await this.prisma.class.findMany({
        where: {
          courseCampus: {
            courseId: data.courseId,
            campusId: data.campusId
          }
        },
        include: {
          term: true
        }
      });

      // Add classes to the course assignment
      if (classes.length > 0) {
        newCourseAssignment.classes = classes.map(cls => ({
          classId: cls.id,
          className: cls.name,
          classCode: cls.code,
          termId: cls.termId,
          termName: cls.term.name,
          assignedAt: new Date()
        }));
      }

      // Update coordinator profile
      const updatedProfile = await this.prisma.coordinatorProfile.update({
        where: { id: coordinator.coordinatorProfile.id },
        data: {
          managedCourses: [...currentManagedCourses, newCourseAssignment],
        },
      });

      return {
        success: true,
        profile: updatedProfile,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to assign course to coordinator",
        cause: error,
      });
    }
  }

  /**
   * Unassigns a course from a coordinator
   * @param coordinatorId Coordinator ID
   * @param courseId Course ID
   * @param campusId Campus ID
   * @returns Updated coordinator profile
   */
  async unassignCourse(coordinatorId: string, courseId: string, campusId: string) {
    try {
      // Check if coordinator exists
      const coordinator = await this.prisma.user.findUnique({
        where: {
          id: coordinatorId,
          userType: UserType.CAMPUS_COORDINATOR
        },
        include: {
          coordinatorProfile: true
        }
      });

      if (!coordinator || !coordinator.coordinatorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coordinator not found",
        });
      }

      // Get current managed courses
      const currentManagedCourses = coordinator.coordinatorProfile.managedCourses as CourseCoordinatorData[];

      // Check if course is assigned
      const existingAssignmentIndex = currentManagedCourses.findIndex(
        c => c.courseId === courseId && c.campusId === campusId
      );

      if (existingAssignmentIndex === -1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Course is not assigned to this coordinator",
        });
      }

      // Remove course assignment
      const updatedManagedCourses = [...currentManagedCourses];
      updatedManagedCourses.splice(existingAssignmentIndex, 1);

      // Update coordinator profile
      const updatedProfile = await this.prisma.coordinatorProfile.update({
        where: { id: coordinator.coordinatorProfile.id },
        data: {
          managedCourses: updatedManagedCourses,
        },
      });

      return {
        success: true,
        profile: updatedProfile,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to unassign course from coordinator",
        cause: error,
      });
    }
  }

  /**
   * Assigns classes to a coordinator
   * @param data Assignment data
   * @returns Updated coordinator profile
   */
  async assignClasses(data: z.infer<typeof assignClassesSchema>) {
    try {
      // Check if coordinator exists
      const coordinator = await this.prisma.user.findUnique({
        where: {
          id: data.coordinatorId,
          OR: [
            { userType: UserType.CAMPUS_COORDINATOR },
            { userType: 'COORDINATOR' }
          ]
        },
        include: {
          coordinatorProfile: true
        }
      });

      if (!coordinator || !coordinator.coordinatorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coordinator not found",
        });
      }

      // Get current managed courses
      const currentManagedCourses = coordinator.coordinatorProfile.managedCourses as CourseCoordinatorData[] || [];

      console.log('Coordinator managed courses:', currentManagedCourses);
      console.log('Looking for courseId:', data.courseId, 'campusId:', data.campusId);

      // Check if course is assigned
      const courseAssignmentIndex = currentManagedCourses.findIndex(
        c => c.courseId === data.courseId && c.campusId === data.campusId
      );

      if (courseAssignmentIndex === -1) {
        // Try to find the course by courseId only (in case campusId is wrong)
        const courseByIdOnly = currentManagedCourses.find(c => c.courseId === data.courseId);

        if (courseByIdOnly) {
          // Course found but campus doesn't match
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Course is assigned to a different campus (${courseByIdOnly.campusName})`,
          });
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Course is not assigned to this coordinator",
          });
        }
      }

      // Get classes to assign
      const classes = await this.prisma.class.findMany({
        where: {
          id: { in: data.classIds },
          courseCampus: {
            courseId: data.courseId,
            campusId: data.campusId
          }
        },
        include: {
          term: true
        }
      });

      if (classes.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No valid classes found",
        });
      }

      // Update the course assignment with the new classes
      const courseAssignment = currentManagedCourses[courseAssignmentIndex];
      const currentClasses = courseAssignment.classes || [];

      // Add new classes that aren't already assigned
      const newClasses = classes.filter(cls =>
        !currentClasses.some(c => c.classId === cls.id)
      ).map(cls => ({
        classId: cls.id,
        className: cls.name,
        classCode: cls.code,
        termId: cls.termId,
        termName: cls.term.name,
        assignedAt: new Date()
      }));

      if (newClasses.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All selected classes are already assigned to this coordinator",
        });
      }

      // Update the course assignment
      courseAssignment.classes = [...currentClasses, ...newClasses];
      currentManagedCourses[courseAssignmentIndex] = courseAssignment;

      // Update coordinator profile
      const updatedProfile = await this.prisma.coordinatorProfile.update({
        where: { id: coordinator.coordinatorProfile.id },
        data: {
          managedCourses: currentManagedCourses,
        },
      });

      return {
        success: true,
        profile: updatedProfile,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to assign classes to coordinator",
        cause: error,
      });
    }
  }

  /**
   * Unassigns a class from a coordinator
   * @param coordinatorId Coordinator ID
   * @param classId Class ID
   * @param courseId Course ID
   * @param campusId Campus ID
   * @returns Updated coordinator profile
   */
  async unassignClass(coordinatorId: string, classId: string, courseId: string, campusId: string) {
    try {
      // Check if coordinator exists
      const coordinator = await this.prisma.user.findUnique({
        where: {
          id: coordinatorId,
          userType: UserType.CAMPUS_COORDINATOR
        },
        include: {
          coordinatorProfile: true
        }
      });

      if (!coordinator || !coordinator.coordinatorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coordinator not found",
        });
      }

      // Get current managed courses
      const currentManagedCourses = coordinator.coordinatorProfile.managedCourses as CourseCoordinatorData[];

      // Check if course is assigned
      const courseAssignmentIndex = currentManagedCourses.findIndex(
        c => c.courseId === courseId && c.campusId === campusId
      );

      if (courseAssignmentIndex === -1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Course is not assigned to this coordinator",
        });
      }

      // Get the course assignment
      const courseAssignment = currentManagedCourses[courseAssignmentIndex];
      const currentClasses = courseAssignment.classes || [];

      // Check if class is assigned
      const classIndex = currentClasses.findIndex(c => c.classId === classId);

      if (classIndex === -1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Class is not assigned to this coordinator",
        });
      }

      // Remove the class
      currentClasses.splice(classIndex, 1);
      courseAssignment.classes = currentClasses;
      currentManagedCourses[courseAssignmentIndex] = courseAssignment;

      // Update coordinator profile
      const updatedProfile = await this.prisma.coordinatorProfile.update({
        where: { id: coordinator.coordinatorProfile.id },
        data: {
          managedCourses: currentManagedCourses,
        },
      });

      return {
        success: true,
        profile: updatedProfile,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to unassign class from coordinator",
        cause: error,
      });
    }
  }
}
