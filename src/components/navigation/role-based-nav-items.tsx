import {
  Home,
  Users,
  Settings,
  BookOpen,
  Calendar,
  BarChart,
  Building,
  Layers,
  School,
  Map,
  GraduationCap,
  ClipboardList,
  FileText,
  Bell,
  User,
  UserPlus,
  UserCog,
  Book,
  Briefcase,
  Clock,
  Database,
  ArrowRightLeft,
  DollarSign,
  Trophy,
  Award
} from 'lucide-react';
import { UserType } from '@prisma/client';

export interface NavItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
  requiredRoles?: UserType[];
  children?: NavItem[];
}

/**
 * Navigation items for the System Admin role
 */
export const systemAdminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/admin/system',
    icon: <Home className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Institutions',
    path: '/admin/system/institutions',
    icon: <Building className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Campuses',
    path: '/admin/system/campuses',
    icon: <School className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Users',
    path: '/admin/system/users',
    icon: <Users className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Teachers',
    path: '/admin/system/teachers',
    icon: <Users className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Background Jobs',
    path: '/admin/system/background-jobs',
    icon: <Clock className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Students',
    path: '/admin/system/students',
    icon: <Users className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Programs',
    path: '/admin/system/programs',
    icon: <GraduationCap className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Courses',
    path: '/admin/system/courses',
    icon: <BookOpen className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Classes',
    path: '/admin/system/classes',
    icon: <BookOpen className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Subjects',
    path: '/admin/system/subjects',
    icon: <Book className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Academic Cycles',
    path: '/admin/system/academic-cycles',
    icon: <Clock className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Assessments',
    path: '/admin/system/assessments',
    icon: <ClipboardList className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Question Bank',
    path: '/admin/academic/question-bank',
    icon: <Database className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Calendar',
    path: '/admin/system/calendar',
    icon: <Calendar className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Permissions',
    path: '/admin/system/permissions',
    icon: <Layers className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Reports',
    path: '/admin/system/reports',
    icon: <BarChart className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Settings',
    path: '/admin/system/settings',
    icon: <Settings className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Utilities',
    path: '/admin/utils',
    icon: <Settings className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Enrollment',
    path: '/admin/system/enrollment',
    icon: <UserPlus className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  },
  {
    title: 'Fee Management',
    path: '/admin/system/fee-management',
    icon: <DollarSign className="h-5 w-5" />,
    requiredRoles: ['SYSTEM_ADMIN']
  }
];

/**
 * Navigation items for the Campus Admin role
 */
export const campusAdminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/admin/campus',
    icon: <Home className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Teachers',
    path: '/admin/campus/teachers',
    icon: <Users className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Coordinators',
    path: '/admin/campus/coordinators',
    icon: <UserCog className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Students',
    path: '/admin/campus/students',
    icon: <Users className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Classes',
    path: '/admin/campus/classes',
    icon: <BookOpen className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Programs',
    path: '/admin/campus/programs',
    icon: <GraduationCap className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Courses',
    path: '/admin/campus/courses',
    icon: <BookOpen className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Attendance',
    path: '/admin/campus/attendance',
    icon: <ClipboardList className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Question Bank',
    path: '/admin/academic/question-bank',
    icon: <Database className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Enrollment',
    path: '/admin/campus/enrollment',
    icon: <UserPlus className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Transfers',
    path: '/admin/campus/transfers',
    icon: <ArrowRightLeft className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Facilities',
    path: '/admin/campus/facilities',
    icon: <Map className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Reports',
    path: '/admin/campus/reports',
    icon: <BarChart className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Settings',
    path: '/admin/campus/settings',
    icon: <Settings className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  },
  {
    title: 'Utilities',
    path: '/admin/utils',
    icon: <Settings className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_ADMIN', 'SYSTEM_ADMIN']
  }
];

/**
 * Navigation items for the Campus Coordinator role
 */
export const campusCoordinatorNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/admin/coordinator',
    icon: <Home className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
  },
  {
    title: 'Teachers',
    path: '/admin/coordinator/teachers',
    icon: <Users className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN'],
    children: [
      {
        title: 'All Teachers',
        path: '/admin/coordinator/teachers',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      },
      {
        title: 'Assignments',
        path: '/admin/coordinator/teachers/assignments',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      },
      {
        title: 'Performance',
        path: '/admin/coordinator/teachers/performance',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      }
    ]
  },
  {
    title: 'Students',
    path: '/admin/coordinator/students',
    icon: <Users className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
  },
  {
    title: 'Classes',
    path: '/admin/coordinator/classes',
    icon: <BookOpen className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
  },
  {
    title: 'Programs',
    path: '/admin/coordinator/programs',
    icon: <GraduationCap className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
  },
  {
    title: 'Courses & Subjects',
    path: '/admin/coordinator/courses',
    icon: <BookOpen className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
  },
  {
    title: 'Attendance',
    path: '/admin/coordinator/attendance',
    icon: <ClipboardList className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN'],
    children: [
      {
        title: 'By Class',
        path: '/admin/coordinator/attendance/by-class',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      },
      {
        title: 'By Student',
        path: '/admin/coordinator/attendance/by-student',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      },
      {
        title: 'Analytics',
        path: '/admin/coordinator/attendance/analytics',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      }
    ]
  },
  {
    title: 'Assessments',
    path: '/admin/coordinator/assessments',
    icon: <FileText className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN'],
    children: [
      {
        title: 'Create Assessment',
        path: '/admin/coordinator/assessments/create',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      },
      {
        title: 'Manage Assessments',
        path: '/admin/coordinator/assessments/manage',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      },
      {
        title: 'Results',
        path: '/admin/coordinator/assessments/results',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      }
    ]
  },
  {
    title: 'Question Bank',
    path: '/admin/academic/question-bank',
    icon: <Database className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
  },
  {
    title: 'Analytics',
    path: '/admin/coordinator/analytics',
    icon: <BarChart className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN'],
    children: [
      {
        title: 'Class Performance',
        path: '/admin/coordinator/analytics/class',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      },
      {
        title: 'Course Performance',
        path: '/admin/coordinator/analytics/course',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      },
      {
        title: 'Teacher Performance',
        path: '/admin/coordinator/analytics/teacher',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      },
      {
        title: 'Student Performance',
        path: '/admin/coordinator/analytics/student',
        requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
      }
    ]
  },
  {
    title: 'Schedules',
    path: '/admin/coordinator/schedules',
    icon: <Clock className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
  },
  {
    title: 'Lesson Plans',
    path: '/admin/coordinator/lesson-plans',
    icon: <FileText className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
  },
  {
    title: 'Transfers',
    path: '/admin/coordinator/transfers',
    icon: <ArrowRightLeft className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_COORDINATOR', 'COORDINATOR', 'SYSTEM_ADMIN']
  }
];

/**
 * Navigation items for the Campus Principal role
 */
export const campusPrincipalNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/admin/principal',
    icon: <Home className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN']
  },
  {
    title: 'Teacher Leaderboard',
    path: '/admin/principal/teacher-leaderboard',
    icon: <Trophy className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN']
  },
  {
    title: 'Student Leaderboard',
    path: '/admin/principal/student-leaderboard',
    icon: <Award className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN']
  },
  {
    title: 'Analytics',
    path: '/admin/principal/analytics',
    icon: <BarChart className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN'],
    children: [
      {
        title: 'Programs',
        path: '/admin/principal/analytics/programs',
        requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN']
      },
      {
        title: 'Courses',
        path: '/admin/principal/analytics/courses',
        requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN']
      },
      {
        title: 'Teachers',
        path: '/admin/principal/analytics/teachers',
        requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN']
      },
      {
        title: 'Students',
        path: '/admin/principal/analytics/students',
        requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN']
      }
    ]
  },
  {
    title: 'Reports',
    path: '/admin/principal/reports',
    icon: <FileText className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN']
  },
  {
    title: 'Settings',
    path: '/admin/principal/settings',
    icon: <Settings className="h-5 w-5" />,
    requiredRoles: ['CAMPUS_PRINCIPAL', 'SYSTEM_ADMIN']
  }
];

/**
 * Get navigation items based on user role
 */
export function getNavItemsByRole(userType: UserType): NavItem[] {
  switch (userType) {
    case 'SYSTEM_ADMIN':
      return systemAdminNavItems;
    case 'CAMPUS_ADMIN':
      return campusAdminNavItems;
    case 'CAMPUS_COORDINATOR':
    case 'COORDINATOR':
      return campusCoordinatorNavItems;
    case 'CAMPUS_PRINCIPAL':
      return campusPrincipalNavItems;
    default:
      return [];
  }
}