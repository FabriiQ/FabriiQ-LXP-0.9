'use client';

import React, { useState } from 'react';
import { 
  ClassList, 
  ClassFilters, 
  ClassData, 
  UserRole, 
  ClassAction, 
  ClassFiltersState,
  ClassListViewMode
} from '../';
import { SystemStatus } from '@prisma/client';

// Mock class data for demonstration
const generateMockClasses = (count: number): ClassData[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: `class-${index + 1}`,
    code: `CL-${101 + index}`,
    name: index % 3 === 0 
      ? `Introduction to Programming ${index + 1}` 
      : index % 3 === 1 
        ? `Data Structures ${index + 1}` 
        : `Web Development ${index + 1}`,
    minCapacity: 10,
    maxCapacity: 30,
    currentCount: 15 + (index % 15),
    status: index % 4 === 0 
      ? SystemStatus.ACTIVE 
      : index % 4 === 1 
        ? SystemStatus.UPCOMING 
        : index % 4 === 2 
          ? SystemStatus.COMPLETED 
          : SystemStatus.INACTIVE,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    courseCampusId: `cc-${(index % 3) + 1}`,
    termId: `term-${(index % 2) + 1}`,
    campusId: 'campus-1',
    courseCampus: {
      id: `cc-${(index % 3) + 1}`,
      course: {
        id: `course-${(index % 3) + 1}`,
        name: index % 3 === 0 
          ? 'Programming Fundamentals' 
          : index % 3 === 1 
            ? 'Data Structures and Algorithms' 
            : 'Web Development',
        code: index % 3 === 0 
          ? 'PF-101' 
          : index % 3 === 1 
            ? 'DS-101' 
            : 'WD-101',
      },
    },
    term: {
      id: `term-${(index % 2) + 1}`,
      name: index % 2 === 0 ? 'Fall 2023' : 'Spring 2024',
      code: index % 2 === 0 ? 'F23' : 'S24',
      startDate: new Date(index % 2 === 0 ? '2023-09-01' : '2024-01-15'),
      endDate: new Date(index % 2 === 0 ? '2023-12-31' : '2024-05-15'),
    },
    classTeacher: index % 5 === 0 ? undefined : {
      id: `teacher-${(index % 3) + 1}`,
      user: {
        id: `user-${(index % 3) + 1}`,
        name: index % 3 === 0 
          ? 'John Doe' 
          : index % 3 === 1 
            ? 'Jane Smith' 
            : 'Bob Johnson',
        email: index % 3 === 0 
          ? 'john.doe@example.com' 
          : index % 3 === 1 
            ? 'jane.smith@example.com' 
            : 'bob.johnson@example.com',
      },
    },
    facility: index % 4 === 0 ? undefined : {
      id: `facility-${(index % 3) + 1}`,
      name: index % 3 === 0 
        ? 'Computer Lab 1' 
        : index % 3 === 1 
          ? 'Lecture Hall A' 
          : 'Classroom 101',
      code: index % 3 === 0 
        ? 'CL1' 
        : index % 3 === 1 
          ? 'LHA' 
          : 'CR101',
    },
    _count: {
      students: 10 + (index % 20),
      activities: 3 + (index % 7),
      assessments: 2 + (index % 5),
    },
  }));
};

// Mock filter options
const mockFilterOptions = {
  terms: [
    { id: 'term-1', name: 'Fall 2023' },
    { id: 'term-2', name: 'Spring 2024' },
  ],
  programs: [
    { id: 'program-1', name: 'Computer Science' },
    { id: 'program-2', name: 'Business Administration' },
  ],
  courses: [
    { id: 'course-1', name: 'Programming Fundamentals' },
    { id: 'course-2', name: 'Data Structures and Algorithms' },
    { id: 'course-3', name: 'Web Development' },
  ],
  teachers: [
    { id: 'teacher-1', name: 'John Doe' },
    { id: 'teacher-2', name: 'Jane Smith' },
    { id: 'teacher-3', name: 'Bob Johnson' },
  ],
  daysOfWeek: [
    { id: 'monday', name: 'Monday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'friday', name: 'Friday' },
  ],
  timesOfDay: [
    { id: 'morning', name: 'Morning' },
    { id: 'afternoon', name: 'Afternoon' },
    { id: 'evening', name: 'Evening' },
  ],
};

// Generate 50 mock classes
const allMockClasses = generateMockClasses(50);

/**
 * Example component to demonstrate the usage of ClassList and ClassFilters components
 */
export const ClassListExample: React.FC = () => {
  // State for selected role
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TEACHER);
  
  // State for filters
  const [filters, setFilters] = useState<ClassFiltersState>({});
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // State for sorting
  const [sorting, setSorting] = useState({ column: 'name', direction: 'asc' as 'asc' | 'desc' });
  
  // State for view mode
  const [viewMode, setViewMode] = useState<ClassListViewMode>('grid');
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle role change
  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value as UserRole);
  };
  
  // Handle filter change
  const handleFilterChange = (newFilters: ClassFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setCurrentPage(page);
      setIsLoading(false);
    }, 500);
  };
  
  // Handle sort change
  const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setSorting({ column, direction });
      setIsLoading(false);
    }, 500);
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode: ClassListViewMode) => {
    setViewMode(mode);
  };
  
  // Handle action click
  const handleActionClick = (action: ClassAction, classData: ClassData) => {
    console.log('Action:', action, 'Class:', classData);
  };
  
  // Filter and sort classes based on current filters and sorting
  const filteredClasses = allMockClasses.filter(classData => {
    // Filter by search term
    if (filters.search && !classData.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Filter by status
    if (filters.status && classData.status !== filters.status) {
      return false;
    }
    
    // Filter by term
    if (filters.termId && classData.termId !== filters.termId) {
      return false;
    }
    
    // Filter by course
    if (filters.courseId && classData.courseCampus?.course?.id !== filters.courseId) {
      return false;
    }
    
    // Filter by teacher
    if (filters.teacherId && classData.classTeacher?.id !== filters.teacherId) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by selected column
    switch (sorting.column) {
      case 'name':
        return sorting.direction === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      case 'course':
        return sorting.direction === 'asc' 
          ? (a.courseCampus?.course?.name || '').localeCompare(b.courseCampus?.course?.name || '') 
          : (b.courseCampus?.course?.name || '').localeCompare(a.courseCampus?.course?.name || '');
      case 'term':
        return sorting.direction === 'asc' 
          ? (a.term?.name || '').localeCompare(b.term?.name || '') 
          : (b.term?.name || '').localeCompare(a.term?.name || '');
      case 'students':
        return sorting.direction === 'asc' 
          ? (a._count?.students || 0) - (b._count?.students || 0) 
          : (b._count?.students || 0) - (a._count?.students || 0);
      case 'status':
        return sorting.direction === 'asc' 
          ? a.status.localeCompare(b.status) 
          : b.status.localeCompare(a.status);
      default:
        return 0;
    }
  });
  
  // Paginate classes
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredClasses.length / pageSize);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Class List Example</h1>
      
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
      
      {/* Filter layout selector */}
      <div className="mb-6">
        <label htmlFor="filter-layout" className="block text-sm font-medium mb-2">
          Filter Layout:
        </label>
        <select
          id="filter-layout"
          value={viewMode === 'mobile' ? 'dropdown' : 'horizontal'}
          onChange={(e) => {
            if (e.target.value === 'dropdown') {
              setViewMode('mobile');
            }
          }}
          className="w-full max-w-xs p-2 border rounded"
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
          <option value="dropdown">Dropdown</option>
        </select>
      </div>
      
      {/* Class filters */}
      <div className="mb-6 border rounded-lg p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Class Filters</h2>
        <ClassFilters
          filters={filters}
          userRole={selectedRole}
          availableFilters={mockFilterOptions}
          onFilterChange={handleFilterChange}
          layout={viewMode === 'mobile' ? 'dropdown' : 'horizontal'}
        />
      </div>
      
      {/* Class list */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Class List</h2>
        <ClassList
          classes={paginatedClasses}
          userRole={selectedRole}
          viewMode={viewMode}
          onAction={handleActionClick}
          isLoading={isLoading}
          pagination={{
            currentPage,
            totalPages,
            pageSize,
            totalItems: filteredClasses.length,
            onPageChange: handlePageChange,
          }}
          sorting={{
            column: sorting.column,
            direction: sorting.direction,
            onSortChange: handleSortChange,
          }}
          actions={[
            ClassAction.VIEW,
            ClassAction.EDIT,
            ClassAction.DELETE,
            ClassAction.TAKE_ATTENDANCE,
            ClassAction.GRADE_ASSESSMENTS,
          ]}
          onViewModeChange={handleViewModeChange}
        />
      </div>
      
      {/* Backward compatibility examples */}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Backward Compatibility</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">ClassListComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ClassListComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">ClassFiltersComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ClassFiltersComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassListExample;
