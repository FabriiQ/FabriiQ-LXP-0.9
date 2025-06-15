// Export all enhanced components
// Temporarily commented out due to TypeScript issues
// export { ActivityTypeSelectorGrid } from './ActivityTypeSelectorGrid';
// Placeholder implementation
export const ActivityTypeSelectorGrid = () => null;
export { UnifiedActivityCreator } from './UnifiedActivityCreator';
export { ActivityViewer } from './ActivityViewer';
export { ActivityEditor } from './ActivityEditor';
export { ActivityAnalyticsWrapper } from './ActivityAnalyticsWrapper';
export { ActivityRegistryProvider } from './ActivityRegistryProvider';

// Export components that are implemented
export { ActivityList } from './ActivityList';

// Export new analytics components
export { MinimalistActivityEngagementDashboard } from './MinimalistActivityEngagementDashboard';
export { TimeTrackingDashboard } from './TimeTrackingDashboard';
export { MinimalistActivityComparison } from './MinimalistActivityComparison';

// Temporary exports for components that will be implemented in future phases
// These are placeholders to avoid import errors
export const ActivityGrading = () => null;
export const BatchGrading = () => null;

// Export utility functions
export { prepareActivityCreateData, prepareActivityUpdateData, validateActivityData, getActivityTypeId } from './utils/api-integration';
