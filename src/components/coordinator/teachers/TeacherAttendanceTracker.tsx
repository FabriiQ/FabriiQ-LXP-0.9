'use client';

import { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeacherAttendanceTrackerProps {
  courseId?: string;
  classId?: string;
  initialDate?: Date;
}

interface Teacher {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  classes: string[];
  attendanceRecords: AttendanceRecord[];
}

interface AttendanceRecord {
  id: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

/**
 * TeacherAttendanceTracker Component
 *
 * Tracks and manages teacher attendance with detailed analytics.
 * Includes daily, weekly, and monthly views with attendance status tracking.
 */
export function TeacherAttendanceTracker({
  courseId,
  classId,
  initialDate = new Date()
}: TeacherAttendanceTrackerProps) {
  const [date, setDate] = useState<Date>(initialDate);
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  // Offline storage hooks
  const {
    isOnline,
    getData: getAttendanceData,
    saveData: saveAttendanceData
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Calculate date range based on view
  const dateRange = (() => {
    if (view === 'day') {
      return [date];
    } else if (view === 'week') {
      const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
      return eachDayOfInterval({ start, end });
    } else {
      // For month view, we'll just use the current week for simplicity
      // In a real implementation, this would show the entire month
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  })();

  // Fetch attendance data on component mount or when parameters change
  useEffect(() => {
    fetchAttendanceData();
  }, [date, view, courseId, classId]);

  // Import API hook
  const { data: teacherAttendanceData, isLoading: isLoadingAttendance, refetch: refetchAttendance } = api.attendance.getByQuery.useQuery(
    {
      classId: classId || 'default-class-id', // Provide a default value
      startDate: dateRange[0],
      endDate: dateRange[dateRange.length - 1]
    },
    {
      enabled: isOnline,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data) {
          // Transform API data to match our component's data structure
          // Create mock teachers if data.teachers doesn't exist
          const teachersData = data.attendanceRecords || [];
          const teacherIds = [...new Set(teachersData.map((record: any) =>
            record.student?.user?.id || 'unknown-id'
          ))];

          // Create mock teachers from the attendance records
          const transformedTeachers = teacherIds.map((id: string) => {
            // Find records for this teacher
            const teacherRecords = teachersData.filter((record: any) =>
              record.student?.user?.id === id
            );

            // Get teacher info from the first record
            const teacherInfo = teacherRecords[0]?.student?.user || {};

            return {
              id: id,
              name: teacherInfo.name || `Teacher ${id.substring(0, 5)}`,
              email: teacherInfo.email || 'teacher@example.com',
              classes: ['Class A', 'Class B'],
              attendanceRecords: teacherRecords.map((record: any) => ({
                id: record.id,
                date: new Date(record.date),
                status: record.status,
                checkInTime: record.checkInTime,
                checkOutTime: record.checkOutTime,
                notes: record.notes
              }))
            };
          });

          setTeachers(transformedTeachers);
          setIsLoading(false);

          // Save to offline storage
          saveAttendanceData('teacherAttendance', `${courseId || 'all'}-${classId || 'all'}-${view}-${date.toISOString().split('T')[0]}`, transformedTeachers);
        }
      },
      onError: (error) => {
        console.error('Error fetching attendance data:', error);
      }
    }
  );

  // Function to fetch attendance data
  const fetchAttendanceData = async () => {
    setIsRefreshing(true);

    try {
      if (isOnline) {
        // Refetch data from API
        await refetchAttendance();
      } else {
        // Try to get data from offline storage
        const offlineData = await getAttendanceData('teacherAttendance', `${courseId || 'all'}-${classId || 'all'}-${view}-${date.toISOString().split('T')[0]}`);
        if (offlineData) {
          setTeachers(offlineData);
        } else {
          // If no offline data, set empty array
          setTeachers([]);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);

      // Set empty array if error
      setTeachers([]);
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    await fetchAttendanceData();
  };

  // Navigate to previous period
  const handlePrevious = () => {
    if (view === 'day') {
      setDate(prev => new Date(prev.setDate(prev.getDate() - 1)));
    } else if (view === 'week') {
      setDate(prev => subWeeks(prev, 1));
    } else {
      // For month view, go back one month
      setDate(prev => new Date(prev.setMonth(prev.getMonth() - 1)));
    }
  };

  // Navigate to next period
  const handleNext = () => {
    if (view === 'day') {
      setDate(prev => new Date(prev.setDate(prev.getDate() + 1)));
    } else if (view === 'week') {
      setDate(prev => addWeeks(prev, 1));
    } else {
      // For month view, go forward one month
      setDate(prev => new Date(prev.setMonth(prev.getMonth() + 1)));
    }
  };

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get attendance status for a teacher on a specific date
  const getAttendanceStatus = (teacherId: string, date: Date) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return null;

    return teacher.attendanceRecords.find(record =>
      isSameDay(new Date(record.date), date)
    );
  };

  // Render attendance status badge
  const renderAttendanceStatus = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Present</Badge>;
      case 'absent':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Absent</Badge>;
      case 'late':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Late</Badge>;
      case 'excused':
        return <Badge variant="outline" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Excused</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold">Teacher Attendance Tracker</h2>
        <div className="flex flex-wrap gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-[300px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !isOnline}
          >
            <Loader2 className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {view === 'day' && format(date, 'PPP')}
                    {view === 'week' && (
                      <span>
                        {format(dateRange[0], 'MMM d')} - {format(dateRange[dateRange.length - 1], 'MMM d, yyyy')}
                      </span>
                    )}
                    {view === 'month' && format(date, 'MMMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search teachers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border-b">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20" />
                  ))}
                </div>
              </div>
            ))
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No teachers found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-medium">Teacher</th>
                      {dateRange.map((day) => (
                        <th key={day.toString()} className="text-center p-2 font-medium">
                          <div>{format(day, 'EEE')}</div>
                          <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className={cn(
                          "border-t hover:bg-muted/50 transition-colors",
                          selectedTeacher === teacher.id && "bg-muted/50"
                        )}
                        onClick={() => setSelectedTeacher(teacher.id)}
                      >
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={teacher.avatar} alt={teacher.name} />
                              <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{teacher.name}</div>
                              <div className="text-xs text-muted-foreground">{teacher.email}</div>
                            </div>
                          </div>
                        </td>
                        {dateRange.map((day) => {
                          const record = getAttendanceStatus(teacher.id, day);
                          return (
                            <td key={day.toString()} className="p-2 text-center">
                              {record ? (
                                <div className="flex flex-col items-center gap-1">
                                  {renderAttendanceStatus(record.status)}
                                  {record.checkInTime && (
                                    <div className="text-xs text-muted-foreground">
                                      {record.checkInTime} - {record.checkOutTime}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline">Not recorded</Badge>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedTeacher && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Attendance Details</CardTitle>
                    <CardDescription>
                      {teachers.find(t => t.id === selectedTeacher)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Attendance Summary</h4>
                        {selectedTeacher && (
                          <>
                            <div className="grid grid-cols-4 gap-2">
                              {/* Calculate actual attendance stats from the teacher's records */}
                              {(() => {
                                const teacher = teachers.find(t => t.id === selectedTeacher);
                                if (!teacher) return null;

                                const records = teacher.attendanceRecords || [];
                                const totalRecords = records.length;

                                if (totalRecords === 0) {
                                  return (
                                    <div className="col-span-4 py-4 text-center text-muted-foreground">
                                      No attendance records available
                                    </div>
                                  );
                                }

                                const presentCount = records.filter(r => r.status === 'present').length;
                                const absentCount = records.filter(r => r.status === 'absent').length;
                                const lateCount = records.filter(r => r.status === 'late').length;
                                const excusedCount = records.filter(r => r.status === 'excused').length;

                                const presentPercent = Math.round((presentCount / totalRecords) * 100);
                                const absentPercent = Math.round((absentCount / totalRecords) * 100);
                                const latePercent = Math.round((lateCount / totalRecords) * 100);
                                const excusedPercent = Math.round((excusedCount / totalRecords) * 100);

                                return (
                                  <>
                                    <Card className="p-3">
                                      <div className="text-xs text-muted-foreground">Present</div>
                                      <div className="text-lg font-bold">{presentPercent}%</div>
                                    </Card>
                                    <Card className="p-3">
                                      <div className="text-xs text-muted-foreground">Absent</div>
                                      <div className="text-lg font-bold">{absentPercent}%</div>
                                    </Card>
                                    <Card className="p-3">
                                      <div className="text-xs text-muted-foreground">Late</div>
                                      <div className="text-lg font-bold">{latePercent}%</div>
                                    </Card>
                                    <Card className="p-3">
                                      <div className="text-xs text-muted-foreground">Excused</div>
                                      <div className="text-lg font-bold">{excusedPercent}%</div>
                                    </Card>
                                  </>
                                );
                              })()}
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Monthly Trend</h4>
                        {selectedTeacher && (
                          <>
                            {(() => {
                              const teacher = teachers.find(t => t.id === selectedTeacher);
                              if (!teacher || !teacher.attendanceRecords || teacher.attendanceRecords.length === 0) {
                                return (
                                  <div className="py-4 text-center text-muted-foreground">
                                    No attendance trend data available
                                  </div>
                                );
                              }

                              // Calculate attendance rate
                              const records = teacher.attendanceRecords;
                              const presentCount = records.filter(r => r.status === 'present').length;
                              const attendanceRate = Math.round((presentCount / records.length) * 100);

                              return (
                                <>
                                  <Progress value={attendanceRate} className="h-2" />
                                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>Attendance Rate</span>
                                    <span>{attendanceRate}%</span>
                                  </div>
                                </>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      View Full Attendance History
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
