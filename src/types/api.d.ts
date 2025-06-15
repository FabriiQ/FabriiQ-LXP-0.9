import { SystemStatus, AccessScope, EntityType } from "@prisma/client";

export interface User {
  id: string;
  name: string;
  email: string;
  status: SystemStatus;
  phone?: string;
  title?: string;
  department?: string;
  role: Role;
  campus: Campus;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  scope: AccessScope;
  entityType?: EntityType;
  status: SystemStatus;
  type: string;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: Date;
  details: string;
  user: User;
  role: Role;
  before?: any;
  after?: any;
  impact?: AuditImpact[];
}

export interface AuditImpact {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Campus {
  id: string;
  code: string;
  name: string;
  status: SystemStatus;
  institution: {
    code: string;
    name: string;
    id: string;
  };
} 