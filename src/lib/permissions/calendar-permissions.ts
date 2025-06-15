import { UserType } from "@prisma/client";

export enum CalendarAction {
  VIEW_HOLIDAYS = "VIEW_HOLIDAYS",
  CREATE_HOLIDAY = "CREATE_HOLIDAY",
  UPDATE_HOLIDAY = "UPDATE_HOLIDAY",
  DELETE_HOLIDAY = "DELETE_HOLIDAY",
  
  VIEW_ACADEMIC_EVENTS = "VIEW_ACADEMIC_EVENTS",
  CREATE_ACADEMIC_EVENT = "CREATE_ACADEMIC_EVENT",
  UPDATE_ACADEMIC_EVENT = "UPDATE_ACADEMIC_EVENT",
  DELETE_ACADEMIC_EVENT = "DELETE_ACADEMIC_EVENT",
  
  VIEW_SCHEDULE_PATTERNS = "VIEW_SCHEDULE_PATTERNS",
  CREATE_SCHEDULE_PATTERN = "CREATE_SCHEDULE_PATTERN",
  UPDATE_SCHEDULE_PATTERN = "UPDATE_SCHEDULE_PATTERN",
  DELETE_SCHEDULE_PATTERN = "DELETE_SCHEDULE_PATTERN",
  
  VIEW_CALENDAR = "VIEW_CALENDAR",
  EXPORT_CALENDAR = "EXPORT_CALENDAR",
}

// Permission matrix by user role
export const calendarPermissionsByRole: Record<UserType, CalendarAction[]> = {
  SYSTEM_ADMIN: Object.values(CalendarAction),
  SYSTEM_MANAGER: Object.values(CalendarAction),
  ADMINISTRATOR: Object.values(CalendarAction),
  CAMPUS_ADMIN: Object.values(CalendarAction),
  CAMPUS_COORDINATOR: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.CREATE_HOLIDAY,
    CalendarAction.UPDATE_HOLIDAY,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.CREATE_ACADEMIC_EVENT,
    CalendarAction.UPDATE_ACADEMIC_EVENT,
    CalendarAction.DELETE_ACADEMIC_EVENT,
    CalendarAction.VIEW_CALENDAR,
    CalendarAction.EXPORT_CALENDAR,
  ],
  COORDINATOR: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.CREATE_HOLIDAY,
    CalendarAction.UPDATE_HOLIDAY,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.CREATE_ACADEMIC_EVENT,
    CalendarAction.UPDATE_ACADEMIC_EVENT,
    CalendarAction.DELETE_ACADEMIC_EVENT,
    CalendarAction.VIEW_CALENDAR,
    CalendarAction.EXPORT_CALENDAR,
  ],
  CAMPUS_TEACHER: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.VIEW_CALENDAR,
    CalendarAction.EXPORT_CALENDAR,
  ],
  TEACHER: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.VIEW_CALENDAR,
    CalendarAction.EXPORT_CALENDAR,
  ],
  CAMPUS_STUDENT: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.VIEW_CALENDAR,
  ],
  STUDENT: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.VIEW_CALENDAR,
  ],
  CAMPUS_PARENT: [
    CalendarAction.VIEW_HOLIDAYS,
    CalendarAction.VIEW_ACADEMIC_EVENTS,
    CalendarAction.VIEW_CALENDAR,
  ]
};

// Check if a user has a specific calendar permission
export function hasCalendarPermission(userType: UserType, action: CalendarAction): boolean {
  return calendarPermissionsByRole[userType]?.includes(action) || false;
}

// Get all calendar permissions for a user type
export function getCalendarPermissions(userType: UserType): CalendarAction[] {
  return calendarPermissionsByRole[userType] || [];
}

// Check if a user has any of the specified calendar permissions
export function hasAnyCalendarPermission(userType: UserType, actions: CalendarAction[]): boolean {
  const userPermissions = getCalendarPermissions(userType);
  return actions.some(action => userPermissions.includes(action));
}

// Check if a user has all of the specified calendar permissions
export function hasAllCalendarPermissions(userType: UserType, actions: CalendarAction[]): boolean {
  const userPermissions = getCalendarPermissions(userType);
  return actions.every(action => userPermissions.includes(action));
} 