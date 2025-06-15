'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AttendanceClassView } from './AttendanceClassView';

interface ClassAttendanceSelectorProps {
  campusId: string;
}

export function ClassAttendanceSelector({ campusId }: ClassAttendanceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch classes for this campus
  const { data: classesData, isLoading: isLoadingClasses } = api.campus.getClasses.useQuery(
    { campusId, status: 'ACTIVE', page: 1, pageSize: 100 },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Define the class item type to help with TypeScript
  type ClassItem = {
    id: string;
    name: string;
    code?: string;
    courseCampus?: {
      course?: {
        name: string;
      };
      programCampus?: {
        programId: string;
      };
    };
    _count?: {
      students: number;
      teachers: number;
      activities: number;
      assessments: number;
    };
  };

  // Fetch programs for this campus
  const { data: programsData } = api.program.getProgramCampusesByCampus.useQuery(
    { campusId },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Filter classes based on search term and selected program
  const filteredClasses = classesData?.items?.filter(
    (classItem: any) => {
      const matchesSearch = searchTerm === '' ||
        classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.courseCampus?.course?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProgram = selectedProgram === null ||
        classItem.courseCampus?.programCampus?.programId === selectedProgram;

      return matchesSearch && matchesProgram;
    }
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Class Attendance</h2>
          <p className="text-muted-foreground">View and manage attendance by class</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full md:w-auto md:min-w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search classes..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={selectedProgram || 'all'} onValueChange={(value) => setSelectedProgram(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programsData && programsData.length > 0 && programsData.map((programCampus: any) => (
                <SelectItem key={programCampus.program.id} value={programCampus.program.id}>
                  {programCampus.program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date: Date | undefined) => {
                  if (date) {
                    setSelectedDate(date);
                  } else {
                    setSelectedDate(null);
                  }
                  setIsCalendarOpen(false);
                }}

              />
            </PopoverContent>
          </Popover>

          {selectedDate && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          )}
        </div>
      </div>

      {selectedClass ? (
        <AttendanceClassView
          classId={selectedClass}
          date={selectedDate}
          onBack={() => setSelectedClass(null)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingClasses ? (
            Array(6).fill(0).map((_, index) => (
              <Skeleton key={index} className="h-[150px] w-full" />
            ))
          ) : filteredClasses.length > 0 ? (
            filteredClasses.map((classItem) => (
              <Card
                key={classItem.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedClass(classItem.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{classItem.name}</CardTitle>
                      <CardDescription>{classItem.code}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{classItem.courseCampus?.course?.name || 'No course'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Students:</span>
                      <span className="font-medium">{classItem._count?.students || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attendance Rate:</span>
                      <span className="font-medium">
                        {/* Attendance rate is not directly available, showing N/A */}
                        {'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-10">
                  <div className="text-center text-muted-foreground">
                    <p>No classes found matching your criteria</p>
                    <Button variant="outline" className="mt-4" onClick={() => {
                      setSearchTerm('');
                      setSelectedProgram(null);
                    }}>
                      Clear filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
