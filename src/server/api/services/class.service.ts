import { TRPCError } from "@trpc/server";
import { PrismaClient, Prisma, SystemStatus, AttendanceStatusType, DayOfWeek, PeriodType, Activity, ActivityGrade, SubmissionStatus, ActivityPurpose, LearningActivityType, AssessmentType } from '@prisma/client';
import { GradeService } from './grade.service';
import {
  CreateClassInput,
  UpdateClassInput,
  ClassFilters,
  EnrollStudentInput,
  AssignTeacherInput,
  ClassServiceConfig,
  CreateActivityInput,
  UpdateActivityInput,
  CreatePeriodInput,
  UpdatePeriodInput,
  ScheduleFilters,
  BulkEnrollStudentsInput,
  BulkMarkAttendanceInput,
  ExportClassDataInput,
} from "../types/class";
import { ClassServiceContext } from '../types/class';

export class ClassService {
  private readonly prisma: PrismaClient;
  private readonly maxEnrollmentCapacity?: number;

  constructor(config: ClassServiceContext) {
    this.prisma = config.prisma;
    this.maxEnrollmentCapacity = config.maxEnrollmentCapacity;
  }

  // Class CRUD Operations
  async createClass(input: CreateClassInput) {
    return this.prisma.class.create({
      data: {
        code: input.code,
        name: input.name,
        courseCampus: { connect: { id: input.courseCampusId } },
        campus: { connect: { id: input.campusId } },
        term: { connect: { id: input.termId } },
        minCapacity: input.minCapacity,
        maxCapacity: input.maxCapacity,
        currentCount: 0,
        ...(input.classTeacherId && { classTeacher: { connect: { id: input.classTeacherId } } }),
        ...(input.facilityId && { facility: { connect: { id: input.facilityId } } }),
        ...(input.programCampusId && { programCampus: { connect: { id: input.programCampusId } } }),
      },
    });
  }

  async getClass(id: string, include?: { students?: boolean; teachers?: boolean; classTeacher?: boolean }) {
    return this.prisma.class.findUnique({
      where: { id },
      include: {
        ...(include?.students && { students: true }),
        ...(include?.teachers && { teachers: true }),
        ...(include?.classTeacher && { classTeacher: true }),
        courseCampus: {
          include: {
            course: true,
          },
        },
        term: true,
        facility: true,
      },
    });
  }

  async updateClass(id: string, input: UpdateClassInput) {
    return this.prisma.class.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.minCapacity && { minCapacity: input.minCapacity }),
        ...(input.maxCapacity && { maxCapacity: input.maxCapacity }),
        ...(input.classTeacherId && { classTeacher: { connect: { id: input.classTeacherId } } }),
        ...(input.facilityId && { facility: { connect: { id: input.facilityId } } }),
        ...(input.status && { status: input.status }),
      },
    });
  }

  async deleteClass(id: string) {
    return this.prisma.class.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  async listClasses(filters: ClassFilters, skip = 0, take = 10) {
    const where: Prisma.ClassWhereInput = {
      ...(filters.courseCampusId && { courseCampusId: filters.courseCampusId }),
      ...(filters.termId && { termId: filters.termId }),
      ...(filters.classTeacherId && { classTeacherId: filters.classTeacherId }),
      ...(filters.facilityId && { facilityId: filters.facilityId }),
      ...(filters.programCampusId && { programCampusId: filters.programCampusId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search } },
          { code: { contains: filters.search } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.class.count({ where }),
      this.prisma.class.findMany({
        where,
        skip,
        take,
        include: {
          courseCampus: {
            include: {
              course: true,
            },
          },
          term: true,
          facility: true,
          classTeacher: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items,
      total,
      hasMore: skip + take < total,
    };
  }

  // Enrollment Management
  async enrollStudent(input: EnrollStudentInput) {
    // Validate class and check capacity
    const classData = await this.prisma.class.findUnique({
      where: { id: input.classId },
      select: {
        maxCapacity: true,
        currentCount: true,
      },
    });

    if (!classData) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Class not found',
      });
    }

    const maxCapacity = classData.maxCapacity || this.maxEnrollmentCapacity || 30;
    if (classData.currentCount >= maxCapacity) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Class is at maximum capacity',
      });
    }

    // Create enrollment and update class count
    const [enrollment] = await this.prisma.$transaction([
      this.prisma.studentEnrollment.create({
        data: {
          student: { connect: { id: input.studentId } },
          class: { connect: { id: input.classId } },
          createdBy: { connect: { id: input.createdById } },
          status: 'ACTIVE',
        },
      }),
      this.prisma.class.update({
        where: { id: input.classId },
        data: {
          currentCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return enrollment;
  }

  async assignTeacher(data: AssignTeacherInput): Promise<any> {
    const existingAssignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        classId: data.classId,
        teacherId: data.teacherId,
        status: 'ACTIVE'
      }
    });

    if (existingAssignment) {
      return existingAssignment;
    }

    return this.prisma.teacherAssignment.create({
      data: {
        classId: data.classId,
        teacherId: data.teacherId,
        startDate: new Date(),
        status: SystemStatus.ACTIVE
      }
    });
  }

  async getTeacherAssignments(classId: string): Promise<any[]> {
    return this.prisma.teacherAssignment.findMany({
      where: {
        classId,
        status: 'ACTIVE'
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async removeStudent(classId: string, studentId: string) {
    // Update enrollment status
    const [enrollment] = await this.prisma.$transaction([
      this.prisma.studentEnrollment.update({
        where: {
          studentId_classId: {
            studentId,
            classId,
          },
        },
        data: {
          status: 'DELETED',
          endDate: new Date(),
        },
      }),
      this.prisma.class.update({
        where: { id: classId },
        data: {
          currentCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    return enrollment;
  }

  async removeTeacher(id: string) {
    return this.prisma.teacherAssignment.update({
      where: { id },
      data: {
        status: 'DELETED',
        endDate: new Date(),
      },
    });
  }

  // Activity Management
  async createActivity(data: CreateActivityInput): Promise<Activity> {
    return this.prisma.activity.create({
      data: {
        title: data.title,
        purpose: data.purpose,
        learningType: data.learningType,
        assessmentType: data.assessmentType,
        subjectId: data.subjectId,
        topicId: data.topicId,
        content: data.content || '',
        isGradable: data.isGradable || false,
        maxScore: data.maxScore,
        passingScore: data.passingScore,
        weightage: data.weightage,
        gradingConfig: data.gradingConfig,
        classId: data.classId,
        status: 'ACTIVE'
      }
    });
  }

  async updateActivity(id: string, data: Partial<UpdateActivityInput>): Promise<Activity> {
    return this.prisma.activity.update({
      where: { id },
      data
    });
  }

  async deleteActivity(id: string): Promise<Activity> {
    return this.prisma.activity.update({
      where: { id },
      data: { status: 'DELETED' }
    });
  }

  async getActivity(id: string, includeGrades = false): Promise<Activity & { grades?: ActivityGrade[] }> {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        subject: true,
        topic: true,
        ...(includeGrades ? { activityGrades: true } : {})
      }
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    // Map activity grades to maintain backward compatibility
    const result = activity as any;
    if (includeGrades && activity.activityGrades) {
      result.grades = activity.activityGrades;
    }

    return result;
  }

  async listActivities(
    filters: {
      classId: string;
      purpose?: ActivityPurpose;
      learningType?: LearningActivityType;
      assessmentType?: AssessmentType;
      status?: SystemStatus
    },
    skip = 0,
    take = 10
  ): Promise<{ items: Activity[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: {
          classId: filters.classId,
          purpose: filters.purpose,
          learningType: filters.learningType,
          assessmentType: filters.assessmentType,
          status: filters.status || 'ACTIVE'
        },
        include: {
          subject: true,
          topic: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.activity.count({
        where: {
          classId: filters.classId,
          purpose: filters.purpose,
          learningType: filters.learningType,
          assessmentType: filters.assessmentType,
          status: filters.status || 'ACTIVE'
        }
      })
    ]);

    return { items, total };
  }

  async saveActivityGrades(
    activityId: string,
    grades: Array<{ studentId: string; score: number; feedback?: string }>
  ): Promise<number> {
    // Fetch the activity to ensure it exists and is gradable
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    if (!activity.isGradable) {
      throw new Error('Activity is not gradable');
    }

    // Create a transaction to perform all the operations atomically
    const operations = grades.map(grade => {
      return this.prisma.activityGrade.upsert({
        where: {
          activityId_studentId: {
            activityId,
            studentId: grade.studentId
          }
        },
        update: {
          score: grade.score,
          feedback: grade.feedback,
          status: SubmissionStatus.GRADED,
          gradedAt: new Date(),
          updatedAt: new Date()
        },
        create: {
          activityId,
          studentId: grade.studentId,
          score: grade.score,
          feedback: grade.feedback,
          status: SubmissionStatus.GRADED,
          gradedAt: new Date()
        }
      });
    });

    const result = await this.prisma.$transaction(operations);
    return result.length;
  }

  // Schedule Management
  async createPeriod(input: CreatePeriodInput) {
    const classExists = await this.prisma.class.findUnique({
      where: { id: input.classId },
      include: {
        term: true,
        courseCampus: true
      }
    });

    if (!classExists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Class not found',
      });
    }

    // Check for schedule conflicts
    const conflicts = await this.checkScheduleConflicts({
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      facilityId: input.facilityId,
      assignmentId: input.assignmentId,
    });

    if (conflicts.length > 0) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Schedule conflict detected',
      });
    }

    // Verify the teacher subject assignment exists or create it
    let subjectAssignment: any;

    // First, get the teacher ID from the assignment ID
    const teacherAssignment = await this.prisma.teacherAssignment.findUnique({
      where: { id: input.assignmentId },
      include: { teacher: true }
    });

    if (!teacherAssignment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Teacher assignment not found',
      });
    }

    const teacherId = teacherAssignment.teacherId;

    // If a subject is specified, try to find a qualification for it
    if (input.subjectId) {
      // Check if the teacher has a qualification for this subject
      let qualification = await this.prisma.teacherSubjectQualification.findFirst({
        where: {
          teacherId,
          subjectId: input.subjectId,
        },
      });

      if (!qualification) {
        // Create a qualification for the teacher and subject
        qualification = await this.prisma.teacherSubjectQualification.create({
          data: {
            teacherId,
            subjectId: input.subjectId,
            level: 'BASIC',
            isVerified: true,
          },
        });
      }

      // Find or create a subject assignment using this qualification
      subjectAssignment = await this.prisma.teacherSubjectAssignment.findFirst({
        where: {
          qualificationId: qualification.id,
          status: 'ACTIVE',
        },
      });

      if (!subjectAssignment) {
        // Create a new subject assignment
        subjectAssignment = await this.prisma.teacherSubjectAssignment.create({
          data: {
            qualificationId: qualification.id,
            campusId: classExists.campusId,
            courseCampusId: classExists.courseCampusId,
            status: 'ACTIVE',
          },
        });
      }
    } else {
      // If no subject is specified, find any active subject assignment for this teacher
      subjectAssignment = await this.prisma.teacherSubjectAssignment.findFirst({
        where: {
          qualification: {
            teacherId,
          },
          status: 'ACTIVE',
        },
      });

      if (!subjectAssignment) {
        // If no subject assignment exists, create a default one
        // First, find or create a default subject
        let defaultSubject = await this.prisma.subject.findFirst({
          where: {
            courseId: classExists.courseCampus.courseId,
            status: 'ACTIVE',
          },
        });

        if (!defaultSubject) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No subjects found for this course. Please create a subject first.',
          });
        }

        // Create a qualification for the default subject
        const qualification = await this.prisma.teacherSubjectQualification.create({
          data: {
            teacherId,
            subjectId: defaultSubject.id,
            level: 'BASIC',
            isVerified: true,
          },
        });

        // Create a subject assignment
        subjectAssignment = await this.prisma.teacherSubjectAssignment.create({
          data: {
            qualificationId: qualification.id,
            campusId: classExists.campusId,
            courseCampusId: classExists.courseCampusId,
            status: 'ACTIVE',
          },
        });
      }
    }

    // Find or create a teacher schedule
    let teacherSchedule = await this.prisma.teacherSchedule.findFirst({
      where: {
        teacherId,
        termId: classExists.termId,
        status: 'ACTIVE',
      },
    });

    if (!teacherSchedule) {
      teacherSchedule = await this.prisma.teacherSchedule.create({
        data: {
          teacherId,
          termId: classExists.termId,
          startDate: classExists.term.startDate,
          endDate: classExists.term.endDate,
          status: 'ACTIVE',
        },
      });
    }

    // Create the timetable period
    const timetable = await this.prisma.timetable.findFirst({
      where: {
        classId: input.classId,
        status: 'ACTIVE',
      },
    });

    let timetableId: string;

    if (timetable) {
      timetableId = timetable.id;
    } else {
      // Create a new timetable
      const newTimetable = await this.prisma.timetable.create({
        data: {
          name: `Timetable for Class ${input.classId}`,
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          status: 'ACTIVE',
          class: { connect: { id: input.classId } },
          courseCampus: { connect: { id: classExists.courseCampusId } },
        },
      });

      timetableId = newTimetable.id;
    }

    // Create the period
    const period = await this.prisma.timetablePeriod.create({
      data: {
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        type: input.type,
        status: 'ACTIVE',
        ...(input.facilityId && { facility: { connect: { id: input.facilityId } } }),
        assignment: { connect: { id: subjectAssignment.id } },
        timetable: { connect: { id: timetableId } },
      },
    });

    // Add the period to the teacher's schedule
    await this.prisma.teacherSchedulePeriod.create({
      data: {
        scheduleId: teacherSchedule.id,
        timetablePeriodId: period.id,
        status: 'ACTIVE',
      },
    });

    // If a facility is specified, add the period to the facility's schedule
    if (input.facilityId) {
      // Find or create a facility schedule
      let facilitySchedule = await this.prisma.facilitySchedule.findFirst({
        where: {
          facilityId: input.facilityId,
          termId: classExists.termId,
          status: 'ACTIVE',
        },
      });

      if (!facilitySchedule) {
        facilitySchedule = await this.prisma.facilitySchedule.create({
          data: {
            facilityId: input.facilityId,
            termId: classExists.termId,
            startDate: classExists.term.startDate,
            endDate: classExists.term.endDate,
            status: 'ACTIVE',
          },
        });
      }

      // Add the period to the facility's schedule
      await this.prisma.facilitySchedulePeriod.create({
        data: {
          scheduleId: facilitySchedule.id,
          timetablePeriodId: period.id,
          status: 'ACTIVE',
        },
      });
    }

    return period;
  }

  async updatePeriod(id: string, input: UpdatePeriodInput) {
    const period = await this.prisma.timetablePeriod.findUnique({
      where: { id },
    });

    if (!period) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Period not found',
      });
    }

    if (input.startTime || input.endTime || input.facilityId) {
      const conflicts = await this.checkScheduleConflicts({
        dayOfWeek: period.dayOfWeek,
        startTime: input.startTime || period.startTime,
        endTime: input.endTime || period.endTime,
        facilityId: input.facilityId || period.facilityId || undefined,
        assignmentId: period.assignmentId,
        excludePeriodId: id,
      });

      if (conflicts.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Schedule conflict detected',
        });
      }
    }

    const updateData: Prisma.TimetablePeriodUpdateInput = {
      startTime: input.startTime,
      endTime: input.endTime,
      facility: input.facilityId ? { connect: { id: input.facilityId } } : undefined,
      status: input.status,
    };

    return this.prisma.timetablePeriod.update({
      where: { id },
      data: updateData,
    });
  }

  async deletePeriod(id: string) {
    const period = await this.prisma.timetablePeriod.findUnique({
      where: { id },
    });

    if (!period) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Period not found',
      });
    }

    return this.prisma.timetablePeriod.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  async getSchedule(filters: ScheduleFilters) {
    const timetable = await this.prisma.timetable.findFirst({
      where: {
        classId: filters.classId,
        startDate: filters.startDate ? { lte: filters.startDate } : undefined,
        endDate: filters.endDate ? { gte: filters.endDate } : undefined,
        status: 'ACTIVE',
      },
      include: {
        periods: {
          where: { status: 'ACTIVE' },
          include: {
            facility: true,
            assignment: {
              include: {
                qualification: {
                  include: {
                    subject: true,
                    teacher: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!timetable) {
      return null;
    }

    return timetable;
  }

  // Batch Operations
  async bulkEnrollStudents(input: BulkEnrollStudentsInput) {
    const classData = await this.prisma.class.findUnique({
      where: { id: input.classId },
      select: {
        maxCapacity: true,
        currentCount: true,
      },
    });

    if (!classData) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Class not found',
      });
    }

    if (classData.currentCount + input.studentIds.length > classData.maxCapacity) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Class capacity would be exceeded',
      });
    }

    const enrollments = await this.prisma.$transaction(async (tx) => {
      const enrollments = await Promise.all(
        input.studentIds.map((studentId) =>
          tx.studentEnrollment.create({
            data: {
              student: { connect: { id: studentId } },
              class: { connect: { id: input.classId } },
              createdBy: { connect: { id: input.createdById } },
              status: 'ACTIVE',
            },
          })
        )
      );

      await tx.class.update({
        where: { id: input.classId },
        data: {
          currentCount: classData.currentCount + input.studentIds.length,
        },
      });

      return enrollments;
    });

    return enrollments;
  }

  async bulkMarkAttendance(input: BulkMarkAttendanceInput) {
    const classExists = await this.prisma.class.findUnique({
      where: { id: input.classId },
    });

    if (!classExists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Class not found',
      });
    }

    return this.prisma.$transaction(
      input.attendance.map((record) =>
        this.prisma.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: record.studentId,
              classId: input.classId,
              date: input.date,
            },
          },
          create: {
            student: { connect: { id: record.studentId } },
            class: { connect: { id: input.classId } },
            date: input.date,
            status: record.status,
            remarks: record.remarks,
          },
          update: {
            status: record.status,
            remarks: record.remarks,
          },
        })
      )
    );
  }

  private async checkScheduleConflicts(data: {
    dayOfWeek: string;
    startTime: Date;
    endTime: Date;
    facilityId?: string;
    assignmentId: string;
    excludePeriodId?: string;
  }) {
    const where: Prisma.TimetablePeriodWhereInput = {
      id: data.excludePeriodId ? { not: data.excludePeriodId } : undefined,
      dayOfWeek: data.dayOfWeek as any,
      status: 'ACTIVE',
      OR: [
        {
          AND: [
            { startTime: { lte: data.startTime } },
            { endTime: { gt: data.startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: data.endTime } },
            { endTime: { gte: data.endTime } },
          ],
        },
      ],
    };

    if (data.facilityId) {
      where.facilityId = data.facilityId;
    }

    where.assignmentId = data.assignmentId;

    const conflicts = await this.prisma.timetablePeriod.findMany({ where });

    return conflicts;
  }

  // Export Operations
  async exportClassData(input: ExportClassDataInput) {
    // This is a placeholder for the actual export implementation
    // In a real application, this would generate files in the requested format
    return {
      url: `https://example.com/exports/${input.classId}_${input.type}_${Date.now()}.${input.format.toLowerCase()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    };
  }

  // Reports Management
  async getReports(classId: string) {
    // Comment out problematic code since 'report' doesn't exist in Prisma schema
    /*
    const reports = await this.prisma.report.findMany({
      where: {
        classId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reports;
    */

    // Return empty array for now until Report is properly defined in schema
    return [];
  }

  async generateReport(input: {
    classId: string;
    type: 'ATTENDANCE' | 'PERFORMANCE' | 'SUMMARY';
    period: 'TERM' | 'MONTH' | 'WEEK' | 'CUSTOM';
    startDate?: Date;
    endDate?: Date;
    generatedById: string;
  }) {
    // Validate class exists
    const classExists = await this.prisma.class.findUnique({
      where: { id: input.classId },
      include: {
        term: true,
      },
    });

    if (!classExists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Class not found',
      });
    }

    // Set date range based on period
    let startDate = input.startDate;
    let endDate = input.endDate;

    if (!startDate || !endDate) {
      if (input.period === 'TERM') {
        startDate = classExists.term?.startDate ?? new Date();
        endDate = classExists.term?.endDate ?? new Date();
      } else if (input.period === 'MONTH') {
        startDate = new Date();
        startDate.setDate(1);
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      } else if (input.period === 'WEEK') {
        startDate = new Date();
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else {
        // Default to last 30 days if custom with no dates
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        endDate = new Date();
      }
    }

    // Determine report type and generate data
    let reportData: any = {};
    let reportTitle = '';

    if (input.type === 'ATTENDANCE') {
      reportTitle = `Attendance Report - ${classExists.name}`;

      // Get attendance data
      const attendanceData = await this.prisma.attendance.findMany({
        where: {
          classId: input.classId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Process attendance data
      reportData = {
        summary: {
          totalSessions: attendanceData.length > 0 ?
            [...new Set(attendanceData.map(a => a.date.toISOString().split('T')[0]))].length : 0,
          averageAttendance: attendanceData.length > 0 ?
            attendanceData.filter(a => a.status === 'PRESENT').length / attendanceData.length * 100 : 0,
        },
        details: attendanceData,
      };
    }

    else if (input.type === 'PERFORMANCE') {
      reportTitle = `Performance Report - ${classExists.name}`;

      // This will need to be updated to match the new Activity schema
      // and create meaningful performance reports
      reportData = {
        summary: {
          totalActivities: 0,
          averageScore: 0,
        },
        details: [],
      };
    }

    else if (input.type === 'SUMMARY') {
      reportTitle = `Summary Report - ${classExists.name}`;

      // Get student count
      const studentCount = await this.prisma.studentEnrollment.count({
        where: {
          classId: input.classId,
          status: 'ACTIVE',
        },
      });

      reportData = {
        className: classExists.name,
        term: classExists.term?.name,
        studentCount,
        period: {
          startDate,
          endDate,
        }
      };
    }

    // Return the report data without trying to create a report record
    // since report table doesn't exist in Prisma schema
    return {
      title: reportTitle,
      type: input.type,
      period: input.period,
      data: reportData,
      generatedAt: new Date(),
    };
  }

  async downloadReport(classId: string, reportId: string) {
    // For now, just return a placeholder
    return {
      url: `https://placeholder-report-url.com/${reportId}.pdf`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  // Assignments Management
  async getAssignments(classId: string) {
    // Query activities with purpose = ASSESSMENT instead of type
    const activities = await this.prisma.activity.findMany({
      where: {
        classId,
        status: 'ACTIVE',
        purpose: 'ASSESSMENT',
      },
      include: {
        _count: {
          select: {
            activityGrades: true,
          },
        },
      },
    });

    // Map to expected format
    const assignments = activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      startDate: activity.startDate,
      endDate: activity.endDate,
      maxScore: activity.maxScore,
      status: activity.status,
      purpose: activity.purpose,
      assessmentType: activity.assessmentType,
      submissionCount: 0, // Need a better way to track submissions
      gradedCount: activity._count.activityGrades,
    }));

    return assignments;
  }

  // Gradebook Management
  async getGradebook(classId: string) {
    // Check if the class exists
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Class not found',
      });
    }

    // Get all students enrolled in the class
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        classId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    // Get all gradable activities for the class
    const activities = await this.prisma.activity.findMany({
      where: {
        classId,
        isGradable: true,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get all grades for these activities and students
    const grades = await this.prisma.activityGrade.findMany({
      where: {
        activity: {
          classId,
        },
        studentId: {
          in: enrollments.map(e => e.studentId),
        },
      },
    });

    // Format the students with their final grades
    const students = enrollments.map(enrollment => {
      // Calculate final grade based on weighted average of all activities
      const studentGrades = grades.filter(grade => grade.studentId === enrollment.studentId);
      let finalGrade: number | null = null;
      let letterGrade: string | null = null;

      if (studentGrades.length > 0) {
        // This is a simplified grade calculation
        // In a real application, this would use the weightage of each activity
        const totalPoints = studentGrades.reduce((sum, grade) => sum + (grade.score || 0), 0);
        const maxPoints = activities.reduce((sum, activity) => sum + (activity.maxScore || 0), 0);
        if (maxPoints > 0) {
          finalGrade = Math.round((totalPoints / maxPoints) * 100);
          // Simple letter grade assignment
          if (finalGrade >= 90) letterGrade = 'A';
          else if (finalGrade >= 80) letterGrade = 'B';
          else if (finalGrade >= 70) letterGrade = 'C';
          else if (finalGrade >= 60) letterGrade = 'D';
          else letterGrade = 'F';
        }
      }

      return {
        id: enrollment.studentId,
        name: enrollment.student.user.name || 'Unknown',
        enrollmentNumber: enrollment.student.enrollmentNumber || '',
        finalGrade,
        letterGrade,
      };
    });

    // Format the assignments
    const assignments = activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      maxScore: activity.maxScore,
      weight: activity.weightage || 1,
    }));

    // Format the grades data
    const gradeData = grades.map(grade => ({
      id: grade.id,
      studentId: grade.studentId,
      assignmentId: grade.activityId,
      score: grade.score,
      percentage: grade.score && activities.find(a => a.id === grade.activityId)?.maxScore
        ? (grade.score / activities.find(a => a.id === grade.activityId)!.maxScore!) * 100
        : null,
    }));

    return {
      students,
      assignments,
      grades: gradeData,
    };
  }

  async initializeGradebook(classId: string, userId?: string) {
    // Check if the class exists
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        term: true
      }
    });

    if (!classData) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Class not found',
      });
    }

    // First, ensure a gradebook exists for this class
    let gradebook = await this.prisma.gradeBook.findFirst({
      where: {
        classId,
      },
    });

    // If no gradebook exists, create one
    if (!gradebook) {
      try {
        console.log('No gradebook found for class, creating one now');
        const gradeService = new GradeService({ prisma: this.prisma });

        // Use the provided userId or find a teacher assigned to this class
        let createdById = userId;

        // If no userId provided, try to find a teacher for this class
        if (!createdById) {
          const teacherAssignment = await this.prisma.teacherAssignment.findFirst({
            where: {
              classId,
              status: 'ACTIVE'
            },
            include: {
              teacher: {
                include: {
                  user: true
                }
              }
            }
          });

          if (teacherAssignment?.teacher?.user?.id) {
            createdById = teacherAssignment.teacher.user.id;
          }
        }

        // If still no user found, use a system user
        if (!createdById) {
          // Try to find a system admin user
          const systemUser = await this.prisma.user.findFirst({
            where: {
              userType: 'SYSTEM_ADMIN',
              status: 'ACTIVE'
            }
          });

          createdById = systemUser?.id || 'system';
        }

        gradebook = await gradeService.createGradeBook({
          classId,
          termId: classData.termId,
          calculationRules: {} as Prisma.JsonValue,
          createdById
        });
        console.log('Gradebook created successfully:', gradebook?.id);
      } catch (error: any) {
        console.error('Error creating gradebook:', error);

        // Check if this is a unique constraint error (P2002)
        if (error.code === 'P2002' &&
            error.meta?.target?.includes('classId') &&
            error.meta?.target?.includes('termId')) {

          // If it's a unique constraint error on classId and termId, try to find the existing gradebook
          const existingGradebook = await this.prisma.gradeBook.findFirst({
            where: {
              classId,
              termId: classData.termId
            }
          });

          if (existingGradebook) {
            console.log('Found existing gradebook after constraint error:', existingGradebook.id);
            gradebook = existingGradebook;
          } else {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create gradebook: A gradebook already exists for this class and term',
            });
          }
        } else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create gradebook',
          });
        }
      }
    }

    // Get all students enrolled in the class
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        classId,
        status: 'ACTIVE',
      },
      select: {
        studentId: true,
      },
    });

    // Get all gradable activities for the class
    const activities = await this.prisma.activity.findMany({
      where: {
        classId,
        isGradable: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    // Initialize empty grades for all students and activities
    const gradeData: {
      studentId: string;
      activityId: string;
      score: null;
      status: SubmissionStatus;
    }[] = [];

    for (const enrollment of enrollments) {
      for (const activity of activities) {
        // Check if a grade already exists
        const existingGrade = await this.prisma.activityGrade.findFirst({
          where: {
            studentId: enrollment.studentId,
            activityId: activity.id,
          },
        });

        if (!existingGrade) {
          gradeData.push({
            studentId: enrollment.studentId,
            activityId: activity.id,
            score: null,
            status: 'PENDING' as SubmissionStatus,
          });
        }
      }
    }

    // Bulk create the grade records if there are any to create
    if (gradeData.length > 0) {
      await this.prisma.activityGrade.createMany({
        data: gradeData,
        skipDuplicates: true,
      });
    }

    return {
      success: true,
      message: 'Gradebook initialized successfully',
      gradesCreated: gradeData.length,
      gradebookId: gradebook?.id
    };
  }
}







