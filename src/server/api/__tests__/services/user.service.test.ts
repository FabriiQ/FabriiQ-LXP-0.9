/**
 * User Service Tests
 */

import { UserService } from '@/server/api/services/user.service';
import { createTestService, getMockPrisma } from '../test-utils';
import { TRPCError } from '@trpc/server';
import { AccessScope, SystemStatus, UserType } from '@prisma/client';

// Extend the UserService type for testing
interface ExtendedUserService extends UserService {
  // Add any test-specific methods here
}

describe('UserService', () => {
  let userService: UserService;
  let mockPrisma: ReturnType<typeof getMockPrisma>;

  beforeEach(() => {
    userService = createTestService(UserService);
    mockPrisma = getMockPrisma();
  });

  describe('getUser', () => {
    it('should return a user when found', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        userType: UserType.CAMPUS_ADMIN,
        institutionId: '1',
        status: SystemStatus.ACTIVE,
        username: 'testuser',
        phoneNumber: null,
        password: 'hashedpassword',
        profileImageUrl: null,
        accessScope: AccessScope.SYSTEM,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        dateOfBirth: null,
        profileData: null,
        primaryCampusId: null,
        deletedAt: null
      };
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUser('1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NOT_FOUND error when user does not exist', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUser('1')).rejects.toThrow(TRPCError);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        userType: UserType.CAMPUS_STUDENT,
        institutionId: '1',
        username: 'newuser',
        accessScope: AccessScope.SINGLE_CAMPUS,
      };
      
      const mockCreatedUser = {
        id: '2',
        ...userData,
        status: SystemStatus.ACTIVE,
        phoneNumber: null,
        password: 'hashedpassword',
        profileImageUrl: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        dateOfBirth: null,
        profileData: null,
        primaryCampusId: null,
        deletedAt: null
      };
      
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(mockCreatedUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining(userData),
      });
    });

    it('should throw CONFLICT error when email already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        name: 'New User',
        userType: UserType.CAMPUS_STUDENT,
        institutionId: '1',
        username: 'existinguser',
        accessScope: AccessScope.SINGLE_CAMPUS,
      };
      
      const prismaError = new Error('Unique constraint failed on the fields: (`email`)');
      prismaError.name = 'PrismaClientKnownRequestError';
      (prismaError as any).code = 'P2002';
      
      mockPrisma.user.create.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow(TRPCError);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining(userData),
      });
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      // Arrange
      const userId = '1';
      const updateData = {
        name: 'Updated Name',
      };
      
      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        userType: UserType.CAMPUS_ADMIN,
        institutionId: '1',
        status: SystemStatus.ACTIVE,
        username: 'testuser',
        phoneNumber: null,
        password: 'hashedpassword',
        profileImageUrl: null,
        accessScope: AccessScope.SYSTEM,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        dateOfBirth: null,
        profileData: null,
        primaryCampusId: null,
        deletedAt: null
      };
      
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await userService.updateUser(userId, updateData);

      // Assert
      expect(result).toEqual(mockUpdatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
    });

    it('should throw NOT_FOUND error when user does not exist', async () => {
      // Arrange
      const userId = 'nonexistent';
      const updateData = {
        name: 'Updated Name',
      };
      
      const prismaError = new Error('Record to update not found.');
      prismaError.name = 'PrismaClientKnownRequestError';
      (prismaError as any).code = 'P2025';
      
      mockPrisma.user.update.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(userService.updateUser(userId, updateData)).rejects.toThrow(TRPCError);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete and return the user', async () => {
      // Arrange
      const userId = '1';
      const mockDeletedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        userType: UserType.CAMPUS_ADMIN,
        institutionId: '1',
        status: SystemStatus.ACTIVE,
        username: 'testuser',
        phoneNumber: null,
        password: 'hashedpassword',
        profileImageUrl: null,
        accessScope: AccessScope.SYSTEM,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        dateOfBirth: null,
        profileData: null,
        primaryCampusId: null,
        deletedAt: null
      };
      
      mockPrisma.user.delete.mockResolvedValue(mockDeletedUser);

      // Act
      const result = await userService.deleteUser(userId);

      // Assert
      expect(result).toEqual(mockDeletedUser);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw NOT_FOUND error when user does not exist', async () => {
      // Arrange
      const userId = 'nonexistent';
      
      const prismaError = new Error('Record to delete does not exist.');
      prismaError.name = 'PrismaClientKnownRequestError';
      (prismaError as any).code = 'P2025';
      
      mockPrisma.user.delete.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(userService.deleteUser(userId)).rejects.toThrow(TRPCError);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
}); 