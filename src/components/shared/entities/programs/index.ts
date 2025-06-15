// Export all program components
export { default as ProgramCard } from './ProgramCard';
export { default as ProgramActions } from './ProgramActions';
export { default as ProgramFilters } from './ProgramFilters';
export { default as ProgramList } from './ProgramList';
export { default as ProgramCourseList } from './ProgramCourseList';

// Export types
export * from './types';

// Export backward compatibility components
export {
  SystemProgramCard,
  CampusProgramCard,
  CoordinatorProgramCard,
  SystemProgramsList,
  CampusProgramsList,
  CoordinatorProgramsList,
  SystemProgramCoursesList,
  CampusProgramCoursesList,
  CoordinatorProgramCoursesList
} from './compatibility';
