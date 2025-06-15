import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { StudentService } from "../services/student.service";
import { TRPCError } from "@trpc/server";
import { SystemStatus, UserType, ActivityPurpose } from "@prisma/client";
import { logger } from "../utils/logger";
import { format } from "date-fns";

export const studentRouter = createTRPCRouter({
  // Import students from file with batch processing for large datasets
  importStudents: protectedProcedure
    .input(
      z.object({
        campusId: z.string(),
        students: z.array(
          z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string().email(),
            enrollmentNumber: z.string().optional(),
            phone: z.string().optional(),
            programId: z.string().optional(),
            termId: z.string().optional(),
          }).passthrough()
        ),
        mapping: z.record(z.string()).optional(),
        batchNumber: z.number().optional(),
        totalBatches: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      const adminRoles = ['SYSTEM_ADMIN', 'SYSTEM_MANAGER', 'CAMPUS_ADMIN'];
      if (!adminRoles.includes(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have permission to import students"
        });
      }

      try {
        // Log batch information if this is part of a batched import
        if (input.batchNumber && input.totalBatches) {
          logger.info(`Processing student import batch ${input.batchNumber}/${input.totalBatches} with ${input.students.length} records`);
        } else {
          logger.info(`Processing student import with ${input.students.length} records`);
        }

        // In a real implementation, we would:
        // 1. Validate all student records
        // 2. Check for duplicates (by email or enrollment number)
        // 3. Create new users and student profiles
        // 4. Assign to programs/terms if specified
        // 5. Track success/failure for each record

        // For large imports, we'd use database transactions and batch inserts

        // For now, we'll simulate the process with mock data
        // In a real implementation, we'd process the actual data

        // Simulate some validation and processing
        const results = {
          total: input.students.length,
          success: 0,
          failed: 0,
          warnings: 0,
          details: [] as Array<{ index: number, status: string, reason: string }>
        };

        // Simulate processing each student
        for (let i = 0; i < input.students.length; i++) {
          const student = input.students[i];

          // Simulate email validation and duplicate checking
          if (student.email.includes('duplicate')) {
            results.failed++;
            results.details.push({
              index: i,
              status: 'failed',
              reason: 'Email already exists'
            });
            continue;
          }

          // Simulate program assignment validation
          if (!student.programId) {
            results.warnings++;
            results.details.push({
              index: i,
              status: 'warning',
              reason: 'Missing program assignment'
            });
          }

          // Simulate successful import
          results.success++;
        }

        // In a real implementation, we'd commit the transaction here

        return results;
      } catch (error) {
        // In a real implementation, we'd roll back the transaction here

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
        campusId: z.string(),
        format: z.enum(['CSV', 'EXCEL']),
        programId: z.string().optional(),
        termId: z.string().optional(),
        includeInactive: z.boolean().default(false),
        includeDetails: z.boolean().default(true),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      const adminRoles = ['SYSTEM_ADMIN', 'SYSTEM_MANAGER', 'CAMPUS_ADMIN', 'CAMPUS_COORDINATOR'];
      if (!adminRoles.includes(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have permission to export students"
        });
      }

      try {
        // First, get a count of students to determine if this is a large dataset
        const studentCount = await ctx.prisma.studentProfile.count({
          where: {
            user: {
              activeCampuses: {
                some: {
                  campusId: input.campusId,
                  status: input.includeInactive ? undefined : 'ACTIVE',
                }
              }
            },
            ...(input.programId ? {
              enrollments: {
                some: {
                  class: {
                    courseCampus: {
                      course: {
                        programCourses: {
                          some: {
                            programId: input.programId
                          }
                        }
                      }
                    }
                  }
                }
              }
            } : {}),
            ...(input.termId ? {
              enrollments: {
                some: {
                  class: {
                    termId: input.termId
                  }
                }
              }
            } : {})
          }
        });

        // For very large datasets (>10,000 records), use a different approach
        const LARGE_DATASET_THRESHOLD = 10000;
        const isLargeDataset = studentCount > LARGE_DATASET_THRESHOLD;

        if (isLargeDataset) {
          // For large datasets, we'll create a background job and return a download URL
          // This is a placeholder - in a real implementation, you'd create a job and store the file

          // Log the export request
          logger.info(`Large student export requested: ${studentCount} records, format: ${input.format}`);

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
            fileName: input.fileName || `students_export_${format(new Date(), 'yyyy-MM-dd')}`,
            format: input.format
          };
        }

        // For smaller datasets, process in the request
        // Get students with pagination to avoid memory issues
        const pageSize = 1000;
        let allStudents = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const students = await ctx.prisma.studentProfile.findMany({
            where: {
              user: {
                activeCampuses: {
                  some: {
                    campusId: input.campusId,
                    status: input.includeInactive ? undefined : 'ACTIVE',
                  }
                }
              },
              ...(input.programId ? {
                enrollments: {
                  some: {
                    class: {
                      courseCampus: {
                        course: {
                          programCourses: {
                            some: {
                              programId: input.programId
                            }
                          }
                        }
                      }
                    }
                  }
                }
              } : {}),
              ...(input.termId ? {
                enrollments: {
                  some: {
                    class: {
                      termId: input.termId
                    }
                  }
                }
              } : {})
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phoneNumber: true,
                  status: true,
                  createdAt: true,
                }
              },
              enrollments: {
                where: {
                  status: 'ACTIVE',
                },
                include: {
                  class: {
                    include: {
                      courseCampus: {
                        include: {
                          course: true
                        }
                      },
                      term: true
                    }
                  }
                }
              },
              ...(input.includeDetails ? {
                emergencyContacts: true,
                addresses: true,
              } : {})
            },
            orderBy: {
              user: {
                name: 'asc',
              }
            },
            skip: page * pageSize,
            take: pageSize,
          });

          if (students.length === 0) {
            hasMore = false;
          } else {
            allStudents = [...allStudents, ...students];
            page++;
          }
        }

        // Format data for export
        let content = '';

        if (input.format === 'CSV') {
          // Create headers
          const headers = [
            'Name',
            'Email',
            'Enrollment Number',
            'Status',
            'Created Date'
          ];

          if (input.includeDetails) {
            headers.push(
              'Phone',
              'Program',
              'Term',
              'Classes',
              'Address',
              'Emergency Contact'
            );
          }

          content = headers.join(',') + '\n';

          // Add student data - process in chunks to avoid memory issues
          const chunkSize = 500;
          for (let i = 0; i < allStudents.length; i += chunkSize) {
            const chunk = allStudents.slice(i, i + chunkSize);

            chunk.forEach(student => {
              const program = student.enrollments[0]?.class.courseCampus.course.name || '';
              const term = student.enrollments[0]?.class.term?.name || '';
              const classes = student.enrollments.length;
              const address = student.addresses && student.addresses[0] ?
                `${student.addresses[0].street}, ${student.addresses[0].city}` : '';
              const emergencyContact = student.emergencyContacts && student.emergencyContacts[0] ?
                `${student.emergencyContacts[0].name} (${student.emergencyContacts[0].relationship})` : '';

              // Escape fields that might contain commas
              const escapeCsvField = (field: string) => {
                if (field && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
                  return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
              };

              const row = [
                escapeCsvField(student.user.name),
                escapeCsvField(student.user.email),
                escapeCsvField(student.enrollmentNumber || ''),
                escapeCsvField(student.user.status),
                format(new Date(student.user.createdAt), 'yyyy-MM-dd')
              ];

              if (input.includeDetails) {
                row.push(
                  escapeCsvField(student.user.phoneNumber || ''),
                  escapeCsvField(program),
                  escapeCsvField(term),
                  classes.toString(),
                  escapeCsvField(address),
                  escapeCsvField(emergencyContact)
                );
              }

              content += row.join(',') + '\n';
            });
          }
        } else if (input.format === 'EXCEL') {
          // For Excel, we'd use a library like xlsx
          // This is just a placeholder
          content = JSON.stringify(allStudents);
        }

        return {
          isLargeDataset: false,
          content,
          totalRecords: allStudents.length,
          fileName: input.fileName || `students_export_${format(new Date(), 'yyyy-MM-dd')}`,
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

  // Get activities for a specific class
  getClassActivities: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Verify the user is authenticated
        const userId = ctx.session.user.id;
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        // Find the student profile
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId },
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Check if the student is enrolled in this class
        const enrollment = await ctx.prisma.studentEnrollment.findFirst({
          where: {
            studentId: studentProfile.id,
            classId: input.classId,
            status: SystemStatus.ACTIVE,
          },
        });

        if (!enrollment) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Student is not enrolled in this class",
          });
        }

        // Get all activities for this class
        const activities = await ctx.prisma.activity.findMany({
          where: {
            classId: input.classId,
            status: SystemStatus.ACTIVE,
          },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            },
            topic: {
              select: {
                id: true,
                title: true,
                code: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return activities;
      } catch (error) {
        logger.error("Error fetching class activities:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch class activities",
        });
      }
    }),
  // Get detailed information about a specific class for a student
  getClassDetails: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Verify the user has access to this class
        const userId = ctx.session.user.id;

        // Find the student profile
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId },
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Check if the student is enrolled in this class
        const enrollment = await ctx.prisma.studentEnrollment.findFirst({
          where: {
            studentId: studentProfile.id,
            classId: input.classId,
            status: SystemStatus.ACTIVE,
          },
        });

        if (!enrollment) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Student is not enrolled in this class",
          });
        }

        // Get class details
        const classData = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {
            courseCampus: {
              include: {
                course: true,
              },
            },
            term: true,
          },
        });

        if (!classData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Get student's average grade in this class
        const grades = await ctx.prisma.activityGrade.findMany({
          where: {
            studentId: studentProfile.id,
            activity: {
              classId: input.classId,
              isGradable: true,
            },
          },
          include: {
            activity: {
              select: {
                maxScore: true,
                weightage: true,
              },
            },
          },
        });

        // Calculate weighted average grade
        let totalWeightedScore = 0;
        let totalWeight = 0;

        grades.forEach(grade => {
          const weight = grade.activity.weightage || 1;
          const maxScore = grade.activity.maxScore || 100;
          // Add null check for grade.score
          const score = grade.score ?? 0;
          const percentage = (score / maxScore) * 100;

          totalWeightedScore += percentage * weight;
          totalWeight += weight;
        });

        const averageGrade = totalWeight > 0
          ? Math.round(totalWeightedScore / totalWeight)
          : 0;

        // Get student's leaderboard position
        const leaderboardPosition = await ctx.prisma.studentEnrollment.count({
          where: {
            classId: input.classId,
            status: SystemStatus.ACTIVE,
            student: {
              ActivityGrade: {
                some: {
                  activity: {
                    classId: input.classId,
                    isGradable: true,
                  },
                  score: {
                    gt: averageGrade,
                  },
                },
              },
            },
          },
        }) + 1; // Add 1 to get the position (1-based index)

        // Get student's points in this class
        const points = await ctx.prisma.studentPoints.aggregate({
          where: {
            studentId: studentProfile.id,
            classId: input.classId,
          },
          _sum: {
            amount: true,
          },
        });

        // Get student's level based on points
        const totalPoints = points._sum.amount || 0;
        const level = Math.floor(Math.sqrt(totalPoints / 100)) + 1; // Simple level calculation

        // Get student's achievements in this class
        const achievements = await ctx.prisma.studentAchievement.findMany({
          where: {
            studentId: studentProfile.id,
            classId: input.classId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Get student's attendance in this class
        const attendance = await ctx.prisma.attendance.findMany({
          where: {
            studentId: studentProfile.id,
            classId: input.classId,
          },
        });

        const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
        const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
        const lateCount = attendance.filter(a => a.status === 'LATE').length;
        const totalAttendance = attendance.length;

        const attendancePercentage = totalAttendance > 0
          ? Math.round((presentCount / totalAttendance) * 100)
          : 0;

        // Return the compiled class details
        return {
          classId: classData.id,
          className: classData.name,
          courseId: classData.courseCampus?.course?.id,
          courseName: classData.courseCampus?.course?.name,
          termId: classData.term?.id,
          termName: classData.term?.name,
          averageGrade,
          leaderboardPosition,
          points: totalPoints,
          level,
          achievements: achievements.map((a) => ({
            id: a.id,
            title: a.title || 'Achievement', // Changed from 'name' to 'title' to match the interface
            description: a.description || '',
            iconUrl: a.icon || '',
            earnedAt: a.createdAt,
            type: a.type,
            progress: a.progress || 100,
          })),
          attendance: {
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            total: totalAttendance,
            percentage: attendancePercentage,
          },
          status: classData.status,
        };
      } catch (error) {
        console.error('Error getting class details:', error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving class details",
            });
      }
    }),
  // Get classes for a specific student
  getStudentClasses: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Find the student profile
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId: input.studentId },
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Find all active enrollments for this student
        const enrollments = await ctx.prisma.studentEnrollment.findMany({
          where: {
            studentId: studentProfile.id,
            status: SystemStatus.ACTIVE,
          },
          include: {
            class: {
              include: {
                courseCampus: {
                  include: {
                    course: true,
                  },
                },
                term: true,
              },
            },
          },
        });

        // Return the classes
        return enrollments.map(enrollment => enrollment.class);
      } catch (error) {
        console.error('Error getting student classes:', error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving student classes",
            });
      }
    }),
  getStudentsWithAttendanceIssues: protectedProcedure
    .input(
      z.object({
        campusId: z.string(),
        threshold: z.number().min(0).max(100).default(75),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check permissions
      const adminRoles = ['SYSTEM_ADMIN', 'SYSTEM_MANAGER', 'CAMPUS_ADMIN', 'CAMPUS_COORDINATOR'];
      if (!adminRoles.includes(ctx.session.user.userType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get students with attendance below threshold using real database queries
        const { campusId, threshold, startDate, endDate } = input;

        // Get all classes for this campus
        const classes = await ctx.prisma.class.findMany({
          where: {
            campusId,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            name: true,
          },
        });

        const classIds = classes.map(c => c.id);

        // Get all student enrollments for these classes
        const enrollments = await ctx.prisma.studentEnrollment.findMany({
          where: {
            classId: {
              in: classIds,
            },
            status: 'ACTIVE',
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                attendance: {
                  where: {
                    classId: {
                      in: classIds,
                    },
                    ...(startDate && endDate ? {
                      date: {
                        gte: startDate,
                        lte: endDate,
                      },
                    } : {}),
                  },
                  orderBy: {
                    date: 'desc',
                  },
                  take: 1, // Get the most recent attendance record
                },
              },
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Calculate attendance rates and filter students with low attendance
        type StudentWithIssue = {
          id: string;
          name: string;
          enrollmentNumber: string;
          className: string;
          attendanceRate: number;
          lastAttendance: Date | undefined;
        };

        const studentsWithIssues: StudentWithIssue[] = [];

        for (const enrollment of enrollments) {
          // Get all attendance records for this student in this class
          const attendanceRecords = await ctx.prisma.attendance.findMany({
            where: {
              studentId: enrollment.studentId,
              classId: enrollment.classId,
              ...(startDate && endDate ? {
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              } : {}),
            },
          });

          if (attendanceRecords.length === 0) continue; // Skip if no attendance records

          // Calculate attendance rate
          const presentCount = attendanceRecords.filter(record =>
            record.status === 'PRESENT'
          ).length;

          const attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100);

          // Check if attendance is below threshold
          if (attendanceRate < threshold) {
            // Get the most recent attendance record
            const lastAttendance = attendanceRecords.sort((a, b) =>
              b.date.getTime() - a.date.getTime()
            )[0]?.date;

            studentsWithIssues.push({
              id: enrollment.student.user.id,
              name: enrollment.student.user.name || 'Unnamed Student',
              enrollmentNumber: enrollment.student.enrollmentNumber || '',
              className: enrollment.class.name,
              attendanceRate,
              lastAttendance,
            });
          }
        }

        return studentsWithIssues;
      } catch (error) {
        console.error('Error in getStudentsWithAttendanceIssues:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve students with attendance issues",
          cause: error,
        });
      }
    }),
  getAllStudentsByCampus: protectedProcedure
    .input(
      z.object({
        campusId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get user's primary campus ID if not specified
      const campusId = input.campusId || ctx.session.user.primaryCampusId;

      if (!campusId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No campus ID specified or found in user profile',
        });
      }

      // Fetch all students associated with the campus
      const students = await ctx.prisma.studentProfile.findMany({
        where: {
          user: {
            activeCampuses: {
              some: {
                campusId: campusId,
                status: 'ACTIVE',
              },
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
    }),

  getStudentEnrollments: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Find all active enrollments for the specified class
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

      return enrollments;
    }),

  enrollStudentToCampus: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        campusId: z.string(),
        programId: z.string(),
        termId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const studentService = new StudentService({ prisma: ctx.prisma });
      return studentService.enrollStudentToCampus(input);
    }),

  // Get all classes for the current student
  getCurrentStudentClasses: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Ensure user is authenticated and is a student
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        // Find the student profile
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId: ctx.session.user.id },
        });

        if (!studentProfile) {
          logger.warn("Student profile not found", { userId: ctx.session.user.id });
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Find all active enrollments for this student
        const enrollments = await ctx.prisma.studentEnrollment.findMany({
          where: {
            studentId: studentProfile.id,
            status: SystemStatus.ACTIVE,
          },
          include: {
            class: {
              include: {
                courseCampus: {
                  include: {
                    course: {
                      include: {
                        subjects: true
                      }
                    }
                  }
                },
                term: true,
                classTeacher: {
                  include: {
                    user: true
                  }
                },
                facility: true
              }
            }
          },
        });

        // Get all activities for the student's classes
        const classIds = enrollments.map(enrollment => enrollment.class.id);

        // Get activities for these classes
        const activities = await ctx.prisma.activity.findMany({
          where: {
            classId: { in: classIds },
            status: SystemStatus.ACTIVE,
          },
          select: {
            id: true,
            classId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Group activities by class
        const activitiesByClass = activities.reduce((acc, activity) => {
          if (!acc[activity.classId]) {
            acc[activity.classId] = [];
          }
          acc[activity.classId].push(activity);
          return acc;
        }, {} as Record<string, any[]>);

        // Transform the data to match the expected format
        const classes = enrollments.map(enrollment => {
          const cls = enrollment.class;
          const course = cls.courseCampus?.course;
          const teacher = cls.classTeacher?.user;
          const classActivities = activitiesByClass[cls.id] || [];

          // Calculate activity counts
          const activitiesCount = classActivities.length;

          // Get the last activity date
          const lastActivity = classActivities.length > 0
            ? new Date(classActivities[0].createdAt)
            : new Date();

          return {
            id: cls.id,
            name: cls.name,
            subject: {
              id: course?.id || '',
              name: course?.name || 'Unknown Subject',
              code: course?.code || ''
            },
            teacher: teacher ? {
              id: teacher.id,
              name: teacher.name || 'Unknown Teacher',
              avatar: undefined // Profile image would need to be fetched from a different source
            } : undefined,
            schedule: cls.facility ? {
              days: ['Mon', 'Wed', 'Fri'], // Default schedule - would need to be fetched from actual schedule data
              startTime: '09:00',
              endTime: '10:30'
            } : undefined,
            progress: 0, // This would need to be calculated based on activity completion
            activitiesCount,
            pendingActivitiesCount: 0, // This would need to be fetched from activities with status
            lastActivity,
            importance: activitiesCount > 10 ? 'high' : activitiesCount > 5 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
            isNewTerm: cls.term?.startDate ?
              (new Date().getTime() - new Date(cls.term.startDate).getTime()) < (30 * 24 * 60 * 60 * 1000) : false // New if term started less than 30 days ago
          };
        });

        return classes;
      } catch (error) {
        logger.error("Error fetching student classes", { error });
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving student classes",
            });
      }
    }),



  enrollInProgram: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        programId: z.string(),
        campusId: z.string(),
        termId: z.string(),
        startDate: z.date().optional(),
        status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED']).optional().default('ACTIVE'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if student exists
      const student = await ctx.prisma.studentProfile.findUnique({
        where: { id: input.studentId },
      });

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student not found',
        });
      }

      // Check if program exists
      const program = await ctx.prisma.program.findUnique({
        where: { id: input.programId },
      });

      if (!program) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Program not found',
        });
      }

      // Check if term exists
      const term = await ctx.prisma.term.findUnique({
        where: { id: input.termId },
      });

      if (!term) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Term not found',
        });
      }

      // Check for existing enrollment
      const existingEnrollment = await ctx.prisma.studentEnrollment.findFirst({
        where: {
          studentId: input.studentId,
          class: {
            courseCampus: {
              programCampus: {
                programId: input.programId,
                campusId: input.campusId,
              }
            }
          },
          status: SystemStatus.ACTIVE,
        },
      });

      if (existingEnrollment) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Student is already enrolled in this program',
        });
      }

      // Find the appropriate class for enrollment
      const targetClass = await ctx.prisma.class.findFirst({
        where: {
          courseCampus: {
            programCampus: {
              programId: input.programId,
              campusId: input.campusId,
            }
          },
          termId: input.termId,
          status: SystemStatus.ACTIVE,
        },
      });

      if (!targetClass) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active class found for the given program, campus, and term',
        });
      }

      // Create new enrollment
      return ctx.prisma.studentEnrollment.create({
        data: {
          studentId: input.studentId,
          classId: targetClass.id,
          startDate: input.startDate || new Date(),
          status: input.status === 'ACTIVE' ? SystemStatus.ACTIVE : SystemStatus.INACTIVE,
          createdById: ctx.session.user.id,
        },
        include: {
          class: {
            include: {
              courseCampus: {
                include: {
                  programCampus: {
                    include: {
                      program: true,
                    }
                  }
                }
              },
              term: true,
            }
          },
        },
      });
    }),

  // Get student enrollments and available programs/terms for a campus
  getStudentEnrollments: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      campusId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get available programs for this campus
        const availablePrograms = await ctx.prisma.program.findMany({
          where: {
            campusOfferings: {
              some: {
                campusId: input.campusId,
                status: SystemStatus.ACTIVE,
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
        const activeTerms = await ctx.prisma.term.findMany({
          where: {
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
          orderBy: {
            startDate: "desc",
          },
        });

        return {
          availablePrograms,
          activeTerms,
        };
      } catch (error) {
        console.error('Error getting student enrollments:', error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving enrollment data",
            });
      }
    }),

  // Fix missing campus access for student profiles
  fixStudentCampusAccess: protectedProcedure
    .input(z.object({
      campusId: z.string().optional(), // Optional - if not provided, will use the first available campus
    }))
    .mutation(async ({ ctx, input }) => {
      // Only allow admin users to run this
      const allowedRoles = ['SYSTEM_ADMIN', 'CAMPUS_ADMIN'];
      if (!allowedRoles.includes(ctx.session.user.userType as string)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only admin users can fix student campus access"
        });
      }

      // Get the campus to use
      let campusId = input.campusId;

      if (!campusId) {
        // If no campusId provided, get the first available campus
        const firstCampus = await ctx.prisma.campus.findFirst({
          where: { status: SystemStatus.ACTIVE },
          orderBy: { createdAt: 'asc' },
          select: { id: true }
        });

        if (!firstCampus) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active campus found"
          });
        }

        campusId = firstCampus.id;
      } else {
        // Verify the campus exists
        const campus = await ctx.prisma.campus.findUnique({
          where: { id: campusId }
        });

        if (!campus) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campus not found"
          });
        }
      }

      // Find all student users
      const studentUsers = await ctx.prisma.user.findMany({
        where: {
          userType: UserType.CAMPUS_STUDENT,
          status: SystemStatus.ACTIVE
        },
        include: {
          activeCampuses: true,
          studentProfile: true
        }
      });

      // Keep track of changes
      const results = {
        total: studentUsers.length,
        primaryCampusUpdated: 0,
        campusAccessAdded: 0,
        details: [] as any[]
      };

      // Process each student
      for (const user of studentUsers) {
        const changes = {
          id: user.id,
          name: user.name,
          email: user.email,
          primaryCampusUpdated: false,
          campusAccessAdded: false
        };

        // Update primary campus if missing
        if (!user.primaryCampusId) {
          await ctx.prisma.user.update({
            where: { id: user.id },
            data: { primaryCampusId: campusId }
          });

          changes.primaryCampusUpdated = true;
          results.primaryCampusUpdated++;
        }

        // Add campus access if missing
        const hasCampusAccess = user.activeCampuses.some(
          access => access.campusId === (user.primaryCampusId || campusId) &&
                  access.status === SystemStatus.ACTIVE
        );

        if (!hasCampusAccess) {
          await ctx.prisma.userCampusAccess.create({
            data: {
              userId: user.id,
              campusId: user.primaryCampusId || campusId,
              roleType: UserType.CAMPUS_STUDENT,
              status: SystemStatus.ACTIVE,
              startDate: new Date()
            }
          });

          changes.campusAccessAdded = true;
          results.campusAccessAdded++;
        }

        results.details.push(changes);
      }

      return results;
    })
});
