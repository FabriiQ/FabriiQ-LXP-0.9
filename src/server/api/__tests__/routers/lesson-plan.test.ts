import { createInnerTRPCContext } from '../../trpc';
import { appRouter } from '../../root';
import { LessonPlanService } from '../../services/lesson-plan.service';
import { LessonPlanStatus, LessonPlanType, UserType } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock the LessonPlanService
jest.mock('../../services/lesson-plan.service');
const MockedLessonPlanService = LessonPlanService as jest.MockedClass<typeof LessonPlanService>;

// Mock the Prisma client
const mockPrisma = mockDeep<PrismaClient>();

describe('Lesson Plan Router', () => {
  beforeEach(() => {
    MockedLessonPlanService.mockClear();
  });

  describe('create', () => {
    it('should create a lesson plan when user is a teacher', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user1',
          userType: UserType.CAMPUS_TEACHER
        }
      };

      const mockContext = createInnerTRPCContext({
        session: mockSession as any,
        prisma: mockPrisma as any
      });

      const caller = appRouter.createCaller(mockContext);

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
        updatedAt: new Date()
      };

      // Mock the service method
      MockedLessonPlanService.prototype.createLessonPlan.mockResolvedValue(mockCreatedLessonPlan as any);

      // Act
      const result = await caller.lessonPlan.create(lessonPlanData);

      // Assert
      expect(result).toEqual(mockCreatedLessonPlan);
      expect(MockedLessonPlanService.prototype.createLessonPlan).toHaveBeenCalledWith(lessonPlanData);
    });

    it('should throw an error when user is not authenticated', async () => {
      // Arrange
      const mockContext = createInnerTRPCContext({
        session: null,
        prisma: mockPrisma as any
      });

      const caller = appRouter.createCaller(mockContext);

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

      // Act & Assert
      await expect(caller.lessonPlan.create(lessonPlanData)).rejects.toThrow('UNAUTHORIZED');
    });

    it('should throw an error when user is not a teacher', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user1',
          userType: UserType.STUDENT
        }
      };

      const mockContext = createInnerTRPCContext({
        session: mockSession as any,
        prisma: mockPrisma as any
      });

      const caller = appRouter.createCaller(mockContext);

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

      // Act & Assert
      await expect(caller.lessonPlan.create(lessonPlanData)).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('submit', () => {
    it('should submit a lesson plan when user is the teacher', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user1',
          userType: UserType.CAMPUS_TEACHER
        }
      };

      const mockContext = createInnerTRPCContext({
        session: mockSession as any,
        prisma: mockPrisma as any
      });

      const caller = appRouter.createCaller(mockContext);

      const submitData = {
        id: 'lessonplan1'
      };

      const mockSubmittedLessonPlan = {
        id: 'lessonplan1',
        title: 'Test Lesson Plan',
        status: LessonPlanStatus.SUBMITTED,
        submittedAt: new Date(),
        teacherId: 'teacher1'
      };

      // Mock the service method
      MockedLessonPlanService.prototype.submitLessonPlan.mockResolvedValue(mockSubmittedLessonPlan as any);

      // Act
      const result = await caller.lessonPlan.submit(submitData);

      // Assert
      expect(result).toEqual(mockSubmittedLessonPlan);
      expect(MockedLessonPlanService.prototype.submitLessonPlan).toHaveBeenCalledWith(submitData, 'user1');
    });
  });

  describe('coordinatorApprove', () => {
    it('should approve a lesson plan when user is a coordinator', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'coordinator1',
          userType: UserType.CAMPUS_COORDINATOR
        }
      };

      const mockContext = createInnerTRPCContext({
        session: mockSession as any,
        prisma: mockPrisma as any
      });

      const caller = appRouter.createCaller(mockContext);

      const approveData = {
        id: 'lessonplan1',
        note: 'Looks good!'
      };

      const mockApprovedLessonPlan = {
        id: 'lessonplan1',
        title: 'Test Lesson Plan',
        status: LessonPlanStatus.COORDINATOR_APPROVED,
        coordinatorId: 'coordinator1',
        coordinatorNote: 'Looks good!',
        coordinatorApprovedAt: new Date()
      };

      // Mock the service method
      MockedLessonPlanService.prototype.coordinatorApprove.mockResolvedValue(mockApprovedLessonPlan as any);

      // Act
      const result = await caller.lessonPlan.coordinatorApprove(approveData);

      // Assert
      expect(result).toEqual(mockApprovedLessonPlan);
      expect(MockedLessonPlanService.prototype.coordinatorApprove).toHaveBeenCalledWith(approveData, 'coordinator1');
    });

    it('should throw an error when user is not a coordinator', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user1',
          userType: UserType.CAMPUS_TEACHER
        }
      };

      const mockContext = createInnerTRPCContext({
        session: mockSession as any,
        prisma: mockPrisma as any
      });

      const caller = appRouter.createCaller(mockContext);

      const approveData = {
        id: 'lessonplan1',
        note: 'Looks good!'
      };

      // Act & Assert
      await expect(caller.lessonPlan.coordinatorApprove(approveData)).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('adminApprove', () => {
    it('should approve a lesson plan when user is an admin', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin1',
          userType: UserType.CAMPUS_ADMIN
        }
      };

      const mockContext = createInnerTRPCContext({
        session: mockSession as any,
        prisma: mockPrisma as any
      });

      const caller = appRouter.createCaller(mockContext);

      const approveData = {
        id: 'lessonplan1',
        note: 'Final approval'
      };

      const mockApprovedLessonPlan = {
        id: 'lessonplan1',
        title: 'Test Lesson Plan',
        status: LessonPlanStatus.APPROVED,
        adminId: 'admin1',
        adminNote: 'Final approval',
        adminApprovedAt: new Date()
      };

      // Mock the service method
      MockedLessonPlanService.prototype.adminApprove.mockResolvedValue(mockApprovedLessonPlan as any);

      // Act
      const result = await caller.lessonPlan.adminApprove(approveData);

      // Assert
      expect(result).toEqual(mockApprovedLessonPlan);
      expect(MockedLessonPlanService.prototype.adminApprove).toHaveBeenCalledWith(approveData, 'admin1');
    });
  });

  describe('addReflection', () => {
    it('should add reflection to a lesson plan when user is the teacher', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user1',
          userType: UserType.CAMPUS_TEACHER
        }
      };

      const mockContext = createInnerTRPCContext({
        session: mockSession as any,
        prisma: mockPrisma as any
      });

      const caller = appRouter.createCaller(mockContext);

      const reflectionData = {
        id: 'lessonplan1',
        reflection: 'This lesson went well, but could improve timing.'
      };

      const mockUpdatedLessonPlan = {
        id: 'lessonplan1',
        title: 'Test Lesson Plan',
        status: LessonPlanStatus.APPROVED,
        reflection: 'This lesson went well, but could improve timing.'
      };

      // Mock the service method
      MockedLessonPlanService.prototype.addReflection.mockResolvedValue(mockUpdatedLessonPlan as any);

      // Act
      const result = await caller.lessonPlan.addReflection(reflectionData);

      // Assert
      expect(result).toEqual(mockUpdatedLessonPlan);
      expect(MockedLessonPlanService.prototype.addReflection).toHaveBeenCalledWith(reflectionData, 'user1');
    });
  });
});
