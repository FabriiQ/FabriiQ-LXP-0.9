import { Prisma, Permission, UserPermission, SystemStatus, UserType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { 
  AssignPermissionInput, 
  CreatePermissionInput, 
  PermissionFilters, 
  PermissionServiceConfig, 
  RevokePermissionInput, 
  UpdatePermissionInput, 
  UserPermissionFilters,
  DefaultRoles
} from "../types/permission";

export class PermissionService {
  private prisma: Prisma.TransactionClient | PrismaClient;
  private defaultStatus: SystemStatus;

  constructor(config: PermissionServiceConfig) {
    this.prisma = config.prisma;
    this.defaultStatus = config.defaultPermissionStatus || SystemStatus.ACTIVE;
  }

  // Permission CRUD operations
  async createPermission(data: CreatePermissionInput): Promise<Permission> {
    return this.prisma.permission.create({
      data: {
        ...data,
        status: this.defaultStatus
      }
    });
  }

  async getPermission(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id }
    });
  }

  async getPermissionByCode(code: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { code }
    });
  }

  async updatePermission(id: string, data: UpdatePermissionInput): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data
    });
  }

  async deletePermission(id: string): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data: {
        status: SystemStatus.DELETED,
        deletedAt: new Date()
      }
    });
  }

  async listPermissions(
    filters: PermissionFilters = {},
    skip?: number,
    take?: number
  ): Promise<{ items: Permission[]; total: number }> {
    const { scope, entityType, status, search } = filters;
    
    const where: Prisma.PermissionWhereInput = {
      status: status || SystemStatus.ACTIVE,
      ...(scope && { scope }),
      ...(entityType && { entityType }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [items, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' }
      }),
      this.prisma.permission.count({ where })
    ]);

    return { items, total };
  }

  // User permission management
  async assignPermission(data: AssignPermissionInput): Promise<UserPermission> {
    const { userId, permissionId, campusId } = data;
    
    // Check if the permission already exists
    const existingPermission = await this.prisma.userPermission.findFirst({
      where: {
        userId,
        permissionId,
        campusId: campusId || null
      }
    });

    if (existingPermission) {
      // If it exists but was deleted, reactivate it
      if (existingPermission.status !== SystemStatus.ACTIVE) {
        return this.prisma.userPermission.update({
          where: { id: existingPermission.id },
          data: {
            status: SystemStatus.ACTIVE,
            deletedAt: null
          }
        });
      }
      return existingPermission;
    }

    // Create new permission assignment
    return this.prisma.userPermission.create({
      data: {
        userId,
        permissionId,
        campusId,
        status: SystemStatus.ACTIVE
      }
    });
  }

  async revokePermission(data: RevokePermissionInput): Promise<UserPermission | null> {
    const { userId, permissionId, campusId } = data;
    
    const userPermission = await this.prisma.userPermission.findFirst({
      where: {
        userId,
        permissionId,
        campusId: campusId || null,
        status: SystemStatus.ACTIVE
      }
    });

    if (!userPermission) return null;

    return this.prisma.userPermission.update({
      where: { id: userPermission.id },
      data: {
        status: SystemStatus.DELETED,
        deletedAt: new Date()
      }
    });
  }

  async listUserPermissions(
    filters: UserPermissionFilters = {},
    skip?: number,
    take?: number
  ): Promise<{ items: UserPermission[]; total: number }> {
    const { userId, permissionId, campusId, status } = filters;
    
    const where: Prisma.UserPermissionWhereInput = {
      status: status || SystemStatus.ACTIVE,
      ...(userId && { userId }),
      ...(permissionId && { permissionId }),
      ...(campusId !== undefined && { campusId: campusId || null })
    };

    const [items, total] = await Promise.all([
      this.prisma.userPermission.findMany({
        where,
        skip,
        take,
        include: {
          permission: true,
          campus: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.userPermission.count({ where })
    ]);

    return { items, total };
  }

  // Role-based permission management
  async setupDefaultRolePermissions(
    userId: string,
    userType: UserType,
    campusId?: string
  ): Promise<{ success: boolean; count: number }> {
    const roleConfig = DefaultRoles[userType];
    if (!roleConfig) {
      throw new Error(`No default permissions defined for role: ${userType}`);
    }

    // Get all permissions by code
    const permissions = await this.prisma.permission.findMany({
      where: {
        code: {
          in: roleConfig.permissions
        },
        status: SystemStatus.ACTIVE
      }
    });

    // Assign each permission to the user
    const permissionPromises = permissions.map((permission: Permission) => 
      this.assignPermission({
        userId,
        permissionId: permission.id,
        campusId: roleConfig.scope === 'SINGLE_CAMPUS' ? campusId : undefined
      })
    );

    await Promise.all(permissionPromises);
    
    return {
      success: true,
      count: permissions.length
    };
  }

  // Permission validation
  async validatePermission(
    userId: string,
    permissionCode: string,
    campusId?: string
  ): Promise<boolean> {
    // First, check if the user has a system-wide permission
    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode }
    });

    if (!permission) return false;

    // Check for wildcard permission (system admin)
    const wildcardPermission = await this.prisma.userPermission.findFirst({
      where: {
        userId,
        permission: {
          code: '*'
        },
        status: SystemStatus.ACTIVE
      }
    });

    if (wildcardPermission) return true;

    // Check for the specific permission
    const userPermission = await this.prisma.userPermission.findFirst({
      where: {
        userId,
        permissionId: permission.id,
        status: SystemStatus.ACTIVE,
        OR: [
          // System-wide permission
          { campusId: null },
          // Campus-specific permission if campusId is provided
          ...(campusId ? [{ campusId }] : [])
        ]
      }
    });

    return !!userPermission;
  }
} 