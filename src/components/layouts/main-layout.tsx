'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/ui/navigation/sidebar';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/navigation/breadcrumbs';
import { UserMenu } from '@/components/ui/user-menu';
import { Home, Users, BookOpen, Calendar, Settings, FileText } from 'lucide-react';
import { isFeatureEnabled } from '@/lib/feature-flags';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Debug feature flag
  console.log('ENABLE_WORKSHEETS feature flag:', isFeatureEnabled('ENABLE_WORKSHEETS'));

  // Define sidebar navigation items with required properties
  const sidebarItems = [
    {
      title: 'Dashboard',
      path: '/teacher/dashboard',
      icon: <Home className="h-5 w-5" />,
      requiredRoles: ['TEACHER'],
    },
    {
      title: 'Students',
      path: '/teacher/students',
      icon: <Users className="h-5 w-5" />,
      requiredRoles: ['TEACHER'],
    },
    {
      title: 'Classes',
      path: '/teacher/classes',
      icon: <BookOpen className="h-5 w-5" />,
      requiredRoles: ['TEACHER'],
    },
    {
      title: 'Schedule',
      path: '/teacher/schedule',
      icon: <Calendar className="h-5 w-5" />,
      requiredRoles: ['TEACHER'],
    },
    // Only show worksheets if the feature is enabled
    ...(isFeatureEnabled('ENABLE_WORKSHEETS') ? [
      {
        title: 'Worksheets',
        path: '/worksheets',
        icon: <FileText className="h-5 w-5" />,
        requiredRoles: ['TEACHER'],
      }
    ] : []),
    {
      title: 'Settings',
      path: '/teacher/settings',
      icon: <Settings className="h-5 w-5" />,
      requiredRoles: ['TEACHER'],
    },
  ];

  // Generate breadcrumb items based on current path
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1),
      href: index < paths.length - 1 ? `/${paths.slice(0, index + 1).join('/')}` : undefined,
      isCurrent: index === paths.length - 1,
    }));
  };

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please log in</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={sidebarItems}
        userType={session?.user?.userType}
        userName={session?.user?.name}
      />
      <main className="flex-1">
        <div className="flex items-center justify-between p-4">
          <Breadcrumbs
            items={getBreadcrumbItems()}
            showHomeIcon
            homeHref="/teacher/dashboard"
          />
          <UserMenu />
        </div>
        {children}
      </main>
    </div>
  );
}

