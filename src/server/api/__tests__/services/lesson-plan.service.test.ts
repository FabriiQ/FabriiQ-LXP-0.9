import { LessonPlanService } from '../../services/lesson-plan.service';
import { LessonPlanStatus, LessonPlanType, SystemStatus, UserType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../../services/notification.service';

// Mock the Prisma client
const mockPrisma = mockDeep<PrismaClient>();
// Mock the NotificationService
jest.mock('../../services/notification.service');
const MockedNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>;

describe('LessonPlanService', () => {
  let lessonPlanService: LessonPlanService;

  beforeEach(() => {
    mockReset(mockPrisma);
    MockedNotificationService.mockClear();
    lessonPlanService = new LessonPlanService({ prisma: mockPrisma as any });
  });

  describe('createLessonPlan', () => {
    it('should create a lesson plan with valid input', async () => {
      // Arrange
      const mockTeacher = {
        id: 'teacher1',
        userId: 'user1',
        user: {
          id: 'user1',
          name: 'Test Teacher',
          email: 'teacher@example.com',
        }
      };

      const mockClass = {
        id: 'class1',
        name: 'Test Class',
        campusId: 'campus1',
      };

      const mockSubject = {
        id: 'subject1',
        name: 'Test Subject',
      };

      const lessonPlanData = {
        title: 'Test Lesson Plan',
        description: 'Test Description',
        teacherId: 'teacher1',
        classId: 'class1',
        subjectId: 'subject1',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-07'),
        planType: LessonPlanType.WEEKLY,
        content: {
          learningObjectives: ['Objective 1', 'Objective 2'],
          topics: ['Topic 1', 'Topic 2'],
          teachingMethods: ['Method 1', 'Method 2'],
          resources: [
            { type: 'DOCUMENT', name: 'Resource 1' },
            { type: 'LINK', name: 'Resource 2', url: 'https://example.com' }
          ],
          activities: [
            { type: 'QUIZ', name: 'Activity 1' },
            { type: 'DISCUSSION', name: 'Activity 2' }
          ],
          assessments: [
            { type: 'QUIZ', name: 'Assessment 1' },
            { type: 'PROJECT', name: 'Assessment 2' }
          ],
          homework: [
            { description: 'Homework 1', dueDate: '2023-01-03' },
            { description: 'Homework 2', dueDate: '2023-01-05' }
          ],
          notes: 'Additional notes'
        }
      };

      const mockCreatedLessonPlan = {
        id: 'lessonplan1',
        ...lessonPlanData,
        status: LessonPlanStatus.DRAFT,
        submittedAt: null,
        coordinatorId: null,
        coordinatorNote: null,
        coordinatorApprovedAt: null,
        adminId: null,
        adminNote: null,
        adminApprovedAt: null,
        reflection: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        teacher: mockTeacher,
        class: mockClass,
        subject: mockSubject
      };

      // Mock the Prisma calls
      mockPrisma.teacherProfile.findUnique.mockResolvedValue(mockTeacher as any);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass as any);
      mockPrisma.subject.findUnique.mockResolvedValue(mockSubject as any);
      mockPrisma.lessonPlan.create.mockResolvedValue(mockCreatedLessonPlan as any);

      // Act
      const result = await lessonPlanService.createLessonPlan(lessonPlanData);

      // Assert
      expect(result).toEqual(mockCreatedLessonPlan);
      expect(mockPrisma.teacherProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'teacher1' }
      });
      expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
        where: { id: 'class1' }
      });
      expect(mockPrisma.subject.findUnique).toHaveBeenCalledWith({
        where: { id: 'subject1' }
      });
      expect(mockPrisma.lessonPlan.create).toHaveBeenCalledWith({
        data: {
          title: lessonPlanData.title,
          description: lessonPlanData.description,
          teacherId: lessonPlanData.teacherId,
          classId: lessonPlanData.classId,
          subjectId: lessonPlanData.subjectId,
          startDate: lessonPlanData.startDate,
          endDate: lessonPlanData.endDate,
          planType: lessonPlanData.planType,
          content: lessonPlanData.content,
          status: LessonPlanStatus.DRAFT
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true
        }
      });
    });

    it('should throw an error when teacher is not found', async () => {
      // Arrange
      const lessonPlanData = {
        title: 'Test Lesson Plan',
        description: 'Test Description',
        teacherId: 'nonexistent',
        classId: 'class1',
        subjectId: 'subject1',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-07'),
        planType: LessonPlanType.WEEKLY,
        content: {
          learningObjectives: ['Objective 1'],
          topics: ['Topic 1'],
          teachingMethods: ['Method 1'],
          resources: [],
          activities: [],
          assessments: [],
          homework: [],
          notes: ''
        }
      };

      // Mock the Prisma calls
      mockPrisma.teacherProfile.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(lessonPlanService.createLessonPlan(lessonPlanData)).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teacher not found',
        })
      );
    });
  });

  describe('submitLessonPlan', () => {
    it('should submit a lesson plan for review', async () => {
      // Arrange
      const submitData = {
        id: 'lessonplan1'
      };

      const teacherId = 'teacher1';

      const mockLessonPlan = {
        id: 'lessonplan1',
        title: 'Test Lesson Plan',
        status: LessonPlanStatus.DRAFT,
        teacherId: 'teacher1',
        class: {
          id: 'class1',
          name: 'Test Class',
          campusId: 'campus1'
        },
        teacher: {
          id: 'teacher1',
          user: {
            id: 'user1',
            name: 'Test Teacher',
            email: 'teacher@example.com'
          }
        }
      };

      const mockUpdatedLessonPlan = {
        ...mockLessonPlan,
        status: LessonPlanStatus.SUBMITTED,
        submittedAt: new Date()
      };

      // Mock the Prisma calls
      mockPrisma.lessonPlan.findUnique.mockResolvedValue(mockLessonPlan as any);
      mockPrisma.lessonPlan.update.mockResolvedValue(mockUpdatedLessonPlan as any);

      // Mock the coordinator query
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'coordinator1', name: 'Test Coordinator', email: 'coordinator@example.com' }
      ] as any);

      // Act
      const result = await lessonPlanService.submitLessonPlan(submitData, teacherId);

      // Assert
      expect(result).toEqual(mockUpdatedLessonPlan);
      expect(mockPrisma.lessonPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'lessonplan1' },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true
        }
      });
      expect(mockPrisma.lessonPlan.update).toHaveBeenCalledWith({
        where: { id: 'lessonplan1' },
        data: {
          status: LessonPlanStatus.SUBMITTED,
          submittedAt: expect.any(Date)
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true
        }
      });
      expect(MockedNotificationService.prototype.createNotification).toHaveBeenCalled();
    });

    it('should throw an error when lesson plan is not found', async () => {
      // Arrange
      const submitData = {
        id: 'nonexistent'
      };

      const teacherId = 'teacher1';

      // Mock the Prisma calls
      mockPrisma.lessonPlan.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(lessonPlanService.submitLessonPlan(submitData, teacherId)).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lesson plan not found',
        })
      );
    });

    it('should throw an error when user is not the teacher of the lesson plan', async () => {
      // Arrange
      const submitData = {
        id: 'lessonplan1'
      };

      const teacherId = 'teacher2';

      const mockLessonPlan = {
        id: 'lessonplan1',
        title: 'Test Lesson Plan',
        status: LessonPlanStatus.DRAFT,
        teacherId: 'teacher1'
      };

      // Mock the Prisma calls
      mockPrisma.lessonPlan.findUnique.mockResolvedValue(mockLessonPlan as any);

      // Act & Assert
      await expect(lessonPlanService.submitLessonPlan(submitData, teacherId)).rejects.toThrow(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not authorized to submit this lesson plan',
        })
      );
    });
  });

  describe('coordinatorApprove', () => {
    it('should approve a lesson plan as coordinator', async () => {
      // Arrange
      const approveData = {
        id: 'lessonplan1',
        note: 'Looks good!'
      };

      const coordinatorId = 'coordinator1';

      const mockLessonPlan = {
        id: 'lessonplan1',
        title: 'Test Lesson Plan',
        status: LessonPlanStatus.SUBMITTED,
        teacherId: 'teacher1',
        class: {
          id: 'class1',
          name: 'Test Class',
          campusId: 'campus1'
        },
        teacher: {
          id: 'teacher1',
          user: {
            id: 'user1',
            name: 'Test Teacher',
            email: 'teacher@example.com'
          }
        }
      };

      const mockUpdatedLessonPlan = {
        ...mockLessonPlan,
        status: LessonPlanStatus.COORDINATOR_APPROVED,
        coordinatorId: 'coordinator1',
        coordinatorNote: 'Looks good!',
        coordinatorApprovedAt: new Date(),
        coordinator: {
          id: 'coordinator1',
          name: 'Test Coordinator'
        }
      };

      // Mock the Prisma calls
      mockPrisma.lessonPlan.findUnique.mockResolvedValue(mockLessonPlan as any);
      mockPrisma.lessonPlan.update.mockResolvedValue(mockUpdatedLessonPlan as any);

      // Mock the admin query
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'admin1', name: 'Test Admin', email: 'admin@example.com' }
      ] as any);

      // Act
      const result = await lessonPlanService.coordinatorApprove(approveData, coordinatorId);

      // Assert
      expect(result).toEqual(mockUpdatedLessonPlan);
      expect(mockPrisma.lessonPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'lessonplan1' },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true
        }
      });
      expect(mockPrisma.lessonPlan.update).toHaveBeenCalledWith({
        where: { id: 'lessonplan1' },
        data: {
          status: LessonPlanStatus.COORDINATOR_APPROVED,
          coordinatorId: coordinatorId,
          coordinatorNote: approveData.note,
          coordinatorApprovedAt: expect.any(Date)
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true,
          coordinator: true
        }
      });
      expect(MockedNotificationService.prototype.createNotification).toHaveBeenCalled();
    });
  });

  describe('adminApprove', () => {
    it('should approve a lesson plan as admin', async () => {
      // Arrange
      const approveData = {
        id: 'lessonplan1',
        note: 'Final approval'
      };

      const adminId = 'admin1';

      const mockLessonPlan = {
        id: 'lessonplan1',
        title: 'Test Lesson Plan',
        status: LessonPlanStatus.COORDINATOR_APPROVED,
        teacherId: 'teacher1',
        class: {
          id: 'class1',
          name: 'Test Class',
          campusId: 'campus1'
        },
        teacher: {
          id: 'teacher1',
          user: {
            id: 'user1',
            name: 'Test Teacher',
            email: 'teacher@example.com'
          }
        }
      };

      const mockUpdatedLessonPlan = {
        ...mockLessonPlan,
        status: LessonPlanStatus.APPROVED,
        adminId: 'admin1',
        adminNote: 'Final approval',
        adminApprovedAt: new Date(),
        admin: {
          id: 'admin1',
          name: 'Test Admin'
        }
      };

      // Mock the Prisma calls
      mockPrisma.lessonPlan.findUnique.mockResolvedValue(mockLessonPlan as any);
      mockPrisma.lessonPlan.update.mockResolvedValue(mockUpdatedLessonPlan as any);

      // Act
      const result = await lessonPlanService.adminApprove(approveData, adminId);

      // Assert
      expect(result).toEqual(mockUpdatedLessonPlan);
      expect(mockPrisma.lessonPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'lessonplan1' },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true
        }
      });
      expect(mockPrisma.lessonPlan.update).toHaveBeenCalledWith({
        where: { id: 'lessonplan1' },
        data: {
          status: LessonPlanStatus.APPROVED,
          adminId: adminId,
          adminNote: approveData.note,
          adminApprovedAt: expect.any(Date)
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true,
          admin: true
        }
      });
      expect(MockedNotificationService.prototype.createNotification).toHaveBeenCalled();
    });
  });

  describe('addReflection', () => {
    it('should add reflection to a lesson plan', async () => {
      // Arrange
      const reflectionData = {
        id: 'lessonplan1',
        reflection: 'This lesson went well, but could improve timing.'
      };

      const teacherId = 'teacher1';

      const mockLessonPlan = {
        id: 'lessonplan1',
        title: 'Test Lesson Plan',
        status: LessonPlanStatus.APPROVED,
        teacherId: 'teacher1',
        reflection: null
      };

      const mockUpdatedLessonPlan = {
        ...mockLessonPlan,
        reflection: 'This lesson went well, but could improve timing.'
      };

      // Mock the Prisma calls
      mockPrisma.lessonPlan.findUnique.mockResolvedValue(mockLessonPlan as any);
      mockPrisma.lessonPlan.update.mockResolvedValue(mockUpdatedLessonPlan as any);

      // Act
      const result = await lessonPlanService.addReflection(reflectionData, teacherId);

      // Assert
      expect(result).toEqual(mockUpdatedLessonPlan);
      expect(mockPrisma.lessonPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'lessonplan1' }
      });
      expect(mockPrisma.lessonPlan.update).toHaveBeenCalledWith({
        where: { id: 'lessonplan1' },
        data: {
          reflection: reflectionData.reflection
        }
      });
    });

    it('should throw an error when user is not the teacher of the lesson plan', async () => {
      // Arrange
      const reflectionData = {
        id: 'lessonplan1',
        reflection: 'This lesson went well, but could improve timing.'
      };

      const teacherId = 'teacher2';

      const mockLessonPlan = {
        id: 'lessonplan1',
        title: 'Test Lesson Plan',
        status: LessonPlanStatus.APPROVED,
        teacherId: 'teacher1',
        reflection: null
      };

      // Mock the Prisma calls
      mockPrisma.lessonPlan.findUnique.mockResolvedValue(mockLessonPlan as any);

      // Act & Assert
      await expect(lessonPlanService.addReflection(reflectionData, teacherId)).rejects.toThrow(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not authorized to add reflection to this lesson plan',
        })
      );
    });
  });
});
