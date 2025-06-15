'use client';

import React, { useState } from 'react';
import { 
  ClassDetail, 
  ClassData, 
  UserRole, 
  ClassAction 
} from '../';
import { SystemStatus } from '@prisma/client';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users 
} from 'lucide-react';

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
const mockStudents = Array.from({ length: 10 }).map((_, index) => ({
  id: `student-${index + 1}`,
  name: `Student ${index + 1}`,
  email: `student${index + 1}@example.com`,
  enrollmentDate: new Date('2023-08-15'),
  attendance: {
    present: 8 + (index % 3),
    absent: 2 - (index % 3),
    total: 10,
    percentage: (8 + (index % 3)) / 10 * 100,
  },
  grades: {
    average: 70 + (index * 2),
    assessmentsCompleted: 2,
    assessmentsTotal: 3,
  },
}));

// Mock attendance data
const mockAttendance = Array.from({ length: 10 }).map((_, index) => ({
  id: `attendance-${index + 1}`,
  date: new Date(2023, 8, 1 + index),
  presentCount: 15 + (index % 5),
  absentCount: 5 - (index % 5),
  excusedCount: index % 3,
  totalCount: 20,
  percentage: (15 + (index % 5)) / 20 * 100,
}));

// Mock assessments data
const mockAssessments = [
  {
    id: 'assessment-1',
    title: 'Quiz 1: Variables and Data Types',
    type: 'QUIZ',
    dueDate: new Date('2023-09-15'),
    maxScore: 100,
    averageScore: 78,
    completedCount: 18,
    totalCount: 20,
  },
  {
    id: 'assessment-2',
    title: 'Assignment 1: Loops and Conditionals',
    type: 'ASSIGNMENT',
    dueDate: new Date('2023-09-30'),
    maxScore: 100,
    averageScore: 82,
    completedCount: 17,
    totalCount: 20,
  },
  {
    id: 'assessment-3',
    title: 'Midterm Exam',
    type: 'EXAM',
    dueDate: new Date('2023-10-15'),
    maxScore: 100,
    averageScore: 75,
    completedCount: 20,
    totalCount: 20,
  },
];

/**
 * Example component to demonstrate the usage of ClassDetail component
 */
export const ClassDetailExample: React.FC = () => {
  // State for selected role
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TEACHER);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // State for error
  const [error, setError] = useState<string | undefined>(undefined);
  
  // Handle role change
  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value as UserRole);
  };
  
  // Handle tab change
  const handleTabChange = (tabId: string) => {
    console.log('Tab changed:', tabId);
  };
  
  // Handle action click
  const handleActionClick = (action: ClassAction, classData: ClassData) => {
    console.log('Action:', action, 'Class:', classData);
  };
  
  // Toggle loading state
  const toggleLoading = () => {
    setIsLoading(!isLoading);
    setError(undefined);
  };
  
  // Toggle error state
  const toggleError = () => {
    setError(error ? undefined : 'Failed to load class data');
    setIsLoading(false);
  };
  
  // Get enabled tabs based on user role
  const getEnabledTabs = () => {
    switch (selectedRole) {
      case UserRole.SYSTEM_ADMIN:
      case UserRole.CAMPUS_ADMIN:
        return ['overview', 'students', 'attendance', 'assessments', 'content', 'gradebook', 'schedule', 'settings'];
      case UserRole.COORDINATOR:
        return ['overview', 'students', 'attendance', 'assessments', 'gradebook', 'schedule'];
      case UserRole.TEACHER:
        return ['overview', 'students', 'attendance', 'assessments', 'content', 'gradebook', 'schedule'];
      case UserRole.STUDENT:
        return ['overview', 'attendance', 'assessments', 'content', 'gradebook', 'schedule'];
      default:
        return ['overview'];
    }
  };
  
  // Get allowed actions based on user role
  const getAllowedActions = () => {
    switch (selectedRole) {
      case UserRole.SYSTEM_ADMIN:
        return [
          ClassAction.EDIT, 
          ClassAction.DELETE, 
          ClassAction.ARCHIVE, 
          ClassAction.DUPLICATE, 
          ClassAction.EXPORT, 
          ClassAction.PRINT
        ];
      case UserRole.CAMPUS_ADMIN:
        return [
          ClassAction.EDIT, 
          ClassAction.ARCHIVE, 
          ClassAction.DUPLICATE, 
          ClassAction.EXPORT, 
          ClassAction.PRINT,
          ClassAction.ASSIGN_TEACHER,
          ClassAction.ENROLL_STUDENTS
        ];
      case UserRole.COORDINATOR:
        return [
          ClassAction.EXPORT, 
          ClassAction.PRINT,
          ClassAction.MESSAGE_STUDENTS
        ];
      case UserRole.TEACHER:
        return [
          ClassAction.TAKE_ATTENDANCE, 
          ClassAction.GRADE_ASSESSMENTS,
          ClassAction.MESSAGE_STUDENTS,
          ClassAction.PRINT
        ];
      case UserRole.STUDENT:
        return [];
      default:
        return [];
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Class Detail Example</h1>
      
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
      
      {/* State toggles */}
      <div className="mb-6 flex gap-4">
        <Button onClick={toggleLoading} variant={isLoading ? "default" : "outline"}>
          {isLoading ? "Hide Loading State" : "Show Loading State"}
        </Button>
        <Button onClick={toggleError} variant={error ? "default" : "outline"}>
          {error ? "Hide Error State" : "Show Error State"}
        </Button>
      </div>
      
      {/* Class detail */}
      <div className="border rounded-lg p-4">
        <ClassDetail
          classData={mockClassData}
          userRole={selectedRole}
          tabs={getEnabledTabs()}
          actions={getAllowedActions()}
          isLoading={isLoading}
          error={error}
          onTabChange={handleTabChange}
          onAction={handleActionClick}
        >
          {/* Overview tab content */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Class Overview</h2>
              
              {/* Course description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{mockClassData.courseCampus?.course?.description}</p>
                </CardContent>
              </Card>
              
              {/* Key metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      Enrollment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {mockClassData.currentCount} / {mockClassData.maxCapacity}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(mockClassData.currentCount / mockClassData.maxCapacity * 100)}% Capacity
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                      Attendance Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">85%</div>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <BarChart className="h-4 w-4 mr-2 text-muted-foreground" />
                      Average Grade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">78%</div>
                    <p className="text-xs text-muted-foreground">
                      Across all assessments
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Upcoming events */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Assignment 2: Functions and Objects</p>
                        <p className="text-sm text-muted-foreground">Due on Oct 15, 2023</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Final Exam</p>
                        <p className="text-sm text-muted-foreground">Dec 10, 2023</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Guest Lecture: Industry Applications</p>
                        <p className="text-sm text-muted-foreground">Oct 20, 2023</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Students tab content */}
          <TabsContent value="students">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Students</h2>
              
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Attendance</th>
                        <th className="text-left p-3">Average Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockStudents.map((student) => (
                        <tr key={student.id} className="border-b">
                          <td className="p-3">{student.name}</td>
                          <td className="p-3">{student.email}</td>
                          <td className="p-3">
                            {student.attendance.percentage.toFixed(0)}%
                          </td>
                          <td className="p-3">
                            {student.grades.average.toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Attendance tab content */}
          <TabsContent value="attendance">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Attendance</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">85%</div>
                      <div className="text-sm text-muted-foreground">Average Attendance</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">17</div>
                      <div className="text-sm text-muted-foreground">Students Present Today</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-3xl font-bold text-amber-600">3</div>
                      <div className="text-sm text-muted-foreground">Students Absent Today</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Present</th>
                        <th className="text-left p-3">Absent</th>
                        <th className="text-left p-3">Excused</th>
                        <th className="text-left p-3">Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockAttendance.map((record) => (
                        <tr key={record.id} className="border-b">
                          <td className="p-3">
                            {record.date.toLocaleDateString()}
                          </td>
                          <td className="p-3">{record.presentCount}</td>
                          <td className="p-3">{record.absentCount}</td>
                          <td className="p-3">{record.excusedCount}</td>
                          <td className="p-3">
                            {record.percentage.toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Assessments tab content */}
          <TabsContent value="assessments">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Assessments</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockAssessments.map((assessment) => (
                  <Card key={assessment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{assessment.title}</CardTitle>
                        <Badge>{assessment.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Due: {assessment.dueDate.toLocaleDateString()}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Average Score:</span>
                          <span className="font-medium">{assessment.averageScore}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Completed:</span>
                          <span className="font-medium">
                            {assessment.completedCount} / {assessment.totalCount}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Content tab content */}
          <TabsContent value="content">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Course Content</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Module 1: Introduction to Python</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Lecture 1: Getting Started with Python</p>
                        <p className="text-sm text-muted-foreground">PDF, 2.3 MB</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Lecture 2: Variables and Data Types</p>
                        <p className="text-sm text-muted-foreground">PDF, 1.8 MB</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Lab 1: Your First Python Program</p>
                        <p className="text-sm text-muted-foreground">ZIP, 0.5 MB</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Module 2: Control Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Lecture 3: Conditionals</p>
                        <p className="text-sm text-muted-foreground">PDF, 2.1 MB</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Lecture 4: Loops</p>
                        <p className="text-sm text-muted-foreground">PDF, 1.9 MB</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Lab 2: Control Flow Exercises</p>
                        <p className="text-sm text-muted-foreground">ZIP, 0.7 MB</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Other tab content placeholders */}
          <TabsContent value="gradebook">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Gradebook</h2>
              <p>Gradebook content would go here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Schedule</h2>
              <p>Schedule content would go here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Settings</h2>
              <p>Settings content would go here.</p>
            </div>
          </TabsContent>
        </ClassDetail>
      </div>
      
      {/* Backward compatibility examples */}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Backward Compatibility</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">ClassDetailComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ClassDetailComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">ClassTabsComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ClassTabsComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailExample;
