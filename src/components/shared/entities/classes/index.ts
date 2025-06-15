/**
 * Class Components Library
 *
 * This file exports all class-related components from the library.
 */

// Export types
export * from './types';

// Export components
export { ClassCard } from './ClassCard';
export { ClassActions } from './ClassActions';
export { ClassList } from './ClassList';
export { ClassFilters } from './ClassFilters';
export { ClassDetail } from './ClassDetail';
export { ClassTabs } from './ClassTabs';
export { ClassForm } from './ClassForm';
export { ClassDashboard } from './ClassDashboard';
export { ClassStudentList } from './ClassStudentList';

// Export attendance components
export * from './ClassAttendance';

// Export schedule components
export * from './ClassSchedule';

// Re-export for backward compatibility
export { ClassCard as ClassCardComponent } from './ClassCard';
export { ClassActions as ClassActionsComponent } from './ClassActions';
export { ClassList as ClassListComponent } from './ClassList';
export { ClassFilters as ClassFiltersComponent } from './ClassFilters';
export { ClassDetail as ClassDetailComponent } from './ClassDetail';
export { ClassTabs as ClassTabsComponent } from './ClassTabs';
export { ClassForm as ClassFormComponent } from './ClassForm';
export { ClassDashboard as ClassDashboardComponent } from './ClassDashboard';
export { ClassStudentList as ClassStudentListComponent } from './ClassStudentList';
