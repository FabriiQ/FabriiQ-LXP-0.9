'use client';

import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { ArrowLeft, Clock, Download } from 'lucide-react';
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

interface AttendanceClassViewProps {
  classId: string;
  date: Date | null;
  onBack: () => void;
}

export function AttendanceClassView({ classId, date, onBack }: AttendanceClassViewProps) {
  // Fetch class details
  const { data: classData, isLoading: isLoadingClass } = api.class.getById.useQuery(
    { classId },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Fetch attendance records
  const { data: attendanceData, isLoading: isLoadingAttendance } = api.attendance.getByQuery.useQuery(
    {
      classId,
      date: date ?? undefined,
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      enabled: !!classId,
    }
  );

  // Fetch attendance stats
  const { data: attendanceStats, isLoading: isLoadingStats } = api.attendance.getClassStats.useQuery(
    { classId },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      enabled: !!classId,
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {isLoadingClass ? (
          <Skeleton className="h-8 w-[200px]" />
        ) : (
          <div>
            <h2 className="text-xl font-bold">{classData?.name}</h2>
            <p className="text-muted-foreground text-sm">{classData?.courseCampus?.course?.name}</p>
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
                  {attendanceStats?.stats ?
                    `${Math.round(attendanceStats.stats.studentStats.reduce((avg, student) => avg + student.attendanceRate, 0) /
                    (attendanceStats.stats.studentStats.length || 1))}%` : 'N/A'}
                </div>
                <Progress
                  value={attendanceStats?.stats ?
                    (attendanceStats.stats.studentStats.reduce((avg, student) => avg + student.attendanceRate, 0) /
                    (attendanceStats.stats.studentStats.length || 1)) : 0}
                  className="h-2 mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {attendanceStats?.stats?.totalDays || 0} days
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingClass ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {classData?.students?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enrolled in this class
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {date ? format(date, 'PPP') : 'All Records'}
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
                  Attendance records {date ? 'on this date' : 'total'}
                </p>
              </>
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
                {date
                  ? `Attendance for ${format(date, 'PPP')}`
                  : 'Recent attendance records'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/campus/attendance/take?classId=${classId}`}>
                  <Clock className="mr-2 h-4 w-4" /> Take Attendance
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
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
                    <TableHead>Student</TableHead>
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
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {record.student?.user?.name?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{record.student?.user?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {record.student?.enrollmentNumber}
                            </div>
                          </div>
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
              {date && (
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/admin/campus/attendance/take?classId=${classId}&date=${date.toISOString()}`}>
                    Take Attendance
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
