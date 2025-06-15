'use client';

import React, { useState } from 'react';
import { 
  ScheduleFilters, 
  ScheduleForm, 
  ScheduleList, 
  ScheduleCalendar,
  ScheduleFiltersState,
  ScheduleItem,
  ScheduleAction
} from '../ClassSchedule';
import { ClassData, UserRole } from '../types';
import { SystemStatus } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { format, addDays, subDays } from 'date-fns';

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

// Mock schedule types
const mockScheduleTypes = [
  { id: 'lecture', name: 'Lecture' },
  { id: 'lab', name: 'Lab' },
  { id: 'exam', name: 'Exam' },
  { id: 'assignment', name: 'Assignment' },
  { id: 'office_hours', name: 'Office Hours' },
];

// Mock facilities
const mockFacilities = [
  { id: 'facility-1', name: 'Room 101' },
  { id: 'facility-2', name: 'Computer Lab' },
  { id: 'facility-3', name: 'Lecture Hall' },
];

// Mock teachers
const mockTeachers = [
  { id: 'teacher-1', name: 'John Doe' },
  { id: 'teacher-2', name: 'Jane Smith' },
];

// Generate mock schedule items
const generateMockScheduleItems = (): ScheduleItem[] => {
  const today = new Date();
  const items: ScheduleItem[] = [];
  
  // Add lectures on Mondays and Wednesdays
  for (let i = 0; i < 4; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - date.getDay() + 1 + (i * 7)); // Monday
    
    items.push({
      id: `lecture-${i}`,
      title: 'Programming Lecture',
      type: 'lecture',
      date,
      startTime: '10:00',
      endTime: '11:30',
      facilityId: 'facility-3',
      teacherId: 'teacher-1',
      description: 'Weekly lecture covering programming concepts.',
      isRecurring: true,
      recurrencePattern: 'weekly',
    });
    
    const wednesdayDate = new Date(date);
    wednesdayDate.setDate(wednesdayDate.getDate() + 2); // Wednesday
    
    items.push({
      id: `lecture-wed-${i}`,
      title: 'Programming Lecture',
      type: 'lecture',
      date: wednesdayDate,
      startTime: '10:00',
      endTime: '11:30',
      facilityId: 'facility-3',
      teacherId: 'teacher-1',
      description: 'Weekly lecture covering programming concepts.',
      isRecurring: true,
      recurrencePattern: 'weekly',
    });
  }
  
  // Add labs on Tuesdays
  for (let i = 0; i < 4; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - date.getDay() + 2 + (i * 7)); // Tuesday
    
    items.push({
      id: `lab-${i}`,
      title: 'Programming Lab',
      type: 'lab',
      date,
      startTime: '14:00',
      endTime: '16:00',
      facilityId: 'facility-2',
      teacherId: 'teacher-2',
      description: 'Hands-on lab session to practice programming concepts.',
      isRecurring: true,
      recurrencePattern: 'weekly',
    });
  }
  
  // Add office hours on Thursdays
  for (let i = 0; i < 4; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - date.getDay() + 4 + (i * 7)); // Thursday
    
    items.push({
      id: `office-hours-${i}`,
      title: 'Office Hours',
      type: 'office_hours',
      date,
      startTime: '13:00',
      endTime: '15:00',
      facilityId: 'facility-1',
      teacherId: 'teacher-1',
      description: 'Drop-in office hours for questions and assistance.',
      isRecurring: true,
      recurrencePattern: 'weekly',
    });
  }
  
  // Add exams
  items.push({
    id: 'midterm',
    title: 'Midterm Exam',
    type: 'exam',
    date: addDays(today, 14),
    startTime: '09:00',
    endTime: '11:00',
    facilityId: 'facility-3',
    teacherId: 'teacher-1',
    description: 'Midterm examination covering all topics from the first half of the course.',
    isRecurring: false,
  });
  
  items.push({
    id: 'final',
    title: 'Final Exam',
    type: 'exam',
    date: addDays(today, 30),
    startTime: '09:00',
    endTime: '12:00',
    facilityId: 'facility-3',
    teacherId: 'teacher-1',
    description: 'Final examination covering all course topics.',
    isRecurring: false,
  });
  
  // Add assignments
  items.push({
    id: 'assignment-1',
    title: 'Assignment 1',
    type: 'assignment',
    date: addDays(today, 7),
    startTime: '23:59',
    endTime: '23:59',
    description: 'First programming assignment due.',
    isRecurring: false,
  });
  
  items.push({
    id: 'assignment-2',
    title: 'Assignment 2',
    type: 'assignment',
    date: addDays(today, 21),
    startTime: '23:59',
    endTime: '23:59',
    description: 'Second programming assignment due.',
    isRecurring: false,
  });
  
  return items;
};

// Mock schedule items
const mockScheduleItems = generateMockScheduleItems();

/**
 * Example component to demonstrate the usage of schedule components
 */
export const ClassScheduleExample: React.FC = () => {
  // State for selected role
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TEACHER);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('calendar');
  
  // State for filters
  const [filters, setFilters] = useState<ScheduleFiltersState>({});
  
  // State for schedule items
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(mockScheduleItems);
  
  // State for selected item for editing
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | undefined>(undefined);
  
  // State for form visibility
  const [showForm, setShowForm] = useState(false);
  
  // State for list view mode
  const [listViewMode, setListViewMode] = useState<'table' | 'grid' | 'mobile'>('table');
  
  // State for calendar view mode
  const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'week' | 'month'>('week');
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // Toast hook
  const { toast } = useToast();
  
  // Handle role change
  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value as UserRole);
  };
  
  // Handle filter change
  const handleFilterChange = (newFilters: ScheduleFiltersState) => {
    setFilters(newFilters);
  };
  
  // Handle form submission
  const handleFormSubmit = (values: any) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      if (selectedItem) {
        // Update existing item
        setScheduleItems(prev => 
          prev.map(item => 
            item.id === selectedItem.id ? { ...values, id: item.id } : item
          )
        );
        
        toast({
          title: 'Schedule Updated',
          description: `${values.title} has been updated.`,
        });
      } else {
        // Create new item
        const newItem: ScheduleItem = {
          ...values,
          id: `item-${Date.now()}`,
        };
        
        setScheduleItems(prev => [...prev, newItem]);
        
        toast({
          title: 'Schedule Created',
          description: `${values.title} has been created.`,
        });
      }
      
      setShowForm(false);
      setSelectedItem(undefined);
    }, 1500);
  };
  
  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedItem(undefined);
  };
  
  // Handle schedule action
  const handleScheduleAction = (action: ScheduleAction, item: ScheduleItem) => {
    switch (action) {
      case 'view':
        toast({
          title: 'View Schedule',
          description: `Viewing ${item.title}`,
        });
        break;
      case 'edit':
        setSelectedItem(item);
        setShowForm(true);
        break;
      case 'delete':
        setScheduleItems(prev => prev.filter(i => i.id !== item.id));
        toast({
          title: 'Schedule Deleted',
          description: `${item.title} has been deleted.`,
          variant: 'destructive',
        });
        break;
      case 'duplicate':
        const newItem: ScheduleItem = {
          ...item,
          id: `item-${Date.now()}`,
          title: `${item.title} (Copy)`,
        };
        setScheduleItems(prev => [...prev, newItem]);
        toast({
          title: 'Schedule Duplicated',
          description: `${item.title} has been duplicated.`,
        });
        break;
    }
  };
  
  // Handle add schedule item
  const handleAddScheduleItem = (date?: Date) => {
    setSelectedItem(undefined);
    setShowForm(true);
    
    if (date) {
      // Set the form date to the selected date
      console.log(`Adding schedule item for ${format(date, 'PPP')}`);
    }
  };
  
  // Filter schedule items based on filters
  const getFilteredScheduleItems = () => {
    let filtered = [...scheduleItems];
    
    if (filters.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }
    
    if (filters.teacherId) {
      filtered = filtered.filter(item => item.teacherId === filters.teacherId);
    }
    
    if (filters.facilityId) {
      filtered = filtered.filter(item => item.facilityId === filters.facilityId);
    }
    
    if (filters.date) {
      filtered = filtered.filter(item => 
        format(new Date(item.date), 'yyyy-MM-dd') === format(filters.date!, 'yyyy-MM-dd')
      );
    }
    
    if (filters.dateRange) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= filters.dateRange!.from && itemDate <= filters.dateRange!.to;
      });
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchLower) || 
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Schedule Components Example</h1>
      
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
      
      {/* Schedule form */}
      {showForm && (
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">
            {selectedItem ? 'Edit Schedule Item' : 'Create Schedule Item'}
          </h2>
          <ScheduleForm
            classData={mockClassData}
            scheduleItem={selectedItem}
            userRole={selectedRole}
            scheduleTypes={mockScheduleTypes}
            facilities={mockFacilities}
            teachers={mockTeachers}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isLoading}
            mode={selectedItem ? 'edit' : 'create'}
          />
        </div>
      )}
      
      {/* Schedule filters */}
      <div className="mb-6 border rounded-lg p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Schedule Filters</h2>
        <ScheduleFilters
          filters={filters}
          userRole={selectedRole}
          availableFilters={{
            types: mockScheduleTypes,
            teachers: mockTeachers,
            facilities: mockFacilities,
          }}
          onFilterChange={handleFilterChange}
          layout="horizontal"
        />
      </div>
      
      {/* Component tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        
        {/* Calendar tab */}
        <TabsContent value="calendar" className="border rounded-lg p-4">
          <ScheduleCalendar
            classData={mockClassData}
            scheduleItems={getFilteredScheduleItems()}
            userRole={selectedRole}
            viewMode={calendarViewMode}
            actions={['view', 'edit', 'delete', 'duplicate']}
            onAction={handleScheduleAction}
            onAddScheduleItem={handleAddScheduleItem}
            onViewModeChange={setCalendarViewMode}
          />
        </TabsContent>
        
        {/* List tab */}
        <TabsContent value="list" className="border rounded-lg p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              View Mode:
            </label>
            <div className="flex space-x-2">
              <Button
                variant={listViewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setListViewMode('table')}
              >
                Table
              </Button>
              <Button
                variant={listViewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setListViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={listViewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setListViewMode('mobile')}
              >
                Mobile
              </Button>
            </div>
          </div>
          
          <ScheduleList
            classData={mockClassData}
            scheduleItems={getFilteredScheduleItems()}
            userRole={selectedRole}
            actions={['view', 'edit', 'delete', 'duplicate']}
            viewMode={listViewMode}
            onAction={handleScheduleAction}
            onAddScheduleItem={handleAddScheduleItem}
          />
        </TabsContent>
      </Tabs>
      
      {/* Backward compatibility examples */}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Backward Compatibility</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">ScheduleCalendarComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ScheduleCalendarComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">ScheduleListComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ScheduleListComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">ScheduleFormComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ScheduleFormComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">ScheduleFiltersComponent</h3>
            <p className="text-sm text-gray-600 mb-2">
              Import using: <code>import {'{ ScheduleFiltersComponent }'} from '@/components/shared/entities/classes';</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassScheduleExample;
