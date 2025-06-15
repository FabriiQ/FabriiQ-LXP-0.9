import React from 'react';
import { Sidebar } from '../ui/navigation/sidebar';
import {
  LayoutGrid,
  Users,
  BookOpen,
  Calendar,
  BarChart,
  Settings,
  School,
  GraduationCap
} from 'lucide-react';

interface PrincipalLayoutProps {
  children: React.ReactNode;
}

export const PrincipalLayout: React.FC<PrincipalLayoutProps> = ({ children }) => {
  const sidebarItems = [
    {
      title: 'Dashboard',
      icon: <LayoutGrid className="h-5 w-5" />,
      path: '/principal/dashboard',
      requiredRoles: ['PRINCIPAL', 'CAMPUS_ADMIN'],
    },
    {
      title: 'Teachers',
      icon: <Users className="h-5 w-5" />,
      path: '/principal/teachers',
      requiredRoles: ['PRINCIPAL', 'CAMPUS_ADMIN'],
    },
    {
      title: 'Students',
      icon: <GraduationCap className="h-5 w-5" />,
      path: '/principal/students',
      requiredRoles: ['PRINCIPAL', 'CAMPUS_ADMIN'],
    },
    {
      title: 'Courses',
      icon: <BookOpen className="h-5 w-5" />,
      path: '/principal/courses',
      requiredRoles: ['PRINCIPAL', 'CAMPUS_ADMIN'],
    },
    {
      title: 'Classes',
      icon: <School className="h-5 w-5" />,
      path: '/principal/classes',
      requiredRoles: ['PRINCIPAL', 'CAMPUS_ADMIN'],
    },
    {
      title: 'Schedule',
      icon: <Calendar className="h-5 w-5" />,
      path: '/principal/schedule',
      requiredRoles: ['PRINCIPAL', 'CAMPUS_ADMIN'],
    },
    {
      title: 'Performance',
      icon: <BarChart className="h-5 w-5" />,
      path: '/principal/performance/dashboard',
      requiredRoles: ['PRINCIPAL', 'CAMPUS_ADMIN'],
    },
    {
      title: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      path: '/principal/settings',
      requiredRoles: ['PRINCIPAL', 'CAMPUS_ADMIN'],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={sidebarItems} userType="Principal" userName="Principal" />
      <div className="flex-1 overflow-auto">
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};
