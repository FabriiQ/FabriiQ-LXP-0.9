'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { ArrowLeft, Calendar, BookOpen, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface AttendanceStudentViewProps {
  studentId: string;
  classId: string | null;
  dateRange: { from: Date | null; to: Date | null };
  onBack: () => void;
}

export function AttendanceStudentView({
  studentId,
  classId,
  dateRange,
  onBack
}: AttendanceStudentViewProps) {
  // Fetch student details
  const { data: studentData, isLoading: isLoadingStudent } = api.student.getAllStudentsByCampus.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      retry: 1,
      select: (data) => data.find(student => student.id === studentId),
    }
  );

  // Fetch attendance records
  const { data: attendanceData, isLoading: isLoadingAttendance } = api.attendance.getByQuery.useQuery(
    {
      studentId,
      classId: classId || '', // Provide a default empty string instead of undefined
      startDate: dateRange.from ?? undefined,
      endDate: dateRange.to ?? undefined,
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      enabled: !!studentId,
    }
  );

  // Fetch attendance stats
  const { data: attendanceStats, isLoading: isLoadingStats } = api.attendance.getStudentStats.useQuery(
    {
      studentId,
      classId: classId || '', // Provide a default empty string instead of undefined
      startDate: dateRange.from ?? undefined,
      endDate: dateRange.to ?? undefined,
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      enabled: !!studentId,
    }
  );

  // Prepare data for pie chart
  const pieData = [
    { name: 'Present', value: attendanceStats?.stats?.statusCounts.PRESENT || 0, color: '#10b981' },
    { name: 'Absent', value: attendanceStats?.stats?.statusCounts.ABSENT || 0, color: '#ef4444' },
    { name: 'Late', value: attendanceStats?.stats?.statusCounts.LATE || 0, color: '#f59e0b' },
    { name: 'Excused', value: attendanceStats?.stats?.statusCounts.EXCUSED || 0, color: '#6366f1' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {isLoadingStudent ? (
          <Skeleton className="h-8 w-[200px]" />
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {studentData?.user?.name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{studentData?.user?.name}</h2>
              <p className="text-muted-foreground text-sm">{studentData?.enrollmentNumber}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {attendanceStats?.stats?.overallAttendanceRate
                    ? `${Math.round(attendanceStats.stats.overallAttendanceRate)}%`
                    : 'N/A'}
                </div>
                <Progress
                  value={attendanceStats?.stats?.overallAttendanceRate || 0}
                  className="h-2 mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {attendanceStats?.stats?.totalRecords || 0} records
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStudent ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {studentData ? '1' : '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {classId ? 'Viewing selected class' : 'Student profile'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {dateRange.from && dateRange.to
                ? `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`
                : dateRange.from
                ? `From ${format(dateRange.from, 'PP')}`
                : 'All Records'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAttendance ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {attendanceData?.attendanceRecords?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Attendance records {dateRange.from || dateRange.to ? 'in date range' : 'total'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
            <CardDescription>Breakdown by attendance status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-[250px] w-full" />
            ) : pieData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} records`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No attendance data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Attendance</CardTitle>
            <CardDescription>Attendance by class</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-[250px] w-full" />
            ) : attendanceStats?.stats?.classStats && attendanceStats.stats.classStats.length > 0 ? (
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                {attendanceStats.stats.classStats.map((classItem: any) => (
                  <div key={classItem.classId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{classItem.className}</div>
                          <div className="text-xs text-muted-foreground">{classItem.classCode}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">{Math.round(classItem.attendanceRate)}%</div>
                    </div>
                    <Progress value={classItem.attendanceRate} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Present: {classItem.statusCounts.PRESENT || 0}</span>
                      <span>Absent: {classItem.statusCounts.ABSENT || 0}</span>
                      <span>Late: {classItem.statusCounts.LATE || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No class attendance data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {dateRange.from && dateRange.to
                  ? `Records from ${format(dateRange.from, 'PP')} to ${format(dateRange.to, 'PP')}`
                  : 'All attendance records'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAttendance ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : attendanceData && attendanceData.attendanceRecords && attendanceData.attendanceRecords.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.attendanceRecords.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{record.class?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.class?.courseCampus?.course?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            record.status === 'PRESENT'
                              ? 'bg-green-50 text-green-700'
                              : record.status === 'ABSENT'
                              ? 'bg-red-50 text-red-700'
                              : record.status === 'LATE'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-blue-50 text-blue-700'
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.date ? format(new Date(record.date), 'PP') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {record.time ? format(new Date(record.time), 'p') : 'N/A'}
                      </TableCell>
                      <TableCell>{record.remarks || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/campus/attendance/${record.id}`}>
                            Edit
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>No attendance records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
