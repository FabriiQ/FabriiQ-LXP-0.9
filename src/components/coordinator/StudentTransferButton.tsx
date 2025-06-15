'use client';

import { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { StudentTransferDialog } from '@/components/shared/entities/students/StudentTransferDialog';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';

interface StudentTransferButtonProps extends ButtonProps {
  studentId: string;
  studentName: string;
}

/**
 * StudentTransferButton Component
 *
 * This component displays a button that opens a dialog for transferring a student.
 * It reuses the existing StudentTransferDialog component.
 */
export function StudentTransferButton({
  studentId,
  studentName,
  ...buttonProps
}: StudentTransferButtonProps) {
  // Dialog state is managed by the StudentTransferDialog component
  const { toast } = useToast();

  // Get current user's data
  const { data: userData } = api.user.getCurrent.useQuery();
  const currentCampusId = userData?.primaryCampusId || '';
  const userId = userData?.id || '';

  // Get student's current enrollments
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = api.enrollment.getEnrollmentsByStudent.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Get available classes in the current campus
  const { data: classesData, isLoading: isLoadingClasses } = api.class.list.useQuery(
    {
      courseCampusId: undefined,
      termId: undefined,
      status: 'ACTIVE',
    },
    { enabled: !!currentCampusId }
  );

  // Get available campuses
  const { data: campusesData, isLoading: isLoadingCampuses } = api.campus.getAll.useQuery();

  // Format student's current classes
  const currentClasses = enrollmentsData?.enrollments
    ? enrollmentsData.enrollments.map(enrollment => ({
        id: enrollment.class.id,
        name: enrollment.class.name,
        code: enrollment.class.code,
        campusId: currentCampusId,
      }))
    : [];

  // Format available classes
  const availableClasses = classesData?.items
    ? classesData.items.map(cls => ({
        id: cls.id,
        name: cls.name,
        code: cls.code,
        campusId: cls.campusId,
      }))
    : [];

  // Format available campuses
  const availableCampuses = campusesData
    ? campusesData.map(campus => ({
        id: campus.id,
        name: campus.name,
        code: 'CODE' // Add a default code since it's required by the interface
      }))
    : [];

  const isLoading = isLoadingEnrollments || isLoadingClasses || isLoadingCampuses;

  const handleSuccess = () => {
    toast({
      title: 'Transfer Successful',
      description: `${studentName} has been transferred successfully.`,
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading}
        {...buttonProps}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="mr-2 h-4 w-4" />
        )}
        Transfer Student
      </Button>

      <StudentTransferDialog
        trigger={
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            {...buttonProps}
            className="hidden"
          >
            Transfer Student
          </Button>
        }
        studentId={studentId}
        studentName={studentName}
        currentClasses={currentClasses}
        availableClasses={availableClasses}
        currentCampusId={currentCampusId}
        availableCampuses={availableCampuses}
        userId={userId}
        onSuccess={handleSuccess}
      />
    </>
  );
}
