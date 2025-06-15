// Export all teacher components
export { default as TeacherCard } from './TeacherCard';
export { default as TeacherActions } from './TeacherActions';
export { default as TeacherFilters } from './TeacherFilters';
export { default as TeacherList } from './TeacherList';

// Export types
export * from './types';

// Export backward compatibility components
export {
  SystemTeacherCard,
  CampusTeacherCard,
  CoordinatorTeacherCard,
  SystemTeachersList,
  CampusTeachersList,
  CoordinatorTeachersList
} from './compatibility';
