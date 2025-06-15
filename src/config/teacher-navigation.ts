import { 
  Home, 
  Users, 
  Calendar, 
  BookOpen, 
  ClipboardList, 
  MessageSquare,
  Settings,
  FileText
} from "lucide-react";

export const teacherNavigationItems = [
  {
    title: 'Dashboard',
    path: '/teacher/dashboard',
    icon: Home,
    requiredRoles: ['CAMPUS_TEACHER']
  },
  {
    title: 'My Classes',
    path: '/teacher/classes',
    icon: Users,
    requiredRoles: ['CAMPUS_TEACHER']
  },
  {
    title: 'Schedule',
    path: '/teacher/schedule',
    icon: Calendar,
    requiredRoles: ['CAMPUS_TEACHER']
  },
  {
    title: 'Assessments',
    path: '/teacher/assessments',
    icon: ClipboardList,
    requiredRoles: ['CAMPUS_TEACHER']
  },
  {
    title: 'Resources',
    path: '/teacher/resources',
    icon: BookOpen,
    requiredRoles: ['CAMPUS_TEACHER']
  },
  {
    title: 'Communications',
    path: '/teacher/communications',
    icon: MessageSquare,
    requiredRoles: ['CAMPUS_TEACHER']
  },
  {
    title: 'Reports',
    path: '/teacher/reports',
    icon: FileText,
    requiredRoles: ['CAMPUS_TEACHER']
  },
  {
    title: 'Settings',
    path: '/teacher/settings',
    icon: Settings,
    requiredRoles: ['CAMPUS_TEACHER']
  }
];