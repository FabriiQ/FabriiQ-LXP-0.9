'use client';

import React from 'react';
import { ClassCard, ClassActions, ClassData, UserRole, ClassAction } from '../';
import { SystemStatus } from '@prisma/client';

// Mock class data for demonstration
const mockClassData: ClassData = {
  id: 'class-1',
  code: 'CL-101',
  name: 'Introduction to Programming',
  minCapacity: 10,
  maxCapacity: 30,
  currentCount: 20,
  status: SystemStatus.ACTIVE,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
  courseCampusId: 'cc-1',
  termId: 'term-1',
  campusId: 'campus-1',
  courseCampus: {
    id: 'cc-1',
    course: {
      id: 'course-1',
      name: 'Programming Fundamentals',
      code: 'PF-101',
    },
  },
  term: {
    id: 'term-1',
    name: 'Fall 2023',
    code: 'F23',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2023-12-31'),
  },
  classTeacher: {
    id: 'teacher-1',
    user: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
  },
  facility: {
    id: 'facility-1',
    name: 'Computer Lab 1',
    code: 'CL1',
  },
  _count: {
    students: 20,
    activities: 5,
    assessments: 3,
  },
};

/**
 * Example component to demonstrate the usage of class components
 */
export const ClassComponentsExample: React.FC = () => {
  const [selectedRole, setSelectedRole] = React.useState<UserRole>(UserRole.TEACHER);
  
  // Handle role change
  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value as UserRole);
  };
  
  // Handle action click
  const handleActionClick = (action: ClassAction, classData: ClassData) => {
    console.log('Action:', action, 'Class:', classData);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Class Components Example</h1>
      
      {/* Role selector */}
      <div className="mb-6">
        <label htmlFor="role-select" className="block text-sm font-medium mb-2">
          Select User Role:
        </label>
        <select
          id="role-select"
          value={selectedRole}
          onChange={handleRoleChange}
          className="w-full max-w-xs p-2 border rounded"
        >
          {Object.values(UserRole).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      
      {/* ClassCard examples */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">ClassCard Component</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Full view */}
          <div>
            <h3 className="text-lg font-medium mb-2">Full View</h3>
            <ClassCard
              classData={mockClassData}
              viewMode="full"
              userRole={selectedRole}
              actions={[ClassAction.VIEW, ClassAction.EDIT, ClassAction.TAKE_ATTENDANCE, ClassAction.GRADE_ASSESSMENTS]}
            />
          </div>
          
          {/* Compact view */}
          <div>
            <h3 className="text-lg font-medium mb-2">Compact View</h3>
            <ClassCard
              classData={mockClassData}
              viewMode="compact"
              userRole={selectedRole}
              actions={[ClassAction.VIEW]}
            />
          </div>
          
          {/* Mobile view */}
          <div>
            <h3 className="text-lg font-medium mb-2">Mobile View</h3>
            <ClassCard
              classData={mockClassData}
              viewMode="mobile"
              userRole={selectedRole}
              actions={[ClassAction.VIEW, ClassAction.TAKE_ATTENDANCE]}
            />
          </div>
          
          {/* Loading state */}
          <div>
            <h3 className="text-lg font-medium mb-2">Loading State</h3>
            <ClassCard
              classData={mockClassData}
              viewMode="full"
              userRole={selectedRole}
              isLoading={true}
            />
          </div>
        </div>
      </section>
      
      {/* ClassActions examples */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">ClassActions Component</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Header placement */}
          <div className="p-4 border rounded">
            <h3 className="text-lg font-medium mb-2">Header Placement</h3>
            <ClassActions
              classData={mockClassData}
              userRole={selectedRole}
              enabledActions={[
                ClassAction.VIEW,
                ClassAction.EDIT,
                ClassAction.DELETE,
                ClassAction.ARCHIVE,
                ClassAction.TAKE_ATTENDANCE,
                ClassAction.GRADE_ASSESSMENTS,
              ]}
              placement="header"
              onAction={handleActionClick}
            />
          </div>
          
          {/* Card placement */}
          <div className="p-4 border rounded">
            <h3 className="text-lg font-medium mb-2">Card Placement</h3>
            <ClassActions
              classData={mockClassData}
              userRole={selectedRole}
              enabledActions={[
                ClassAction.VIEW,
                ClassAction.EDIT,
                ClassAction.TAKE_ATTENDANCE,
              ]}
              placement="card"
              onAction={handleActionClick}
            />
          </div>
          
          {/* Detail placement */}
          <div className="p-4 border rounded">
            <h3 className="text-lg font-medium mb-2">Detail Placement</h3>
            <ClassActions
              classData={mockClassData}
              userRole={selectedRole}
              enabledActions={[
                ClassAction.VIEW,
                ClassAction.EDIT,
                ClassAction.DELETE,
                ClassAction.ARCHIVE,
                ClassAction.TAKE_ATTENDANCE,
              ]}
              placement="detail"
              onAction={handleActionClick}
            />
          </div>
          
          {/* List placement */}
          <div className="p-4 border rounded">
            <h3 className="text-lg font-medium mb-2">List Placement</h3>
            <ClassActions
              classData={mockClassData}
              userRole={selectedRole}
              enabledActions={[
                ClassAction.VIEW,
                ClassAction.EDIT,
                ClassAction.DELETE,
              ]}
              placement="list"
              onAction={handleActionClick}
            />
          </div>
        </div>
      </section>
      
      {/* Backward compatibility examples */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Backward Compatibility</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">ClassCardComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ClassCardComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">ClassActionsComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ClassActionsComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClassComponentsExample;
