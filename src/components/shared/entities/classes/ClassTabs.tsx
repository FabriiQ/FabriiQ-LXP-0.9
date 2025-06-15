'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { UserRole, ClassData } from './types';
import { 
  Home, 
  Users, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  BarChart, 
  Settings,
  Clock
} from 'lucide-react';

export interface ClassTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content?: React.ReactNode;
  roles: UserRole[];
}

export interface ClassTabsProps {
  /**
   * Class data
   */
  classData: ClassData;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Array of enabled tabs
   * @default []
   */
  enabledTabs?: string[];
  
  /**
   * Currently active tab
   */
  activeTab?: string;
  
  /**
   * Tab change callback
   */
  onTabChange?: (tabId: string) => void;
  
  /**
   * Custom tabs to add to the default tabs
   * @default []
   */
  customTabs?: ClassTab[];
  
  /**
   * Children to render in the tab content
   */
  children?: React.ReactNode;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * ClassTabs component with mobile-first design
 * 
 * Features:
 * - Role-specific tab visibility
 * - Mobile-friendly tab navigation
 * - Tab change animations
 * 
 * @example
 * ```tsx
 * <ClassTabs 
 *   classData={classData}
 *   userRole={UserRole.TEACHER}
 *   enabledTabs={['overview', 'students', 'attendance']}
 *   activeTab="overview"
 *   onTabChange={handleTabChange}
 * >
 *   <TabsContent value="overview">Overview content</TabsContent>
 *   <TabsContent value="students">Students content</TabsContent>
 *   <TabsContent value="attendance">Attendance content</TabsContent>
 * </ClassTabs>
 * ```
 */
export const ClassTabs: React.FC<ClassTabsProps> = ({
  classData,
  userRole,
  enabledTabs = [],
  activeTab,
  onTabChange,
  customTabs = [],
  children,
  className,
}) => {
  // Default tabs configuration
  const defaultTabs: ClassTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Home className="h-4 w-4" />,
      roles: [
        UserRole.SYSTEM_ADMIN, 
        UserRole.CAMPUS_ADMIN, 
        UserRole.COORDINATOR, 
        UserRole.TEACHER, 
        UserRole.STUDENT
      ],
    },
    {
      id: 'students',
      label: 'Students',
      icon: <Users className="h-4 w-4" />,
      roles: [
        UserRole.SYSTEM_ADMIN, 
        UserRole.CAMPUS_ADMIN, 
        UserRole.COORDINATOR, 
        UserRole.TEACHER
      ],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: <Calendar className="h-4 w-4" />,
      roles: [
        UserRole.SYSTEM_ADMIN, 
        UserRole.CAMPUS_ADMIN, 
        UserRole.COORDINATOR, 
        UserRole.TEACHER, 
        UserRole.STUDENT
      ],
    },
    {
      id: 'assessments',
      label: 'Assessments',
      icon: <GraduationCap className="h-4 w-4" />,
      roles: [
        UserRole.SYSTEM_ADMIN, 
        UserRole.CAMPUS_ADMIN, 
        UserRole.COORDINATOR, 
        UserRole.TEACHER, 
        UserRole.STUDENT
      ],
    },
    {
      id: 'content',
      label: 'Content',
      icon: <BookOpen className="h-4 w-4" />,
      roles: [
        UserRole.SYSTEM_ADMIN, 
        UserRole.CAMPUS_ADMIN, 
        UserRole.COORDINATOR, 
        UserRole.TEACHER, 
        UserRole.STUDENT
      ],
    },
    {
      id: 'gradebook',
      label: 'Gradebook',
      icon: <BarChart className="h-4 w-4" />,
      roles: [
        UserRole.SYSTEM_ADMIN, 
        UserRole.CAMPUS_ADMIN, 
        UserRole.COORDINATOR, 
        UserRole.TEACHER, 
        UserRole.STUDENT
      ],
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: <Clock className="h-4 w-4" />,
      roles: [
        UserRole.SYSTEM_ADMIN, 
        UserRole.CAMPUS_ADMIN, 
        UserRole.COORDINATOR, 
        UserRole.TEACHER, 
        UserRole.STUDENT
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      roles: [
        UserRole.SYSTEM_ADMIN, 
        UserRole.CAMPUS_ADMIN, 
        UserRole.COORDINATOR, 
        UserRole.TEACHER
      ],
    },
  ];
  
  // Combine default and custom tabs
  const allTabs = [...defaultTabs, ...customTabs];
  
  // Filter tabs based on user role and enabled tabs
  const visibleTabs = allTabs.filter(tab => {
    // Check if tab is enabled
    const isEnabled = enabledTabs.length === 0 || enabledTabs.includes(tab.id);
    
    // Check if user has permission to see this tab
    const hasPermission = tab.roles.includes(userRole);
    
    return isEnabled && hasPermission;
  });
  
  // State for current tab
  const [currentTab, setCurrentTab] = useState<string>(
    activeTab || (visibleTabs.length > 0 ? visibleTabs[0].id : '')
  );
  
  // Update current tab when activeTab prop changes
  useEffect(() => {
    if (activeTab && visibleTabs.some(tab => tab.id === activeTab)) {
      setCurrentTab(activeTab);
    }
  }, [activeTab, visibleTabs]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    if (onTabChange) {
      onTabChange(value);
    }
  };
  
  // If no tabs are visible, return null
  if (visibleTabs.length === 0) {
    return null;
  }
  
  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className={cn("w-full", className)}
    >
      <div className="border-b overflow-x-auto">
        <TabsList className="h-10 bg-transparent p-0">
          {visibleTabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center gap-2 h-10 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none",
                "text-sm font-medium transition-all hover:text-primary data-[state=active]:text-primary"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      
      {/* Render children if provided */}
      {children}
      
      {/* Render tab content if provided in tabs */}
      {visibleTabs.map(tab => tab.content && (
        <TabsContent key={tab.id} value={tab.id} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ClassTabs;
