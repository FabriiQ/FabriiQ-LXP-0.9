// Export all student components
export * from './types';
export * from './StudentCard';
export * from './StudentActions';
export * from './StudentList';
export * from './StudentFilters';
export * from './StudentForm';
export * from './StudentProfileView';
export * from './StudentTabs';
export * from './StudentPerformanceView';
export * from './StudentTransferForm';
export * from './StudentTransferDialog';

// Default export
import { StudentCard } from './StudentCard';
import { StudentActions } from './StudentActions';
import { StudentList } from './StudentList';
import { StudentFilters } from './StudentFilters';
import { StudentForm } from './StudentForm';
import { StudentProfileView } from './StudentProfileView';
import { StudentTabs } from './StudentTabs';
import { StudentPerformanceView } from './StudentPerformanceView';
import { StudentTransferForm } from './StudentTransferForm';
import { StudentTransferDialog } from './StudentTransferDialog';

export default {
  StudentCard,
  StudentActions,
  StudentList,
  StudentFilters,
  StudentForm,
  StudentProfileView,
  StudentTabs,
  StudentPerformanceView,
  StudentTransferForm,
  StudentTransferDialog
};
