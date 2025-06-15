import React from 'react';
import { 
  ProgramCard, 
  ProgramList, 
  ProgramActions, 
  ProgramFilters,
  ProgramCourseList
} from './index';
import { 
  ProgramData, 
  ProgramAction, 
  ProgramFilter, 
  UserRole, 
  SystemStatus,
  CourseInProgram
} from './types';

/**
 * Backward compatibility wrapper for SystemProgramCard
 */
export const SystemProgramCard = (props: any) => {
  // Map old props to new props
  const program: ProgramData = {
    id: props.program.id,
    name: props.program.name,
    code: props.program.code,
    description: props.program.description,
    status: props.program.status || SystemStatus.ACTIVE,
    institutionId: props.program.institutionId,
    institutionName: props.program.institutionName,
    campusId: props.program.campusId,
    campusName: props.program.campusName,
    courseCount: props.program.courseCount,
    studentCount: props.program.studentCount,
    startDate: props.program.startDate,
    endDate: props.program.endDate,
    createdAt: props.program.createdAt,
    updatedAt: props.program.updatedAt,
    image: props.program.image
  };

  // Map old handlers to new handlers
  const handleAction = (action: ProgramAction, program: ProgramData) => {
    switch (action) {
      case ProgramAction.VIEW:
        if (props.onView) props.onView(program);
        break;
      case ProgramAction.EDIT:
        if (props.onEdit) props.onEdit(program);
        break;
      case ProgramAction.DELETE:
        if (props.onDelete) props.onDelete(program);
        break;
      default:
        break;
    }
  };

  return (
    <ProgramCard
      program={program}
      userRole={UserRole.SYSTEM_ADMIN}
      viewMode={props.compact ? 'compact' : 'full'}
      onAction={handleAction}
      className={props.className}
    />
  );
};

/**
 * Backward compatibility wrapper for CampusProgramCard
 */
export const CampusProgramCard = (props: any) => {
  // Map old props to new props
  const program: ProgramData = {
    id: props.program.id,
    name: props.program.name,
    code: props.program.code,
    description: props.program.description,
    status: props.program.status || SystemStatus.ACTIVE,
    campusId: props.program.campusId,
    campusName: props.program.campusName,
    courseCount: props.program.courseCount,
    studentCount: props.program.studentCount,
    startDate: props.program.startDate,
    endDate: props.program.endDate,
    image: props.program.image
  };

  // Map old handlers to new handlers
  const handleAction = (action: ProgramAction, program: ProgramData) => {
    switch (action) {
      case ProgramAction.VIEW:
        if (props.onView) props.onView(program);
        break;
      case ProgramAction.EDIT:
        if (props.onEdit) props.onEdit(program);
        break;
      default:
        break;
    }
  };

  return (
    <ProgramCard
      program={program}
      userRole={UserRole.CAMPUS_ADMIN}
      viewMode={props.compact ? 'compact' : 'full'}
      onAction={handleAction}
      className={props.className}
    />
  );
};

/**
 * Backward compatibility wrapper for CoordinatorProgramCard
 */
export const CoordinatorProgramCard = (props: any) => {
  // Map old props to new props
  const program: ProgramData = {
    id: props.program.id,
    name: props.program.name,
    code: props.program.code,
    description: props.program.description,
    status: props.program.status || SystemStatus.ACTIVE,
    campusName: props.program.campusName,
    courseCount: props.program.courseCount,
    studentCount: props.program.studentCount,
    startDate: props.program.startDate,
    endDate: props.program.endDate,
    image: props.program.image
  };

  // Map old handlers to new handlers
  const handleAction = (action: ProgramAction, program: ProgramData) => {
    switch (action) {
      case ProgramAction.VIEW:
        if (props.onView) props.onView(program);
        break;
      default:
        break;
    }
  };

  return (
    <ProgramCard
      program={program}
      userRole={UserRole.COORDINATOR}
      viewMode={props.compact ? 'compact' : 'full'}
      onAction={handleAction}
      className={props.className}
    />
  );
};

/**
 * Backward compatibility wrapper for SystemProgramsList
 */
export const SystemProgramsList = (props: any) => {
  // Map old props to new props
  const programs: ProgramData[] = props.programs.map((program: any) => ({
    id: program.id,
    name: program.name,
    code: program.code,
    description: program.description,
    status: program.status || SystemStatus.ACTIVE,
    institutionId: program.institutionId,
    institutionName: program.institutionName,
    campusId: program.campusId,
    campusName: program.campusName,
    courseCount: program.courseCount,
    studentCount: program.studentCount,
    startDate: program.startDate,
    endDate: program.endDate,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    image: program.image
  }));

  // Map old handlers to new handlers
  const handleAction = (action: ProgramAction, program: ProgramData) => {
    switch (action) {
      case ProgramAction.VIEW:
        if (props.onView) props.onView(program);
        break;
      case ProgramAction.EDIT:
        if (props.onEdit) props.onEdit(program);
        break;
      case ProgramAction.DELETE:
        if (props.onDelete) props.onDelete(program);
        break;
      default:
        break;
    }
  };

  // Map old filter handlers to new handlers
  const handleFilterChange = (filters: ProgramFilter) => {
    if (props.onFilterChange) props.onFilterChange(filters);
  };

  return (
    <ProgramList
      programs={programs}
      userRole={UserRole.SYSTEM_ADMIN}
      isLoading={props.isLoading}
      error={props.error}
      institutions={props.institutions}
      campuses={props.campuses}
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
 * Backward compatibility wrapper for CampusProgramsList
 */
export const CampusProgramsList = (props: any) => {
  // Map old props to new props
  const programs: ProgramData[] = props.programs.map((program: any) => ({
    id: program.id,
    name: program.name,
    code: program.code,
    description: program.description,
    status: program.status || SystemStatus.ACTIVE,
    campusId: program.campusId,
    campusName: program.campusName,
    courseCount: program.courseCount,
    studentCount: program.studentCount,
    startDate: program.startDate,
    endDate: program.endDate,
    image: program.image
  }));

  // Map old handlers to new handlers
  const handleAction = (action: ProgramAction, program: ProgramData) => {
    switch (action) {
      case ProgramAction.VIEW:
        if (props.onView) props.onView(program);
        break;
      case ProgramAction.EDIT:
        if (props.onEdit) props.onEdit(program);
        break;
      default:
        break;
    }
  };

  // Map old filter handlers to new handlers
  const handleFilterChange = (filters: ProgramFilter) => {
    if (props.onFilterChange) props.onFilterChange(filters);
  };

  return (
    <ProgramList
      programs={programs}
      userRole={UserRole.CAMPUS_ADMIN}
      isLoading={props.isLoading}
      error={props.error}
      campuses={props.campuses}
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
 * Backward compatibility wrapper for CoordinatorProgramsList
 */
export const CoordinatorProgramsList = (props: any) => {
  // Map old props to new props
  const programs: ProgramData[] = props.programs.map((program: any) => ({
    id: program.id,
    name: program.name,
    code: program.code,
    description: program.description,
    status: program.status || SystemStatus.ACTIVE,
    campusName: program.campusName,
    courseCount: program.courseCount,
    studentCount: program.studentCount,
    startDate: program.startDate,
    endDate: program.endDate,
    image: program.image
  }));

  // Map old handlers to new handlers
  const handleAction = (action: ProgramAction, program: ProgramData) => {
    switch (action) {
      case ProgramAction.VIEW:
        if (props.onView) props.onView(program);
        break;
      default:
        break;
    }
  };

  // Map old filter handlers to new handlers
  const handleFilterChange = (filters: ProgramFilter) => {
    if (props.onFilterChange) props.onFilterChange(filters);
  };

  return (
    <ProgramList
      programs={programs}
      userRole={UserRole.COORDINATOR}
      isLoading={props.isLoading}
      error={props.error}
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
 * Backward compatibility wrapper for SystemProgramCoursesList
 */
export const SystemProgramCoursesList = (props: any) => {
  // Map old props to new props
  const program: ProgramData = {
    id: props.program.id,
    name: props.program.name,
    code: props.program.code,
    status: props.program.status || SystemStatus.ACTIVE,
    institutionName: props.program.institutionName,
    campusName: props.program.campusName
  };

  // Map old courses to new courses
  const courses: CourseInProgram[] = props.courses.map((course: any) => ({
    id: course.id,
    name: course.name,
    code: course.code,
    description: course.description,
    subjectId: course.subjectId,
    subjectName: course.subjectName,
    classCount: course.classCount,
    studentCount: course.studentCount,
    status: course.status || SystemStatus.ACTIVE
  }));

  return (
    <ProgramCourseList
      program={program}
      courses={courses}
      userRole={UserRole.SYSTEM_ADMIN}
      isLoading={props.isLoading}
      error={props.error}
      onViewCourse={props.onViewCourse}
      onEditCourse={props.onEditCourse}
      onRemoveCourse={props.onRemoveCourse}
      onAddCourse={props.onAddCourse}
      className={props.className}
    />
  );
};

/**
 * Backward compatibility wrapper for CampusProgramCoursesList
 */
export const CampusProgramCoursesList = (props: any) => {
  // Map old props to new props
  const program: ProgramData = {
    id: props.program.id,
    name: props.program.name,
    code: props.program.code,
    status: props.program.status || SystemStatus.ACTIVE,
    campusName: props.program.campusName
  };

  // Map old courses to new courses
  const courses: CourseInProgram[] = props.courses.map((course: any) => ({
    id: course.id,
    name: course.name,
    code: course.code,
    description: course.description,
    subjectId: course.subjectId,
    subjectName: course.subjectName,
    classCount: course.classCount,
    studentCount: course.studentCount,
    status: course.status || SystemStatus.ACTIVE
  }));

  return (
    <ProgramCourseList
      program={program}
      courses={courses}
      userRole={UserRole.CAMPUS_ADMIN}
      isLoading={props.isLoading}
      error={props.error}
      onViewCourse={props.onViewCourse}
      onEditCourse={props.onEditCourse}
      onRemoveCourse={props.onRemoveCourse}
      onAddCourse={props.onAddCourse}
      className={props.className}
    />
  );
};

/**
 * Backward compatibility wrapper for CoordinatorProgramCoursesList
 */
export const CoordinatorProgramCoursesList = (props: any) => {
  // Map old props to new props
  const program: ProgramData = {
    id: props.program.id,
    name: props.program.name,
    code: props.program.code,
    status: props.program.status || SystemStatus.ACTIVE,
    campusName: props.program.campusName
  };

  // Map old courses to new courses
  const courses: CourseInProgram[] = props.courses.map((course: any) => ({
    id: course.id,
    name: course.name,
    code: course.code,
    description: course.description,
    subjectId: course.subjectId,
    subjectName: course.subjectName,
    classCount: course.classCount,
    studentCount: course.studentCount,
    status: course.status || SystemStatus.ACTIVE
  }));

  return (
    <ProgramCourseList
      program={program}
      courses={courses}
      userRole={UserRole.COORDINATOR}
      isLoading={props.isLoading}
      error={props.error}
      onViewCourse={props.onViewCourse}
      className={props.className}
    />
  );
};
