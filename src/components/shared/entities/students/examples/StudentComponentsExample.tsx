'use client';

import React, { useState } from 'react';
import { 
  StudentCard, 
  StudentList, 
  StudentFilters, 
  StudentForm, 
  StudentProfileView, 
  StudentTabs, 
  StudentPerformanceView,
  StudentActions,
  UserRole,
  StudentStatus,
  StudentAction,
  StudentTab,
  StudentData
} from '../';

// Sample student data
const sampleStudents: StudentData[] = [
  {
    id: 'student-1',
    userId: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    enrollmentNumber: 'S12345',
    status: StudentStatus.ACTIVE,
    programName: 'Computer Science',
    academicScore: 85.5,
    attendanceRate: 92.3,
    participationRate: 78.9,
    classCount: 4,
    leaderboardPosition: 5,
    leaderboardChange: 2,
  },
  {
    id: 'student-2',
    userId: 'user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    enrollmentNumber: 'S12346',
    status: StudentStatus.ACTIVE,
    programName: 'Business Administration',
    academicScore: 92.1,
    attendanceRate: 88.7,
    participationRate: 85.2,
    classCount: 5,
    leaderboardPosition: 2,
    leaderboardChange: 1,
  },
  {
    id: 'student-3',
    userId: 'user-3',
    name: 'Michael Johnson',
    email: 'michael.johnson@example.com',
    enrollmentNumber: 'S12347',
    status: StudentStatus.INACTIVE,
    programName: 'Graphic Design',
    academicScore: 76.8,
    attendanceRate: 65.4,
    participationRate: 70.1,
    classCount: 3,
    leaderboardPosition: 15,
    leaderboardChange: -3,
  },
];

// Sample programs
const samplePrograms = [
  { id: 'program-1', name: 'Computer Science' },
  { id: 'program-2', name: 'Business Administration' },
  { id: 'program-3', name: 'Graphic Design' },
];

// Sample classes
const sampleClasses = [
  { id: 'class-1', name: 'Introduction to Programming' },
  { id: 'class-2', name: 'Data Structures and Algorithms' },
  { id: 'class-3', name: 'Web Development' },
  { id: 'class-4', name: 'Database Systems' },
];

// Sample campuses
const sampleCampuses = [
  { id: 'campus-1', name: 'Main Campus' },
  { id: 'campus-2', name: 'Downtown Campus' },
  { id: 'campus-3', name: 'Online Campus' },
];

/**
 * Example component demonstrating the usage of student components
 */
export const StudentComponentsExample: React.FC = () => {
  // State for selected component
  const [selectedComponent, setSelectedComponent] = useState<string>('list');
  
  // State for selected student
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  
  // State for user role
  const [userRole, setUserRole] = useState<UserRole>(UserRole.TEACHER);
  
  // Handle component selection
  const handleComponentSelect = (component: string) => {
    setSelectedComponent(component);
  };
  
  // Handle role selection
  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
  };
  
  // Handle student action
  const handleStudentAction = (action: StudentAction, student: StudentData) => {
    console.log(`Action: ${action} on student: ${student.name}`);
    
    if (action === StudentAction.VIEW) {
      setSelectedStudent(student);
      setSelectedComponent('profile');
    }
  };
  
  // Handle student click
  const handleStudentClick = (student: StudentData) => {
    setSelectedStudent(student);
    setSelectedComponent('profile');
  };
  
  // Handle form submit
  const handleFormSubmit = (data: any) => {
    console.log('Form submitted:', data);
    setSelectedComponent('list');
  };
  
  // Handle form cancel
  const handleFormCancel = () => {
    setSelectedComponent('list');
  };
  
  // Handle filter change
  const handleFilterChange = (filters: any) => {
    console.log('Filters changed:', filters);
  };
  
  // Handle export
  const handleExport = () => {
    console.log('Exporting data...');
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    console.log('Time range changed:', range);
  };
  
  // Handle tab change
  const handleTabChange = (tab: StudentTab) => {
    console.log('Tab changed:', tab);
  };
  
  // Render selected component
  const renderSelectedComponent = () => {
    switch (selectedComponent) {
      case 'card':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleStudents.map(student => (
              <StudentCard
                key={student.id}
                student={student}
                userRole={userRole}
                actions={[StudentAction.VIEW, StudentAction.EDIT, StudentAction.PROVIDE_FEEDBACK]}
                onAction={handleStudentAction}
                onClick={handleStudentClick}
              />
            ))}
          </div>
        );
      
      case 'list':
        return (
          <StudentList
            students={sampleStudents}
            userRole={userRole}
            actions={[StudentAction.VIEW, StudentAction.EDIT, StudentAction.PROVIDE_FEEDBACK]}
            onAction={handleStudentAction}
            onFilterChange={handleFilterChange}
          />
        );
      
      case 'filters':
        return (
          <StudentFilters
            userRole={userRole}
            onFilterChange={handleFilterChange}
            availablePrograms={samplePrograms}
            availableClasses={sampleClasses}
            availableCampuses={sampleCampuses}
          />
        );
      
      case 'form':
        return (
          <StudentForm
            userRole={userRole}
            initialData={selectedStudent || {}}
            isNew={!selectedStudent}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            availablePrograms={samplePrograms}
            availableClasses={sampleClasses}
            availableCampuses={sampleCampuses}
          />
        );
      
      case 'profile':
        return selectedStudent ? (
          <StudentProfileView
            student={selectedStudent}
            userRole={userRole}
            onAction={handleStudentAction}
          />
        ) : (
          <div className="text-center py-8">
            No student selected. Please select a student from the list.
          </div>
        );
      
      case 'tabs':
        return selectedStudent ? (
          <StudentTabs
            student={selectedStudent}
            userRole={userRole}
            title="Student Information"
            description="View detailed student information"
            onTabChange={handleTabChange}
          />
        ) : (
          <div className="text-center py-8">
            No student selected. Please select a student from the list.
          </div>
        );
      
      case 'performance':
        return selectedStudent ? (
          <StudentPerformanceView
            student={selectedStudent}
            userRole={userRole}
            onExport={handleExport}
            onTimeRangeChange={handleTimeRangeChange}
          />
        ) : (
          <div className="text-center py-8">
            No student selected. Please select a student from the list.
          </div>
        );
      
      case 'actions':
        return selectedStudent ? (
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-bold mb-4">Student Actions</h2>
            <StudentActions
              student={selectedStudent}
              userRole={userRole}
              onAction={handleStudentAction}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            No student selected. Please select a student from the list.
          </div>
        );
      
      default:
        return (
          <div className="text-center py-8">
            Please select a component to view.
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Student Components Example</h1>
        
        <div className="flex flex-wrap gap-2">
          <select
            className="px-3 py-1 border rounded-md"
            value={userRole}
            onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
          >
            <option value={UserRole.STUDENT}>Student</option>
            <option value={UserRole.TEACHER}>Teacher</option>
            <option value={UserRole.COORDINATOR}>Coordinator</option>
            <option value={UserRole.CAMPUS_ADMIN}>Campus Admin</option>
            <option value={UserRole.SYSTEM_ADMIN}>System Admin</option>
          </select>
          
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md"
            onClick={() => handleComponentSelect('list')}
          >
            List
          </button>
          
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md"
            onClick={() => handleComponentSelect('card')}
          >
            Card
          </button>
          
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md"
            onClick={() => handleComponentSelect('filters')}
          >
            Filters
          </button>
          
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md"
            onClick={() => {
              setSelectedStudent(null);
              handleComponentSelect('form');
            }}
          >
            Form
          </button>
          
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md"
            onClick={() => handleComponentSelect('profile')}
            disabled={!selectedStudent}
          >
            Profile
          </button>
          
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md"
            onClick={() => handleComponentSelect('tabs')}
            disabled={!selectedStudent}
          >
            Tabs
          </button>
          
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md"
            onClick={() => handleComponentSelect('performance')}
            disabled={!selectedStudent}
          >
            Performance
          </button>
          
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md"
            onClick={() => handleComponentSelect('actions')}
            disabled={!selectedStudent}
          >
            Actions
          </button>
        </div>
      </div>
      
      <div>
        {renderSelectedComponent()}
      </div>
    </div>
  );
};

export default StudentComponentsExample;
