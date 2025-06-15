import { TRPCError } from "@trpc/server";
import { hash, compare } from "bcryptjs";
import type { Prisma } from ".prisma/client";
import {
  CreateUserInput,
  UpdateUserInput,
  UserServiceConfig,
  UserFilters,
  CreateProfileInput,
  UpdateProfileInput,
  SystemStatus,
  UserType
} from "../types/user";
import { UserPreferences, DEFAULT_USER_PREFERENCES } from "../constants";

// Re-export UserPreferences type for convenience
export type { UserPreferences } from "../constants";

export class UserService {
  constructor(private config: UserServiceConfig) {}

  // User CRUD Operations
  async createUser(input: CreateUserInput) {
    const { prisma } = this.config;

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          { username: input.username }
        ]
      }
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User with this email or username already exists"
      });
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (input.password) {
      hashedPassword = await hash(input.password, this.config.passwordHashRounds || 10);
    }

    // Create user with proper JSON handling
    const user = await prisma.$transaction(async (tx) => {
      // Create the user first
      const createdUser = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          username: input.username,
          phoneNumber: input.phoneNumber,
          password: hashedPassword,
          userType: input.userType,
          institutionId: input.institutionId, // Direct assignment instead of using connect
          status: this.config.defaultUserStatus || SystemStatus.ACTIVE,
          profileData: input.profileData as Prisma.InputJsonValue,
          accessScope: input.accessScope,
          primaryCampusId: input.primaryCampusId
        }
      });

      // If the user is a student, create their profile
      if (input.userType === UserType.CAMPUS_STUDENT) {
        await tx.studentProfile.create({
          data: {
            userId: createdUser.id,
            enrollmentNumber: input.profileData?.enrollmentNumber || '',
            currentGrade: input.profileData?.currentGrade,
            academicHistory: input.profileData?.academicHistory as Prisma.InputJsonValue,
            interests: input.profileData?.interests || [],
            achievements: (input.profileData?.achievements || []) as Prisma.InputJsonValue[],
            specialNeeds: input.profileData?.specialNeeds as Prisma.InputJsonValue
          }
        });
      }

      // If a primaryCampusId is provided, create a campus access record
      if (input.primaryCampusId) {
        await tx.userCampusAccess.create({
          data: {
            userId: createdUser.id,
            campusId: input.primaryCampusId,
            roleType: input.userType,
            status: SystemStatus.ACTIVE,
            startDate: new Date()
          }
        });
      }

      return createdUser;
    });

    return user;
  }

  async getUser(id: string) {
    const { prisma } = this.config;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        teacherProfile: true,
        coordinatorProfile: true,
        permissions: {
          include: {
            permission: true
          }
        },
        activeCampuses: {
          include: {
            campus: true
          }
        }
      }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    return user;
  }

  async updateUser(id: string, input: UpdateUserInput) {
    const { prisma } = this.config;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    // Hash new password if provided
    let hashedPassword: string | undefined;
    if (input.password) {
      hashedPassword = await hash(input.password, this.config.passwordHashRounds || 10);
    }

    // Update user with proper JSON handling
    const userData: Prisma.UserUpdateInput = {
      ...input,
      password: hashedPassword || undefined,
      profileData: input.profileData as Prisma.InputJsonValue
    };

    const updatedUser = await prisma.user.update({
      where: { id },
      data: userData
    });

    return updatedUser;
  }

  async deleteUser(id: string) {
    const { prisma } = this.config;

    // Soft delete by updating status
    await prisma.user.update({
      where: { id },
      data: {
        status: SystemStatus.DELETED,
        deletedAt: new Date()
      }
    });
  }

  async listUsers(filters: UserFilters, skip?: number, take?: number) {
    const { prisma } = this.config;

    const where: Prisma.UserWhereInput = {
      institutionId: filters.institutionId,
      userType: filters.userType,
      status: filters.status,
      OR: filters.search ? [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } }
      ] : undefined,
      activeCampuses: filters.campusId ? {
        some: {
          campusId: filters.campusId
        }
      } : undefined
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          studentProfile: true,
          teacherProfile: true,
          coordinatorProfile: true,
          permissions: {
            include: {
              permission: true
            }
          },
          activeCampuses: {
            include: {
              campus: true
            }
          }
        },
        skip,
        take
      })
    ]);

    return {
      total,
      items: users
    };
  }

  // Profile Management
  async createStudentProfile(input: CreateProfileInput) {
    const { prisma } = this.config;

    const user = await prisma.user.findUnique({
      where: { id: input.userId }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    if (user.userType !== UserType.CAMPUS_STUDENT) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User is not a student"
      });
    }

    const profileData: Prisma.StudentProfileCreateInput = {
      user: { connect: { id: input.userId } },
      enrollmentNumber: input.enrollmentNumber!,
      currentGrade: input.currentGrade,
      academicHistory: input.academicHistory as Prisma.InputJsonValue,
      interests: input.interests || [],
      achievements: input.achievements as Prisma.InputJsonValue[] || [],
      specialNeeds: input.specialNeeds as Prisma.InputJsonValue,
      guardianInfo: input.guardianInfo as Prisma.InputJsonValue
    };

    const profile = await prisma.studentProfile.create({
      data: profileData
    });

    return profile;
  }

  async createTeacherProfile(userId: string, specialization?: string) {
    const { prisma } = this.config;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    if (user.userType !== UserType.CAMPUS_TEACHER) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User is not a teacher"
      });
    }

    const profile = await prisma.teacherProfile.create({
      data: {
        userId,
        specialization,
        qualifications: [],
        certifications: [],
        experience: [],
        expertise: [],
        publications: [],
        achievements: []
      }
    });

    return profile;
  }

  async createCoordinatorProfile(userId: string, department?: string) {
    const { prisma } = this.config;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    // Check if user is a coordinator (using string comparison for flexibility)
    if (user.userType !== UserType.CAMPUS_COORDINATOR &&
        user.userType !== 'COORDINATOR' &&
        user.userType !== 'CAMPUS_COORDINATOR') {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User is not a coordinator"
      });
    }

    const profile = await prisma.coordinatorProfile.create({
      data: {
        userId,
        department,
        qualifications: [],
        responsibilities: [],
        managedPrograms: [],
        managedCourses: []
      }
    });

    return profile;
  }

  async updateStudentProfile(userId: string, input: UpdateProfileInput) {
    const { prisma } = this.config;

    const profileData: Prisma.StudentProfileUpdateInput = {
      currentGrade: input.currentGrade,
      academicHistory: input.academicHistory as Prisma.InputJsonValue,
      interests: input.interests,
      achievements: input.achievements as Prisma.InputJsonValue[],
      specialNeeds: input.specialNeeds as Prisma.InputJsonValue,
      guardianInfo: input.guardianInfo as Prisma.InputJsonValue
    };

    const profile = await prisma.studentProfile.update({
      where: { userId },
      data: profileData
    });

    return profile;
  }

  async getProfile(userId: string, userType: UserType) {
    const { prisma } = this.config;

    switch (userType) {
      case UserType.CAMPUS_STUDENT:
        return prisma.studentProfile.findUnique({
          where: { userId }
        });
      case UserType.CAMPUS_TEACHER:
        return prisma.teacherProfile.findUnique({
          where: { userId }
        });
      case UserType.CAMPUS_COORDINATOR:
        return prisma.coordinatorProfile.findUnique({
          where: { userId }
        });
      default:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid user type for profile"
        });
    }
  }

  // Authentication
  async validateCredentials(username: string, password: string) {
    const { prisma } = this.config;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ],
        status: SystemStatus.ACTIVE
      }
    });

    if (!user || !user.password) {
      return null;
    }

    const isValid = await compare(password, user.password);
    return isValid ? user : null;
  }

  // Campus Access Management
  async assignToCampus(userId: string, campusId: string, roleType: UserType) {
    const { prisma } = this.config;

    // Use upsert to avoid unique constraint errors
    const access = await prisma.userCampusAccess.upsert({
      where: {
        userId_campusId: {
          userId,
          campusId
        }
      },
      update: {
        roleType,
        status: SystemStatus.ACTIVE
      },
      create: {
        userId,
        campusId,
        roleType,
        status: SystemStatus.ACTIVE,
        startDate: new Date()
      }
    });

    return access;
  }

  /**
   * Get available teachers that can be assigned to a campus
   * @param campusId Campus ID
   * @returns List of available teachers
   */
  async getAvailableTeachers(campusId: string) {
    const { prisma } = this.config;

    try {
      // Get users with teacher profiles who are not already assigned to this campus
      const teachers = await prisma.user.findMany({
        where: {
          userType: UserType.CAMPUS_TEACHER,
          teacherProfile: {
            isNot: null,
          },
          NOT: {
            activeCampuses: {
              some: {
                campusId,
                status: SystemStatus.ACTIVE,
              },
            },
          },
        },
        include: {
          teacherProfile: {
            select: {
              id: true,
              qualifications: true,
              specialization: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Map the access records to include user data
      const campusTeachers = teachers.map(teacher => ({
        ...teacher,
        user: teacher,
      }));

      return {
        success: true,
        teachers: campusTeachers,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get available teachers",
        cause: error,
      });
    }
  }

  /**
   * Get available students that can be enrolled to a campus
   * @param campusId Campus ID
   * @returns List of available students
   */
  async getAvailableStudents(campusId: string) {
    const { prisma } = this.config;

    try {
      // Get users with student profiles who are not already assigned to this campus
      const students = await prisma.user.findMany({
        where: {
          userType: UserType.CAMPUS_STUDENT,
          studentProfile: {
            isNot: null,
          },
          NOT: {
            activeCampuses: {
              some: {
                campusId,
                status: SystemStatus.ACTIVE,
              },
            },
          },
        },
        include: {
          studentProfile: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        students,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get available students",
        cause: error,
      });
    }
  }

  /**
   * Remove user access from a campus
   * @param accessId UserCampusAccess ID
   * @returns Success status
   */
  async removeCampusAccess(accessId: string) {
    const { prisma } = this.config;

    try {
      // Get access record
      const access = await prisma.userCampusAccess.findUnique({
        where: { id: accessId },
        include: {
          user: {
            include: {
              teacherProfile: {
                include: {
                  _count: {
                    select: {
                      assignments: true,
                    },
                  },
                },
              },
              studentProfile: {
                include: {
                  _count: {
                    select: {
                      enrollments: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!access) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campus access record not found",
        });
      }

      // Check for dependencies
      if (access.user.teacherProfile &&
          (access.user.teacherProfile._count.assignments > 0)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot remove teacher with active classes",
        });
      }

      if (access.user.studentProfile &&
          access.user.studentProfile._count.enrollments > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot remove student with active enrollments",
        });
      }

      // Update the access record to inactive
      await prisma.userCampusAccess.update({
        where: { id: accessId },
        data: {
          status: SystemStatus.INACTIVE,
          endDate: new Date(),
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove campus access",
        cause: error,
      });
    }
  }

  /**
   * Bulk assign users to a campus
   * @param userIds List of user IDs
   * @param campusId Campus ID
   * @param roleType User role type
   * @returns List of created access records
   */
  async bulkAssignToCampus(userIds: string[], campusId: string, roleType: UserType) {
    const { prisma } = this.config;

    try {
      // Check if campus exists
      const campus = await prisma.campus.findUnique({
        where: { id: campusId },
      });

      if (!campus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campus not found",
        });
      }

      // Check if all users exist
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });

      if (users.length !== userIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more users not found",
        });
      }

      // Create access records for each user
      const accessRecords = await Promise.all(
        userIds.map(async (userId) => {
          // Check if user already has access to this campus
          const existingAccess = await prisma.userCampusAccess.findFirst({
            where: {
              userId,
              campusId,
              status: SystemStatus.ACTIVE,
            },
          });

          if (existingAccess) {
            return existingAccess;
          }

          // Create new access record
          return prisma.userCampusAccess.create({
            data: {
              userId,
              campusId,
              roleType,
              status: SystemStatus.ACTIVE,
            },
          });
        })
      );

      return {
        success: true,
        accessRecords,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to bulk assign users to campus",
        cause: error,
      });
    }
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const { prisma } = this.config;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        userType: true,
        profileData: true
      }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    // Ensure the userType is valid before accessing DEFAULT_USER_PREFERENCES
    if (!(user.userType in DEFAULT_USER_PREFERENCES)) {
      // Fallback to default preferences if user type is not found
      return DEFAULT_USER_PREFERENCES[UserType.CAMPUS_STUDENT];
    }

    // Get default preferences based on user type
    const basePreferences = DEFAULT_USER_PREFERENCES[user.userType as keyof typeof DEFAULT_USER_PREFERENCES];

    // Extract stored preferences from profileData if they exist
    const storedPreferences = user.profileData && typeof user.profileData === 'object' && 'preferences' in user.profileData
      ? (user.profileData as { preferences: Partial<UserPreferences> }).preferences
      : {};

    // Merge default preferences with stored preferences
    return {
      ...basePreferences,
      ...storedPreferences,
      notifications: {
        ...basePreferences.notifications,
        ...(storedPreferences.notifications || {})
      },
      display: {
        ...basePreferences.display,
        ...(storedPreferences.display || {})
      },
      accessibility: {
        ...basePreferences.accessibility,
        ...(storedPreferences.accessibility || {})
      }
    };
  }

  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<UserPreferences> {
    const { prisma } = this.config;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileData: true
      }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    // Prepare the updated profileData
    const currentProfileData = user.profileData as Prisma.JsonObject || {};
    const updatedProfileData = {
      ...currentProfileData,
      preferences: preferences as unknown as Prisma.JsonValue
    };

    // Update the user's profileData
    await prisma.user.update({
      where: { id: userId },
      data: {
        profileData: updatedProfileData as Prisma.InputJsonValue
      }
    });

    return preferences;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const { prisma } = this.config;

    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        status: { not: SystemStatus.DELETED }
      }
    });

    return !!existingUser;
  }
}







