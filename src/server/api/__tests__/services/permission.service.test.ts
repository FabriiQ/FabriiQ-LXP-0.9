/**
 * Permission Service Tests
 */

import { PermissionService } from '@/server/api/services/permission.service';
import { createTestService, getMockPrisma } from '../test-utils';
import { TRPCError } from '@trpc/server';
import { AccessScope, EntityType, SystemStatus } from '@prisma/client';

// Mock the types we need for testing
const mockPermissionStatus = SystemStatus;

describe('PermissionService', () => {
  let permissionService: PermissionService;
  let mockPrisma: ReturnType<typeof getMockPrisma>;

  beforeEach(() => {
    permissionService = createTestService(PermissionService);
    mockPrisma = getMockPrisma();
  });

  describe('getPermission', () => {
    it('should return a permission when found', async () => {
      // Arrange
      const mockPermission = {
        id: '1',
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        status: SystemStatus.ACTIVE,
        scope: AccessScope.SYSTEM,
        entityType: EntityType.PROGRAM,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrisma.permission.findUnique.mockResolvedValue(mockPermission);

      // Act
      const result = await permissionService.getPermission('1');

      // Assert
      expect(result).toEqual(mockPermission);
      expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NOT_FOUND error when permission does not exist', async () => {
      // Arrange
      mockPrisma.permission.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(permissionService.getPermission('1')).rejects.toThrow(TRPCError);
      expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getPermissionByCode', () => {
    it('should return a permission when found by code', async () => {
      // Arrange
      const mockPermission = {
        id: '1',
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        status: SystemStatus.ACTIVE,
        scope: AccessScope.SYSTEM,
        entityType: EntityType.PROGRAM,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrisma.permission.findUnique.mockResolvedValue(mockPermission);

      // Act
      const result = await permissionService.getPermissionByCode('TEST_PERMISSION');

      // Assert
      expect(result).toEqual(mockPermission);
      expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
        where: { code: 'TEST_PERMISSION' },
      });
    });

    it('should return null when permission does not exist', async () => {
      // Arrange
      mockPrisma.permission.findUnique.mockResolvedValue(null);

      // Act
      const result = await permissionService.getPermissionByCode('NONEXISTENT');

      // Assert
      expect(result).toBeNull();
      expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
        where: { code: 'NONEXISTENT' },
      });
    });
  });

  describe('createPermission', () => {
    it('should create and return a new permission', async () => {
      // Arrange
      const permissionData = {
        code: 'NEW_PERMISSION',
        name: 'New Permission',
        description: 'A new test permission',
        scope: AccessScope.SYSTEM,
      };
      
      const mockCreatedPermission = {
        id: '2',
        ...permissionData,
        status: SystemStatus.ACTIVE,
        entityType: EntityType.PROGRAM,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrisma.permission.create.mockResolvedValue(mockCreatedPermission);

      // Act
      const result = await permissionService.createPermission(permissionData);

      // Assert
      expect(result).toEqual(mockCreatedPermission);
      expect(mockPrisma.permission.create).toHaveBeenCalledWith({
        data: expect.objectContaining(permissionData),
      });
    });

    it('should throw CONFLICT error when code already exists', async () => {
      // Arrange
      const permissionData = {
        code: 'EXISTING_PERMISSION',
        name: 'New Permission',
        description: 'A new test permission',
        scope: AccessScope.SYSTEM,
      };
      
      const prismaError = new Error('Unique constraint failed on the fields: (`code`)');
      prismaError.name = 'PrismaClientKnownRequestError';
      (prismaError as any).code = 'P2002';
      
      mockPrisma.permission.create.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(permissionService.createPermission(permissionData)).rejects.toThrow(TRPCError);
      expect(mockPrisma.permission.create).toHaveBeenCalledWith({
        data: expect.objectContaining(permissionData),
      });
    });
  });

  describe('validatePermission', () => {
    it('should return true when user has system-wide permission', async () => {
      // Arrange
      const userId = '1';
      const permissionCode = 'TEST_PERMISSION';
      
      // Mock finding the permission
      mockPrisma.permission.findUnique.mockResolvedValue({
        id: '1',
        code: permissionCode,
        name: 'Test Permission',
        description: 'A test permission',
        status: SystemStatus.ACTIVE,
        scope: AccessScope.SYSTEM,
        entityType: EntityType.PROGRAM,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock finding the user permission
      mockPrisma.userPermission.findFirst.mockResolvedValue({
        id: '1',
        userId,
        permissionId: '1',
        status: SystemStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        campusId: null
      });

      // Act
      const result = await permissionService.validatePermission(userId, permissionCode);

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
        where: { code: permissionCode },
      });
      expect(mockPrisma.userPermission.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          permissionId: '1',
          status: SystemStatus.ACTIVE,
        },
      });
    });

    it('should return true when user has wildcard permission', async () => {
      // Arrange
      const userId = '1';
      const permissionCode = 'TEST_PERMISSION';
      
      // Mock not finding the specific permission
      mockPrisma.permission.findUnique.mockResolvedValue(null);
      
      // Mock finding wildcard permission
      mockPrisma.userPermission.findFirst.mockResolvedValueOnce({
        id: '1',
        userId,
        permissionId: 'wildcard',
        status: SystemStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        campusId: null
      });

      // Act
      const result = await permissionService.validatePermission(userId, permissionCode);

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
        where: { code: permissionCode },
      });
      expect(mockPrisma.userPermission.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          permission: {
            code: '*',
          },
          status: SystemStatus.ACTIVE,
        },
      });
    });

    it('should return false when user does not have permission', async () => {
      // Arrange
      const userId = '1';
      const permissionCode = 'TEST_PERMISSION';
      
      // Mock finding the permission
      mockPrisma.permission.findUnique.mockResolvedValue({
        id: '1',
        code: permissionCode,
        name: 'Test Permission',
        description: 'A test permission',
        status: SystemStatus.ACTIVE,
        scope: AccessScope.SYSTEM,
        entityType: EntityType.PROGRAM,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock not finding the user permission
      mockPrisma.userPermission.findFirst.mockResolvedValue(null);
      
      // Mock not finding wildcard permission
      mockPrisma.userPermission.findFirst.mockResolvedValue(null);

      // Act
      const result = await permissionService.validatePermission(userId, permissionCode);

      // Assert
      expect(result).toBe(false);
    });
  });
}); 