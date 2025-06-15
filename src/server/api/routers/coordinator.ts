import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, UserType } from "@prisma/client";
import {
  CoordinatorService,
  assignProgramSchema,
  assignCourseSchema,
  assignClassesSchema
} from "../services/coordinator.service";

export const coordinatorRouter = createTRPCRouter({
  // Get students for coordinator's managed programs
  getStudents: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      programId: z.string().optional(),
      campusId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a coordinator
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userType: true,
          coordinatorProfile: true
        }
      });

      if (!user || (user.userType !== UserType.CAMPUS_COORDINATOR && user.userType !== UserType.COORDINATOR) || !user.coordinatorProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a coordinator",
        });
      }

      // Get managed programs
      const managedPrograms = user.coordinatorProfile.managedPrograms as any[];

      if (managedPrograms.length === 0) {
        return {
          success: true,
          students: []
        };
      }

      // Filter by program ID if provided
      let programIds = [...new Set(managedPrograms.map(p => p.programId))];
      if (input.programId) {
        programIds = programIds.filter(id => id === input.programId);
      }

      // Get courses for these programs
      const courses = await ctx.prisma.course.findMany({
        where: {
          programId: { in: programIds },
          status: SystemStatus.ACTIVE
        },
        select: {
          id: true,
          name: true,
          programId: true,
          program: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      const courseIds = courses.map(c => c.id);

      // Get course campuses for these courses and the specified campus
      const courseCampuses = await ctx.prisma.courseCampus.findMany({
        where: {
          courseId: { in: courseIds },
          campusId: input.campusId,
          status: SystemStatus.ACTIVE
        },
        select: {
          id: true,
          courseId: true
        }
      });

      const courseCampusIds = courseCampuses.map(cc => cc.id);

      // Get classes for these course campuses
      const classes = await ctx.prisma.class.findMany({
        where: {
          courseCampusId: { in: courseCampusIds },
          status: SystemStatus.ACTIVE
        },
        select: {
          id: true,
          courseCampusId: true
        }
      });

      const classIds = classes.map(c => c.id);

      // Get student enrollments for these classes
      const enrollments = await ctx.prisma.studentEnrollment.findMany({
        where: {
          classId: { in: classIds },
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
                  phoneNumber: true,
                  status: true
                }
              },
              grades: {
                take: 1,
                orderBy: {
                  updatedAt: 'desc'
                }
              }
            }
          },
          class: {
            include: {
              courseCampus: {
                include: {
                  course: {
                    include: {
                      program: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Get unique students
      const studentMap = new Map();

      enrollments.forEach(enrollment => {
        const student = enrollment.student;
        if (!student || !student.user) return;

        // Skip if already processed this student
        if (studentMap.has(student.id)) return;

        // Get program and course info
        const programName = enrollment.class?.courseCampus?.course?.program?.name;
        const courseName = enrollment.class?.courseCampus?.course?.name;

        // Get latest grade info
        const latestGrade = student.grades[0];
        const academicScore = latestGrade?.finalGrade;

        // Create student object
        studentMap.set(student.id, {
          id: student.id,
          userId: student.userId,
          name: student.user.name || 'Unnamed',
          email: student.user.email || '',
          phone: student.user.phoneNumber || '',
          enrollmentNumber: student.enrollmentNumber,
          currentGrade: student.currentGrade,
          academicScore: student.academicScore || academicScore,
          attendanceRate: student.attendanceRate,
          participationRate: student.participationRate,
          classCount: 0, // Will be incremented below
          programName,
          courseName,
          // Mock leaderboard data for now
          leaderboardPosition: Math.floor(Math.random() * 50) + 1,
          leaderboardChange: Math.floor(Math.random() * 10) - 5
        });
      });

      // Count classes for each student
      enrollments.forEach(enrollment => {
        const studentId = enrollment.studentId;
        if (studentMap.has(studentId)) {
          const student = studentMap.get(studentId);
          student.classCount += 1;
          studentMap.set(studentId, student);
        }
      });

      // Convert to array and filter by search if provided
      let students = Array.from(studentMap.values());

      if (input.search) {
        const search = input.search.toLowerCase();
        students = students.filter(student =>
          student.name.toLowerCase().includes(search) ||
          student.email.toLowerCase().includes(search) ||
          student.enrollmentNumber.toLowerCase().includes(search)
        );
      }

      return {
        success: true,
        students
      };
    }),
  // Get teachers for coordinator's managed programs
  getTeachers: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      campusId: z.string().optional(),
      programId: z.string().optional(),
      courseId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a coordinator
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userType: true,
          coordinatorProfile: true
        }
      });

      // Allow coordinator and admin users
      if (!user ||
          (user.userType !== UserType.CAMPUS_COORDINATOR &&
           user.userType !== UserType.COORDINATOR &&
           user.userType !== UserType.SYSTEM_ADMIN &&
           user.userType !== UserType.CAMPUS_ADMIN) ||
          (!user.coordinatorProfile &&
           user.userType !== UserType.SYSTEM_ADMIN &&
           user.userType !== UserType.CAMPUS_ADMIN)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a coordinator or admin",
        });
      }

      // For admin users, we don't need to check for coordinator profile
      const isAdmin = user.userType === UserType.SYSTEM_ADMIN || user.userType === UserType.CAMPUS_ADMIN;

      // For admin users, return all teachers if no coordinator profile
      if (isAdmin && !user.coordinatorProfile) {
        // Get all teachers for admin users
        const teacherProfiles = await ctx.prisma.teacherProfile.findMany({
          where: input.campusId ? {
            user: {
              activeCampuses: {
                some: {
                  campusId: input.campusId,
                  status: SystemStatus.ACTIVE
                }
              }
            }
          } : undefined,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                status: true,
                userType: true
              }
            },
            subjectQualifications: {
              include: {
                subject: true
              }
            },
            assignments: {
              where: {
                status: SystemStatus.ACTIVE
              },
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

        // Filter by search if provided
        let filteredTeachers = teacherProfiles;
        if (input.search) {
          const search = input.search.toLowerCase();
          filteredTeachers = teacherProfiles.filter(teacher =>
            teacher.user.name?.toLowerCase().includes(search) ||
            teacher.user.email?.toLowerCase().includes(search) ||
            teacher.specialization?.toLowerCase().includes(search)
          );
        }

        // Format teacher data
        const formattedTeachers = filteredTeachers.map(teacher => ({
          id: teacher.id,
          userId: teacher.userId,
          name: teacher.user.name || 'Unnamed',
          email: teacher.user.email || '',
          phone: teacher.user.phoneNumber || '',
          status: teacher.user.status,
          specialization: teacher.specialization || 'General Teacher',
          classCount: teacher.assignments.length,
          subjectCount: teacher.subjectQualifications.length,
          assignments: teacher.assignments
        }));

        return {
          success: true,
          teachers: formattedTeachers
        };
      }

      // For coordinators, get managed programs
      const managedPrograms = user.coordinatorProfile?.managedPrograms as any[] || [];

      if (managedPrograms.length === 0) {
        return {
          success: true,
          teachers: []
        };
      }

      // Get program IDs and campus IDs from managed programs
      let programIds = [...new Set(managedPrograms.map(p => p.programId))];

      // Filter by programId if provided
      if (input.programId) {
        programIds = programIds.filter(id => id === input.programId);
      }

      // Filter by campus if provided
      const campusIds = input.campusId
        ? [input.campusId]
        : [...new Set(managedPrograms.map(p => p.campusId))];

      // Get courses for these programs
      const courses = await ctx.prisma.course.findMany({
        where: {
          programId: { in: programIds },
          status: SystemStatus.ACTIVE
        },
        select: { id: true }
      });

      // Filter by courseId if provided
      let courseIds = courses.map(c => c.id);
      if (input.courseId) {
        courseIds = courseIds.filter(id => id === input.courseId);
      }

      // Get course campuses for these courses and campuses
      const courseCampuses = await ctx.prisma.courseCampus.findMany({
        where: {
          courseId: { in: courseIds },
          campusId: { in: campusIds },
          status: SystemStatus.ACTIVE
        },
        select: { id: true }
      });

      const courseCampusIds = courseCampuses.map(cc => cc.id);

      // Get classes for these course campuses
      const classes = await ctx.prisma.class.findMany({
        where: {
          courseCampusId: { in: courseCampusIds },
          status: SystemStatus.ACTIVE
        },
        select: {
          id: true,
          classTeacherId: true,
          courseCampusId: true
        }
      });

      // Get teacher assignments for these classes
      const teacherAssignments = await ctx.prisma.teacherAssignment.findMany({
        where: {
          classId: { in: classes.map(c => c.id) },
          status: SystemStatus.ACTIVE
        },
        select: {
          teacherId: true,
          classId: true
        }
      });

      // Get unique teacher IDs (both class teachers and assigned teachers)
      const teacherIds = new Set<string>();

      // Add class teachers
      classes.forEach(c => {
        if (c.classTeacherId) {
          teacherIds.add(c.classTeacherId);
        }
      });

      // Add assigned teachers
      teacherAssignments.forEach(ta => {
        teacherIds.add(ta.teacherId);
      });

      // Get teacher profiles
      const teacherProfiles = await ctx.prisma.teacherProfile.findMany({
        where: {
          id: { in: Array.from(teacherIds) }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              status: true,
              userType: true
            }
          },
          subjectQualifications: {
            include: {
              subject: true
            }
          },
          assignments: {
            where: {
              status: SystemStatus.ACTIVE,
              class: {
                courseCampusId: { in: courseCampusIds }
              }
            },
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

      // Filter by search if provided
      let filteredTeachers = teacherProfiles;
      if (input.search) {
        const search = input.search.toLowerCase();
        filteredTeachers = teacherProfiles.filter(teacher =>
          teacher.user.name?.toLowerCase().includes(search) ||
          teacher.user.email?.toLowerCase().includes(search) ||
          teacher.specialization?.toLowerCase().includes(search)
        );
      }

      // Count classes for each teacher (both as class teacher and assigned teacher)
      const teacherClassCounts = new Map<string, number>();

      // Count classes where teacher is the class teacher
      classes.forEach(c => {
        if (c.classTeacherId) {
          teacherClassCounts.set(
            c.classTeacherId,
            (teacherClassCounts.get(c.classTeacherId) || 0) + 1
          );
        }
      });

      // Count classes where teacher is assigned
      teacherAssignments.forEach(ta => {
        teacherClassCounts.set(
          ta.teacherId,
          (teacherClassCounts.get(ta.teacherId) || 0) + 1
        );
      });

      // Format teacher data
      const formattedTeachers = filteredTeachers.map(teacher => ({
        id: teacher.id,
        userId: teacher.userId,
        name: teacher.user.name || 'Unnamed',
        email: teacher.user.email || '',
        phone: teacher.user.phoneNumber || '',
        status: teacher.user.status,
        specialization: teacher.specialization || 'General Teacher',
        classCount: teacherClassCounts.get(teacher.id) || 0,
        subjectCount: teacher.subjectQualifications.length,
        assignments: teacher.assignments
      }));

      return {
        success: true,
        teachers: formattedTeachers
      };
    }),
  // Get programs assigned to the current coordinator
  getAssignedPrograms: protectedProcedure
    .query(async ({ ctx }) => {
      // Ensure user is authenticated and is a coordinator
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user || (user.userType !== UserType.CAMPUS_COORDINATOR && user.userType !== UserType.COORDINATOR)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a coordinator",
        });
      }

      const coordinatorService = new CoordinatorService({ prisma: ctx.prisma });
      return coordinatorService.getAssignedPrograms(ctx.session.user.id);
    }),

  // Get program details with coordinator-specific information
  getProgramDetails: protectedProcedure
    .input(z.object({
      programId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a coordinator
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user || (user.userType !== UserType.CAMPUS_COORDINATOR && user.userType !== UserType.COORDINATOR)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a coordinator",
        });
      }

      const coordinatorService = new CoordinatorService({ prisma: ctx.prisma });
      return coordinatorService.getCoordinatorProgramDetails(ctx.session.user.id, input.programId);
    }),

  // Get program courses
  getProgramCourses: protectedProcedure
    .input(z.object({
      programId: z.string(),
      campusId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a coordinator
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userType: true,
          coordinatorProfile: true
        }
      });

      if (!user || (user.userType !== UserType.CAMPUS_COORDINATOR && user.userType !== UserType.COORDINATOR) || !user.coordinatorProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a coordinator",
        });
      }

      // Check if program is assigned to coordinator
      const managedPrograms = user.coordinatorProfile.managedPrograms as any[] || [];

      // For system admins or campus admins, bypass the assignment check
      const isAdmin = user.userType === UserType.SYSTEM_ADMIN || user.userType === UserType.CAMPUS_ADMIN;

      if (!isAdmin) {
        const isAssigned = managedPrograms.some(p =>
          p.programId === input.programId &&
          (!input.campusId || p.campusId === input.campusId)
        );

        if (!isAssigned) {
          // Check if the user has any managed programs at all
          if (managedPrograms.length === 0) {
            // If no managed programs, allow access to any program
            console.log("Coordinator has no managed programs, allowing access");
          } else {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Program is not assigned to this coordinator",
            });
          }
        }
      }

      // Get program courses
      const whereClause: any = {
        programId: input.programId,
        status: SystemStatus.ACTIVE
      };

      const courses = await ctx.prisma.course.findMany({
        where: whereClause,
        include: {
          campusOfferings: input.campusId ? {
            where: {
              campusId: input.campusId
            },
            include: {
              campus: true
            }
          } : {
            include: {
              campus: true
            }
          },
          _count: {
            select: {
              subjects: true
            }
          }
        },
        orderBy: [
          { level: 'asc' },
          { code: 'asc' }
        ]
      });

      return {
        success: true,
        courses
      };
    }),

  // Get program students
  getProgramStudents: protectedProcedure
    .input(z.object({
      programId: z.string(),
      campusId: z.string().optional(),
      search: z.string().optional(),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(10),
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a coordinator
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userType: true,
          coordinatorProfile: true
        }
      });

      if (!user || user.userType !== UserType.CAMPUS_COORDINATOR || !user.coordinatorProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a coordinator",
        });
      }

      // Check if program is assigned to coordinator
      const managedPrograms = user.coordinatorProfile.managedPrograms as any[];
      const isAssigned = managedPrograms.some(p =>
        p.programId === input.programId &&
        (!input.campusId || p.campusId === input.campusId)
      );

      if (!isAssigned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Program is not assigned to this coordinator",
        });
      }

      // Get program campus IDs
      let programCampusIds: string[] = [];

      if (input.campusId) {
        const programCampus = await ctx.prisma.programCampus.findUnique({
          where: {
            programId_campusId: {
              programId: input.programId,
              campusId: input.campusId
            }
          },
          select: { id: true }
        });

        if (programCampus) {
          programCampusIds = [programCampus.id];
        }
      } else {
        // Get all program campus IDs for campuses assigned to this coordinator
        const assignedCampusIds = managedPrograms
          .filter(p => p.programId === input.programId)
          .map(p => p.campusId);

        const programCampuses = await ctx.prisma.programCampus.findMany({
          where: {
            programId: input.programId,
            campusId: {
              in: assignedCampusIds
            }
          },
          select: { id: true }
        });

        programCampusIds = programCampuses.map(pc => pc.id);
      }

      if (programCampusIds.length === 0) {
        return {
          success: true,
          total: 0,
          students: []
        };
      }

      // We'll build the search condition directly in the whereClause

      // Get students enrolled in the program
      const skip = (input.page - 1) * input.pageSize;

      // Build where clause for student enrollments
      const whereClause: any = {
        status: SystemStatus.ACTIVE,
      };

      // Add program campus IDs condition
      if (programCampusIds.length > 0) {
        whereClause.programCampus = {
          id: {
            in: programCampusIds
          }
        };
      }

      // Add search condition if provided
      if (input.search) {
        whereClause.OR = [
          { student: { user: { name: { contains: input.search, mode: 'insensitive' as const } } } },
          { student: { user: { email: { contains: input.search, mode: 'insensitive' as const } } } },
          { student: { enrollmentNumber: { contains: input.search, mode: 'insensitive' as const } } }
        ];
      }

      const [total, students] = await Promise.all([
        ctx.prisma.studentEnrollment.count({
          where: whereClause
        }),
        ctx.prisma.studentEnrollment.findMany({
          where: whereClause,
          include: {
            student: {
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
            // Include program and campus information through a different path
            class: {
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
            }
          },
          skip,
          take: input.pageSize,
          orderBy: { createdAt: 'desc' }
        })
      ]);

      return {
        success: true,
        total,
        students
      };
    }),

  // Admin: Assign program to coordinator
  assignProgram: protectedProcedure
    .input(assignProgramSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is an admin
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user || (user.userType !== UserType.SYSTEM_ADMIN && user.userType !== UserType.CAMPUS_ADMIN)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not have permission to assign programs",
        });
      }

      const coordinatorService = new CoordinatorService({ prisma: ctx.prisma });
      return coordinatorService.assignProgram(input);
    }),

  // Admin: Unassign program from coordinator
  unassignProgram: protectedProcedure
    .input(z.object({
      coordinatorId: z.string(),
      programId: z.string(),
      campusId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is an admin
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user || (user.userType !== UserType.SYSTEM_ADMIN && user.userType !== UserType.CAMPUS_ADMIN)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not have permission to unassign programs",
        });
      }

      const coordinatorService = new CoordinatorService({ prisma: ctx.prisma });
      return coordinatorService.unassignProgram(input.coordinatorId, input.programId, input.campusId);
    }),

  // Get classes assigned to the current coordinator
  getAssignedClasses: protectedProcedure
    .input(z.object({
      campusId: z.string().optional(),
      search: z.string().optional(),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(10),
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a coordinator
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userType: true,
          coordinatorProfile: true
        }
      });

      if (!user || user.userType !== UserType.CAMPUS_COORDINATOR || !user.coordinatorProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a coordinator",
        });
      }

      // Get managed programs
      const managedPrograms = user.coordinatorProfile.managedPrograms as any[];

      if (managedPrograms.length === 0) {
        return {
          success: true,
          classes: []
        };
      }

      // Get program IDs and campus IDs from managed programs
      const programIds = [...new Set(managedPrograms.map(p => p.programId))];

      // Filter by campus if provided
      const campusIds = input.campusId
        ? [input.campusId]
        : [...new Set(managedPrograms.map(p => p.campusId))];

      // Get courses for these programs
      const courses = await ctx.prisma.course.findMany({
        where: {
          programId: { in: programIds },
          status: SystemStatus.ACTIVE
        },
        select: { id: true }
      });

      const courseIds = courses.map(c => c.id);

      if (courseIds.length === 0) {
        return {
          success: true,
          classes: []
        };
      }

      // Get course campus offerings
      const courseCampuses = await ctx.prisma.courseCampus.findMany({
        where: {
          courseId: { in: courseIds },
          campusId: { in: campusIds },
          status: SystemStatus.ACTIVE
        },
        select: { id: true }
      });

      const courseCampusIds = courseCampuses.map(cc => cc.id);

      if (courseCampusIds.length === 0) {
        return {
          success: true,
          classes: []
        };
      }

      // Build search condition
      const searchCondition = input.search ? {
        OR: [
          { name: { contains: input.search, mode: 'insensitive' as const } },
          { code: { contains: input.search, mode: 'insensitive' as const } }
        ]
      } : {};

      // Get classes
      const classes = await ctx.prisma.class.findMany({
        where: {
          courseCampusId: { in: courseCampusIds },
          status: SystemStatus.ACTIVE,
          ...searchCondition
        },
        include: {
          courseCampus: {
            include: {
              course: true,
              campus: true
            }
          },
          term: true,
          _count: {
            select: {
              students: true,
              assessments: true,
              activities: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        classes
      };
    }),

  // Admin: Assign course to coordinator
  assignCourse: protectedProcedure
    .input(assignCourseSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is an admin
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user || (user.userType !== UserType.SYSTEM_ADMIN && user.userType !== UserType.CAMPUS_ADMIN)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not have permission to assign courses",
        });
      }

      const coordinatorService = new CoordinatorService({ prisma: ctx.prisma });
      return coordinatorService.assignCourse(input);
    }),

  // Admin: Unassign course from coordinator
  unassignCourse: protectedProcedure
    .input(z.object({
      coordinatorId: z.string(),
      courseId: z.string(),
      campusId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is an admin
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user || (user.userType !== UserType.SYSTEM_ADMIN && user.userType !== UserType.CAMPUS_ADMIN)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not have permission to unassign courses",
        });
      }

      const coordinatorService = new CoordinatorService({ prisma: ctx.prisma });
      return coordinatorService.unassignCourse(input.coordinatorId, input.courseId, input.campusId);
    }),

  // Admin: Assign classes to coordinator
  assignClasses: protectedProcedure
    .input(assignClassesSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is an admin
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user || (user.userType !== UserType.SYSTEM_ADMIN && user.userType !== UserType.CAMPUS_ADMIN)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not have permission to assign classes",
        });
      }

      const coordinatorService = new CoordinatorService({ prisma: ctx.prisma });
      return coordinatorService.assignClasses(input);
    }),

  // Admin: Unassign class from coordinator
  unassignClass: protectedProcedure
    .input(z.object({
      coordinatorId: z.string(),
      classId: z.string(),
      courseId: z.string(),
      campusId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is an admin
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user || (user.userType !== UserType.SYSTEM_ADMIN && user.userType !== UserType.CAMPUS_ADMIN)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not have permission to unassign classes",
        });
      }

      const coordinatorService = new CoordinatorService({ prisma: ctx.prisma });
      return coordinatorService.unassignClass(
        input.coordinatorId,
        input.classId,
        input.courseId,
        input.campusId
      );
    }),
});
