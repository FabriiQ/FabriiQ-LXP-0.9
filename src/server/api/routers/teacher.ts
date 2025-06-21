import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";
import { UserType } from "../constants";
import bcryptjs from "bcryptjs";

const createTeacherSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  qualifications: z.string().optional(),
  joinDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  sendInvitation: z.boolean().optional(),
  requirePasswordChange: z.boolean().optional(),
  campusId: z.string(),
  userId: z.string(),
  // Manual credential creation fields
  createManualAccount: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

// Define system-level teacher creation schema
const createSystemTeacherSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  qualifications: z.string().optional(),
  joinDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  sendInvitation: z.boolean().optional(),
  requirePasswordChange: z.boolean().optional(),
  campusId: z.string(),
  userId: z.string(),
  // New fields for manual account creation
  createManualAccount: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

// Define update schema
const updateTeacherSchema = z.object({
  id: z.string(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  qualifications: z.string().optional(),
  joinDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  campusId: z.string(),
  userId: z.string(),
});

export const teacherRouter = createTRPCRouter({
  // Get class by ID
  getClassById: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get the class details
        const classDetails = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {
            term: true,
            courseCampus: {
              include: {
                course: {
                  include: {
                    subjects: true
                  }
                }
              }
            },
            programCampus: {
              include: {
                program: true
              }
            },
            campus: true,
            facility: true,
            teachers: {
              include: {
                teacher: {
                  include: {
                    user: true
                  }
                }
              }
            },
            _count: {
              select: {
                students: true,
                activities: true,
                assessments: true,
                attendance: true
              }
            }
          }
        });

        if (!classDetails) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Check if the teacher is assigned to this class
        const isTeacherAssigned = classDetails.teachers.some(
          assignment => assignment.teacherId === user.teacherProfile?.id
        );

        if (!isTeacherAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not assigned to this class",
          });
        }

        return classDetails;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class details: ${(error as Error).message}`,
        });
      }
    }),

  // Get class metrics
  getClassMetrics: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get class performance metrics
        const classPerformance = await ctx.prisma.classPerformance.findUnique({
          where: { classId: input.classId }
        });

        // If no performance record exists, create a default one
        if (!classPerformance) {
          // Get basic class info for the default metrics
          const classInfo = await ctx.prisma.class.findUnique({
            where: { id: input.classId },
            include: {
              _count: {
                select: {
                  students: true,
                  activities: true,
                  assessments: true
                }
              }
            }
          });

          if (!classInfo) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Class not found",
            });
          }

          // Return default metrics
          return {
            id: input.classId,
            classId: input.classId,
            // Academic metrics
            averageGrade: 0,
            passingRate: 0,
            highestGrade: 0,
            lowestGrade: 0,
            // Attendance metrics
            attendanceRate: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            excusedCount: 0,
            // Participation metrics
            participationRate: 0,
            activeStudents: 0,
            inactiveStudents: classInfo._count.students,
            // Activity metrics
            completionRate: 0,
            completedActivities: 0,
            totalActivities: classInfo._count.activities,
            // Assessment metrics
            assessmentCompletionRate: 0,
            completedAssessments: 0,
            totalAssessments: classInfo._count.assessments,
            // Time metrics
            averageLearningTimeMinutes: 0,
            totalLearningTimeMinutes: 0,
            // Last updated
            lastUpdated: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }

        return classPerformance;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class metrics: ${(error as Error).message}`,
        });
      }
    }),

  // Get recent class activities
  getRecentClassActivities: protectedProcedure
    .input(z.object({
      classId: z.string(),
      limit: z.number().min(1).max(100).optional().default(5),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get recent activities for this class
        const recentActivities = await ctx.prisma.activity.findMany({
          where: {
            classId: input.classId,
            status: 'ACTIVE' as SystemStatus,
          },
          take: input.limit,
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            topic: {
              select: {
                id: true,
                title: true
              }
            },
            _count: {
              select: {
                activityGrades: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return recentActivities;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get recent class activities: ${(error as Error).message}`,
        });
      }
    }),

  // Get upcoming class assessments
  getUpcomingClassAssessments: protectedProcedure
    .input(z.object({
      classId: z.string(),
      limit: z.number().min(1).max(100).optional().default(5),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get upcoming assessments for this class
        const now = new Date();
        const upcomingAssessments = await ctx.prisma.assessment.findMany({
          where: {
            classId: input.classId,
            status: 'ACTIVE' as SystemStatus,
            dueDate: {
              gte: now
            }
          },
          take: input.limit,
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            _count: {
              select: {
                submissions: true
              }
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        });

        return upcomingAssessments;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get upcoming class assessments: ${(error as Error).message}`,
        });
      }
    }),

  // Get activities for a specific class
  getClassActivities: protectedProcedure
    .input(z.object({
      classId: z.string(),
      subjectId: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      cursor: z.string().optional(), // For cursor-based pagination
    }))
    .query(async ({ ctx, input }) => {
      try {
        // First, get the teacher profile to determine which students they can see
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Build the where clause for activities
        const activityWhere: any = {
          classId: input.classId,
          status: 'ACTIVE' as SystemStatus,
        };

        // Add subject filter if provided
        if (input.subjectId) {
          activityWhere.subjectId = input.subjectId;
        }

        // Get all activities for this class
        const activities = await ctx.prisma.activity.findMany({
          where: activityWhere,
          take: input.limit + 1, // Take one more to check if there are more results
          ...(input.cursor && {
            cursor: {
              id: input.cursor,
            },
            skip: 1, // Skip the cursor
          }),
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            topic: {
              select: {
                id: true,
                title: true
              }
            },
            // Include activity grades to get analytics and attempts
            activityGrades: {
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            },
            // Include learning time records
            learningTimeRecords: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Process activities to include analytics and learning time data
        const processedActivities = activities.map(activity => {
          // Calculate analytics
          const totalSubmissions = activity.activityGrades.length;
          const gradedSubmissions = activity.activityGrades.filter(grade =>
            grade.status === 'GRADED'
          ).length;
          const averageScore = activity.activityGrades.length > 0
            ? activity.activityGrades.reduce((sum, grade) => sum + (grade.score || 0), 0) / totalSubmissions
            : 0;

          // Calculate total learning time from both direct records and activity grades
          const totalLearningTime = activity.learningTimeRecords.reduce(
            (sum, record) => sum + record.timeSpentMinutes,
            0
          ) + activity.activityGrades.reduce(
            (sum, grade) => sum + (grade.timeSpentMinutes || 0),
            0
          );

          // Determine if activity requires manual grading
          const content = activity.content as Record<string, any> || {};
          const requiresManualGrading = content.requiresTeacherReview === true ||
            (content.hasSubmission === true && content.hasRealTimeComponents !== true);

          // Return processed activity with analytics
          return {
            ...activity,
            analytics: {
              totalSubmissions,
              gradedSubmissions,
              averageScore,
              totalLearningTime,
              requiresManualGrading
            }
          };
        });

        // Check if there are more results
        let nextCursor: string | undefined = undefined;
        if (processedActivities.length > input.limit) {
          const nextItem = processedActivities.pop();
          nextCursor = nextItem?.id;
        }

        return {
          items: processedActivities,
          nextCursor
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class activities: ${(error as Error).message}`,
        });
      }
    }),

  // Get lesson plans for a specific class
  getClassLessonPlans: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get all lesson plans for this class and teacher
        const lessonPlans = await ctx.prisma.lessonPlan.findMany({
          where: {
            classId: input.classId,
            teacherId: user.teacherProfile.id,
          },
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            class: true,
            subject: true
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });

        return lessonPlans;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class lesson plans: ${(error as Error).message}`,
        });
      }
    }),

  // Delete an activity
  deleteActivity: protectedProcedure
    .input(z.object({
      activityId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Update the activity status to DELETED
        const deletedActivity = await ctx.prisma.activity.update({
          where: { id: input.activityId },
          data: { status: 'DELETED' as SystemStatus }
        });

        return deletedActivity;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete activity: ${(error as Error).message}`,
        });
      }
    }),

  // Create a teacher at the system level
  createSystemTeacher: protectedProcedure
    .input(createSystemTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to create teachers at system level
      const userType = ctx.session?.user?.userType;
      if (userType !== UserType.SYSTEM_ADMIN && userType !== UserType.SYSTEM_MANAGER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create teachers at the system level',
        });
      }

      // Get the campus to fetch the institution ID
      const campus = await ctx.prisma.campus.findUnique({
        where: { id: input.campusId },
        select: { institutionId: true }
      });

      if (!campus) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campus not found',
        });
      }

      // Prepare user data
      const userData: any = {
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        username: input.createManualAccount && input.username ? input.username : input.email,
        userType: 'CAMPUS_TEACHER' as UserType,
        status: input.createManualAccount ? 'ACTIVE' as SystemStatus : 'INACTIVE' as SystemStatus,
        primaryCampusId: input.campusId,
        institutionId: campus.institutionId,
        // Store user's basic info in profileData
        profileData: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          address: input.address,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country,
          bio: input.bio,
        },
        teacherProfile: {
          create: {
            specialization: input.specialization,
            qualifications: input.qualifications ? [{ value: input.qualifications }] : [],
          },
        },
        activeCampuses: {
          create: {
            campusId: input.campusId,
            roleType: 'CAMPUS_TEACHER' as UserType,
            status: 'ACTIVE' as SystemStatus,
          },
        },
      };

      // If creating a manual account with password
      if (input.createManualAccount && input.password) {
        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(input.password, salt);
        userData.password = hashedPassword;

        console.log('Creating manual account with username:', userData.username);
        console.log('Password has been hashed and set');
      } else {
        console.log('Not creating manual account or no password provided');
        console.log('createManualAccount:', input.createManualAccount);
        console.log('password provided:', !!input.password);
      }

      // Create the user account for the teacher
      const teacher = await ctx.prisma.user.create({
        data: userData
      });

      // Fetch the teacher profile
      const teacherProfile = await ctx.prisma.teacherProfile.findUnique({
        where: { userId: teacher.id }
      });

      if (!teacherProfile) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create teacher profile',
        });
      }

      // Handle subject assignments if provided
      if (input.subjects?.length) {
        // Instead of directly creating TeacherSubjectAssignment records, we need to
        // first create qualifications and then assignments
        for (const subjectId of input.subjects) {
          // First create a qualification for the subject
          const qualification = await ctx.prisma.teacherSubjectQualification.create({
            data: {
              teacherId: teacherProfile.id,
              subjectId: subjectId,
              level: "BASIC",
              isVerified: true
            }
          });

          // Get the course campus info to complete the assignment
          const courseCampus = await ctx.prisma.courseCampus.findFirst({
            where: {
              campusId: input.campusId,
              course: {
                subjects: {
                  some: {
                    id: subjectId
                  }
                }
              }
            }
          });

          if (courseCampus) {
            // Now create the assignment
            await ctx.prisma.teacherSubjectAssignment.create({
              data: {
                qualificationId: qualification.id,
                campusId: input.campusId,
                courseCampusId: courseCampus.id,
                status: 'ACTIVE' as SystemStatus
              }
            });
          }
        }
      }

      // Handle invitation email if requested
      if (!input.createManualAccount && input.sendInvitation) {
        // Add your email sending logic here
      }

      return { ...teacher, teacherProfile };
    }),

  create: protectedProcedure
    .input(createTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to create teachers
      const userCampusAccess = await ctx.prisma.userCampusAccess.findFirst({
        where: {
          userId: ctx.session?.user?.id,
          campusId: input.campusId,
          status: 'ACTIVE' as SystemStatus,
        },
      });

      if (!userCampusAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create teachers for this campus',
        });
      }

      // Get the campus to fetch the institution ID
      const campus = await ctx.prisma.campus.findUnique({
        where: { id: input.campusId },
        select: { institutionId: true }
      });

      if (!campus) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campus not found',
        });
      }

      // Prepare user data
      const userData: any = {
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        username: input.createManualAccount && input.username ? input.username : input.email,
        userType: 'CAMPUS_TEACHER' as UserType,
        status: input.createManualAccount ? 'ACTIVE' as SystemStatus : 'INACTIVE' as SystemStatus,
        primaryCampusId: input.campusId,
        institutionId: campus.institutionId,
        // Store user's basic info in profileData
        profileData: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          address: input.address,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country,
          bio: input.bio,
        },
        teacherProfile: {
          create: {
            specialization: input.specialization,
            qualifications: input.qualifications ? [{ value: input.qualifications }] : [],
          },
        },
        activeCampuses: {
          create: {
            campusId: input.campusId,
            roleType: 'CAMPUS_TEACHER' as UserType,
            status: 'ACTIVE' as SystemStatus,
          },
        },
      };

      // If creating a manual account with password
      if (input.createManualAccount && input.password) {
        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(input.password, salt);
        userData.password = hashedPassword;

        console.log('Creating manual account with username:', userData.username);
        console.log('Password has been hashed and set');
      } else {
        console.log('Not creating manual account or no password provided');
        console.log('createManualAccount:', input.createManualAccount);
        console.log('password provided:', !!input.password);
      }

      // Create the user account for the teacher
      const teacher = await ctx.prisma.user.create({
        data: userData
      });

      // Fetch the teacher profile
      const teacherProfile = await ctx.prisma.teacherProfile.findUnique({
        where: { userId: teacher.id }
      });

      if (!teacherProfile) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create teacher profile',
        });
      }

      // Handle subject assignments if provided
      if (input.subjects?.length) {
        // Instead of directly creating TeacherSubjectAssignment records, we need to
        // first create qualifications and then assignments
        for (const subjectId of input.subjects) {
          // First create a qualification for the subject
          const qualification = await ctx.prisma.teacherSubjectQualification.create({
            data: {
              teacherId: teacherProfile.id,
              subjectId: subjectId,
              level: "BASIC",
              isVerified: true
            }
          });

          // Get the course campus info to complete the assignment
          const courseCampus = await ctx.prisma.courseCampus.findFirst({
            where: {
              campusId: input.campusId,
              course: {
                subjects: {
                  some: {
                    id: subjectId
                  }
                }
              }
            }
          });

          if (courseCampus) {
            // Now create the assignment
            await ctx.prisma.teacherSubjectAssignment.create({
              data: {
                qualificationId: qualification.id,
                campusId: input.campusId,
                courseCampusId: courseCampus.id,
                status: 'ACTIVE' as SystemStatus
              }
            });
          }
        }
      }

      // Handle invitation email if requested
      if (input.sendInvitation) {
        // Add your email sending logic here
      }

      return { ...teacher, teacherProfile };
    }),

  update: protectedProcedure
    .input(updateTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to update teachers
      const userType = ctx.session?.user?.userType;

      // Allow system admins to update teachers without campus access check
      if (userType !== UserType.SYSTEM_ADMIN && userType !== UserType.SYSTEM_MANAGER) {
        const userCampusAccess = await ctx.prisma.userCampusAccess.findFirst({
          where: {
            userId: ctx.session?.user?.id,
            campusId: input.campusId,
            status: 'ACTIVE' as SystemStatus,
          },
        });

        if (!userCampusAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to update teachers for this campus',
          });
        }
      }

      // Get the teacher profile to update
      const teacherProfile = await ctx.prisma.teacherProfile.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          subjectQualifications: true
        }
      });

      if (!teacherProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teacher not found',
        });
      }

      // Update the user information
      const user = await ctx.prisma.user.update({
        where: { id: teacherProfile.userId },
        data: {
          name: `${input.firstName} ${input.lastName}`,
          email: input.email,
          // Store user's basic info in profileData
          profileData: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            address: input.address,
            city: input.city,
            state: input.state,
            postalCode: input.postalCode,
            country: input.country,
            bio: input.bio,
          },
        },
      });

      // Update the teacher profile
      const updatedTeacherProfile = await ctx.prisma.teacherProfile.update({
        where: { id: input.id },
        data: {
          specialization: input.specialization,
          qualifications: input.qualifications ? [{ value: input.qualifications }] : [],
          // Remove joinDate as it's not in the TeacherProfile schema
        },
      });

      // Handle subject qualifications if provided
      if (input.subjects?.length) {
        // Get current subject qualifications
        const currentQualifications = await ctx.prisma.teacherSubjectQualification.findMany({
          where: { teacherId: input.id }
        });

        // Get IDs of current qualifications
        const currentSubjectIds = currentQualifications.map(qual => qual.subjectId);

        // Find subjects to add and remove
        const subjectsToAdd = input.subjects?.filter(subjectId => !currentSubjectIds.includes(subjectId)) || [];
        const subjectsToRemove = currentSubjectIds.filter(currentId => !input.subjects?.includes(currentId));

        // Remove old qualifications
        if (subjectsToRemove.length > 0) {
          await ctx.prisma.teacherSubjectQualification.deleteMany({
            where: {
              teacherId: input.id,
              subjectId: { in: subjectsToRemove }
            }
          });
        }

        // Add new qualifications
        for (const subjectId of subjectsToAdd) {
          await ctx.prisma.teacherSubjectQualification.create({
            data: {
              teacherId: input.id,
              subjectId: subjectId,
              level: "BASIC",
              isVerified: true
            }
          });
        }
      }

      // Return the updated teacher with user information
      return {
        ...updatedTeacherProfile,
        user
      };
    }),

  getAllTeachers: protectedProcedure
    .input(z.object({
      campusId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.teacherProfile.findMany({
        where: {
          user: {
            activeCampuses: {
              some: {
                campusId: input.campusId,
                status: 'ACTIVE' as SystemStatus,
              },
            },
          },
        },
        include: {
          user: true,
        },
      });
    }),

  // Get a specific teacher by ID
  getTeacherById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.prisma.teacherProfile.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          subjectQualifications: {
            include: {
              subject: true,
            },
          },
          assignments: {
            where: { status: 'ACTIVE' as SystemStatus },
            include: {
              class: true,
            },
          },
        },
      });

      if (!teacher) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teacher not found',
        });
      }

      return teacher;
    }),

  // Get classes assigned to a teacher
  getTeacherClasses: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const teacherAssignments = await ctx.prisma.teacherAssignment.findMany({
        where: {
          teacherId: input.teacherId,
          status: 'ACTIVE' as SystemStatus,
        },
        include: {
          class: true,
        },
      });

      if (!teacherAssignments.length) {
        return [];
      }

      return teacherAssignments.map(assignment => assignment.class);
    }),

  // Get assessments for a class
  getClassAssessments: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get assessments for this class
        const assessments = await ctx.prisma.assessment.findMany({
          where: {
            classId: input.classId,
            status: 'ACTIVE', // Only show active assessments by default
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            subject: true,
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        });

        // Add additional computed properties for the frontend
        return assessments.map(assessment => ({
          ...assessment,
          completionRate: Math.round(Math.random() * 100), // Placeholder - replace with actual calculation
          averageScore: Math.round(Math.random() * 100), // Placeholder - replace with actual calculation
          assessmentType: assessment.category || 'ASSIGNMENT',
          status: assessment.status.toLowerCase(),
          subjectName: assessment.subject?.name || '', // Add subject name as a separate property
        }));
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class assessments: ${(error as Error).message}`,
        });
      }
    }),

  // Delete an assessment
  deleteAssessment: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the assessment to check if the teacher has access
        const assessment = await ctx.prisma.assessment.findUnique({
          where: { id: input.assessmentId },
          include: {
            class: {
              include: {
                teachers: true
              }
            }
          }
        });

        if (!assessment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assessment not found",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Check if the teacher is assigned to this class
        const isTeacherAssigned = assessment.class.teachers.some(
          assignment => assignment.teacherId === user.teacherProfile?.id
        );

        if (!isTeacherAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to delete this assessment",
          });
        }

        // Delete the assessment
        await ctx.prisma.assessment.update({
          where: { id: input.assessmentId },
          data: { status: 'DELETED' as SystemStatus }
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete assessment: ${(error as Error).message}`,
        });
      }
    }),

  // Assign a subject qualification to a teacher
  assignSubject: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      subjectId: z.string(),
      level: z.string().optional(),
      isVerified: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if the qualification already exists
      const existingQualification = await ctx.prisma.teacherSubjectQualification.findUnique({
        where: {
          teacherId_subjectId: {
            teacherId: input.teacherId,
            subjectId: input.subjectId,
          },
        },
      });

      if (existingQualification) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Teacher already has a qualification for this subject',
        });
      }

      // Create the qualification
      const qualification = await ctx.prisma.teacherSubjectQualification.create({
        data: {
          teacherId: input.teacherId,
          subjectId: input.subjectId,
          level: input.level || 'BASIC',
          isVerified: input.isVerified ?? true,
        },
        include: {
          subject: true,
        },
      });

      // Get the teacher's primary campus
      const teacher = await ctx.prisma.teacherProfile.findUnique({
        where: { id: input.teacherId },
        include: { user: true },
      });

      if (!teacher?.user?.primaryCampusId) {
        return qualification;
      }

      // Find a course campus for this subject and campus
      const courseCampus = await ctx.prisma.courseCampus.findFirst({
        where: {
          campusId: teacher.user.primaryCampusId,
          course: {
            subjects: {
              some: {
                id: input.subjectId,
              },
            },
          },
        },
      });

      // If we found a course campus, create an assignment
      if (courseCampus) {
        await ctx.prisma.teacherSubjectAssignment.create({
          data: {
            qualificationId: qualification.id,
            campusId: teacher.user.primaryCampusId,
            courseCampusId: courseCampus.id,
            status: 'ACTIVE' as SystemStatus,
          },
        });
      }

      return qualification;
    }),

  // Update teacher status (activate/deactivate)
  updateTeacherStatus: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      status: z.enum(['ACTIVE', 'INACTIVE']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to update teacher status
      const userType = ctx.session?.user?.userType;
      if (userType !== UserType.SYSTEM_ADMIN && userType !== UserType.SYSTEM_MANAGER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update teacher status',
        });
      }

      // Get the teacher profile
      const teacherProfile = await ctx.prisma.teacherProfile.findUnique({
        where: { id: input.teacherId },
        select: { userId: true }
      });

      if (!teacherProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teacher not found',
        });
      }

      // Update the user status
      const updatedUser = await ctx.prisma.user.update({
        where: { id: teacherProfile.userId },
        data: { status: input.status as SystemStatus },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          userType: true
        }
      });

      return updatedUser;
    }),

  // Get students for a specific class
  getClassStudents: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get student enrollments for the class
        const enrollments = await ctx.prisma.studentEnrollment.findMany({
          where: {
            classId: input.classId,
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
                    profileData: true,
                  },
                },
              },
            },
          },
          orderBy: {
            student: {
              user: {
                name: 'asc',
              },
            },
          },
        });

        // Transform the data to match the expected format in the EnhancedStudentGrid component
        const students = enrollments.map(enrollment => {
          // Calculate attendance rate (placeholder - you can implement actual calculation)
          const attendanceRate = Math.floor(Math.random() * 100); // Placeholder

          // Calculate completion rate (placeholder)
          const completionRate = Math.floor(Math.random() * 100); // Placeholder

          // Calculate average score (placeholder)
          const averageScore = Math.floor(Math.random() * 100); // Placeholder

          return {
            id: enrollment.studentId,
            name: enrollment.student.user.name || '',
            email: enrollment.student.user.email || '',
            attendanceRate,
            completionRate,
            averageScore,
            status: 'active',
          };
        });

        return students;
      } catch (error) {
        console.error('Error getting students for class:', error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving students for class",
            });
      }
    }),
});
