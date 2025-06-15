import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { UserService } from "../services/user.service";
import { SystemStatus, UserType, AccessScope, CreateUserInput, CreateProfileInput } from "../types/user";
import { logger } from "../utils/logger";
import { TRPCError } from "@trpc/server";
import { SystemAdminCacheService } from "../services/system-admin-cache.service";

// Input validation schemas
const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  userType: z.enum(Object.values(UserType) as [string, ...string[]]).transform(val => val as UserType),
  generateCredentials: z.boolean().default(true),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  campusId: z.string().optional(),
  accessScope: z.enum(Object.values(AccessScope) as [string, ...string[]]).transform(val => val as AccessScope).optional(),
  phoneNumber: z.string().optional(),
  institutionId: z.string().optional(),
  profileData: z.record(z.any()).optional()
});

const updateUserSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    password: z.string().min(8).optional(),
    userType: z.enum(Object.values(UserType) as [string, ...string[]]).transform(val => val as UserType).optional(),
    accessScope: z.enum(Object.values(AccessScope) as [string, ...string[]]).transform(val => val as AccessScope).optional(),
    primaryCampusId: z.string().optional(),
    status: z.enum(Object.values(SystemStatus) as [string, ...string[]]).transform(val => val as SystemStatus).optional(),
    profileData: z.record(z.any()).optional()
  })
});

const createProfileSchema = z.object({
  userId: z.string(),
  enrollmentNumber: z.string(),
  currentGrade: z.string().optional(),
  academicHistory: z.record(z.any()).optional(),
  interests: z.array(z.string()).optional(),
  achievements: z.array(z.record(z.any())).optional(),
  specialNeeds: z.record(z.any()).optional(),
  guardianInfo: z.record(z.any()).optional()
});

const updateProfileSchema = z.object({
  userId: z.string(),
  data: z.object({
    currentGrade: z.string().optional(),
    academicHistory: z.record(z.any()).optional(),
    interests: z.array(z.string()).optional(),
    achievements: z.array(z.record(z.any())).optional(),
    specialNeeds: z.record(z.any()).optional(),
    guardianInfo: z.record(z.any()).optional()
  })
});

const userListSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
  campus: z.string().optional(),
  dateRange: z.object({
    from: z.date().nullable(),
    to: z.date().nullable()
  }).optional(),
  skip: z.number().optional(),
  take: z.number().optional(),
});

// Add preference schema
const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    inApp: z.boolean(),
    digest: z.enum(['none', 'daily', 'weekly'])
  }),
  display: z.object({
    density: z.enum(['compact', 'comfortable', 'spacious']),
    fontSize: z.enum(['small', 'medium', 'large']),
    colorScheme: z.enum(['default', 'high-contrast', 'pastel'])
  }),
  accessibility: z.object({
    reduceMotion: z.boolean(),
    highContrast: z.boolean(),
    screenReader: z.boolean(),
    keyboardNavigation: z.boolean()
  })
}).transform((data) => {
  // Set default values for any missing fields
  return {
    theme: data.theme || 'system',
    notifications: {
      email: data.notifications?.email ?? true,
      push: data.notifications?.push ?? true,
      inApp: data.notifications?.inApp ?? true,
      digest: data.notifications?.digest || 'daily'
    },
    display: {
      density: data.display?.density || 'comfortable',
      fontSize: data.display?.fontSize || 'medium',
      colorScheme: data.display?.colorScheme || 'default'
    },
    accessibility: {
      reduceMotion: data.accessibility?.reduceMotion ?? false,
      highContrast: data.accessibility?.highContrast ?? false,
      screenReader: data.accessibility?.screenReader ?? false,
      keyboardNavigation: data.accessibility?.keyboardNavigation ?? false
    }
  };
});

export const userRouter = createTRPCRouter({
  // Get current user
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const userService = new UserService({ prisma: ctx.prisma });
      return userService.getUser(ctx.session.user.id);
    }),
  create: protectedProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userService = new UserService({
          prisma: ctx.prisma,
          defaultUserStatus: SystemStatus.ACTIVE,
          passwordHashRounds: 10
        });

        // Get the current user's institution
        const currentUser = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { institutionId: true }
        });

        if (!currentUser) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current user not found',
          });
        }

        // Generate a username if not provided
        const username = input.username || generateUsernameFromNameAndEmail(input.name, input.email);

        // Helper function to generate a username from name and email
        function generateUsernameFromNameAndEmail(name: string, email: string): string {
          // Extract first part of email (before @) as a fallback
          const emailUsername = email.split('@')[0];

          // Generate from name if available
          if (name && name.trim().length > 0) {
            const nameParts = name.trim().split(' ');
            let username = '';

            if (nameParts.length > 1) {
              // First letter of first name + last name
              username = (nameParts[0][0] + nameParts[nameParts.length - 1]).toLowerCase();
            } else {
              // Just use the single name
              username = name.toLowerCase().replace(/\s+/g, '');
            }

            // Add random numbers to make it unique
            username += Math.floor(1000 + Math.random() * 9000);
            return username;
          }

          // Fallback to email username + random numbers
          return emailUsername + Math.floor(1000 + Math.random() * 9000);
        }

        // Prepare user data
        const userData: CreateUserInput = {
          name: input.name,
          email: input.email,
          userType: input.userType,
          institutionId: currentUser.institutionId,
          accessScope: input.accessScope || AccessScope.SINGLE_CAMPUS,
          primaryCampusId: input.campusId,
          username: username,
          password: input.password
        };

        // Create the user
        const user = await userService.createUser(userData);

        // If a campus is specified, create campus access (using upsert to avoid unique constraint errors)
        if (input.campusId) {
          await ctx.prisma.userCampusAccess.upsert({
            where: {
              userId_campusId: {
                userId: user.id,
                campusId: input.campusId
              }
            },
            update: {
              roleType: input.userType,
              status: SystemStatus.ACTIVE
            },
            create: {
              userId: user.id,
              campusId: input.campusId,
              roleType: input.userType,
              status: SystemStatus.ACTIVE
            }
          });
        }

        return user;
      } catch (error) {
        logger.error('Error creating user', { error: error instanceof Error ? error.message : 'Unknown error' });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create user',
        });
      }
    }),

  get: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const userService = new UserService({ prisma: ctx.prisma });
      return userService.getUser(id);
    }),

  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService({ prisma: ctx.prisma });
      return userService.updateUser(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const userService = new UserService({ prisma: ctx.prisma });
      return userService.deleteUser(id);
    }),

  list: protectedProcedure
    .input(userListSchema)
    .query(async ({ ctx, input }) => {
      const { search, role, status, campus, dateRange, skip = 0, take = 100 } = input;

      // Use the cache service to get or set the data
      return SystemAdminCacheService.cacheUsers(input, async () => {
        try {
          // Build where clause
          const whereClause: any = {};

          // Search filter
          if (search) {
            whereClause.OR = [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ];
          }

          // Role filter
          if (role) {
            whereClause.permissions = {
              some: { permissionId: role }
            };
          }

          // Status filter
          if (status) {
            whereClause.status = status;
          }

          // Campus filter
          if (campus) {
            whereClause.activeCampuses = {
              some: { campusId: campus }
            };
          }

          // Date range filter
          if (dateRange?.from || dateRange?.to) {
            whereClause.createdAt = {};
            if (dateRange.from) whereClause.createdAt.gte = dateRange.from;
            if (dateRange.to) whereClause.createdAt.lte = dateRange.to;
          }

          // Get total count for pagination - use a cached count for better performance
          const totalCountCacheKey = `userTotalCount:${JSON.stringify(whereClause)}`;
          let totalCount = await SystemAdminCacheService.systemUsersCache.get(totalCountCacheKey);

          if (totalCount === null) {
            totalCount = await ctx.prisma.user.count({
              where: whereClause
            });
            // Cache the total count for 5 minutes
            SystemAdminCacheService.systemUsersCache.set(totalCountCacheKey, totalCount, 5 * 60 * 1000);
          }

          // Get users with related data
          const users = await ctx.prisma.user.findMany({
            where: whereClause,
            include: {
              activeCampuses: {
                include: {
                  campus: true
                }
              },
              permissions: true,
            },
            orderBy: {
              name: 'asc',
            },
            skip,
            take,
          });

          // Process users in parallel for better performance
          const usersWithCampus = await Promise.all(
            users.map(async (user) => {
              if (!user.primaryCampusId) return user;

              // Check cache for primary campus
              const primaryCampusCacheKey = `primaryCampus:${user.primaryCampusId}`;
              let primaryCampus = await SystemAdminCacheService.systemUsersCache.get(primaryCampusCacheKey);

              if (primaryCampus === null) {
                // Get the primary campus information
                primaryCampus = await ctx.prisma.campus.findUnique({
                  where: { id: user.primaryCampusId }
                });

                // Cache the primary campus for 30 minutes
                if (primaryCampus) {
                  SystemAdminCacheService.systemUsersCache.set(primaryCampusCacheKey, primaryCampus, 30 * 60 * 1000);
                }
              }

              // Add the primary campus information to the user's activeCampuses array
              if (primaryCampus) {
                const hasCampus = user.activeCampuses.some(
                  (access) => access.campusId === primaryCampus.id
                );

                if (!hasCampus) {
                  user.activeCampuses.push({
                    id: `primary-${user.id}`,
                    userId: user.id,
                    campusId: primaryCampus.id,
                    roleType: user.userType,
                    status: user.status,
                    startDate: user.createdAt,
                    endDate: null,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    deletedAt: null,
                    campus: primaryCampus
                  });
                }
              }

              return user;
            })
          );

          return {
            items: usersWithCampus,
            total: totalCount,
          };
        } catch (error) {
          logger.error('Error fetching users:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch users',
            cause: error
          });
        }
      });
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          activeCampuses: {
            include: {
              campus: true
            }
          },
          permissions: true,
          coordinatorProfile: true,
          teacherProfile: true,
          studentProfile: true
        }
      });

      if (!user) return null;

      // If user has a primaryCampusId, fetch the campus details
      if (user.primaryCampusId) {
        const primaryCampus = await ctx.prisma.campus.findUnique({
          where: { id: user.primaryCampusId }
        });

        // Add the primary campus to the response
        if (primaryCampus) {
          // Check if the primary campus is already in activeCampuses
          const hasCampus = user.activeCampuses.some(
            (access) => access.campusId === primaryCampus.id
          );

          // If not, add it
          if (!hasCampus) {
            user.activeCampuses.push({
              id: `primary-${user.id}`,
              userId: user.id,
              campusId: primaryCampus.id,
              roleType: user.userType,
              status: user.status,
              startDate: user.createdAt,
              endDate: null,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              deletedAt: null,
              campus: primaryCampus
            });
          }
        }
      }

      return user;
    }),

  getRoles: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.userPermission.findMany({
        where: { userId: input.userId },
      });
    }),

  assignRole: protectedProcedure
    .input(z.object({
      userId: z.string(),
      roleId: z.string(),
      campusId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.userPermission.create({
        data: {
          userId: input.userId,
          permissionId: input.roleId,
          campusId: input.campusId,
        }
      });
    }),

  removeRole: protectedProcedure
    .input(z.object({
      userId: z.string(),
      roleId: z.string(),
      campusId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const permission = await ctx.prisma.userPermission.findFirst({
        where: {
          userId: input.userId,
          permissionId: input.roleId,
          campusId: input.campusId || null
        }
      });

      if (!permission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Permission not found",
        });
      }

      return ctx.prisma.userPermission.delete({
        where: { id: permission.id }
      });
    }),

  getActivity: protectedProcedure
    .input(z.object({
      userId: z.string(),
      dateRange: z.object({
        from: z.date().nullable(),
        to: z.date().nullable(),
      })
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.auditLog.findMany({
        where: {
          userId: input.userId,
          createdAt: {
            gte: input.dateRange.from || undefined,
            lte: input.dateRange.to || undefined,
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }),

  createStudentProfile: protectedProcedure
    .input(createProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService({ prisma: ctx.prisma });
      // Ensure input has all required fields
      const profileInput: CreateProfileInput = {
        userId: input.userId,
        enrollmentNumber: input.enrollmentNumber,
        currentGrade: input.currentGrade,
        academicHistory: input.academicHistory,
        interests: input.interests,
        achievements: input.achievements,
        specialNeeds: input.specialNeeds,
        guardianInfo: input.guardianInfo
      };
      return userService.createStudentProfile(profileInput);
    }),

  createTeacherProfile: protectedProcedure
    .input(z.object({
      userId: z.string(),
      specialization: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService({ prisma: ctx.prisma });
      return userService.createTeacherProfile(input.userId, input.specialization);
    }),

  createCoordinatorProfile: protectedProcedure
    .input(z.object({
      userId: z.string(),
      department: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService({ prisma: ctx.prisma });
      return userService.createCoordinatorProfile(input.userId, input.department);
    }),

  // Create coordinator profiles for all coordinators without profiles
  createMissingCoordinatorProfiles: protectedProcedure
    .mutation(async ({ ctx }) => {
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
          message: "User does not have permission to perform this action",
        });
      }

      try {
        // Find all coordinators without profiles
        const coordinatorsWithoutProfiles = await ctx.prisma.user.findMany({
          where: {
            OR: [
              { userType: UserType.CAMPUS_COORDINATOR },
              { userType: 'COORDINATOR' }
            ],
            coordinatorProfile: null
          }
        });

        console.log(`Found ${coordinatorsWithoutProfiles.length} coordinators without profiles`);

        // Create profiles for each coordinator
        const userService = new UserService({ prisma: ctx.prisma });

        type ProfileResult = {
          userId: string;
          name: string | null;
          email: string | null;
          success: boolean;
          profileId?: string;
          error?: string;
        };

        const results: ProfileResult[] = [];

        for (const coordinator of coordinatorsWithoutProfiles) {
          try {
            const profile = await userService.createCoordinatorProfile(coordinator.id);
            results.push({
              userId: coordinator.id,
              name: coordinator.name,
              email: coordinator.email,
              success: true,
              profileId: profile.id
            });
          } catch (error) {
            results.push({
              userId: coordinator.id,
              name: coordinator.name,
              email: coordinator.email,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        return {
          totalCoordinators: coordinatorsWithoutProfiles.length,
          successCount: results.filter(r => r.success).length,
          failureCount: results.filter(r => !r.success).length,
          results
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create coordinator profiles",
          cause: error,
        });
      }
    }),

  updateStudentProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService({ prisma: ctx.prisma });
      return userService.updateStudentProfile(input.userId, input.data);
    }),

  updateCoordinatorProfile: protectedProcedure
    .input(z.object({
      userId: z.string(),
      department: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Find the coordinator profile
        const profile = await ctx.prisma.coordinatorProfile.findUnique({
          where: { userId: input.userId }
        });

        if (!profile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Coordinator profile not found"
          });
        }

        // Update the profile
        const updatedProfile = await ctx.prisma.coordinatorProfile.update({
          where: { userId: input.userId },
          data: {
            department: input.department,
            updatedAt: new Date()
          }
        });

        return updatedProfile;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update coordinator profile",
          cause: error
        });
      }
    }),

  getProfile: protectedProcedure
    .input(z.object({
      userId: z.string(),
      userType: z.enum(Object.values(UserType) as [string, ...string[]]).transform(val => val as UserType)
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService({ prisma: ctx.prisma });
      return userService.getProfile(input.userId, input.userType);
    }),

  assignToCampus: protectedProcedure
    .input(z.object({
      userId: z.string(),
      campusId: z.string(),
      roleType: z.enum(Object.values(UserType) as [string, ...string[]]).transform(val => val as UserType),
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService({
        prisma: ctx.prisma,
        defaultUserStatus: SystemStatus.ACTIVE,
        passwordHashRounds: 10
      });
      return userService.assignToCampus(input.userId, input.campusId, input.roleType);
    }),

  removeCampusAccess: protectedProcedure
    .input(z.object({ accessId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService({
        prisma: ctx.prisma,
        defaultUserStatus: SystemStatus.ACTIVE,
        passwordHashRounds: 10
      });
      return userService.removeCampusAccess(input.accessId);
    }),

  getPreferences: publicProcedure
    .query(async ({ ctx }) => {
      try {
        if (!ctx.session?.user?.id) {
          // Return default preferences for unauthenticated users
          return {
            theme: 'system',
            notifications: { email: true, push: true, inApp: true, digest: 'daily' },
            display: { density: 'comfortable', fontSize: 'medium', colorScheme: 'default' },
            accessibility: { reduceMotion: false, highContrast: false, screenReader: false, keyboardNavigation: false }
          };
        }

        const userService = new UserService({ prisma: ctx.prisma });
        return userService.getUserPreferences(ctx.session.user.id);
      } catch (error) {
        logger.error("Error getting user preferences", { error });
        return {
          theme: 'system',
          notifications: { email: true, push: true, inApp: true, digest: 'daily' },
          display: { density: 'comfortable', fontSize: 'medium', colorScheme: 'default' },
          accessibility: { reduceMotion: false, highContrast: false, screenReader: false, keyboardNavigation: false }
        };
      }
    }),

  updatePreferences: protectedProcedure
    .input(userPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const userService = new UserService({ prisma: ctx.prisma });
      return userService.updateUserPreferences(ctx.session.user.id, input);
    }),

  getAvailableTeachers: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService({
        prisma: ctx.prisma,
        defaultUserStatus: SystemStatus.ACTIVE,
        passwordHashRounds: 10
      });
      return userService.getAvailableTeachers(input.campusId);
    }),

  // Get users by campus and type
  getUsersByCampus: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      userType: z.enum(Object.values(UserType) as [string, ...string[]]).transform(val => val as UserType).optional(),
      status: z.enum(Object.values(SystemStatus) as [string, ...string[]]).transform(val => val as SystemStatus).optional().default(SystemStatus.ACTIVE),
      search: z.string().optional(),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(10)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { campusId, userType, status, search, page, pageSize } = input;

        // Build where clause
        const where: any = {
          activeCampuses: {
            some: {
              campusId,
              status
            }
          },
          status
        };

        // Add userType filter if provided
        if (userType) {
          where.userType = userType;
        }

        // Add search filter if provided
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { username: { contains: search, mode: 'insensitive' as const } }
          ];
        }

        // Get users with the specified filters
        const users = await ctx.prisma.user.findMany({
          where,
          include: {
            activeCampuses: {
              include: {
                campus: true
              }
            },
            coordinatorProfile: userType === UserType.CAMPUS_COORDINATOR || userType === 'COORDINATOR',
            teacherProfile: userType === UserType.CAMPUS_TEACHER || userType === 'TEACHER',
            studentProfile: userType === UserType.CAMPUS_STUDENT
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { name: 'asc' }
        });

        return users;
      } catch (error) {
        console.error('Error fetching users by campus:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch users',
          cause: error
        });
      }
    }),

  getAvailableStudents: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService({
        prisma: ctx.prisma,
        defaultUserStatus: SystemStatus.ACTIVE,
        passwordHashRounds: 10
      });
      return userService.getAvailableStudents(input.campusId);
    }),

  // Get all students across all campuses
  getAllStudents: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Check if user has system-level access
        if (!['SYSTEM_ADMIN', 'SYSTEM_MANAGER'].includes(ctx.session.user.userType)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only system administrators can access all students",
          });
        }

        // Get all student profiles with their user information
        const students = await ctx.prisma.studentProfile.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
                primaryCampusId: true,
              },
            },
          },
          orderBy: {
            user: {
              name: 'asc',
            },
          },
        });

        return students;
      } catch (error) {
        console.error('Error fetching all students:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch students",
          cause: error,
        });
      }
    }),

  bulkAssignToCampus: protectedProcedure
    .input(z.object({
      userIds: z.array(z.string()),
      campusId: z.string(),
      roleType: z.enum(Object.values(UserType) as [string, ...string[]]).transform(val => val as UserType),
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService({
        prisma: ctx.prisma,
        defaultUserStatus: SystemStatus.ACTIVE,
        passwordHashRounds: 10
      });
      return userService.bulkAssignToCampus(input.userIds, input.campusId, input.roleType);
    }),
});
