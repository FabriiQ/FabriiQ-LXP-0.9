import { UserType } from '@/server/api/constants';

export enum CalendarAction {
  VIEW_HOLIDAYS = 'VIEW_HOLIDAYS',
  CREATE_HOLIDAY = 'CREATE_HOLIDAY',
  UPDATE_HOLIDAY = 'UPDATE_HOLIDAY',
  DELETE_HOLIDAY = 'DELETE_HOLIDAY',
  
  VIEW_ACADEMIC_EVENTS = 'VIEW_ACADEMIC_EVENTS',
  CREATE_ACADEMIC_EVENT = 'CREATE_ACADEMIC_EVENT',
  UPDATE_ACADEMIC_EVENT = 'UPDATE_ACADEMIC_EVENT',
  DELETE_ACADEMIC_EVENT = 'DELETE_ACADEMIC_EVENT',
  
  VIEW_SCHEDULE_PATTERNS = 'VIEW_SCHEDULE_PATTERNS',
  CREATE_SCHEDULE_PATTERN = 'CREATE_SCHEDULE_PATTERN',
  UPDATE_SCHEDULE_PATTERN = 'UPDATE_SCHEDULE_PATTERN',
  DELETE_SCHEDULE_PATTERN = 'DELETE_SCHEDULE_PATTERN',
  
  VIEW_CALENDAR = 'VIEW_CALENDAR',
  EXPORT_CALENDAR = 'EXPORT_CALENDAR',
}

// Permission matrix by user role
const permissionsByRole: Record<UserType, CalendarAction[]> = {
  [UserType.SYSTEM_ADMIN]: Object.values(CalendarAction),
  [UserType.SYSTEM_MANAGER]: Object.values(CalendarAction),
  [UserType.CAMPUS_ADMIN]: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.CREATE_HOLIDAY,
    CalendarAction.UPDATE_HOLIDAY,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.CREATE_ACADEMIC_EVENT,
    CalendarAction.UPDATE_ACADEMIC_EVENT,
    CalendarAction.DELETE_ACADEMIC_EVENT,
    CalendarAction.VIEW_SCHEDULE_PATTERNS,
    CalendarAction.CREATE_SCHEDULE_PATTERN,
    CalendarAction.UPDATE_SCHEDULE_PATTERN,
    CalendarAction.VIEW_CALENDAR,
    CalendarAction.EXPORT_CALENDAR,
  ],
  [UserType.CAMPUS_COORDINATOR]: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.CREATE_ACADEMIC_EVENT,
    CalendarAction.UPDATE_ACADEMIC_EVENT,
    CalendarAction.VIEW_SCHEDULE_PATTERNS,
    CalendarAction.CREATE_SCHEDULE_PATTERN,
    CalendarAction.UPDATE_SCHEDULE_PATTERN,
    CalendarAction.VIEW_CALENDAR,
    CalendarAction.EXPORT_CALENDAR,
  ],
  [UserType.CAMPUS_TEACHER]: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.VIEW_SCHEDULE_PATTERNS,
    CalendarAction.VIEW_CALENDAR,
    CalendarAction.EXPORT_CALENDAR,
  ],
  [UserType.CAMPUS_STUDENT]: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.VIEW_CALENDAR,
  ],
  [UserType.CAMPUS_PARENT]: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.VIEW_CALENDAR,
  ],
};

// Check if a user has a specific calendar permission
export function hasCalendarPermission(userType: UserType, action: CalendarAction): boolean {
  return permissionsByRole[userType]?.includes(action) || false;
} 