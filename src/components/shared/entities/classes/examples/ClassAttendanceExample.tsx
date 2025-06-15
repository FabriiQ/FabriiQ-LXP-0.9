'use client';

import React, { useState } from 'react';
import { 
  AttendanceFilters, 
  AttendanceRecorder, 
  AttendanceGrid, 
  AttendanceStats,
  AttendanceFiltersState,
  AttendanceRecord,
  AttendanceStatsData
} from '../ClassAttendance';
import { ClassData, UserRole } from '../types';
import { SystemStatus } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';

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
};

// Mock students data
const mockStudents = Array.from({ length: 10 }).map((_, index) => ({
  id: `student-${index + 1}`,
  userId: `user-${index + 10}`,
  name: `Student ${index + 1}`,
  email: `student${index + 1}@example.com`,
}));

// Generate mock attendance records
const generateMockAttendance = (numDays: number): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < numDays; i++) {
    const date = subDays(today, i);
    
    mockStudents.forEach(student => {
      // Randomly determine status with a bias towards present
      const rand = Math.random();
      let status: 'present' | 'absent' | 'excused';
      
      if (rand < 0.8) {
        status = 'present';
      } else if (rand < 0.9) {
        status = 'absent';
      } else {
        status = 'excused';
      }
      
      records.push({
        date,
        studentId: student.id,
        status,
        comment: status !== 'present' ? `Comment for ${student.name} on ${format(date, 'MMM dd')}` : undefined,
      });
    });
  }
  
  return records;
};

// Mock attendance records
const mockAttendanceRecords = generateMockAttendance(30);

// Generate mock attendance stats
const generateMockStats = (): AttendanceStatsData => {
  const today = new Date();
  const startDate = subDays(today, 30);
  const endDate = today;
  
  // Calculate overall stats
  const totalRecords = mockAttendanceRecords.length;
  const presentCount = mockAttendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = mockAttendanceRecords.filter(r => r.status === 'absent').length;
  const excusedCount = mockAttendanceRecords.filter(r => r.status === 'excused').length;
  const overallRate = (presentCount / totalRecords) * 100;
  
  // Generate trend data
  const trendData = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(today, 29 - i);
    const dayRecords = mockAttendanceRecords.filter(r => 
      format(new Date(r.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    const dayPresent = dayRecords.filter(r => r.status === 'present').length;
    const dayAbsent = dayRecords.filter(r => r.status === 'absent').length;
    const dayExcused = dayRecords.filter(r => r.status === 'excused').length;
    const dayTotal = dayRecords.length;
    const dayRate = dayTotal > 0 ? (dayPresent / dayTotal) * 100 : 0;
    
    return {
      date,
      present: dayPresent,
      absent: dayAbsent,
      excused: dayExcused,
      total: dayTotal,
      rate: dayRate,
    };
  });
  
  // Generate student stats
  const studentStats = mockStudents.map(student => {
    const studentRecords = mockAttendanceRecords.filter(r => r.studentId === student.id);
    const studentPresent = studentRecords.filter(r => r.status === 'present').length;
    const studentAbsent = studentRecords.filter(r => r.status === 'absent').length;
    const studentExcused = studentRecords.filter(r => r.status === 'excused').length;
    const studentTotal = studentRecords.length;
    const studentRate = studentTotal > 0 ? (studentPresent / studentTotal) * 100 : 0;
    
    return {
      studentId: student.id,
      studentName: student.name,
      present: studentPresent,
      absent: studentAbsent,
      excused: studentExcused,
      total: studentTotal,
      rate: studentRate,
    };
  });
  
  // Generate weekday stats
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekdayStats = weekdays.map(weekday => {
    const dayIndex = weekdays.indexOf(weekday);
    const weekdayRecords = mockAttendanceRecords.filter(r => 
      new Date(r.date).getDay() === (dayIndex + 1) % 7
    );
    const weekdayPresent = weekdayRecords.filter(r => r.status === 'present').length;
    const weekdayTotal = weekdayRecords.length;
    const weekdayRate = weekdayTotal > 0 ? (weekdayPresent / weekdayTotal) * 100 : 0;
    
    return {
      weekday,
      rate: weekdayRate,
    };
  });
  
  return {
    overall: {
      present: presentCount,
      absent: absentCount,
      excused: excusedCount,
      total: totalRecords,
      rate: overallRate,
    },
    trend: trendData,
    byStudent: studentStats,
    byWeekday: weekdayStats,
  };
};

// Mock attendance stats
const mockStats = generateMockStats();

/**
 * Example component to demonstrate the usage of attendance components
 */
export const ClassAttendanceExample: React.FC = () => {
  // State for selected role
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TEACHER);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('recorder');
  
  // State for filters
  const [filters, setFilters] = useState<AttendanceFiltersState>({});
  
  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // State for date range
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // Toast hook
  const { toast } = useToast();
  
  // Handle role change
  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value as UserRole);
  };
  
  // Handle filter change
  const handleFilterChange = (newFilters: AttendanceFiltersState) => {
    setFilters(newFilters);
    
    // If date filter is set, update selected date
    if (newFilters.date) {
      setSelectedDate(newFilters.date);
    }
    
    // If date range filter is set, update date range
    if (newFilters.dateRange) {
      setDateRange({
        start: newFilters.dateRange.from,
        end: newFilters.dateRange.to,
      });
    }
  };
  
  // Handle attendance submission
  const handleAttendanceSubmit = (date: Date, attendance: any) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Attendance Saved',
        description: `Attendance for ${format(date, 'PPP')} has been saved.`,
      });
      console.log('Attendance data:', date, attendance);
    }, 1500);
  };
  
  // Handle edit attendance
  const handleEditAttendance = (date: Date) => {
    setSelectedDate(date);
    setActiveTab('recorder');
    
    toast({
      title: 'Edit Attendance',
      description: `Editing attendance for ${format(date, 'PPP')}.`,
    });
  };
  
  // Handle date range change
  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range);
  };
  
  // Get existing attendance for selected date
  const getExistingAttendance = () => {
    const records = mockAttendanceRecords.filter(record => 
      format(new Date(record.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );
    
    const result: { [studentId: string]: { status: 'present' | 'absent' | 'excused'; comment?: string } } = {};
    
    records.forEach(record => {
      result[record.studentId] = {
        status: record.status,
        comment: record.comment,
      };
    });
    
    return result;
  };
  
  // Filter attendance records based on filters
  const getFilteredAttendance = () => {
    let filtered = [...mockAttendanceRecords];
    
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(record => record.status === filters.status);
    }
    
    if (filters.studentId) {
      filtered = filtered.filter(record => record.studentId === filters.studentId);
    }
    
    if (filters.date) {
      filtered = filtered.filter(record => 
        format(new Date(record.date), 'yyyy-MM-dd') === format(filters.date, 'yyyy-MM-dd')
      );
    }
    
    if (filters.dateRange) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= filters.dateRange!.from && recordDate <= filters.dateRange!.to;
      });
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(record => {
        const student = mockStudents.find(s => s.id === record.studentId);
        return student && student.name.toLowerCase().includes(searchLower);
      });
    }
    
    return filtered;
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Attendance Components Example</h1>
      
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
      
      {/* Attendance filters */}
      <div className="mb-6 border rounded-lg p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Attendance Filters</h2>
        <AttendanceFilters
          filters={filters}
          userRole={selectedRole}
          availableFilters={{
            students: mockStudents.map(s => ({ id: s.id, name: s.name })),
          }}
          onFilterChange={handleFilterChange}
          layout="horizontal"
        />
      </div>
      
      {/* Component tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recorder">Recorder</TabsTrigger>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        {/* Recorder tab */}
        <TabsContent value="recorder" className="border rounded-lg p-4">
          <AttendanceRecorder
            classData={mockClassData}
            students={mockStudents}
            date={selectedDate}
            existingAttendance={getExistingAttendance()}
            userRole={selectedRole}
            onSubmit={handleAttendanceSubmit}
            isLoading={isLoading}
          />
        </TabsContent>
        
        {/* Grid tab */}
        <TabsContent value="grid" className="border rounded-lg p-4">
          <AttendanceGrid
            classData={mockClassData}
            students={mockStudents}
            attendance={getFilteredAttendance()}
            dateRange={dateRange}
            userRole={selectedRole}
            onEdit={handleEditAttendance}
            onDateRangeChange={handleDateRangeChange}
          />
        </TabsContent>
        
        {/* Stats tab */}
        <TabsContent value="stats" className="border rounded-lg p-4">
          <AttendanceStats
            classData={mockClassData}
            stats={mockStats}
            userRole={selectedRole}
            dateRange={{
              start: subDays(new Date(), 30),
              end: new Date(),
            }}
          />
        </TabsContent>
      </Tabs>
      
      {/* Backward compatibility examples */}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Backward Compatibility</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">AttendanceRecorderComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ AttendanceRecorderComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">AttendanceGridComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ AttendanceGridComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">AttendanceStatsComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ AttendanceStatsComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">AttendanceFiltersComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ AttendanceFiltersComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassAttendanceExample;
