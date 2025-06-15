# Teacher Attendance Implementation

## Current State

The system currently has:
- Student attendance tracking via the `Attendance` model
- `TeacherProfile` with an `attendanceRate` field but no actual attendance records
- No dedicated teacher attendance tracking functionality

## Database Schema Changes

Add a new model to `schema.prisma`:

```prisma
model TeacherAttendance {
  id            String               @id @default(cuid())
  teacherId     String
  campusId      String
  date          DateTime
  status        AttendanceStatusType
  remarks       String?
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt
  teacher       TeacherProfile       @relation(fields: [teacherId], references: [id])
  campus        Campus               @relation(fields: [campusId], references: [id])

  @@unique([teacherId, date])
  @@index([date, status])
  @@map("teacher_attendance")
}
```

## API Endpoints

Create a new router file `src/server/api/routers/teacher-attendance.ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TeacherAttendanceService } from "../services/teacher-attendance.service";
import { SystemStatus, AttendanceStatusType, UserType } from "../constants";

export const teacherAttendanceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        campusId: z.string(),
        date: z.date(),
        status: z.nativeEnum(AttendanceStatusType),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new TeacherAttendanceService({ prisma: ctx.prisma });
      return service.createTeacherAttendance(input);
    }),

  bulkCreate: protectedProcedure
    .input(
      z.object({
        campusId: z.string(),
        date: z.date(),
        records: z.array(
          z.object({
            teacherId: z.string(),
            status: z.nativeEnum(AttendanceStatusType),
            remarks: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new TeacherAttendanceService({ prisma: ctx.prisma });
      return service.bulkCreateTeacherAttendance(input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(AttendanceStatusType).optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new TeacherAttendanceService({ prisma: ctx.prisma });
      return service.updateTeacherAttendance(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new TeacherAttendanceService({ prisma: ctx.prisma });
      return service.deleteTeacherAttendance(input.id);
    }),

  getByQuery: protectedProcedure
    .input(
      z.object({
        campusId: z.string(),
        teacherId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.nativeEnum(AttendanceStatusType).optional(),
        date: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = new TeacherAttendanceService({ prisma: ctx.prisma });
      return service.getTeacherAttendanceByQuery(input);
    }),

  getTeacherStats: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = new TeacherAttendanceService({ prisma: ctx.prisma });
      return service.getTeacherAttendanceStats(input);
    }),

  getCampusStats: protectedProcedure
    .input(
      z.object({
        campusId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = new TeacherAttendanceService({ prisma: ctx.prisma });
      return service.getCampusTeacherAttendanceStats(input);
    }),
});
```

## Service Implementation

Create a new service file `src/server/api/services/teacher-attendance.service.ts`:

```typescript
import { AttendanceStatusType, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ServiceBase } from "./service-base";
import { HolidayService } from "./holiday.service";
import { AcademicCalendarService } from "./academic-calendar.service";
import { NotificationService } from "./notification.service";

export class TeacherAttendanceService extends ServiceBase {
  private holidayService: HolidayService;
  private academicCalendarService: AcademicCalendarService;
  private notificationService: NotificationService;

  constructor(options: any) {
    super(options);
    this.holidayService = new HolidayService(options);
    this.academicCalendarService = new AcademicCalendarService(options);
    this.notificationService = new NotificationService(options);
  }

  async createTeacherAttendance(data: {
    teacherId: string;
    campusId: string;
    date: Date;
    status: AttendanceStatusType;
    remarks?: string;
  }) {
    try {
      // Check if record already exists
      const existingAttendance = await this.prisma.teacherAttendance.findUnique({
        where: {
          teacherId_date: {
            teacherId: data.teacherId,
            date: data.date,
          },
        },
      });

      if (existingAttendance) {
        // Update existing record
        const attendance = await this.prisma.teacherAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            status: data.status,
            remarks: data.remarks,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          attendance,
        };
      }

      // Create new attendance record
      const attendance = await this.prisma.teacherAttendance.create({
        data: {
          teacher: {
            connect: { id: data.teacherId },
          },
          campus: {
            connect: { id: data.campusId },
          },
          date: data.date,
          status: data.status,
          remarks: data.remarks,
        },
      });

      return {
        success: true,
        attendance,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create teacher attendance record",
        cause: error,
      });
    }
  }

  // Implement other methods (bulkCreate, update, delete, getByQuery, etc.)
  // Similar to the student attendance service but adapted for teachers
}
```

## UI Components

### 1. Core Components

Create a new component in `src/components/core/attendance/TeacherAttendanceRecorder.tsx`:

```tsx
"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttendanceStatusType } from "@/server/api/constants";

export interface Teacher {
  id: string;
  name: string;
  email?: string;
}

export interface TeacherAttendanceRecord {
  teacherId: string;
  status: AttendanceStatusType;
  remarks?: string;
}

export interface TeacherAttendanceRecorderProps {
  campusId: string;
  teachers: Teacher[];
  date?: Date;
  existingAttendance?: Record<string, { status: AttendanceStatusType; remarks?: string }>;
  onSubmit: (date: Date, records: TeacherAttendanceRecord[]) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function TeacherAttendanceRecorder({
  campusId,
  teachers,
  date = new Date(),
  existingAttendance = {},
  onSubmit,
  onCancel,
  isLoading = false,
}: TeacherAttendanceRecorderProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(date);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: AttendanceStatusType; remarks?: string }>
  >(() => {
    // Initialize with existing attendance or default to present
    const initialRecords: Record<
      string,
      { status: AttendanceStatusType; remarks?: string }
    > = {};
    
    teachers.forEach((teacher) => {
      initialRecords[teacher.id] = existingAttendance[teacher.id] || 
        { status: AttendanceStatusType.PRESENT };
    });
    
    return initialRecords;
  });

  const handleStatusChange = (teacherId: string, status: AttendanceStatusType) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], status },
    }));
  };

  const handleRemarksChange = (teacherId: string, remarks: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], remarks },
    }));
  };

  const handleSubmit = () => {
    const records = Object.entries(attendanceRecords).map(
      ([teacherId, record]) => ({
        teacherId,
        status: record.status,
        remarks: record.remarks,
      })
    );

    onSubmit(selectedDate, records);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setSelectedDate(newDate);
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const markAllAs = (status: AttendanceStatusType) => {
    const newRecords = { ...attendanceRecords };
    teachers.forEach((teacher) => {
      newRecords[teacher.id] = { ...newRecords[teacher.id], status };
    });
    setAttendanceRecords(newRecords);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Teacher Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/3">
              <Label htmlFor="date">Date</Label>
              <DatePicker
                date={selectedDate}
                onSelect={handleDateChange}
                disabled={isLoading}
              />
            </div>
            <div className="w-full sm:w-2/3">
              <Label htmlFor="search">Search Teachers</Label>
              <Input
                id="search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAllAs(AttendanceStatusType.PRESENT)}
              disabled={isLoading}
            >
              Mark All Present
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAllAs(AttendanceStatusType.ABSENT)}
              disabled={isLoading}
            >
              Mark All Absent
            </Button>
          </div>

          <div className="border rounded-md">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Teacher</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b">
                    <td className="px-4 py-2">{teacher.name}</td>
                    <td className="px-4 py-2">
                      <select
                        value={attendanceRecords[teacher.id]?.status || AttendanceStatusType.PRESENT}
                        onChange={(e) =>
                          handleStatusChange(
                            teacher.id,
                            e.target.value as AttendanceStatusType
                          )
                        }
                        disabled={isLoading}
                        className="w-full p-2 border rounded"
                      >
                        <option value={AttendanceStatusType.PRESENT}>Present</option>
                        <option value={AttendanceStatusType.ABSENT}>Absent</option>
                        <option value={AttendanceStatusType.LATE}>Late</option>
                        <option value={AttendanceStatusType.EXCUSED}>Excused</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={attendanceRecords[teacher.id]?.remarks || ""}
                        onChange={(e) =>
                          handleRemarksChange(teacher.id, e.target.value)
                        }
                        placeholder="Add remarks..."
                        disabled={isLoading}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              Save Attendance
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. Shared Components

Create a new component in `src/components/shared/entities/attendance/TeacherAttendanceRecorder.tsx` that extends the core component:

```tsx
"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/feedback/toast";
import { TeacherAttendanceRecorder as CoreTeacherAttendanceRecorder, Teacher, TeacherAttendanceRecord } from "@/components/core/attendance/TeacherAttendanceRecorder";
import { AttendanceStatusType } from "@/server/api/constants";

interface TeacherAttendanceRecorderProps {
  campusId: string;
  teachers: Teacher[];
  date?: Date;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function TeacherAttendanceRecorder({
  campusId,
  teachers,
  date = new Date(),
  onSuccess,
  onError,
  className,
}: TeacherAttendanceRecorderProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(date);
  const { toast } = useToast();
  
  // Fetch existing attendance records for the selected date
  const { data: existingAttendance, isLoading: isLoadingAttendance } = api.teacherAttendance.getByQuery.useQuery(
    {
      campusId,
      date: selectedDate,
    },
    {
      enabled: !!campusId && !!selectedDate,
    }
  );
  
  // Format existing attendance for the component
  const formattedAttendance: Record<string, { status: AttendanceStatusType; remarks?: string }> = {};
  if (existingAttendance) {
    existingAttendance.forEach((record) => {
      formattedAttendance[record.teacherId] = {
        status: record.status as AttendanceStatusType,
        remarks: record.remarks || undefined,
      };
    });
  }
  
  // Mutation for bulk creating/updating attendance
  const bulkCreateMutation = api.teacherAttendance.bulkCreate.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher attendance recorded successfully",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record attendance",
        variant: "error",
      });
      if (onError) onError(error);
    },
  });
  
  const handleSubmit = (date: Date, records: TeacherAttendanceRecord[]) => {
    bulkCreateMutation.mutate({
      campusId,
      date,
      records: records.map(record => ({
        teacherId: record.teacherId,
        status: record.status,
        remarks: record.remarks,
      })),
    });
  };
  
  return (
    <CoreTeacherAttendanceRecorder
      campusId={campusId}
      teachers={teachers}
      date={selectedDate}
      existingAttendance={formattedAttendance}
      onSubmit={handleSubmit}
      isLoading={isLoadingAttendance || bulkCreateMutation.isLoading}
    />
  );
}
```

### 3. Admin Page Component

Create a new page at `src/app/admin/teacher-attendance/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { api } from "@/trpc/react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeacherAttendanceRecorder } from "@/components/shared/entities/attendance/TeacherAttendanceRecorder";
import { Skeleton } from "@/components/ui/atoms/skeleton";

export default function AdminTeacherAttendancePage() {
  const { data: session, status } = useSession();
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  
  // Redirect if not authenticated
  if (status === "unauthenticated") {
    redirect("/api/auth/signin");
  }
  
  // Get user's campuses
  const { data: campuses, isLoading: isLoadingCampuses } = api.campus.list.useQuery();
  
  // Get teachers for selected campus
  const { data: teachers, isLoading: isLoadingTeachers } = api.teacher.list.useQuery(
    { campusId: selectedCampus || "" },
    { enabled: !!selectedCampus }
  );
  
  if (isLoadingCampuses) {
    return <AdminTeacherAttendancePageSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Teacher Attendance"
        subheading="Record and manage teacher attendance"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Select Campus</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCampus || ""}
            onValueChange={(value) => setSelectedCampus(value)}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a campus" />
            </SelectTrigger>
            <SelectContent>
              {campuses?.map((campus) => (
                <SelectItem key={campus.id} value={campus.id}>
                  {campus.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {selectedCampus && (
        <div>
          {isLoadingTeachers ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            teachers && teachers.length > 0 ? (
              <TeacherAttendanceRecorder
                campusId={selectedCampus}
                teachers={teachers.map(teacher => ({
                  id: teacher.id,
                  name: `${teacher.firstName} ${teacher.lastName}`,
                  email: teacher.email,
                }))}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-500">No teachers found for this campus.</p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}

function AdminTeacherAttendancePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-[300px]" />
        </CardContent>
      </Card>
    </div>
  );
}
```

## Implementation Steps

1. **Database Migration**:
   - Add the `TeacherAttendance` model to `schema.prisma`
   - Run `npx prisma migrate dev --name add-teacher-attendance`

2. **API Implementation**:
   - Create the teacher attendance service
   - Create the teacher attendance router
   - Add the router to the main tRPC router in `src/server/api/root.ts`

3. **UI Components**:
   - Implement the core TeacherAttendanceRecorder component
   - Implement the shared TeacherAttendanceRecorder component
   - Create the admin page for teacher attendance

4. **Testing**:
   - Test the API endpoints using Postman or similar tools
   - Test the UI components in the browser
   - Verify data is being saved correctly in the database

## Integration with Existing System

1. **Update TeacherProfile**:
   - Add logic to calculate and update the `attendanceRate` field based on attendance records

2. **Add to Navigation**:
   - Add a link to the teacher attendance page in the admin dashboard navigation

3. **Analytics Integration**:
   - Extend the analytics service to include teacher attendance metrics
   - Add teacher attendance charts to relevant dashboards

## Conclusion

This implementation provides a complete solution for tracking teacher attendance in the system, leveraging existing patterns and components while adding new functionality specific to teacher attendance tracking. The solution is designed to be scalable, maintainable, and consistent with the rest of the system.
