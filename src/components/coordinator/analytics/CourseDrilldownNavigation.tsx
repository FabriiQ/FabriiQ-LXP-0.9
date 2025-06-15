'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useToast } from '@/components/ui/use-toast';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
// import { api } from '@/trpc/react'; // Commented out until API endpoints are implemented
import {
  ChevronRight,
  Home,
  School,
  BookOpen,
  Users
} from 'lucide-react';
import {
  RefreshCw as RotateCw,
  ArrowLeft as ArrowLeftIcon
} from '@/components/ui/icons/custom-icons';
import { useRouter, usePathname } from 'next/navigation';

interface CourseDrilldownNavigationProps {
  initialLevel?: 'program' | 'course' | 'class';
  programId?: string;
  programName?: string;
  courseId?: string;
  courseName?: string;
  classId?: string;
  className?: string;
  campusId?: string;
  campusName?: string;
  onNavigate?: (level: string, id: string, name: string) => void;
}

interface NavigationItem {
  id: string;
  name: string;
  type: 'program' | 'course' | 'class';
  parentId?: string;
  campusId?: string;
}

// Mock data for development
const getMockPrograms = (): NavigationItem[] => {
  return [
    { id: 'program-1', name: 'Science Program', type: 'program', campusId: 'campus-1' },
    { id: 'program-2', name: 'Mathematics Program', type: 'program', campusId: 'campus-1' },
    { id: 'program-3', name: 'Language Arts Program', type: 'program', campusId: 'campus-1' }
  ];
};

const getMockCourses = (): NavigationItem[] => {
  return [
    { id: 'course-1', name: 'Biology 101', type: 'course', parentId: 'program-1', campusId: 'campus-1' },
    { id: 'course-2', name: 'Chemistry 101', type: 'course', parentId: 'program-1', campusId: 'campus-1' },
    { id: 'course-3', name: 'Physics 101', type: 'course', parentId: 'program-1', campusId: 'campus-1' }
  ];
};

const getMockClasses = (): NavigationItem[] => {
  return [
    { id: 'class-1', name: 'Biology 101-A', type: 'class', parentId: 'course-1', campusId: 'campus-1' },
    { id: 'class-2', name: 'Biology 101-B', type: 'class', parentId: 'course-1', campusId: 'campus-1' },
    { id: 'class-3', name: 'Biology 101-C', type: 'class', parentId: 'course-1', campusId: 'campus-1' }
  ];
};

/**
 * CourseDrilldownNavigation Component
 *
 * Provides intuitive drill-down navigation from program to course to class
 * with breadcrumb navigation for context awareness.
 */
export function CourseDrilldownNavigation({
  initialLevel = 'program',
  programId,
  programName,
  courseId,
  courseName,
  classId,
  className,
  campusId,
  campusName,
  onNavigate
}: CourseDrilldownNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<'program' | 'course' | 'class'>(initialLevel);
  const [currentId, setCurrentId] = useState<string>('');
  const [currentName, setCurrentName] = useState<string>('');
  const [navigationHistory, setNavigationHistory] = useState<NavigationItem[]>([]);
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Offline storage hooks
  const {
    isOnline,
    getData: getOfflineData,
    saveData: saveOfflineData,
    sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Initialize current state based on props
  useEffect(() => {
    if (initialLevel === 'program' && programId) {
      setCurrentId(programId);
      setCurrentName(programName || 'Program');
    } else if (initialLevel === 'course' && courseId) {
      setCurrentId(courseId);
      setCurrentName(courseName || 'Course');
    } else if (initialLevel === 'class' && classId) {
      setCurrentId(classId);
      setCurrentName(className || 'Class');
    }

    // Initialize navigation history
    const history: NavigationItem[] = [];

    if (programId && programName) {
      history.push({
        id: programId,
        name: programName,
        type: 'program',
        campusId: campusId
      });

      if (courseId && courseName) {
        history.push({
          id: courseId,
          name: courseName,
          type: 'course',
          parentId: programId,
          campusId: campusId
        });

        if (classId && className) {
          history.push({
            id: classId,
            name: className,
            type: 'class',
            parentId: courseId,
            campusId: campusId
          });
        }
      }
    }

    setNavigationHistory(history);
  }, [initialLevel, programId, programName, courseId, courseName, classId, className, campusId]);

  // Fetch programs when at program level
  // Note: Using mock data since the API endpoint doesn't exist yet
  const {
    data: programsData,
    isLoading: isLoadingPrograms,
    refetch: refetchPrograms
  } = {
    data: getMockPrograms(),
    isLoading: false,
    refetch: async () => ({ data: getMockPrograms() })
  };

  // Fetch courses when at course level
  // Note: Using mock data since the API endpoint doesn't exist yet
  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    refetch: refetchCourses
  } = {
    data: getMockCourses(),
    isLoading: false,
    refetch: async () => ({ data: getMockCourses() })
  };

  // Fetch classes when at class level
  // Note: Using mock data since the API endpoint doesn't exist yet
  const {
    data: classesData,
    isLoading: isLoadingClasses,
    refetch: refetchClasses
  } = {
    data: getMockClasses(),
    isLoading: false,
    refetch: async () => ({ data: getMockClasses() })
  };

  // Load data based on current level
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        if (currentLevel === 'program') {
          if (currentId) {
            // Load courses for the selected program
            if (isOnline && coursesData) {
              setItems(coursesData.map(course => ({
                id: course.id,
                name: course.name,
                type: 'course' as const,
                parentId: currentId,
                campusId: campusId
              })));
            } else {
              // Try to get from offline storage
              const offlineData = await getOfflineData('courses', currentId);
              if (offlineData) {
                setItems(offlineData.map((course: any) => ({
                  id: course.id,
                  name: course.name,
                  type: 'course' as const,
                  parentId: currentId,
                  campusId: campusId
                })));
              } else {
                // Mock data if nothing available
                setItems(getMockCourses());
              }
            }
          } else {
            // Load all programs
            if (isOnline && programsData) {
              setItems(programsData.map(program => ({
                id: program.id,
                name: program.name,
                type: 'program' as const,
                campusId: campusId
              })));
            } else {
              // Try to get from offline storage
              const offlineData = await getOfflineData('programs', 'navigation');
              if (offlineData) {
                setItems(offlineData.map((program: any) => ({
                  id: program.id,
                  name: program.name,
                  type: 'program' as const,
                  campusId: campusId
                })));
              } else {
                // Mock data if nothing available
                setItems(getMockPrograms());
              }
            }
          }
        } else if (currentLevel === 'course') {
          // Load classes for the selected course
          if (isOnline && classesData) {
            setItems(classesData.map(cls => ({
              id: cls.id,
              name: cls.name,
              type: 'class' as const,
              parentId: currentId,
              campusId: campusId
            })));
          } else {
            // Try to get from offline storage
            const offlineData = await getOfflineData('classes', currentId);
            if (offlineData) {
              setItems(offlineData.map((cls: any) => ({
                id: cls.id,
                name: cls.name,
                type: 'class' as const,
                parentId: currentId,
                campusId: campusId
              })));
            } else {
              // Mock data if nothing available
              setItems(getMockClasses());
            }
          }
        } else {
          // At class level, no items to show
          setItems([]);
        }
      } catch (error) {
        console.error('Error loading navigation data:', error);

        // Use mock data as fallback
        if (currentLevel === 'program') {
          setItems(currentId ? getMockCourses() : getMockPrograms());
        } else if (currentLevel === 'course') {
          setItems(getMockClasses());
        } else {
          setItems([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentLevel, currentId, isOnline, programsData, coursesData, classesData, campusId]);



  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      if (isOnline) {
        if (currentLevel === 'program') {
          if (currentId) {
            await refetchCourses();
          } else {
            await refetchPrograms();
          }
        } else if (currentLevel === 'course') {
          await refetchClasses();
        }
      } else {
        toast({
          title: 'Offline Mode',
          description: 'You are currently offline. Data cannot be refreshed.',
          variant: 'warning',
        });
      }
    } catch (error) {
      console.error('Error refreshing navigation data:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh navigation data. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle navigation
  const handleNavigate = (item: NavigationItem) => {
    // Update current level and ID
    setCurrentLevel(item.type);
    setCurrentId(item.id);
    setCurrentName(item.name);

    // Update navigation history
    let newHistory = [...navigationHistory];

    if (item.type === 'program') {
      // Reset history and start with this program
      newHistory = [item];
    } else if (item.type === 'course') {
      // Find the program in history or use the current one
      const programIndex = newHistory.findIndex(h => h.type === 'program');
      if (programIndex >= 0) {
        // Keep the program and add this course
        newHistory = [
          newHistory[programIndex],
          item
        ];
      } else {
        // Just add this course
        newHistory.push(item);
      }
    } else if (item.type === 'class') {
      // Find program and course in history
      const programIndex = newHistory.findIndex(h => h.type === 'program');
      const courseIndex = newHistory.findIndex(h => h.type === 'course');

      if (programIndex >= 0 && courseIndex >= 0) {
        // Keep program and course, add this class
        newHistory = [
          newHistory[programIndex],
          newHistory[courseIndex],
          item
        ];
      } else if (courseIndex >= 0) {
        // Keep course and add this class
        newHistory = [
          newHistory[courseIndex],
          item
        ];
      } else {
        // Just add this class
        newHistory.push(item);
      }
    }

    setNavigationHistory(newHistory);

    // Call the onNavigate callback if provided
    if (onNavigate) {
      onNavigate(item.type, item.id, item.name);
    }

    // Navigate to the appropriate page
    if (item.type === 'program') {
      router.push(`/admin/coordinator/programs/${item.id}/analytics`);
    } else if (item.type === 'course') {
      router.push(`/admin/coordinator/courses/${item.id}/analytics`);
    } else if (item.type === 'class') {
      router.push(`/admin/coordinator/classes/${item.id}/analytics`);
    }
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (item: NavigationItem) => {
    handleNavigate(item);
  };

  // Handle back navigation
  const handleBack = () => {
    if (navigationHistory.length <= 1) {
      // If at the top level, go to the dashboard
      router.push('/admin/coordinator');
      return;
    }

    // Go back one level
    const newHistory = [...navigationHistory];
    newHistory.pop();
    const previousItem = newHistory[newHistory.length - 1];

    if (previousItem) {
      setCurrentLevel(previousItem.type);
      setCurrentId(previousItem.id);
      setCurrentName(previousItem.name);
      setNavigationHistory(newHistory);

      // Call the onNavigate callback if provided
      if (onNavigate) {
        onNavigate(previousItem.type, previousItem.id, previousItem.name);
      }

      // Navigate to the appropriate page
      if (previousItem.type === 'program') {
        router.push(`/admin/coordinator/programs/${previousItem.id}/analytics`);
      } else if (previousItem.type === 'course') {
        router.push(`/admin/coordinator/courses/${previousItem.id}/analytics`);
      } else if (previousItem.type === 'class') {
        router.push(`/admin/coordinator/classes/${previousItem.id}/analytics`);
      }
    }
  };

  // Get icon for navigation item
  const getItemIcon = (type: string) => {
    if (type === 'program') {
      return <School className="h-4 w-4 mr-2" />;
    } else if (type === 'course') {
      return <BookOpen className="h-4 w-4 mr-2" />;
    } else {
      return <Users className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/coordinator">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>

            {navigationHistory.map((item, index) => (
              <BreadcrumbItem key={item.id}>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleBreadcrumbClick(item);
                  }}
                  className={index === navigationHistory.length - 1 ? 'font-medium' : ''}
                >
                  {item.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={navigationHistory.length <= 1}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !isOnline}
          >
            <RotateCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <h3 className="text-lg font-medium">No items found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
              {currentLevel === 'program'
                ? 'No programs available'
                : currentLevel === 'course'
                  ? 'No courses available for this program'
                  : 'No classes available for this course'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleNavigate(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getItemIcon(item.type)}
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
