'use client';

import React, { useState } from 'react';
import { 
  ClassForm, 
  ClassDashboard, 
  ClassStudentList,
  ClassData, 
  UserRole, 
  ClassStudentData,
  ClassStudentAction
} from '../';
import { SystemStatus } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

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
      description: 'An introduction to programming concepts using Python.',
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

// Mock students data
const mockStudents: ClassStudentData[] = Array.from({ length: 10 }).map((_, index) => ({
  id: `student-${index + 1}`,
  userId: `user-${index + 10}`,
  name: `Student ${index + 1}`,
  email: `student${index + 1}@example.com`,
  enrollmentDate: new Date('2023-08-15'),
  status: 'ACTIVE',
  attendance: {
    present: 8 + (index % 3),
    absent: 2 - (index % 3),
    excused: 0,
    total: 10,
    percentage: (8 + (index % 3)) / 10 * 100,
  },
  grades: {
    average: 70 + (index * 2),
    assessmentsCompleted: 2,
    assessmentsTotal: 3,
  },
}));

// Mock course options
const mockCourses = [
  { id: 'cc-1', name: 'Programming Fundamentals', code: 'PF-101' },
  { id: 'cc-2', name: 'Data Structures', code: 'DS-101' },
  { id: 'cc-3', name: 'Web Development', code: 'WD-101' },
];

// Mock teacher options
const mockTeachers = [
  { id: 'teacher-1', name: 'John Doe' },
  { id: 'teacher-2', name: 'Jane Smith' },
  { id: 'teacher-3', name: 'Bob Johnson' },
];

// Mock term options
const mockTerms = [
  { 
    id: 'term-1', 
    name: 'Fall 2023', 
    code: 'F23', 
    startDate: new Date('2023-09-01'), 
    endDate: new Date('2023-12-31') 
  },
  { 
    id: 'term-2', 
    name: 'Spring 2024', 
    code: 'S24', 
    startDate: new Date('2024-01-15'), 
    endDate: new Date('2024-05-15') 
  },
];

// Mock facility options
const mockFacilities = [
  { id: 'facility-1', name: 'Computer Lab 1', code: 'CL1' },
  { id: 'facility-2', name: 'Lecture Hall A', code: 'LHA' },
  { id: 'facility-3', name: 'Classroom 101', code: 'CR101' },
];

// Mock program options
const mockPrograms = [
  { id: 'program-1', name: 'Computer Science', code: 'CS' },
  { id: 'program-2', name: 'Business Administration', code: 'BA' },
];

// Mock campus options
const mockCampuses = [
  { id: 'campus-1', name: 'Main Campus', code: 'MC' },
  { id: 'campus-2', name: 'Downtown Campus', code: 'DC' },
];

/**
 * Example component to demonstrate the usage of Phase 4 components
 */
export const ClassPhase4Example: React.FC = () => {
  // State for selected role
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TEACHER);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State for student view mode
  const [studentViewMode, setStudentViewMode] = useState<'table' | 'grid' | 'mobile'>('table');
  
  // Toast hook
  const { toast } = useToast();
  
  // Handle role change
  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value as UserRole);
  };
  
  // Handle form submission
  const handleFormSubmit = (values: any) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Class Updated',
        description: 'The class has been updated successfully.',
      });
      console.log('Form values:', values);
    }, 1500);
  };
  
  // Handle form cancel
  const handleFormCancel = () => {
    toast({
      title: 'Cancelled',
      description: 'Form changes were discarded.',
      variant: 'destructive',
    });
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: '7d' | '30d' | '90d' | 'all') => {
    console.log('Time range changed:', range);
  };
  
  // Handle student action
  const handleStudentAction = (action: ClassStudentAction, student: ClassStudentData) => {
    toast({
      title: `${action.charAt(0).toUpperCase() + action.slice(1).replace('-', ' ')}`,
      description: `Action performed on ${student.name}`,
    });
    console.log('Student action:', action, student);
  };
  
  // Handle add student
  const handleAddStudent = () => {
    toast({
      title: 'Add Student',
      description: 'Add student functionality would be implemented here.',
    });
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Phase 4 Components Example</h1>
      
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
      
      {/* Component tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="form">Form</TabsTrigger>
        </TabsList>
        
        {/* Dashboard tab */}
        <TabsContent value="dashboard" className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Class Dashboard</h2>
          <ClassDashboard
            classData={mockClassData}
            userRole={selectedRole}
            timeRange="7d"
            onTimeRangeChange={handleTimeRangeChange}
          />
        </TabsContent>
        
        {/* Students tab */}
        <TabsContent value="students" className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Class Students</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              View Mode:
            </label>
            <div className="flex space-x-2">
              <Button
                variant={studentViewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStudentViewMode('table')}
              >
                Table
              </Button>
              <Button
                variant={studentViewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStudentViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={studentViewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStudentViewMode('mobile')}
              >
                Mobile
              </Button>
            </div>
          </div>
          
          <ClassStudentList
            classData={mockClassData}
            students={mockStudents}
            userRole={selectedRole}
            actions={['view', 'message', 'remove', 'view-grades', 'view-attendance']}
            viewMode={studentViewMode}
            onAction={handleStudentAction}
            onAddStudent={handleAddStudent}
          />
        </TabsContent>
        
        {/* Form tab */}
        <TabsContent value="form" className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Class Form</h2>
          <ClassForm
            classData={mockClassData}
            userRole={selectedRole}
            courses={mockCourses}
            teachers={mockTeachers}
            terms={mockTerms}
            facilities={mockFacilities}
            programs={mockPrograms}
            campuses={mockCampuses}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isLoading}
            mode="edit"
          />
        </TabsContent>
      </Tabs>
      
      {/* Backward compatibility examples */}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Backward Compatibility</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">ClassFormComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ClassFormComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">ClassDashboardComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ClassDashboardComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">ClassStudentListComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ClassStudentListComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassPhase4Example;
