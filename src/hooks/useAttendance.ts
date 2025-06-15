"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { AttendanceStatus, BulkAttendanceRecord } from "@/types/attendance";

export function useAttendance() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const utils = api.useUtils();

  // Query: Get attendance records
  const getAttendanceRecords = (
    classId?: string,
    studentId?: string,
    startDate?: Date,
    endDate?: Date,
    status?: AttendanceStatus
  ) => {
    return api.attendance.getRecords.useQuery(
      {
        classId,
        studentId,
        startDate,
        endDate,
        status,
      },
      {
        enabled: !!classId || !!studentId,
      }
    );
  };

  // Query: Get class attendance stats
  const getClassStats = (classId: string, startDate?: Date, endDate?: Date) => {
    return api.attendance.getClassStats.useQuery(
      {
        classId,
        startDate,
        endDate,
      },
      {
        enabled: !!classId,
      }
    );
  };

  // Query: Get student attendance stats
  const getStudentStats = (studentId: string, startDate?: Date, endDate?: Date) => {
    return api.attendance.getStudentStats.useQuery(
      {
        studentId,
        startDate,
        endDate,
      },
      {
        enabled: !!studentId,
      }
    );
  };

  // Mutation: Create attendance record
  const createAttendanceMutation = api.attendance.create.useMutation({
    onSuccess: () => {
      utils.attendance.invalidate();
    },
  });

  // Mutation: Create bulk attendance records
  const bulkCreateAttendanceMutation = api.attendance.bulkCreate.useMutation({
    onSuccess: () => {
      utils.attendance.invalidate();
    },
  });

  // Mutation: Update attendance record
  const updateAttendanceMutation = api.attendance.update.useMutation({
    onSuccess: () => {
      utils.attendance.invalidate();
    },
  });

  // Mutation: Delete attendance record
  const deleteAttendanceMutation = api.attendance.delete.useMutation({
    onSuccess: () => {
      utils.attendance.invalidate();
    },
  });

  // Create a single attendance record
  const createAttendance = async ({
    studentId,
    classId,
    date,
    status,
    remarks,
  }: {
    studentId: string;
    classId: string;
    date: Date;
    status: AttendanceStatus;
    remarks?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createAttendanceMutation.mutateAsync({
        studentId,
        classId,
        date,
        status: status as any, // Cast to match API expectations
        remarks,
      });
      return result;
    } catch (err) {
      setError("Failed to create attendance record");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create multiple attendance records at once
  const bulkCreateAttendance = async ({
    classId,
    date,
    records,
  }: {
    classId: string;
    date: Date;
    records: {
      studentId: string;
      status: AttendanceStatus;
      remarks?: string;
    }[];
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await bulkCreateAttendanceMutation.mutateAsync({
        classId,
        date,
        attendanceRecords: records.map(record => ({
          studentId: record.studentId,
          status: record.status as any, // Cast to match API expectations
          remarks: record.remarks
        })),
      });
      return result;
    } catch (err) {
      setError("Failed to create bulk attendance records");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing attendance record
  const updateAttendance = async ({
    id,
    status,
    remarks,
  }: {
    id: string;
    status?: AttendanceStatus;
    remarks?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateAttendanceMutation.mutateAsync({
        id,
        status: status as any, // Cast to match API expectations
        remarks,
      });
      return result;
    } catch (err) {
      setError("Failed to update attendance record");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an attendance record
  const deleteAttendance = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteAttendanceMutation.mutateAsync({
        id,
      });
      return result;
    } catch (err) {
      setError("Failed to delete attendance record");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk update attendance records
  const bulkUpdateAttendance = async ({
    classId,
    date,
    records,
  }: {
    classId: string;
    date: Date;
    records: {
      studentId: string;
      status: AttendanceStatus;
      remarks?: string;
      id?: string;
    }[];
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Process records with existing IDs for update
      const recordsToUpdate = records.filter(record => record.id);
      
      // Process records without IDs for creation
      const recordsToCreate = records.filter(record => !record.id);
      
      // Update existing records
      if (recordsToUpdate.length > 0) {
        for (const record of recordsToUpdate) {
          if (record.id) {
            await updateAttendanceMutation.mutateAsync({
              id: record.id,
              status: record.status as any,
              remarks: record.remarks,
            });
          }
        }
      }
      
      // Create new records
      if (recordsToCreate.length > 0) {
        await bulkCreateAttendanceMutation.mutateAsync({
          classId,
          date,
          attendanceRecords: recordsToCreate.map(record => ({
            studentId: record.studentId,
            status: record.status as any,
            remarks: record.remarks
          })),
        });
      }
      
      return true;
    } catch (err) {
      setError("Failed to update attendance records");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    getAttendanceRecords,
    getClassStats,
    getStudentStats,
    createAttendance,
    bulkCreateAttendance,
    updateAttendance,
    deleteAttendance,
    bulkUpdateAttendance,
  };
} 