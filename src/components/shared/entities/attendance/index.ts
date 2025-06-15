// Export all attendance components
export * from './types';
export * from './AttendanceRecorder';
export * from './AttendanceGrid';
export * from './AttendanceAnalytics';
export * from './AttendanceSelector';
export * from './AttendanceStatusCell';
export * from './StudentAttendanceProfile';
export * from './AttendanceTabs';
export * from './AttendanceActions';
export * from './AttendanceFilters';

// Default export
import { AttendanceRecorder } from './AttendanceRecorder';
import { AttendanceGrid } from './AttendanceGrid';
import { AttendanceAnalytics } from './AttendanceAnalytics';
import { AttendanceSelector } from './AttendanceSelector';
import { AttendanceStatusCell } from './AttendanceStatusCell';
import { StudentAttendanceProfile } from './StudentAttendanceProfile';
import { AttendanceTabs } from './AttendanceTabs';
import { AttendanceActions } from './AttendanceActions';
import { AttendanceFilters } from './AttendanceFilters';

export default {
  AttendanceRecorder,
  AttendanceGrid,
  AttendanceAnalytics,
  AttendanceSelector,
  AttendanceStatusCell,
  StudentAttendanceProfile,
  AttendanceTabs,
  AttendanceActions,
  AttendanceFilters
};
