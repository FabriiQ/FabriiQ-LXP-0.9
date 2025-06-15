import React from 'react';
import { 
  TeacherCard, 
  TeacherList, 
  TeacherActions, 
  TeacherFilters 
} from './index';
import { 
  TeacherData, 
  TeacherAction, 
  TeacherFilter, 
  UserRole, 
  SystemStatus 
} from './types';

/**
 * Backward compatibility wrapper for SystemTeacherCard
 */
export const SystemTeacherCard = (props: any) => {
  // Map old props to new props
  const teacher: TeacherData = {
    id: props.teacher.id,
    name: props.teacher.name,
    email: props.teacher.email,
    phone: props.teacher.phone,
    avatar: props.teacher.avatar,
    status: props.teacher.status || SystemStatus.ACTIVE,
    campusId: props.teacher.campusId,
    campusName: props.teacher.campusName,
    subjectQualifications: props.teacher.subjects?.map((subject: any) => ({
      id: subject.id,
      subjectId: subject.id,
      subjectName: subject.name
    })),
    classCount: props.teacher.classCount
  };

  // Map old handlers to new handlers
  const handleAction = (action: TeacherAction, teacher: TeacherData) => {
    switch (action) {
      case TeacherAction.VIEW:
        if (props.onView) props.onView(teacher);
        break;
      case TeacherAction.EDIT:
        if (props.onEdit) props.onEdit(teacher);
        break;
      case TeacherAction.DELETE:
        if (props.onDelete) props.onDelete(teacher);
        break;
      default:
        break;
    }
  };

  return (
    <TeacherCard
      teacher={teacher}
      userRole={UserRole.SYSTEM_ADMIN}
      viewMode={props.compact ? 'compact' : 'full'}
      onAction={handleAction}
      className={props.className}
    />
  );
};

/**
 * Backward compatibility wrapper for CampusTeacherCard
 */
export const CampusTeacherCard = (props: any) => {
  // Map old props to new props
  const teacher: TeacherData = {
    id: props.teacher.id,
    name: props.teacher.name,
    email: props.teacher.email,
    phone: props.teacher.phone,
    avatar: props.teacher.avatar,
    status: props.teacher.status || SystemStatus.ACTIVE,
    subjectQualifications: props.teacher.subjects?.map((subject: any) => ({
      id: subject.id,
      subjectId: subject.id,
      subjectName: subject.name
    })),
    classCount: props.teacher.classCount
  };

  // Map old handlers to new handlers
  const handleAction = (action: TeacherAction, teacher: TeacherData) => {
    switch (action) {
      case TeacherAction.VIEW:
        if (props.onView) props.onView(teacher);
        break;
      case TeacherAction.EDIT:
        if (props.onEdit) props.onEdit(teacher);
        break;
      default:
        break;
    }
  };

  return (
    <TeacherCard
      teacher={teacher}
      userRole={UserRole.CAMPUS_ADMIN}
      viewMode={props.compact ? 'compact' : 'full'}
      onAction={handleAction}
      className={props.className}
    />
  );
};

/**
 * Backward compatibility wrapper for CoordinatorTeacherCard
 */
export const CoordinatorTeacherCard = (props: any) => {
  // Map old props to new props
  const teacher: TeacherData = {
    id: props.teacher.id,
    name: props.teacher.name,
    email: props.teacher.email,
    avatar: props.teacher.avatar,
    status: props.teacher.status || SystemStatus.ACTIVE,
    subjectQualifications: props.teacher.subjects?.map((subject: any) => ({
      id: subject.id,
      subjectId: subject.id,
      subjectName: subject.name
    })),
    classCount: props.teacher.classCount
  };

  // Map old handlers to new handlers
  const handleAction = (action: TeacherAction, teacher: TeacherData) => {
    switch (action) {
      case TeacherAction.VIEW:
        if (props.onView) props.onView(teacher);
        break;
      case TeacherAction.PROVIDE_FEEDBACK:
        if (props.onProvideFeedback) props.onProvideFeedback(teacher);
        break;
      default:
        break;
    }
  };

  return (
    <TeacherCard
      teacher={teacher}
      userRole={UserRole.COORDINATOR}
      viewMode={props.compact ? 'compact' : 'full'}
      onAction={handleAction}
      className={props.className}
    />
  );
};

/**
 * Backward compatibility wrapper for SystemTeachersList
 */
export const SystemTeachersList = (props: any) => {
  // Map old props to new props
  const teachers: TeacherData[] = props.teachers.map((teacher: any) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    avatar: teacher.avatar,
    status: teacher.status || SystemStatus.ACTIVE,
    campusId: teacher.campusId,
    campusName: teacher.campusName,
    subjectQualifications: teacher.subjects?.map((subject: any) => ({
      id: subject.id,
      subjectId: subject.id,
      subjectName: subject.name
    })),
    classCount: teacher.classCount
  }));

  // Map old handlers to new handlers
  const handleAction = (action: TeacherAction, teacher: TeacherData) => {
    switch (action) {
      case TeacherAction.VIEW:
        if (props.onView) props.onView(teacher);
        break;
      case TeacherAction.EDIT:
        if (props.onEdit) props.onEdit(teacher);
        break;
      case TeacherAction.DELETE:
        if (props.onDelete) props.onDelete(teacher);
        break;
      default:
        break;
    }
  };

  // Map old filter handlers to new handlers
  const handleFilterChange = (filters: TeacherFilter) => {
    if (props.onFilterChange) props.onFilterChange(filters);
  };

  return (
    <TeacherList
      teachers={teachers}
      userRole={UserRole.SYSTEM_ADMIN}
      isLoading={props.isLoading}
      error={props.error}
      campuses={props.campuses}
      subjects={props.subjects}
      onAction={handleAction}
      onFilterChange={handleFilterChange}
      pagination={props.pagination && {
        currentPage: props.pagination.currentPage,
        totalPages: props.pagination.totalPages,
        onPageChange: props.pagination.onPageChange
      }}
      className={props.className}
    />
  );
};

/**
 * Backward compatibility wrapper for CampusTeachersList
 */
export const CampusTeachersList = (props: any) => {
  // Map old props to new props
  const teachers: TeacherData[] = props.teachers.map((teacher: any) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    avatar: teacher.avatar,
    status: teacher.status || SystemStatus.ACTIVE,
    subjectQualifications: teacher.subjects?.map((subject: any) => ({
      id: subject.id,
      subjectId: subject.id,
      subjectName: subject.name
    })),
    classCount: teacher.classCount
  }));

  // Map old handlers to new handlers
  const handleAction = (action: TeacherAction, teacher: TeacherData) => {
    switch (action) {
      case TeacherAction.VIEW:
        if (props.onView) props.onView(teacher);
        break;
      case TeacherAction.EDIT:
        if (props.onEdit) props.onEdit(teacher);
        break;
      default:
        break;
    }
  };

  // Map old filter handlers to new handlers
  const handleFilterChange = (filters: TeacherFilter) => {
    if (props.onFilterChange) props.onFilterChange(filters);
  };

  return (
    <TeacherList
      teachers={teachers}
      userRole={UserRole.CAMPUS_ADMIN}
      isLoading={props.isLoading}
      error={props.error}
      subjects={props.subjects}
      onAction={handleAction}
      onFilterChange={handleFilterChange}
      pagination={props.pagination && {
        currentPage: props.pagination.currentPage,
        totalPages: props.pagination.totalPages,
        onPageChange: props.pagination.onPageChange
      }}
      className={props.className}
    />
  );
};

/**
 * Backward compatibility wrapper for CoordinatorTeachersList
 */
export const CoordinatorTeachersList = (props: any) => {
  // Map old props to new props
  const teachers: TeacherData[] = props.teachers.map((teacher: any) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    avatar: teacher.avatar,
    status: teacher.status || SystemStatus.ACTIVE,
    subjectQualifications: teacher.subjects?.map((subject: any) => ({
      id: subject.id,
      subjectId: subject.id,
      subjectName: subject.name
    })),
    classCount: teacher.classCount
  }));

  // Map old handlers to new handlers
  const handleAction = (action: TeacherAction, teacher: TeacherData) => {
    switch (action) {
      case TeacherAction.VIEW:
        if (props.onView) props.onView(teacher);
        break;
      case TeacherAction.PROVIDE_FEEDBACK:
        if (props.onProvideFeedback) props.onProvideFeedback(teacher);
        break;
      default:
        break;
    }
  };

  // Map old filter handlers to new handlers
  const handleFilterChange = (filters: TeacherFilter) => {
    if (props.onFilterChange) props.onFilterChange(filters);
  };

  return (
    <TeacherList
      teachers={teachers}
      userRole={UserRole.COORDINATOR}
      isLoading={props.isLoading}
      error={props.error}
      subjects={props.subjects}
      onAction={handleAction}
      onFilterChange={handleFilterChange}
      pagination={props.pagination && {
        currentPage: props.pagination.currentPage,
        totalPages: props.pagination.totalPages,
        onPageChange: props.pagination.onPageChange
      }}
      className={props.className}
    />
  );
};
