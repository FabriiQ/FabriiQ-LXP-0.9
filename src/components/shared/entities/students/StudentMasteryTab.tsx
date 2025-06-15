'use client';

import React from 'react';
import { StudentMasteryProfile } from '@/features/bloom/components/mastery/StudentMasteryProfile';
import { StudentData } from './types';

interface StudentMasteryTabProps {
  student: StudentData;
  className?: string;
}

/**
 * Component for displaying student mastery data in the student profile
 */
export function StudentMasteryTab({ student, className = '' }: StudentMasteryTabProps) {
  return (
    <div className={className}>
      <StudentMasteryProfile
        studentId={student.id}
        studentName={student.name}
        className="mt-4"
      />
    </div>
  );
}

export default StudentMasteryTab;
