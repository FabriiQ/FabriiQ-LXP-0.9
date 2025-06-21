import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { UserType } from "@prisma/client";
import { SystemAdminCacheService } from "../services/system-admin-cache.service";
import { format } from "date-fns";
import { generateEnrollmentNumber } from "@/utils/enrollment-number";

/**
 * System Analytics Router
 * Provides endpoints for retrieving system-wide analytics data
 */
export const systemAnalyticsRouter = createTRPCRouter({
  // Get classes across all campuses with filtering
  getSystemClasses: protectedProcedure
    .input(z.object({
      status: z.enum(['ACTIVE', 'UPCOMING', 'COMPLETED', 'ALL']).optional().default('ALL'),
      campusId: z.string().optional(),
      programId: z.string().optional(),
      termId: z.string().optional(),
      search: z.string().optional(),
      skip: z.number().optional().default(0),
      take: z.number().optional().default(12),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Build where clause based on filters
        const whereClause: any = {};

        // Status filter
        if (input.status !== 'ALL') {
          if (input.status === 'ACTIVE') {
            whereClause.status = 'ACTIVE';
            // For active classes, also check that the term is current
            whereClause.term = {
              startDate: { lte: new Date() },
              endDate: { gte: new Date() }
            };
          } else if (input.status === 'UPCOMING') {
            whereClause.status = 'ACTIVE';
            // For upcoming classes, check that the term hasn't started yet
            whereClause.term = {
              startDate: { gt: new Date() }
            };
          } else if (input.status === 'COMPLETED') {
            // For completed classes, check that the term has ended
            whereClause.term = {
              endDate: { lt: new Date() }
            };
          }
        }

        // Campus filter
        if (input.campusId) {
          whereClause.campusId = input.campusId;
        }

        // Program filter
        if (input.programId) {
          whereClause.programCampus = {
            programId: input.programId
          };
        }

        // Term filter
        if (input.termId) {
          whereClause.termId = input.termId;
        }

        // Search filter
        if (input.search) {
          whereClause.OR = [
            { name: { contains: input.search, mode: 'insensitive' } },
            { code: { contains: input.search, mode: 'insensitive' } },
          ];
        }

        // Get total count for pagination
        const totalCount = await ctx.prisma.class.count({
          where: whereClause
        });

        // Get classes with related data
        const classes = await ctx.prisma.class.findMany({
          where: whereClause,
          include: {
            courseCampus: {
              include: {
                course: true,
                campus: true
              }
            },
            term: true,
            classTeacher: {
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
            facility: true,
            programCampus: {
              include: {
                program: true,
              },
            },
            campus: true,
            _count: {
              select: {
                students: true,
                teachers: true,
                activities: true,
                assessments: true,
              },
            },
          },
          orderBy: [
            {
              term: {
                startDate: 'desc',
              },
            },
            {
              name: 'asc',
            },
          ],
          skip: input.skip,
          take: input.take,
        });

        // Format the data for the frontend
        const formattedClasses = classes.map(cls => ({
          id: cls.id,
          name: cls.name,
          code: cls.code,
          status: cls.status,
          campus: {
            id: cls.campus.id,
            name: cls.campus.name
          },
          course: {
            id: cls.courseCampus.course.id,
            name: cls.courseCampus.course.name,
            code: cls.courseCampus.course.code
          },
          term: {
            id: cls.term.id,
            name: cls.term.name,
            startDate: cls.term.startDate,
            endDate: cls.term.endDate
          },
          teacher: cls.classTeacher ? {
            id: cls.classTeacher.id,
            name: cls.classTeacher.user.name || 'Unnamed Teacher'
          } : null,
          facility: cls.facility ? {
            id: cls.facility.id,
            name: cls.facility.name
          } : null,
          program: cls.programCampus?.program ? {
            id: cls.programCampus.program.id,
            name: cls.programCampus.program.name
          } : null,
          studentCount: cls._count.students,
          teacherCount: cls._count.teachers,
          activityCount: cls._count.activities,
          assessmentCount: cls._count.assessments
        }));

        return {
          classes: formattedClasses,
          totalCount,
          hasMore: input.skip + input.take < totalCount
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve system classes",
          cause: error,
        });
      }
    }),

  // Get class by ID
  getClassById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get class with related data
        const classData = await ctx.prisma.class.findUnique({
          where: {
            id: input.id
          },
          include: {
            courseCampus: {
              include: {
                course: true,
                campus: true
              }
            },
            term: true,
            classTeacher: {
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
            facility: true,
            programCampus: {
              include: {
                program: true,
              },
            },
            campus: true,
            _count: {
              select: {
                students: true,
                teachers: true,
                activities: true,
                assessments: true,
              },
            },
          },
        });

        if (!classData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Format the data for the frontend
        return {
          id: classData.id,
          name: classData.name,
          code: classData.code,
          status: classData.status,
          // Cast to any to avoid TypeScript error
          description: (classData as any).description || null,
          campus: {
            id: classData.campus.id,
            name: classData.campus.name
          },
          course: {
            id: classData.courseCampus.course.id,
            name: classData.courseCampus.course.name,
            code: classData.courseCampus.course.code
          },
          term: {
            id: classData.term.id,
            name: classData.term.name,
            startDate: classData.term.startDate,
            endDate: classData.term.endDate
          },
          teacher: classData.classTeacher ? {
            id: classData.classTeacher.id,
            name: classData.classTeacher.user.name || 'Unnamed Teacher'
          } : null,
          facility: classData.facility ? {
            id: classData.facility.id,
            name: classData.facility.name
          } : null,
          program: classData.programCampus?.program ? {
            id: classData.programCampus.program.id,
            name: classData.programCampus.program.name
          } : null,
          studentCount: classData._count.students,
          teacherCount: classData._count.teachers,
          activityCount: classData._count.activities,
          assessmentCount: classData._count.assessments
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve class details",
          cause: error,
        });
      }
    }),

  // Get students across all campuses with filtering
  getSystemStudents: protectedProcedure
    .input(z.object({
      status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED', 'DELETED', 'ARCHIVED_CURRENT_YEAR', 'ARCHIVED_PREVIOUS_YEAR', 'ARCHIVED_HISTORICAL', 'ALL']).optional().default('ALL'),
      campusId: z.string().optional(),
      programId: z.string().optional(),
      search: z.string().optional(),
      skip: z.number().optional().default(0),
      take: z.number().optional().default(50), // Increased default page size for virtualization
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Clear the cache to ensure we get fresh data
      SystemAdminCacheService.invalidateStudentsCache();

      // Use the cache service to get or set the data
      return SystemAdminCacheService.cacheStudents(input, async () => {
        try {
          // Build where clause based on filters
          const whereClause: any = {
            userType: {
              in: ['CAMPUS_STUDENT', 'STUDENT']  // Look for both types of students
            },
          };

          // Debug: Check if we have any students in the database
          const totalCampusStudents = await ctx.prisma.user.count({
            where: { userType: 'CAMPUS_STUDENT' }
          });

          const totalStudents = await ctx.prisma.user.count({
            where: { userType: 'STUDENT' }
          });

          console.log(`Total students in database: CAMPUS_STUDENT=${totalCampusStudents}, STUDENT=${totalStudents}`);

          // Status filter
          if (input.status !== 'ALL') {
            whereClause.status = input.status;
          }

          // Campus filter
          if (input.campusId) {
            whereClause.activeCampuses = {
              some: {
                campusId: input.campusId,
              },
            };
          }

          // Debug: Check if we have any students with activeCampuses
          const studentsWithCampuses = await ctx.prisma.user.count({
            where: {
              userType: {
                in: ['CAMPUS_STUDENT', 'STUDENT']
              },
              activeCampuses: {
                some: {}
              }
            }
          });
          console.log(`Students with campus access: ${studentsWithCampuses}`);

          // Debug: Check the field name for activeCampuses and roleType
          const userWithCampuses = await ctx.prisma.user.findFirst({
            where: {
              userType: {
                in: ['CAMPUS_STUDENT', 'STUDENT']
              }
            },
            include: {
              activeCampuses: true
            }
          });

          if (userWithCampuses && userWithCampuses.activeCampuses.length > 0) {
            console.log('User with campuses:',
              `Found user ${userWithCampuses.id} with ${userWithCampuses.activeCampuses.length} campuses`);
            console.log('First campus access:', userWithCampuses.activeCampuses[0]);
          } else {
            console.log('No user found with campus access');

            // Try to find any user with campus access
            const anyUserWithCampus = await ctx.prisma.userCampusAccess.findFirst({
              include: {
                user: true,
                campus: true
              }
            });

            if (anyUserWithCampus) {
              console.log('Found campus access record:', anyUserWithCampus);
              console.log('User type:', anyUserWithCampus.user.userType);
              console.log('Role type:', anyUserWithCampus.roleType);
            } else {
              console.log('No campus access records found at all');
            }
          }

          // Program filter
          if (input.programId) {
            whereClause.OR = [
              {
                studentProfile: {
                  enrollments: {
                    some: {
                      programCampus: {
                        programId: input.programId,
                      },
                    },
                  },
                },
              },
              {
                studentProfile: {
                  classes: {
                    some: {
                      class: {
                        programCampus: {
                          programId: input.programId,
                        },
                      },
                    },
                  },
                },
              },
            ];
          }

          // Search filter
          if (input.search) {
            const searchConditions = [
              { name: { contains: input.search, mode: 'insensitive' } },
              { email: { contains: input.search, mode: 'insensitive' } },
              { studentProfile: { enrollmentNumber: { contains: input.search, mode: 'insensitive' } } },
            ];

            // If we already have OR conditions from program filter, merge them
            if (whereClause.OR) {
              const programConditions = whereClause.OR;
              delete whereClause.OR;

              // Create a new AND condition that combines program and search
              whereClause.AND = [
                { OR: programConditions },
                { OR: searchConditions }
              ];
            } else {
              whereClause.OR = searchConditions;
            }
          }

          // Add debug logging
          console.log('System students query:', JSON.stringify(whereClause, null, 2));

          // Get total count for pagination - use a cached count for better performance
          const totalCountCacheKey = `totalCount:${JSON.stringify(whereClause)}`;
          let totalCount = await SystemAdminCacheService.systemStudentsCache.get(totalCountCacheKey);

          if (totalCount === null) {
            totalCount = await ctx.prisma.user.count({
              where: whereClause
            });
            // Cache the total count for 5 minutes
            SystemAdminCacheService.systemStudentsCache.set(totalCountCacheKey, totalCount, 5 * 60 * 1000);
          }

          // Try a simpler query first to see if we can get any students
          const simpleStudents = await ctx.prisma.user.findMany({
            where: {
              userType: {
                in: ['CAMPUS_STUDENT', 'STUDENT']
              },
            },
            take: 5,
          });
          console.log(`Simple query found ${simpleStudents.length} students`);

          if (simpleStudents.length > 0) {
            console.log('First student found:', {
              id: simpleStudents[0].id,
              name: simpleStudents[0].name,
              userType: simpleStudents[0].userType
            });
          }

          // Get students with related data
          const students = await ctx.prisma.user.findMany({
            where: whereClause,
            include: {
              studentProfile: true,
              activeCampuses: {
                include: {
                  campus: true,
                },
              },
            },
            orderBy: [
              {
                name: 'asc',
              },
            ],
            skip: input.skip,
            take: input.take,
          });

          // Log the number of students found
          console.log(`Found ${students.length} students out of ${totalCount} total`);

          // Optimize the data formatting by using Promise.all for parallel processing
          const formattedStudents = await Promise.all(students.map(async (student) => {
            // Get primary campus - handle case where activeCampuses might be empty
            let primaryCampus: { id: string; name: string } | null = null;

            if (student.activeCampuses && student.activeCampuses.length > 0) {
              const foundCampus = student.activeCampuses.find(ca => ca.campusId === student.primaryCampusId)?.campus ||
                                 student.activeCampuses[0]?.campus;

              if (foundCampus) {
                primaryCampus = {
                  id: foundCampus.id,
                  name: foundCampus.name
                };
              }
            }

            // If no campus found through activeCampuses but primaryCampusId exists, try to fetch it directly
            if (!primaryCampus && student.primaryCampusId) {
              const campus = await ctx.prisma.campus.findUnique({
                where: { id: student.primaryCampusId }
              });
              if (campus) {
                primaryCampus = {
                  id: campus.id,
                  name: campus.name
                };
              }
            }

            // Get program information - use a cached lookup for better performance
            let program: { id: string; name: string } | null = null;

            if (student.studentProfile) {
              const programCacheKey = `program:${student.id}`;
              program = await SystemAdminCacheService.systemStudentsCache.get(programCacheKey);

              if (program === null) {
                // Get class with program information
                const classWithProgram = await ctx.prisma.class.findFirst({
                  where: {
                    students: {
                      some: {
                        studentId: student.studentProfile.id,
                        status: 'ACTIVE' as const,
                      }
                    }
                  },
                  select: {
                    programCampus: {
                      include: {
                        program: true
                      }
                    }
                  },
                  orderBy: {
                    createdAt: 'desc'
                  }
                });

                if (classWithProgram?.programCampus?.program) {
                  program = {
                    id: classWithProgram.programCampus.program.id,
                    name: classWithProgram.programCampus.program.name,
                  };
                  // Cache the program for 30 minutes
                  SystemAdminCacheService.systemStudentsCache.set(programCacheKey, program, 30 * 60 * 1000);
                }
              }
            }

            // Get class count - use a cached count for better performance
            let classCount = 0;

            if (student.studentProfile) {
              const classCountCacheKey = `classCount:${student.studentProfile.id}`;
              classCount = await SystemAdminCacheService.systemStudentsCache.get(classCountCacheKey);

              if (classCount === null) {
                classCount = await ctx.prisma.class.count({
                  where: {
                    students: {
                      some: {
                        studentId: student.studentProfile.id,
                        status: 'ACTIVE',
                      }
                    }
                  },
                });
                // Cache the class count for 15 minutes
                SystemAdminCacheService.systemStudentsCache.set(classCountCacheKey, classCount, 15 * 60 * 1000);
              }
            }

            return {
              id: student.id,
              userId: student.id,
              name: student.name || 'Unnamed Student',
              email: student.email || 'No email provided',
              status: student.status,
              enrollmentDate: student.studentProfile?.createdAt || student.createdAt,
              enrollmentNumber: student.studentProfile?.enrollmentNumber,
              campus: primaryCampus ? {
                id: primaryCampus.id,
                name: primaryCampus.name,
              } : null,
              program: program,
              classCount,
              avatar: null, // No avatar field in the database
              studentProfileId: student.studentProfile?.id,
            };
          }));

          return {
            students: formattedStudents,
            totalCount,
            hasMore: input.skip + input.take < totalCount
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to retrieve system students",
            cause: error,
          });
        }
      });
    }),

  // Get student by ID
  getStudentById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get student with related data
        const student = await ctx.prisma.user.findUnique({
          where: {
            id: input.id,
            userType: 'CAMPUS_STUDENT',
          },
          include: {
            studentProfile: true,
            activeCampuses: {
              include: {
                campus: true,
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

        // Get enrollments with class and program information
        const enrollments = student.studentProfile ? await ctx.prisma.class.findMany({
          where: {
            students: {
              some: {
                studentId: student.studentProfile.id
              }
            } as any
          },
          include: {
            programCampus: {
              include: {
                program: true,
                campus: true,
              },
            },
            term: true,
            students: {
              where: {
                studentId: student.studentProfile.id
              },
              take: 1
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        }) : [];

        // Get classes
        const classes = student.studentProfile ? await ctx.prisma.class.findMany({
          where: {
            students: {
              some: {
                studentId: student.studentProfile.id
              }
            } as any
          },
          include: {
            courseCampus: {
              include: {
                course: true,
              },
            },
            term: true,
            campus: true,
            students: {
              where: {
                studentId: student.studentProfile.id
              },
              take: 1
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        }) : [];

        // Get grades
        const grades = student.studentProfile ? await ctx.prisma.studentGrade.findMany({
          where: {
            studentId: student.studentProfile.id,
          },
          include: {
            gradeBook: {
              include: {
                class: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }) : [];

        // Format the data for the frontend
        return {
          id: student.id,
          name: student.name || 'Unnamed Student',
          email: student.email || 'No email provided',
          status: student.status,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
          profile: student.studentProfile ? {
            id: student.studentProfile.id,
            enrollmentNumber: student.studentProfile.enrollmentNumber,
            currentGrade: student.studentProfile.currentGrade,
            academicHistory: student.studentProfile.academicHistory,
            interests: student.studentProfile.interests,
            achievements: student.studentProfile.achievements,
            specialNeeds: student.studentProfile.specialNeeds,
            guardianInfo: student.studentProfile.guardianInfo,
            attendanceRate: student.studentProfile.attendanceRate,
            academicScore: student.studentProfile.academicScore,
            participationRate: student.studentProfile.participationRate,
            lastCounseling: student.studentProfile.lastCounseling,
            lastParentMeeting: student.studentProfile.lastParentMeeting,
            createdAt: student.studentProfile.createdAt,
            updatedAt: student.studentProfile.updatedAt,
          } : null,
          campuses: student.activeCampuses.map((ca: any) => ({
            id: ca.campus.id,
            name: ca.campus.name,
            status: ca.status,
            isPrimary: ca.campusId === student.primaryCampusId,
          })),
          enrollments: enrollments.map((cls: any) => ({
            id: cls.id,
            program: cls.programCampus?.program ? {
              id: cls.programCampus.program.id,
              name: cls.programCampus.program.name,
            } : null,
            campus: cls.programCampus?.campus ? {
              id: cls.programCampus.campus.id,
              name: cls.programCampus.campus.name,
            } : {
              id: cls.campusId,
              name: cls.campus.name,
            },
            term: {
              id: cls.term.id,
              name: cls.term.name,
              startDate: cls.term.startDate,
              endDate: cls.term.endDate,
            },
            startDate: cls.students[0]?.startDate || cls.createdAt,
            status: cls.students[0]?.status || 'ACTIVE',
            createdAt: cls.createdAt,
          })),
          classes: classes.map((cls: any) => ({
            id: cls.id,
            class: {
              id: cls.id,
              name: cls.name,
              code: cls.code,
              course: {
                id: cls.courseCampus.course.id,
                name: cls.courseCampus.course.name,
                code: cls.courseCampus.course.code,
              },
              term: {
                id: cls.term.id,
                name: cls.term.name,
                startDate: cls.term.startDate,
                endDate: cls.term.endDate,
              },
              campus: {
                id: cls.campus.id,
                name: cls.campus.name,
              },
            },
            status: cls.students[0]?.status || 'ACTIVE',
            enrollmentDate: cls.students[0]?.createdAt || cls.createdAt,
          })),
          grades: grades.map((grade: any) => ({
            id: grade.id,
            class: grade.gradeBook.class ? {
              id: grade.gradeBook.class.id,
              name: grade.gradeBook.class.name,
            } : null,
            finalGrade: grade.finalGrade,
            letterGrade: grade.letterGrade,
            attendance: grade.attendance,
            comments: grade.comments,
            createdAt: grade.createdAt,
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve student details",
          cause: error,
        });
      }
    }),

  // Get all campuses for filtering
  getFilterOptions: protectedProcedure
    .query(async ({ ctx }) => {
      // Check permissions
      if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get all active campuses
        const campuses = await ctx.prisma.campus.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });

        // Get all active programs
        const programs = await ctx.prisma.program.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });

        // Get all active terms
        const terms = await ctx.prisma.term.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, startDate: true, endDate: true },
          orderBy: [{ startDate: 'desc' }, { name: 'asc' }]
        });

        return { campuses, programs, terms };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve filter options",
          cause: error,
        });
      }
    }),
  // Get user activity data for the dashboard
  getUserActivity: protectedProcedure
    .input(z.object({
      days: z.number().optional().default(7),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        // Get login events from audit logs
        const loginEvents = await ctx.prisma.auditLog.groupBy({
          by: ['createdAt'],
          where: {
            action: {
              contains: 'login',
            },
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          _count: {
            id: true,
          },
        });

        // Get user registrations
        const registrations = await ctx.prisma.user.groupBy({
          by: ['createdAt'],
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          _count: {
            id: true,
          },
        });

        // Get active users (users with audit logs)
        const activeUsers = await ctx.prisma.auditLog.groupBy({
          by: ['createdAt'],
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          _count: {
            userId: true,
          },
        });

        // Format data by day
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const result: Array<{
          date: string;
          logins: number;
          registrations: number;
          activeUsers: number;
        }> = [];

        for (let i = 0; i < input.days; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dayStr = days[date.getDay()];
          const dateStr = date.toISOString().split('T')[0];

          // Find login count for this day
          const loginCount = loginEvents.find(
            event => new Date(event.createdAt).toISOString().split('T')[0] === dateStr
          )?._count.id || 0;

          // Find registration count for this day
          const registrationCount = registrations.find(
            reg => new Date(reg.createdAt).toISOString().split('T')[0] === dateStr
          )?._count.id || 0;

          // Find active user count for this day
          const activeUserCount = activeUsers.find(
            active => new Date(active.createdAt).toISOString().split('T')[0] === dateStr
          )?._count.userId || 0;

          result.push({
            date: dayStr,
            logins: loginCount,
            registrations: registrationCount,
            activeUsers: activeUserCount,
          });
        }

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve user activity data",
          cause: error,
        });
      }
    }),

  // Get user distribution by role
  getUserDistribution: protectedProcedure.query(async ({ ctx }) => {
    // Check permissions
    if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    try {
      const userCounts = await ctx.prisma.user.groupBy({
        by: ['userType'],
        _count: {
          id: true,
        },
        where: {
          status: 'ACTIVE',
        },
      });

      // Define colors for each user type
      const colors: Record<string, string> = {
        SYSTEM_ADMIN: "#D92632",
        CAMPUS_ADMIN: "#FF9852",
        CAMPUS_COORDINATOR: "#5A8A84",
        CAMPUS_TEACHER: "#1F504B",
        CAMPUS_STUDENT: "#2F96F4",
        CAMPUS_PARENT: "#D8E3E0",
      };

      // Map to the expected format
      return userCounts.map(count => ({
        name: formatUserType(count.userType),
        value: count._count.id,
        color: colors[count.userType] || "#1F504B",
      }));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve user distribution data",
        cause: error,
      });
    }
  }),

  // Get campus performance data
  getCampusPerformance: protectedProcedure.query(async ({ ctx }) => {
    // Check permissions
    if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    try {
      // Get top 5 campuses by student count
      const campuses = await ctx.prisma.campus.findMany({
        where: {
          status: 'ACTIVE',
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              userAccess: true,
            },
          },
        },
      });

      // For each campus, get student and teacher counts
      const result = await Promise.all(
        campuses.map(async (campus) => {
          // Get student count
          const studentCount = await ctx.prisma.userCampusAccess.count({
            where: {
              campusId: campus.id,
              status: 'ACTIVE',
              user: {
                userType: 'CAMPUS_STUDENT',
              },
            },
          });

          // Get teacher count
          const teacherCount = await ctx.prisma.userCampusAccess.count({
            where: {
              campusId: campus.id,
              status: 'ACTIVE',
              user: {
                userType: 'CAMPUS_TEACHER',
              },
            },
          });

          // Get course count
          const courseCount = await ctx.prisma.courseCampus.count({
            where: {
              campusId: campus.id,
              status: 'ACTIVE',
            },
          });

          return {
            name: campus.name,
            students: studentCount,
            teachers: teacherCount,
            courses: courseCount,
          };
        })
      );

      return result;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve campus performance data",
        cause: error,
      });
    }
  }),

  // Get institution performance data
  getInstitutionPerformance: protectedProcedure.query(async ({ ctx }) => {
    // Check permissions
    if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    try {
      // Get top 5 institutions
      const institutions = await ctx.prisma.institution.findMany({
        where: {
          status: 'ACTIVE',
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // For each institution, get campus count
      const result = await Promise.all(
        institutions.map(async (institution) => {
          // Get campus count
          const campusCount = await ctx.prisma.campus.count({
            where: {
              institutionId: institution.id,
              status: 'ACTIVE',
            },
          });

          // Get student count across all campuses
          const studentCount = await ctx.prisma.userCampusAccess.count({
            where: {
              campus: {
                institutionId: institution.id,
              },
              status: 'ACTIVE',
              user: {
                userType: 'CAMPUS_STUDENT',
              },
            },
          });

          // Get teacher count across all campuses
          const teacherCount = await ctx.prisma.userCampusAccess.count({
            where: {
              campus: {
                institutionId: institution.id,
              },
              status: 'ACTIVE',
              user: {
                userType: 'CAMPUS_TEACHER',
              },
            },
          });

          // Get course count across all campuses
          const courseCount = await ctx.prisma.courseCampus.count({
            where: {
              campus: {
                institutionId: institution.id,
              },
              status: 'ACTIVE',
            },
          });

          return {
            name: institution.name,
            campuses: campusCount,
            students: studentCount,
            teachers: teacherCount,
            courses: courseCount,
          };
        })
      );

      return result;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve institution performance data",
        cause: error,
      });
    }
  }),

  // Get system health data
  getSystemHealth: protectedProcedure.query(async ({ ctx }) => {
    // Check permissions
    if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    try {
      // Get error logs from the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const errorLogs = await ctx.prisma.auditLog.groupBy({
        by: ['createdAt'],
        where: {
          action: {
            contains: 'error',
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          id: true,
        },
      });

      // Format data by day
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result: Array<{ date: string; errors: number }> = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayStr = days[date.getDay()];
        const dateStr = date.toISOString().split('T')[0];

        // Find error count for this day
        const errorCount = errorLogs.find(
          log => new Date(log.createdAt).toISOString().split('T')[0] === dateStr
        )?._count.id || 0;

        result.push({
          date: dayStr,
          errors: errorCount,
        });
      }

      return result;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve system health data",
        cause: error,
      });
    }
  }),

  // Get system resource usage (mock data as this would typically come from server monitoring)
  getSystemResources: protectedProcedure.query(async ({ ctx }) => {
    // Check permissions
    if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // In a real implementation, this would fetch data from a monitoring service
    // For now, we'll return mock data
    return [
      { name: "CPU Usage", value: Math.floor(Math.random() * 60) + 20, color: "#1F504B" },
      { name: "Memory", value: Math.floor(Math.random() * 40) + 40, color: "#5A8A84" },
      { name: "Storage", value: Math.floor(Math.random() * 30) + 30, color: "#D8E3E0" },
      { name: "Network", value: Math.floor(Math.random() * 40) + 20, color: "#2F96F4" },
    ];
  }),

  // Get teachers across all campuses with filtering
  getSystemTeachers: protectedProcedure
    .input(z.object({
      status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional().default('ALL'),
      campusId: z.string().optional(),
      search: z.string().optional(),
      skip: z.number().optional().default(0),
      take: z.number().optional().default(12),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Build where clause based on filters
        const whereClause: any = {};

        // User filter for TEACHER and CAMPUS_TEACHER
        whereClause.user = {
          userType: {
            in: [UserType.CAMPUS_TEACHER, UserType.TEACHER]
          }
        };

        // Status filter
        if (input.status !== 'ALL') {
          whereClause.user.status = input.status;
        }

        // Campus filter
        if (input.campusId) {
          whereClause.user.activeCampuses = {
            some: {
              campusId: input.campusId,
              status: 'ACTIVE'
            }
          };
        }

        // Search filter
        if (input.search) {
          whereClause.user.OR = [
            { name: { contains: input.search, mode: 'insensitive' } },
            { email: { contains: input.search, mode: 'insensitive' } },
          ];
        }

        // Count total teachers matching the criteria
        const totalCount = await ctx.prisma.teacherProfile.count({
          where: whereClause
        });

        // Get teachers with pagination
        const teachers = await ctx.prisma.teacherProfile.findMany({
          where: whereClause,
          include: {
            user: {
              include: {
                activeCampuses: {
                  include: {
                    campus: true
                  }
                }
              }
            },
            subjectQualifications: {
              include: {
                subject: true
              }
            },
            assignments: {
              where: { status: 'ACTIVE' },
              include: {
                class: true
              }
            }
          },
          skip: input.skip,
          take: input.take,
          orderBy: {
            user: {
              name: 'asc'
            }
          }
        });

        // Format the response
        const formattedTeachers = teachers.map(teacher => {
          // Get primary campus
          const primaryCampus = teacher.user.activeCampuses[0]?.campus;

          return {
            id: teacher.id,
            userId: teacher.user.id,
            name: teacher.user.name,
            email: teacher.user.email,
            phone: teacher.user.phoneNumber,
            status: teacher.user.status,
            campus: primaryCampus ? {
              id: primaryCampus.id,
              name: primaryCampus.name
            } : null,
            specialization: teacher.specialization,
            classCount: teacher.assignments.length,
            subjectCount: teacher.subjectQualifications.length,
            avatar: null // No avatar field in the database
          };
        });

        return {
          teachers: formattedTeachers,
          totalCount,
          hasMore: input.skip + input.take < totalCount
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve system teachers",
          cause: error,
        });
      }
    }),

  // Get API response time (mock data as this would typically come from server monitoring)
  getApiResponseTime: protectedProcedure.query(async ({ ctx }) => {
    // Check permissions
    if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // In a real implementation, this would fetch data from a monitoring service
    // For now, we'll return mock data with some randomization
    const hours = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];
    return hours.map(hour => ({
      hour,
      time: Math.floor(Math.random() * 100) + 100, // Random response time between 100-200ms
    }));
  }),

  // Get dashboard metrics
  getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
    // Check permissions
    if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    try {
      // Get institution count
      const institutionCount = await ctx.prisma.institution.count({
        where: { status: 'ACTIVE' }
      });

      // Get campus count
      const campusCount = await ctx.prisma.campus.count({
        where: { status: 'ACTIVE' }
      });

      // Get user count
      const userCount = await ctx.prisma.user.count({
        where: { status: 'ACTIVE' }
      });

      // Get course count
      const courseCount = await ctx.prisma.course.count({
        where: { status: 'ACTIVE' }
      });

      // Get class count
      const classCount = await ctx.prisma.class.count({
        where: { status: 'ACTIVE' }
      });

      // Get open support tickets (mock data)
      const ticketCount = Math.floor(Math.random() * 10) + 1;

      return {
        institutions: { value: institutionCount, description: "Active institutions" },
        campuses: { value: campusCount, description: "Active campuses" },
        users: { value: userCount, description: "Total users" },
        courses: { value: courseCount, description: "Active courses" },
        classes: { value: classCount, description: "Active classes" },
        tickets: { value: ticketCount, description: "Open support tickets" },
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve dashboard metrics",
        cause: error,
      });
    }
  }),
  // Import students from file with batch processing for large datasets
  importStudents: protectedProcedure
    .input(
      z.object({
        students: z.array(
          z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string().email(),
            enrollmentNumber: z.string().optional(),
            phone: z.string().optional(),
            campusId: z.string().optional(),
            programId: z.string().optional(),
            termId: z.string().optional(),
          }).passthrough()
        ),
        mapping: z.record(z.string()).optional(),
        defaultCampusId: z.string(),
        batchNumber: z.number().optional(),
        totalBatches: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Log batch information if this is part of a batched import
        if (input.batchNumber && input.totalBatches) {
          console.info(`Processing system student import batch ${input.batchNumber}/${input.totalBatches} with ${input.students.length} records`);
        } else {
          console.info(`Processing system student import with ${input.students.length} records`);
        }

        // Process each student record
        const results = {
          total: input.students.length,
          success: 0,
          failed: 0,
          warnings: 0
        };

        // In a real implementation, we'd use a transaction here
        for (const studentData of input.students) {
          try {
            // Apply field mapping if provided
            const mappedData = input.mapping
              ? Object.entries(studentData).reduce((acc, [key, value]) => {
                  const mappedKey = input.mapping?.[key] || key;
                  acc[mappedKey] = value;
                  return acc;
                }, {} as Record<string, any>)
              : studentData;

            // Extract required fields
            const firstName = mappedData.firstName || '';
            const lastName = mappedData.lastName || '';
            const email = mappedData.email || '';
            const campusId = mappedData.campusId || input.defaultCampusId;

            // Validate required fields
            if (!firstName || !lastName || !email) {
              results.failed++;
              continue;
            }

            // Check if user already exists
            const existingUser = await ctx.prisma.user.findFirst({
              where: {
                email: {
                  equals: email,
                  mode: 'insensitive'
                }
              },
              include: {
                studentProfile: true
              }
            });

            if (existingUser) {
              // Update existing user
              await ctx.prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  name: `${firstName} ${lastName}`,
                  // Update other fields as needed
                }
              });

              // Ensure the user has access to the specified campus
              const existingCampusAccess = await ctx.prisma.userCampusAccess.findFirst({
                where: {
                  userId: existingUser.id,
                  campusId
                }
              });

              if (!existingCampusAccess) {
                await ctx.prisma.userCampusAccess.create({
                  data: {
                    userId: existingUser.id,
                    campusId,
                    status: 'ACTIVE',
                    roleType: 'STUDENT' // Use STUDENT to match existing data
                  }
                });
              }

              results.success++;
              results.warnings++; // Count as a warning since we're updating an existing user
            } else {
              // Get campus information to get institution ID
              const campus = await ctx.prisma.campus.findUnique({
                where: { id: campusId },
                select: { institutionId: true }
              });

              if (!campus) {
                results.failed++;
                continue;
              }

              // Create new user with enrollment number collision handling
              let enrollmentNumber = mappedData.enrollmentNumber || generateEnrollmentNumber('ST');
              let retryCount = 0;
              const maxRetries = 5;

              while (retryCount < maxRetries) {
                try {
                  await ctx.prisma.user.create({
                    data: {
                      name: `${firstName} ${lastName}`,
                      email,
                      username: email, // Use email as username
                      userType: 'STUDENT', // Use STUDENT to match existing data
                      status: 'ACTIVE',
                      primaryCampusId: campusId,
                      institution: {
                        connect: { id: campus.institutionId }
                      },
                      activeCampuses: {
                        create: {
                          campusId,
                          status: 'ACTIVE',
                          roleType: 'STUDENT' // Use STUDENT to match existing data
                        }
                      },
                      studentProfile: {
                        create: {
                          enrollmentNumber,
                          // Add other student profile fields as needed
                        }
                      }
                    }
                  });
                  results.success++; // Increment success counter on successful creation
                  break; // Success, exit the retry loop
                } catch (error: any) {
                  // Check if it's a unique constraint error on enrollmentNumber
                  if (error.code === 'P2002' && error.meta?.target?.includes('enrollmentNumber')) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                      console.error('Failed to generate unique enrollment number after multiple attempts for:', email);
                      results.failed++;
                      break; // Exit retry loop and continue with next student
                    }
                    // Generate a new enrollment number and retry
                    enrollmentNumber = generateEnrollmentNumber('ST');
                    continue;
                  }
                  // If it's not an enrollment number collision, re-throw the error
                  throw error;
                }
              }
            }
          } catch (error) {
            console.error('Error processing student record:', error);
            results.failed++;
          }
        }

        return results;
      } catch (error) {
        console.error('Error importing students:', error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while importing students",
            });
      }
    }),

  // Export students data with optimizations for large datasets
  exportStudents: protectedProcedure
    .input(
      z.object({
        format: z.enum(['CSV', 'EXCEL']),
        campusId: z.string().optional(),
        programId: z.string().optional(),
        includeInactive: z.boolean().default(false),
        includeDetails: z.boolean().default(true),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (ctx.session.user.userType !== UserType.SYSTEM_ADMIN) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Build where clause based on filters
        const whereClause: any = {
          userType: 'CAMPUS_STUDENT',
        };

        // Include inactive students if requested
        if (!input.includeInactive) {
          whereClause.status = 'ACTIVE';
        }

        // Campus filter
        if (input.campusId) {
          whereClause.activeCampuses = {
            some: {
              campusId: input.campusId,
              status: 'ACTIVE',
            },
          };
        }

        // Program filter
        if (input.programId) {
          whereClause.studentProfile = {
            enrollments: {
              some: {
                programCampus: {
                  programId: input.programId,
                },
                status: 'ACTIVE',
              },
            },
          };
        }

        // Get total count to determine if this is a large dataset
        const studentCount = await ctx.prisma.user.count({
          where: whereClause
        });

        // For very large datasets, we'll create a background job
        const isLargeDataset = studentCount > 10000;

        if (isLargeDataset) {
          // For large datasets, we'll create a background job and return a download URL
          // This is a placeholder - in a real implementation, you'd create a job and store the file

          // Log the export request
          console.info(`Large system student export requested: ${studentCount} records, format: ${input.format}`);

          // In a real implementation, you would:
          // 1. Create a background job to generate the export file
          // 2. Store the file in a temporary location or cloud storage
          // 3. Return a URL to download the file

          // For now, we'll simulate this behavior
          const jobId = `export-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
          const downloadUrl = `/api/exports/${jobId}`;

          return {
            isLargeDataset: true,
            downloadUrl,
            totalRecords: studentCount,
            fileName: input.fileName || `system_students_export_${format(new Date(), 'yyyy-MM-dd')}`,
            format: input.format
          };
        }

        // For smaller datasets, process synchronously
        const allStudents = await ctx.prisma.user.findMany({
          where: whereClause,
          include: {
            studentProfile: true,
            activeCampuses: {
              include: {
                campus: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        // Format the data for export
        const exportData = await Promise.all(allStudents.map(async (student) => {
          // Get primary campus
          const primaryCampus = student.activeCampuses.find(ca => ca.campusId === student.primaryCampusId)?.campus ||
                              student.activeCampuses[0]?.campus;

          // Get program information
          let programName = '';
          if (student.studentProfile) {
            const classWithProgram = await ctx.prisma.class.findFirst({
              where: {
                students: {
                  some: {
                    studentId: student.studentProfile.id,
                    status: 'ACTIVE',
                  }
                }
              },
              select: {
                programCampus: {
                  include: {
                    program: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            });

            programName = classWithProgram?.programCampus?.program?.name || '';
          }

          // Basic fields that are always included
          const exportRecord: Record<string, any> = {
            'Student ID': student.id,
            'Name': student.name || '',
            'Email': student.email || '',
            'Status': student.status,
            'Campus': primaryCampus?.name || '',
            'Program': programName,
          };

          // Add detailed information if requested
          if (input.includeDetails) {
            exportRecord['Enrollment Number'] = student.studentProfile?.enrollmentNumber || '';
            exportRecord['Enrollment Date'] = student.studentProfile?.createdAt
              ? format(student.studentProfile.createdAt, 'yyyy-MM-dd')
              : '';
            exportRecord['Last Login'] = student.lastLoginAt
              ? format(student.lastLoginAt, 'yyyy-MM-dd HH:mm:ss')
              : 'Never';
          }

          return exportRecord;
        }));

        // Generate the export content
        let content = '';
        if (input.format === 'CSV') {
          // Generate CSV
          const headers = Object.keys(exportData[0] || {});
          content = headers.join(',') + '\n';

          exportData.forEach(record => {
            content += headers.map(header => {
              const value = record[header]?.toString() || '';
              // Escape quotes and wrap in quotes if contains comma
              return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
            }).join(',') + '\n';
          });
        } else {
          // For Excel, in a real implementation you'd use a library like xlsx
          // This is just a placeholder that returns JSON
          content = JSON.stringify(exportData, null, 2);
        }

        return {
          isLargeDataset: false,
          content,
          totalRecords: allStudents.length,
          fileName: input.fileName || `system_students_export_${format(new Date(), 'yyyy-MM-dd')}`,
          format: input.format
        };
      } catch (error) {
        console.error('Error exporting students:', error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while exporting students",
            });
      }
    }),
});

// Helper function to format user type for display
function formatUserType(userType: string): string {
  switch (userType) {
    case 'SYSTEM_ADMIN':
      return 'System Admins';
    case 'CAMPUS_ADMIN':
      return 'Campus Admins';
    case 'CAMPUS_COORDINATOR':
      return 'Coordinators';
    case 'CAMPUS_TEACHER':
      return 'Teachers';
    case 'CAMPUS_STUDENT':
      return 'Students';
    case 'CAMPUS_PARENT':
      return 'Parents';
    default:
      return userType.replace(/_/g, ' ').replace(/\w\S*/g, txt =>
        txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      );
  }
}
