/**
 * Class Attendance Components Library
 *
 * This file exports all attendance-related components from the library.
 */

// Export components
export { AttendanceFilters } from './AttendanceFilters';
export { AttendanceRecorder } from './AttendanceRecorder';
export { AttendanceGrid } from './AttendanceGrid';
export { AttendanceStats } from './AttendanceStats';

// Export types
export type { 
  AttendanceFilterOption,
  AttendanceFiltersState,
  AttendanceFiltersProps 
} from './AttendanceFilters';

export type { 
  AttendanceStudentData,
  AttendanceRecorderProps 
} from './AttendanceRecorder';

export type { 
  AttendanceRecord,
  AttendanceStudent,
  AttendanceGridProps 
} from './AttendanceGrid';

export type { 
  AttendanceStatsData,
  AttendanceStatsProps 
} from './AttendanceStats';

// Re-export for backward compatibility
export { AttendanceFilters as AttendanceFiltersComponent } from './AttendanceFilters';
export { AttendanceRecorder as AttendanceRecorderComponent } from './AttendanceRecorder';
export { AttendanceGrid as AttendanceGridComponent } from './AttendanceGrid';
export { AttendanceStats as AttendanceStatsComponent } from './AttendanceStats';
