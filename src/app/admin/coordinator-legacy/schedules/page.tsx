'use client';

import { useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, Clock, List, Grid, Plus, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SystemStatus } from '@prisma/client';
import { CoordinatorTimetableView } from '@/components/coordinator/CoordinatorTimetableView';
import { CoordinatorScheduleList } from '@/components/coordinator/CoordinatorScheduleList';

export default function CoordinatorSchedulesPage({
  searchParams,
}: {
  searchParams: { courseId?: string; classId?: string; termId?: string };
}) {
  const router = useRouter();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedTermId, setSelectedTermId] = useState<string>(searchParams.termId || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(searchparams.id || '');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(searchParams.courseId || '');
  
  // Fetch current term
  const { data: currentTermData, isLoading: isLoadingCurrentTerm } = api.term.getCurrent.useQuery();
  
  // Fetch terms
  const { data: termsData, isLoading: isLoadingTerms } = api.term.list.useQuery({
    status: SystemStatus.ACTIVE,
  });
  
  // Fetch classes for coordinator
  const { data: classesData, isLoading: isLoadingClasses } = api.class.getTeacherClasses.useQuery({
    status: SystemStatus.ACTIVE,
  });
  
  // Fetch courses for coordinator
  const { data: coursesData, isLoading: isLoadingCourses } = api.course.list.useQuery({
    status: SystemStatus.ACTIVE,
  });
  
  // Set default term if not already set
  if (!selectedTermId && currentTermData?.id && !isLoadingCurrentTerm) {
    setSelectedTermId(currentTermData.id);
  }
  
  const isLoading = isLoadingCurrentTerm || isLoadingTerms || isLoadingClasses || isLoadingCourses;
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  const terms = termsData?.items || [];
  const classes = classesData?.items || [];
  const courses = coursesData?.items || [];
  
  // Filter classes by selected course if needed
  const filteredClasses = selectedCourseId 
    ? classes.filter(cls => cls.course?.id === selectedCourseId)
    : classes;
  
  const handleCreateSchedule = () => {
    router.push('/admin/coordinator/schedules/new');
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Class Schedules"
          description="Manage class timetables and schedules"
        />
        <Button onClick={handleCreateSchedule}>
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Schedule Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant={view === 'calendar' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setView('calendar')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Calendar View
              </Button>
              <Button 
                variant={view === 'list' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setView('list')}
              >
                <List className="mr-2 h-4 w-4" />
                List View
              </Button>
            </div>
          </div>
          <CardDescription>
            View and manage class schedules and timetables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Term</label>
              <Select 
                value={selectedTermId} 
                onValueChange={setSelectedTermId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(term => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Course</label>
              <Select 
                value={selectedCourseId} 
                onValueChange={(value) => {
                  setSelectedCourseId(value);
                  setSelectedClassId(''); // Reset class when course changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Class</label>
              <Select 
                value={selectedClassId} 
                onValueChange={setSelectedClassId}
                disabled={filteredClasses.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {filteredClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {view === 'calendar' ? (
            <CoordinatorTimetableView 
              termId={selectedTermId}
              classId={selectedClassId}
              courseId={selectedCourseId}
            />
          ) : (
            <CoordinatorScheduleList 
              termId={selectedTermId}
              classId={selectedClassId}
              courseId={selectedCourseId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

