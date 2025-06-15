import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import type { Prisma } from '@prisma/client';
import { ClassService } from '../services/class.service';
import { GradeService } from '../services/grade.service';
import { validateInput } from '../utils/validation';
import { classCapacitySchema } from '@/server/api/schemas/class.schema';
import { TRPCError } from '@trpc/server';
import { SystemStatus, ActivityPurpose, LearningActivityType, AssessmentType, PeriodType, GradingType, GradingScale, DayOfWeek } from '@prisma/client';

const createClassSchema = z.object({
  code: z.string(),
  name: z.string(),
  courseCampusId: z.string(),
  campusId: z.string(),
  termId: z.string(),
  minCapacity: z.number().optional(),
  maxCapacity: z.number().optional(),
  classTeacherId: z.string().optional(),
  facilityId: z.string().optional(),
  programCampusId: z.string(),
  // Gradebook settings
  gradebook: z.object({
    gradingType: z.nativeEnum(GradingType).default(GradingType.MANUAL),
    gradingScale: z.nativeEnum(GradingScale).default(GradingScale.PERCENTAGE),
    settings: z.record(z.unknown()).optional(),
  }).optional()
});

const updateClassSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  minCapacity: z.number().optional(),
  maxCapacity: z.number().optional(),
  classTeacherId: z.string().optional(),
  facilityId: z.string().optional(),
  status: z.enum([
    "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED",
    "ARCHIVED_CURRENT_YEAR", "ARCHIVED_PREVIOUS_YEAR", "ARCHIVED_HISTORICAL"
  ]).optional()
});

const listClassesSchema = z.object({
  courseCampusId: z.string().optional(),
  termId: z.string().optional(),
  classTeacherId: z.string().optional(),
  facilityId: z.string().optional(),
  programCampusId: z.string().optional(),
  status: z.enum([
    "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED",
    "ARCHIVED_CURRENT_YEAR", "ARCHIVED_PREVIOUS_YEAR", "ARCHIVED_HISTORICAL"
  ]).optional(),
  search: z.string().optional(),
  skip: z.number().optional(),
  take: z.number().optional()
});

const enrollStudentSchema = z.object({
  classId: z.string(),
  studentId: z.string()
});

const assignTeacherSchema = z.object({
  classId: z.string(),
  teacherId: z.string(),
  assignmentType: z.enum(['PRIMARY', 'ASSISTANT'])
});

const removeStudentSchema = z.object({
  classId: z.string(),
  studentId: z.string()
});

const removeTeacherSchema = z.object({
  classId: z.string(),
  teacherId: z.string()
});

const createActivitySchema = z.object({
  classId: z.string(),
  title: z.string(),
  purpose: z.nativeEnum(ActivityPurpose),
  learningType: z.nativeEnum(LearningActivityType).optional(),
  assessmentType: z.nativeEnum(AssessmentType).optional(),
  subjectId: z.string(),
  topicId: z.string().optional(),
  content: z.any().optional(),
  isGradable: z.boolean().optional(),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weightage: z.number().optional(),
  gradingConfig: z.any().optional(),
});

const updateActivitySchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.any().optional(),
  isGradable: z.boolean().optional(),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weightage: z.number().optional(),
  gradingConfig: z.any().optional(),
  status: z.enum([
    "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED"
  ]).optional(),
});

const createPeriodSchema = z.object({
  classId: z.string(),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.date(),
  endTime: z.date(),
  type: z.enum(Object.values(PeriodType) as [string, ...string[]]),
  facilityId: z.string().optional(),
  subjectId: z.string().optional(),
  assignmentId: z.string(),
});

const unassignTeacherSchema = z.object({
  classId: z.string(),
  teacherId: z.string()
});

export const classRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createClassSchema)
    .use(async ({ next, input }) => {
      await validateInput(classCapacitySchema, {
        minCapacity: input.minCapacity,
        maxCapacity: input.maxCapacity,
        currentCount: 0,
      });
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure termId is provided before passing to service
      if (!input.termId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Term ID is required'
        });
      }
      // Create the class
      const newClass = await service.createClass({
        ...input,
        termId: input.termId // Now TypeScript knows termId is defined
      });

      // Automatically create a gradebook for the class
      try {
        console.log('Creating gradebook for class:', newClass.id, 'with termId:', newClass.termId);
        const gradeService = new GradeService({ prisma: ctx.prisma });
        const gradebook = await gradeService.createGradeBook({
          classId: newClass.id,
          termId: newClass.termId,
          calculationRules: input.gradebook?.settings as Prisma.JsonValue || {} as Prisma.JsonValue,
          createdById: ctx.session.user.id // Use the user.id from the session
        });
        console.log('Gradebook created successfully:', gradebook.id);
      } catch (error) {
        console.error('Error creating gradebook:', error);
        // We don't throw here to avoid failing the class creation if gradebook creation fails
        // Instead, we'll schedule a background task to retry gradebook creation
        try {
          // Log the error for monitoring
          console.error(`Failed to create gradebook for class ${newClass.id}`, {
            classId: newClass.id,
            error: error instanceof Error ? error.message : String(error)
          });
        } catch (logError) {
          console.error('Failed to log gradebook creation error:', logError);
        }
      }

      return newClass;
    }),

  getById: protectedProcedure
    .input(z.object({
      id: z.string().optional(), // Accept either id or classId
      classId: z.string().optional(), // Support for client code using classId
      includeEnrollments: z.boolean().optional(),
      include: z.object({
        students: z.boolean().optional(),
        teachers: z.boolean().optional(),
        classTeacher: z.object({
          include: z.object({
            user: z.boolean()
          })
        }).optional()
      }).optional()
    }).refine(data => data.id || data.classId, {
      message: "Either id or classId must be provided",
      path: ["id"]
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Use id if provided, otherwise use classId
        const classId = input.id || input.classId;

        if (!classId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Class ID is required"
          });
        }

        // Use Prisma directly to ensure we get all the needed student details
        const classData = await ctx.prisma.class.findUnique({
          where: { id: classId },
          include: {
            students: input.include?.students === true ? {
              include: {
                student: {
                  include: {
                    user: true
                  }
                }
              }
            } : false,
            teachers: input.include?.teachers === true,
            classTeacher: input.include?.classTeacher ? {
              include: {
                user: true
              }
            } : false,
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
            facility: true,
            campus: true
          }
        });

        if (!classData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found"
          });
        }

        return classData;
      } catch (error) {
        console.error('Error fetching class by ID:', error, 'classId:', input.id || input.classId);
        throw error;
      }
    }),

  update: protectedProcedure
    .input(updateClassSchema)
    .use(async ({ next, input, ctx }) => {
      if (input.minCapacity || input.maxCapacity) {
        const currentClass = await ctx.prisma.class.findUnique({
          where: { id: input.id },
          select: {
            minCapacity: true,
            maxCapacity: true,
            currentCount: true,
          },
        });

        if (!currentClass) {
          throw new Error('Class not found');
        }

        await validateInput(classCapacitySchema, {
          minCapacity: input.minCapacity ?? currentClass.minCapacity,
          maxCapacity: input.maxCapacity ?? currentClass.maxCapacity,
          currentCount: currentClass.currentCount,
        });
      }
      return next();
    })
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const service = new ClassService({ prisma: ctx.prisma });
      return service.updateClass(id, data);
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.deleteClass(input);
    }),

  list: protectedProcedure
    .input(listClassesSchema)
    .query(async ({ ctx, input }) => {
      const { skip = 0, take = 10, ...filters } = input;
      const service = new ClassService({ prisma: ctx.prisma });
      return service.listClasses(filters, skip, take);
    }),

  // Get all classes across all campuses
  getAllClasses: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Check if user has system-level access
        if (![UserType.SYSTEM_ADMIN, UserType.SYSTEM_MANAGER].includes(ctx.session.user.userType as UserType)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only system administrators can access all classes",
          });
        }

        // Get all classes with related data
        const classes = await ctx.prisma.class.findMany({
          where: {
            status: SystemStatus.ACTIVE,
          },
          include: {
            campus: true,
            term: true,
            courseCampus: {
              include: {
                course: true,
              },
            },
            programCampus: {
              include: {
                program: true,
              },
            },
            _count: {
              select: {
                students: true,
              },
            },
          },
          orderBy: [
            {
              campus: {
                name: 'asc',
              },
            },
            {
              name: 'asc',
            },
          ],
        });

        return {
          items: classes,
          total: classes.length,
          hasMore: false,
        };
      } catch (error) {
        console.error('Error fetching all classes:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch classes",
          cause: error,
        });
      }
    }),

  enrollStudent: protectedProcedure
    .input(enrollStudentSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure classId and studentId are required
      if (!input.classId || !input.studentId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Class ID and Student ID are required'
        });
      }
      return service.enrollStudent({
        classId: input.classId,
        studentId: input.studentId,
        createdById: ctx.session.user.id ?? ''
      });
    }),

  assignTeacher: protectedProcedure
    .input(assignTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure classId and teacherId are required
      if (!input.classId || !input.teacherId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Class ID and Teacher ID are required'
        });
      }
      return service.assignTeacher({
        classId: input.classId,
        teacherId: input.teacherId,
        assignmentType: input.assignmentType
      });
    }),

  getTeacherAssignments: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.getTeacherAssignments(input.classId);
    }),

  removeStudent: protectedProcedure
    .input(removeStudentSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.removeStudent(input.classId, input.studentId);
    }),

  removeTeacher: protectedProcedure
    .input(removeTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      const assignment = await ctx.prisma.teacherAssignment.findFirst({
        where: {
          classId: input.classId,
          teacherId: input.teacherId,
          status: 'ACTIVE'
        }
      });
      if (!assignment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teacher assignment not found'
        });
      }
      return service.removeTeacher(assignment.id);
    }),

  // Activity Management
  createActivity: protectedProcedure
    .input(createActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure required fields are present
      if (!input.classId || !input.title || !input.purpose || !input.subjectId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Class ID, title, purpose, and subject ID are required'
        });
      }
      return service.createActivity({
        classId: input.classId,
        title: input.title,
        purpose: input.purpose,
        subjectId: input.subjectId,
        content: input.content || {},
        learningType: input.learningType,
        assessmentType: input.assessmentType,
        topicId: input.topicId,
        isGradable: input.isGradable,
        maxScore: input.maxScore,
        passingScore: input.passingScore,
        weightage: input.weightage,
        gradingConfig: input.gradingConfig
      });
    }),

  updateActivity: protectedProcedure
    .input(updateActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const service = new ClassService({ prisma: ctx.prisma });
      return service.updateActivity(id, data);
    }),

  deleteActivity: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.deleteActivity(input);
    }),

  listActivities: protectedProcedure
    .input(z.object({
      classId: z.string(),
      purpose: z.nativeEnum(ActivityPurpose).optional(),
      learningType: z.nativeEnum(LearningActivityType).optional(),
      assessmentType: z.nativeEnum(AssessmentType).optional(),
      status: z.nativeEnum(SystemStatus).optional(),
      skip: z.number().optional(),
      take: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { skip = 0, take = 10, ...filters } = input;
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure classId is required
      if (!filters.classId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Class ID is required'
        });
      }
      return service.listActivities({
        classId: filters.classId,
        purpose: filters.purpose,
        learningType: filters.learningType,
        assessmentType: filters.assessmentType,
        status: filters.status
      }, skip, take);
    }),

  getActivity: protectedProcedure
    .input(z.object({
      id: z.string(),
      includeGrades: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.getActivity(input.id, input.includeGrades);
    }),

  bulkSaveActivityGrades: protectedProcedure
    .input(z.object({
      activityId: z.string(),
      grades: z.array(z.object({
        studentId: z.string(),
        score: z.number(),
        feedback: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure all grades have required fields
      const validatedGrades = input.grades.map(grade => {
        if (!grade.studentId || grade.score === undefined) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Student ID and score are required for all grades'
          });
        }
        return {
          studentId: grade.studentId,
          score: grade.score,
          feedback: grade.feedback
        };
      });
      return service.saveActivityGrades(input.activityId, validatedGrades);
    }),

  // Schedule Management
  createPeriod: protectedProcedure
    .input(createPeriodSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure required fields are present
      if (!input.classId || !input.type || !input.dayOfWeek || !input.startTime || !input.endTime) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Class ID, type, day of week, start time, and end time are required'
        });
      }
      return service.createPeriod({
        classId: input.classId,
        type: input.type as PeriodType,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        facilityId: input.facilityId,
        subjectId: input.subjectId,
        assignmentId: input.assignmentId
      });
    }),

  updatePeriod: protectedProcedure
    .input(z.object({
      id: z.string(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      facilityId: z.string().optional(),
      status: z.nativeEnum(SystemStatus).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const service = new ClassService({ prisma: ctx.prisma });
      return service.updatePeriod(id, data);
    }),

  deletePeriod: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.deletePeriod(input);
    }),

  getSchedule: protectedProcedure
    .input(z.object({
      classId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure classId is required
      if (!input.classId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Class ID is required'
        });
      }
      return service.getSchedule({
        classId: input.classId,
        startDate: input.startDate,
        endDate: input.endDate
      });
    }),

  // Apply a schedule pattern to a class timetable
  applySchedulePattern: protectedProcedure
    .input(z.object({
      patternId: z.string(),
      classId: z.string(),
      facilityId: z.string().optional(),
      type: z.nativeEnum(PeriodType),
      subjectId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { patternId, classId, facilityId, type, subjectId } = input;

      // Get the class
      const classData = await ctx.prisma.class.findUnique({
        where: { id: classId },
        include: {
          courseCampus: true,
        },
      });

      if (!classData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Class not found',
        });
      }

      // Get the schedule pattern
      const pattern = await ctx.prisma.schedulePattern.findUnique({
        where: { id: patternId },
      });

      if (!pattern) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Schedule pattern not found',
        });
      }

      // Get teacher assignments for this class
      const teacherAssignments = await ctx.prisma.teacherAssignment.findMany({
        where: {
          classId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          teacher: {
            include: {
              subjectQualifications: true
            }
          }
        }
      });

      // If no teacher assignments exist, throw an error
      if (teacherAssignments.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No teacher assigned to this class. Please assign a teacher first.',
        });
      }

      // Get the teacher ID from the first assignment
      const teacherId = teacherAssignments[0].teacherId;

      // Find or create a TeacherSubjectAssignment for this teacher
      let subjectAssignment: any;

      // If a subject is specified, try to find a qualification for it
      if (subjectId) {
        // Check if the teacher has a qualification for this subject
        const qualification = await ctx.prisma.teacherSubjectQualification.findFirst({
          where: {
            teacherId,
            subjectId,
          },
        });

        if (qualification) {
          // Find or create a subject assignment using this qualification
          subjectAssignment = await ctx.prisma.teacherSubjectAssignment.findFirst({
            where: {
              qualificationId: qualification.id,
              status: SystemStatus.ACTIVE,
            },
          });

          if (!subjectAssignment) {
            // Create a new subject assignment
            subjectAssignment = await ctx.prisma.teacherSubjectAssignment.create({
              data: {
                qualificationId: qualification.id,
                campusId: classData.campusId,
                courseCampusId: classData.courseCampusId,
                status: SystemStatus.ACTIVE,
              },
            });
          }
        } else {
          // Create a qualification and then an assignment
          const newQualification = await ctx.prisma.teacherSubjectQualification.create({
            data: {
              teacherId,
              subjectId,
              level: 'BASIC',
              isVerified: true,
            },
          });

          subjectAssignment = await ctx.prisma.teacherSubjectAssignment.create({
            data: {
              qualificationId: newQualification.id,
              campusId: classData.campusId,
              courseCampusId: classData.courseCampusId,
              status: SystemStatus.ACTIVE,
            },
          });
        }
      } else {
        // If no subject is specified, find any active subject assignment for this teacher
        subjectAssignment = await ctx.prisma.teacherSubjectAssignment.findFirst({
          where: {
            qualification: {
              teacherId,
            },
            status: SystemStatus.ACTIVE,
          },
        });

        if (!subjectAssignment) {
          // If no subject assignment exists, create a default one
          // First, find or create a default subject
          let defaultSubject = await ctx.prisma.subject.findFirst({
            where: {
              courseId: classData.courseCampus.courseId,
              status: SystemStatus.ACTIVE,
            },
          });

          if (!defaultSubject) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'No subjects found for this course. Please create a subject first.',
            });
          }

          // Create a qualification for the default subject
          const qualification = await ctx.prisma.teacherSubjectQualification.create({
            data: {
              teacherId,
              subjectId: defaultSubject.id,
              level: 'BASIC',
              isVerified: true,
            },
          });

          // Create a subject assignment
          subjectAssignment = await ctx.prisma.teacherSubjectAssignment.create({
            data: {
              qualificationId: qualification.id,
              campusId: classData.campusId,
              courseCampusId: classData.courseCampusId,
              status: SystemStatus.ACTIVE,
            },
          });
        }
      }

      // Use the subject assignment ID
      const assignmentId = subjectAssignment.id;

      // Create or get timetable
      const timetable = await ctx.prisma.timetable.upsert({
        where: {
          classId_startDate_endDate: {
            classId,
            startDate: pattern.startDate,
            endDate: pattern.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          },
        },
        update: {
          schedulePatternId: patternId,
        },
        create: {
          name: `${classData.name} Schedule`,
          classId,
          courseCampusId: classData.courseCampusId,
          startDate: pattern.startDate,
          endDate: pattern.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          schedulePatternId: patternId,
          status: SystemStatus.ACTIVE,
        },
      });

      // Generate periods based on the pattern
      const periods: any[] = [];

      // Get the teacher ID from the subject assignment
      const teacherQualification = await ctx.prisma.teacherSubjectQualification.findUnique({
        where: { id: subjectAssignment.qualificationId },
        include: { teacher: true }
      });

      if (!teacherQualification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teacher qualification not found',
        });
      }

      // Get the term information
      const classWithTerm = await ctx.prisma.class.findUnique({
        where: { id: classId },
        include: { term: true }
      });

      if (!classWithTerm?.term) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Class term not found',
        });
      }

      const termId = classWithTerm.termId;
      const termStartDate = classWithTerm.term.startDate;
      const termEndDate = classWithTerm.term.endDate;

      // Find or create a teacher schedule
      let teacherSchedule = await ctx.prisma.teacherSchedule.findFirst({
        where: {
          teacherId: teacherQualification.teacherId,
          termId,
          status: SystemStatus.ACTIVE,
        },
      });

      if (!teacherSchedule) {
        teacherSchedule = await ctx.prisma.teacherSchedule.create({
          data: {
            teacherId: teacherQualification.teacherId,
            termId,
            startDate: termStartDate,
            endDate: termEndDate,
            status: SystemStatus.ACTIVE,
          },
        });
      }

      // Create periods for each day in the pattern
      for (const day of pattern.daysOfWeek) {
        // Create the timetable period
        const period = await ctx.prisma.timetablePeriod.create({
          data: {
            timetableId: timetable.id,
            dayOfWeek: day as DayOfWeek,
            startTime: new Date(`1970-01-01T${pattern.startTime}:00`),
            endTime: new Date(`1970-01-01T${pattern.endTime}:00`),
            type,
            facilityId,
            assignmentId, // Using the assignmentId we defined earlier
            status: SystemStatus.ACTIVE,
          },
        });

        // Add the period to the teacher's schedule
        await ctx.prisma.teacherSchedulePeriod.create({
          data: {
            scheduleId: teacherSchedule.id,
            timetablePeriodId: period.id,
            status: SystemStatus.ACTIVE,
          },
        });

        // If a facility is specified, add the period to the facility's schedule
        if (facilityId) {
          // Find or create a facility schedule
          let facilitySchedule = await ctx.prisma.facilitySchedule.findFirst({
            where: {
              facilityId,
              termId,
              status: SystemStatus.ACTIVE,
            },
          });

          if (!facilitySchedule) {
            facilitySchedule = await ctx.prisma.facilitySchedule.create({
              data: {
                facilityId,
                termId,
                startDate: termStartDate,
                endDate: termEndDate,
                status: SystemStatus.ACTIVE,
              },
            });
          }

          // Add the period to the facility's schedule
          await ctx.prisma.facilitySchedulePeriod.create({
            data: {
              scheduleId: facilitySchedule.id,
              timetablePeriodId: period.id,
              status: SystemStatus.ACTIVE,
            },
          });
        }

        periods.push(period);
      }

      return {
        success: true,
        timetable,
        periods,
      };
    }),

  // Batch Operations
  bulkEnrollStudents: protectedProcedure
    .input(z.object({
      classId: z.string(),
      studentIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure required fields are present
      if (!input.classId || !input.studentIds || input.studentIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Class ID and student IDs are required'
        });
      }
      return service.bulkEnrollStudents({
        classId: input.classId,
        studentIds: input.studentIds,
        createdById: ctx.session.user.id ?? ''
      });
    }),

  bulkMarkAttendance: protectedProcedure
    .input(z.object({
      classId: z.string(),
      date: z.date(),
      attendance: z.array(z.object({
        studentId: z.string(),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'LEAVE']),
        remarks: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure required fields are present
      if (!input.classId || !input.date || !input.attendance || input.attendance.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Class ID, date, and attendance records are required'
        });
      }
      // Validate each attendance record
      const validatedAttendance = input.attendance.map(record => {
        if (!record.studentId || !record.status) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Student ID and status are required for all attendance records'
          });
        }
        return {
          studentId: record.studentId,
          status: record.status,
          remarks: record.remarks
        };
      });
      return service.bulkMarkAttendance({
        classId: input.classId,
        date: input.date,
        attendance: validatedAttendance
      });
    }),

  // Export Operations
  exportClassData: protectedProcedure
    .input(z.object({
      classId: z.string(),
      type: z.enum(['ATTENDANCE', 'GRADES', 'STUDENTS', 'SCHEDULE']),
      format: z.enum(['CSV', 'EXCEL']),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure required fields are present
      if (!input.classId || !input.type || !input.format) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Class ID, export type, and format are required'
        });
      }
      return service.exportClassData({
        classId: input.classId,
        type: input.type,
        format: input.format,
        startDate: input.startDate,
        endDate: input.endDate
      });
    }),

  getAvailableClassesForTeacher: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      campusId: z.string().optional(),
      termId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { teacherId, campusId, termId } = input;

      // Get currently assigned classes
      const assignedClasses = await ctx.prisma.teacherAssignment.findMany({
        where: {
          teacherId,
          status: 'ACTIVE'
        },
        select: {
          classId: true
        }
      });

      const assignedClassIds = assignedClasses.map(assignment => assignment.classId);

      // Find available classes that the teacher is not assigned to
      const availableClasses = await ctx.prisma.class.findMany({
        where: {
          id: { notIn: assignedClassIds },
          status: 'ACTIVE',
          ...(campusId && { campusId }),
          ...(termId && { termId })
        },
        include: {
          courseCampus: {
            include: {
              course: true
            }
          },
          term: true,
          facility: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return availableClasses;
    }),

  updateTeacherAssignment: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      assignedClassIds: z.array(z.string()),
      unassignedClassIds: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { teacherId, assignedClassIds, unassignedClassIds = [] } = input;
      const service = new ClassService({ prisma: ctx.prisma });

      // Handle new assignments
      const assignmentPromises = assignedClassIds.map(classId =>
        service.assignTeacher({
          classId,
          teacherId,
          assignmentType: 'PRIMARY'
        })
      );

      // Handle unassignments
      const unassignmentPromises = unassignedClassIds.map(async classId => {
        const assignment = await ctx.prisma.teacherAssignment.findFirst({
          where: {
            classId,
            teacherId,
            status: 'ACTIVE'
          }
        });

        if (assignment) {
          return service.removeTeacher(assignment.id);
        }
        return null;
      });

      const [assignResults, unassignResults] = await Promise.all([
        Promise.all(assignmentPromises),
        Promise.all(unassignmentPromises)
      ]);

      return {
        assigned: assignResults.filter(Boolean).length,
        unassigned: unassignResults.filter(Boolean).length
      };
    }),

  // Reports Management
  getReports: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.getReports(input.classId);
    }),

  generateReport: protectedProcedure
    .input(z.object({
      classId: z.string(),
      type: z.enum(['ATTENDANCE', 'PERFORMANCE', 'SUMMARY']),
      period: z.enum(['TERM', 'MONTH', 'WEEK', 'CUSTOM']),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      // Ensure required fields are present
      if (!input.classId || !input.type || !input.period) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Class ID, report type, and period are required'
        });
      }
      return service.generateReport({
        classId: input.classId,
        type: input.type,
        period: input.period,
        startDate: input.startDate,
        endDate: input.endDate,
        generatedById: ctx.session.user.id
      });
    }),

  downloadReport: protectedProcedure
    .input(z.object({
      classId: z.string(),
      reportId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.downloadReport(input.classId, input.reportId);
    }),

  // Assignments Management
  getAssignments: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.getAssignments(input.classId);
    }),

  // Gradebook Management
  getGradebook: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.getGradebook(input.classId);
    }),

  initializeGradebook: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new ClassService({ prisma: ctx.prisma });
      return service.initializeGradebook(input.classId, ctx.session.user.id);
    }),

  getSubjects: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('Getting subjects for class:', input.classId);

        const classData = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {
            courseCampus: {
              include: {
                course: {
                  include: {
                    subjects: {
                      where: {
                        status: 'ACTIVE'
                      }
                    }
                  }
                }
              }
            }
          }
        });

        console.log('Class data found:', !!classData);
        console.log('Course campus found:', !!(classData?.courseCampus));
        console.log('Course found:', !!(classData?.courseCampus?.course));

        if (!classData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
        }

        if (!classData.courseCampus) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course campus not found for this class" });
        }

        if (!classData.courseCampus.course) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course not found for this class" });
        }

        const subjects = classData.courseCampus.course.subjects || [];
        console.log('Subjects found:', subjects.length);

        // If no subjects are found, try to get subjects directly from the course
        if (subjects.length === 0) {
          console.log('No subjects found, trying to get subjects directly from course');
          const courseId = classData.courseCampus.courseId;

          const courseSubjects = await ctx.prisma.subject.findMany({
            where: {
              courseId,
              status: 'ACTIVE'
            }
          });

          console.log('Subjects found directly from course:', courseSubjects.length);
          return courseSubjects;
        }

        return subjects;
      } catch (error) {
        console.error('Error getting subjects:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get subjects for class: ${(error as Error).message}`,
        });
      }
    }),

  // Get classes by course campus
  getByCourseCampus: protectedProcedure
    .input(z.object({
      courseCampusId: z.string(),
      includeEnrollments: z.boolean().optional().default(false)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const classes = await ctx.prisma.class.findMany({
          where: {
            courseCampusId: input.courseCampusId,
            status: SystemStatus.ACTIVE
          },
          include: {
            term: true,
            _count: input.includeEnrollments ? {
              select: {
                students: true
              }
            } : undefined
          },
          orderBy: [
            { term: { startDate: 'desc' } },
            { name: 'asc' }
          ]
        });

        return classes;
      } catch (error) {
        console.error('Error fetching classes by course campus:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch classes',
          cause: error
        });
      }
    }),

  // Get teacher assignments for a class (alternative endpoint)
  getTeacherAssignmentsV2: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { classId } = input;

        // Check if the class exists
        const classData = await ctx.prisma.class.findUnique({
          where: { id: classId }
        });

        if (!classData) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Class not found',
          });
        }

        // Get all teacher assignments for this class
        const assignments = await ctx.prisma.teacherAssignment.findMany({
          where: {
            classId,
          },
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return assignments;
      } catch (error) {
        console.error('Error getting teacher assignments:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get teacher assignments: ${(error as Error).message}`,
        });
      }
    }),

  // Remove a teacher from a class (alternative endpoint)
  removeTeacherV2: protectedProcedure
    .input(z.object({
      classId: z.string(),
      teacherId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { classId, teacherId } = input;

        // Find the assignment
        const assignment = await ctx.prisma.teacherAssignment.findFirst({
          where: {
            classId,
            teacherId,
            status: 'ACTIVE',
          },
        });

        if (!assignment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Teacher assignment not found',
          });
        }

        // Update the assignment status to INACTIVE
        const updatedAssignment = await ctx.prisma.teacherAssignment.update({
          where: { id: assignment.id },
          data: { status: 'INACTIVE' },
        });

        // If this was the primary teacher, remove the classTeacherId from the class
        const classData = await ctx.prisma.class.findUnique({
          where: { id: classId },
        });

        if (classData?.classTeacherId === teacherId) {
          await ctx.prisma.class.update({
            where: { id: classId },
            data: { classTeacherId: null },
          });
        }

        return updatedAssignment;
      } catch (error) {
        console.error('Error removing teacher:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to remove teacher: ${(error as Error).message}`,
        });
      }
    }),

  // Get classes for a teacher
  getTeacherClasses: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      termId: z.string().optional(),
      status: z.nativeEnum(SystemStatus).optional().default(SystemStatus.ACTIVE)
    }))
    .query(async ({ ctx, input }) => {
      const { teacherId, termId } = input;

      // Get teacher profile
      const teacherProfile = await ctx.prisma.teacherProfile.findFirst({
        where: { userId: teacherId }
      });

      if (!teacherProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teacher profile not found'
        });
      }

      // Find classes where the teacher is assigned
      const teacherAssignments = await ctx.prisma.teacherAssignment.findMany({
        where: {
          teacherId: teacherProfile.id,
          status: SystemStatus.ACTIVE
        },
        include: {
          class: {
            include: {
              term: true,
              courseCampus: {
                include: {
                  course: true
                }
              },
              programCampus: {
                include: {
                  program: true
                }
              },
              campus: true,
              facility: true,
              _count: true
            }
          }
        }
      });

      // Get the classes directly
      const classes = await ctx.prisma.class.findMany({
        where: {
          id: { in: teacherAssignments.map(ta => ta.classId) },
          ...(termId ? { termId } : {})
        },
        include: {
          term: true,
          courseCampus: {
            include: {
              course: true
            }
          },
          programCampus: {
            include: {
              program: true
            }
          },
          campus: true,
          facility: true,
          students: {
            where: {
              status: SystemStatus.ACTIVE
            },
            include: {
              student: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      return classes;
    }),

  // Assign a teacher to a class (alternative endpoint)
  assignTeacherV2: protectedProcedure
    .input(z.object({
      classId: z.string(),
      teacherId: z.string(),
      assignmentType: z.enum(['PRIMARY', 'ASSISTANT']).default('PRIMARY'),
      subjectId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { classId, teacherId, assignmentType, subjectId, startDate, endDate } = input;

        // Check if the teacher exists
        const teacher = await ctx.prisma.teacherProfile.findUnique({
          where: { id: teacherId }
        });

        if (!teacher) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Teacher not found',
          });
        }

        // Check if the class exists
        const classData = await ctx.prisma.class.findUnique({
          where: { id: classId }
        });

        if (!classData) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Class not found',
          });
        }

        // If it's a primary assignment, update the class with the teacher ID
        if (assignmentType === 'PRIMARY') {
          await ctx.prisma.class.update({
            where: { id: classId },
            data: { classTeacherId: teacherId }
          });
        }

        // Check if there's already an active assignment for this teacher and class
        const existingAssignment = await ctx.prisma.teacherAssignment.findFirst({
          where: {
            teacherId,
            classId,
            status: 'ACTIVE',
          },
        });

        if (existingAssignment) {
          // Update the existing assignment
          const updatedAssignment = await ctx.prisma.teacherAssignment.update({
            where: { id: existingAssignment.id },
            data: {
              // Note: 'type' field doesn't exist in TeacherAssignment model
              // We'll use status field instead
              startDate: startDate || existingAssignment.startDate,
              endDate: endDate || existingAssignment.endDate,
              // Add subjectId if provided
              ...(subjectId ? { subjectId } : {}),
            },
          });

          return updatedAssignment;
        }

        // Create a new teacher assignment record
        const assignment = await ctx.prisma.teacherAssignment.create({
          data: {
            teacherId,
            classId,
            // Note: 'type' field doesn't exist in TeacherAssignment model
            // We'll use status field instead
            ...(subjectId ? { subjectId } : {}),
            startDate: startDate || new Date(),
            endDate,
            status: 'ACTIVE' as SystemStatus,
          }
        });

        return assignment;
      } catch (error) {
        console.error('Error assigning teacher:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to assign teacher: ${(error as Error).message}`,
        });
      }
    }),

  // Get subjects for a specific class
  getSubjectsForClass: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const classData = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {
            courseCampus: {
              include: {
                course: {
                  include: {
                    subjects: {
                      where: {
                        status: SystemStatus.ACTIVE
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (!classData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
        }

        if (!classData.courseCampus) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course campus not found for this class" });
        }

        if (!classData.courseCampus.course) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course not found for this class" });
        }

        const subjects = classData.courseCampus.course.subjects || [];

        // If no subjects are found, try to get subjects directly from the course
        if (subjects.length === 0) {
          const courseId = classData.courseCampus.courseId;

          const courseSubjects = await ctx.prisma.subject.findMany({
            where: {
              courseId,
              status: SystemStatus.ACTIVE
            }
          });

          console.log('Found course subjects:', courseSubjects);
          return courseSubjects;
        }

        console.log('Found class subjects:', subjects);
        return subjects;
      } catch (error) {
        console.error('Error getting subjects for class:', error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving subjects for class",
            });
      }
    }),

  // Get students for a specific class
  getStudents: protectedProcedure
    .input(z.object({
      classId: z.string(),
      status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "DELETED"]).optional().default("ACTIVE"),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const students = await ctx.prisma.studentEnrollment.findMany({
          where: {
            classId: input.classId,
            status: input.status,
          },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
          orderBy: [
            {
              student: {
                user: {
                  name: 'asc',
                },
              },
            }
          ],
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






