'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Search,
  User,
  BarChart as BarChartIcon,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Filter,
  SortAsc,
  SortDesc,
  Loader2, // Using Loader2 instead of RefreshCw
  Bell,
  Award, // Using Award instead of Star
  ArrowDown, // Using ArrowDown instead of Tag
  CheckCircle // Using CheckCircle instead of Sparkles
} from 'lucide-react';

export interface ClassData {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  teacher?: {
    id: string;
    name: string;
    avatar?: string;
  };
  schedule?: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  progress?: number;
  activitiesCount?: number;
  pendingActivitiesCount?: number;
  attendanceRate?: number;
  averageGrade?: string;
  // New fields for enhanced UX
  lastActivity?: Date;
  importance?: 'high' | 'medium' | 'low';
  hasLimitedTimeActivities?: boolean;
  limitedTimeActivitiesCount?: number;
  nextDeadline?: Date | null;
  isNewTerm?: boolean;
}

export interface StudentClassListProps {
  classes: ClassData[];
  isLoading?: boolean;
  error?: string;
  className?: string;
  // New props for enhanced UX
  defaultSortBy?: 'name' | 'lastActivity' | 'importance' | 'deadline' | 'progress';
  defaultSortOrder?: 'asc' | 'desc';
  showFilters?: boolean;
  showSearch?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * StudentClassList component with mobile-first design
 *
 * Features:
 * - Grid view of classes
 * - Search functionality
 * - Class cards with progress indicators
 * - Loading and error states
 *
 * @example
 * ```tsx
 * <StudentClassList
 *   classes={classes}
 * />
 * ```
 */
export const StudentClassList: React.FC<StudentClassListProps> = ({
  classes,
  isLoading = false,
  error,
  className,
  defaultSortBy = 'lastActivity',
  defaultSortOrder = 'desc',
  showFilters = true,
  showSearch = true,
  onRefresh,
  isRefreshing = false,
}) => {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState({
    hasActivities: false,
    hasPendingActivities: false,
    hasLimitedTimeActivities: false,
    isNewTerm: false
  });

  // Animation states
  const [animatedItems, setAnimatedItems] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);

  // Generate search suggestions based on class data
  useEffect(() => {
    if (searchTerm.length > 0) {
      const suggestions: string[] = [];

      // Add subject names
      classes.forEach(cls => {
        if (cls.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !suggestions.includes(cls.subject.name)) {
          suggestions.push(cls.subject.name);
        }
      });

      // Add teacher names
      classes.forEach(cls => {
        if (cls.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !suggestions.includes(cls.teacher.name)) {
          suggestions.push(cls.teacher.name);
        }
      });

      // Limit to 5 suggestions
      setSearchSuggestions(suggestions.slice(0, 5));
    } else {
      setSearchSuggestions([]);
    }
  }, [searchTerm, classes]);

  // Trigger staggered animations after component mounts
  useEffect(() => {
    if (!isLoading) {
      // Stagger the animations for each card
      classes.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedItems(prev => ({ ...prev, [`card-${index}`]: true }));
        }, 150 * index); // 150ms stagger
      });
    }
  }, [isLoading, classes]);

  // Filter classes based on search term and filters
  const filteredClasses = classes.filter(cls => {
    // Search filter
    const matchesSearch =
      searchTerm === '' ||
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Other filters
    const matchesFilters =
      (!filters.hasActivities || (cls.activitiesCount && cls.activitiesCount > 0)) &&
      (!filters.hasPendingActivities || (cls.pendingActivitiesCount && cls.pendingActivitiesCount > 0)) &&
      (!filters.hasLimitedTimeActivities || cls.hasLimitedTimeActivities) &&
      (!filters.isNewTerm || cls.isNewTerm);

    return matchesSearch && matchesFilters;
  });

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format time (e.g., "09:00" to "9:00 AM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Format date relative to now (e.g., "2 days ago", "in 3 days")
  const formatRelativeDate = (date: Date | null | undefined) => {
    if (!date) return 'No date';

    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  // Sort classes based on current sort settings
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    const direction = sortOrder === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'name':
        return direction * a.name.localeCompare(b.name);

      case 'lastActivity':
        // Default to oldest date if lastActivity is not available
        const dateA = a.lastActivity || new Date(0);
        const dateB = b.lastActivity || new Date(0);
        return direction * (dateA.getTime() - dateB.getTime());

      case 'importance':
        // Convert importance to numeric value for sorting
        const importanceMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const importanceA = importanceMap[a.importance || 'low'] || 0;
        const importanceB = importanceMap[b.importance || 'low'] || 0;
        return direction * (importanceA - importanceB);

      case 'deadline':
        // Classes with deadlines come first, then sort by deadline date
        const hasDeadlineA = a.nextDeadline !== null && a.nextDeadline !== undefined;
        const hasDeadlineB = b.nextDeadline !== null && b.nextDeadline !== undefined;

        if (hasDeadlineA && !hasDeadlineB) return -1 * direction;
        if (!hasDeadlineA && hasDeadlineB) return 1 * direction;
        if (!hasDeadlineA && !hasDeadlineB) return 0;

        return direction * ((a.nextDeadline as Date).getTime() - (b.nextDeadline as Date).getTime());

      case 'progress':
        const progressA = a.progress || 0;
        const progressB = b.progress || 0;
        return direction * (progressA - progressB);

      default:
        return 0;
    }
  });

  // Apply Serial Position Effect - important classes at beginning and end
  const applySerialPositionEffect = (classes: ClassData[]) => {
    if (classes.length <= 3) return classes;

    // Get high importance classes
    const highImportanceClasses = classes.filter(cls => cls.importance === 'high');

    // If no high importance classes, return original array
    if (highImportanceClasses.length === 0) return classes;

    // Remove high importance classes from the original array
    const otherClasses = classes.filter(cls => cls.importance !== 'high');

    // If we have at least 2 high importance classes, put one at the beginning and one at the end
    if (highImportanceClasses.length >= 2) {
      return [
        highImportanceClasses[0],
        ...otherClasses,
        highImportanceClasses[highImportanceClasses.length - 1]
      ];
    }

    // If only one high importance class, put it at the beginning
    return [highImportanceClasses[0], ...otherClasses];
  };

  // Apply Serial Position Effect if not sorting by importance
  const displayClasses = sortBy === 'importance' ? sortedClasses : applySerialPositionEffect(sortedClasses);

  // Handle pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY.current || refreshing || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // Only trigger pull-to-refresh when scrolled to top and pulling down
    if (containerRef.current?.scrollTop === 0 && diff > 50) {
      setRefreshing(true);
    }
  };

  const handleTouchEnd = () => {
    if (refreshing && onRefresh) {
      onRefresh();

      // Reset after animation completes
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }

    startY.current = null;
  };

  // Toggle sort order or change sort field
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to descending for new sort field
    }
  };

  // If loading, show skeleton that matches final UI structure
  if (isLoading) {
    return (
      <div className={className} ref={containerRef}>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="w-full md:w-auto flex gap-2">
              <Skeleton className="h-10 w-full md:w-[250px]" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </div>

          {/* Filters skeleton */}
          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Skeleton className="h-8 w-24 rounded-full flex-shrink-0" />
              <Skeleton className="h-8 w-32 rounded-full flex-shrink-0" />
              <Skeleton className="h-8 w-28 rounded-full flex-shrink-0" />
              <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
            </div>
          )}

          {/* Cards skeleton with staggered animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-14 rounded-md" />
                      <Skeleton className="h-14 rounded-md" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Skeleton className="h-9 w-full rounded-md" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If error, show error message with helpful guidance
  if (error) {
    return (
      <div className={className} ref={containerRef}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Classes</h1>
              <p className="text-muted-foreground">
                View and manage your enrolled classes
              </p>
            </div>
          </div>

          <Card className="border-destructive/20">
            <CardContent className="py-10">
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <div className="absolute inset-0 bg-destructive/10 rounded-full animate-pulse"></div>
                  <AlertCircle className="h-16 w-16 text-destructive mx-auto relative z-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">Error Loading Classes</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">{error}</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  This might be due to a network issue or server maintenance.
                  You can try refreshing the page or try again later.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => window.location.reload()}
                    className="relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center">
                      <Loader2 className="mr-2 h-4 w-4" />
                      Refresh Page
                    </span>
                    <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onRefresh && onRefresh()}
                    className="relative overflow-hidden group"
                  >
                    <span className="relative z-10">Try Again</span>
                    <span className="absolute inset-0 bg-background/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative", className)}
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(refreshing || isRefreshing) && (
        <div className="absolute top-0 left-0 right-0 flex justify-center py-4 z-10">
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header with search and filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Classes</h1>
            <p className="text-muted-foreground">
              View and manage your enrolled classes
            </p>
          </div>
          <div className="w-full md:w-auto flex gap-2">
            {showSearch && (
              <div className="relative flex-1 md:flex-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search classes..."
                  className="pl-8 w-full md:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Search suggestions */}
                {searchSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg">
                    <ul className="py-1">
                      {searchSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => setSearchTerm(suggestion)}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {showFilters && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={cn(
                  "flex-shrink-0 relative",
                  showFiltersPanel && "bg-primary/10 border-primary/30"
                )}
                aria-label="Filter classes"
              >
                <Filter className="h-4 w-4" />
                {Object.values(filters).some(Boolean) && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
                )}
              </Button>
            )}

            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                className="flex-shrink-0"
                disabled={refreshing || isRefreshing}
                aria-label="Refresh classes"
              >
                <Loader2 className={cn("h-4 w-4", (refreshing || isRefreshing) && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>

        {/* Filters panel */}
        {showFiltersPanel && (
          <Card className="p-4 animate-in fade-in-50">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({
                    hasActivities: false,
                    hasPendingActivities: false,
                    hasLimitedTimeActivities: false,
                    isNewTerm: false
                  })}
                  className="h-8 px-2 text-xs"
                  disabled={!Object.values(filters).some(Boolean)}
                >
                  Reset
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasActivities"
                    checked={filters.hasActivities}
                    onChange={(e) => setFilters({...filters, hasActivities: e.target.checked})}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="hasActivities" className="text-sm">Has activities</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasPendingActivities"
                    checked={filters.hasPendingActivities}
                    onChange={(e) => setFilters({...filters, hasPendingActivities: e.target.checked})}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="hasPendingActivities" className="text-sm">Has pending activities</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasLimitedTimeActivities"
                    checked={filters.hasLimitedTimeActivities}
                    onChange={(e) => setFilters({...filters, hasLimitedTimeActivities: e.target.checked})}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="hasLimitedTimeActivities" className="text-sm">Has time-limited activities</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isNewTerm"
                    checked={filters.isNewTerm}
                    onChange={(e) => setFilters({...filters, isNewTerm: e.target.checked})}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isNewTerm" className="text-sm">New term classes</label>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Sort options */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={sortBy === 'lastActivity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('lastActivity')}
            className="flex items-center gap-1 rounded-full"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Recent</span>
            {sortBy === 'lastActivity' && (
              sortOrder === 'desc' ? <SortDesc className="h-3.5 w-3.5 ml-1" /> : <SortAsc className="h-3.5 w-3.5 ml-1" />
            )}
          </Button>

          <Button
            variant={sortBy === 'importance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('importance')}
            className="flex items-center gap-1 rounded-full"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Importance</span>
            {sortBy === 'importance' && (
              sortOrder === 'desc' ? <SortDesc className="h-3.5 w-3.5 ml-1" /> : <SortAsc className="h-3.5 w-3.5 ml-1" />
            )}
          </Button>

          <Button
            variant={sortBy === 'deadline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('deadline')}
            className="flex items-center gap-1 rounded-full"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Deadline</span>
            {sortBy === 'deadline' && (
              sortOrder === 'desc' ? <SortDesc className="h-3.5 w-3.5 ml-1" /> : <SortAsc className="h-3.5 w-3.5 ml-1" />
            )}
          </Button>

          <Button
            variant={sortBy === 'progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('progress')}
            className="flex items-center gap-1 rounded-full"
          >
            <BarChartIcon className="h-3.5 w-3.5" />
            <span>Progress</span>
            {sortBy === 'progress' && (
              sortOrder === 'desc' ? <SortDesc className="h-3.5 w-3.5 ml-1" /> : <SortAsc className="h-3.5 w-3.5 ml-1" />
            )}
          </Button>

          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('name')}
            className="flex items-center gap-1 rounded-full"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            <span>Name</span>
            {sortBy === 'name' && (
              sortOrder === 'desc' ? <SortDesc className="h-3.5 w-3.5 ml-1" /> : <SortAsc className="h-3.5 w-3.5 ml-1" />
            )}
          </Button>
        </div>

        {/* Classes grid with staggered animations */}
        {displayClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayClasses.map((cls, index) => (
              <Card
                key={cls.id}
                className={cn(
                  "overflow-hidden border transition-all duration-300 hover:shadow-md",
                  cls.importance === 'high' && "border-primary/30",
                  cls.isNewTerm && "border-blue-300/50",
                  animatedItems[`card-${index}`] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{
                  transitionDelay: `${index * 150}ms`,
                  transform: animatedItems[`card-${index}`] ? 'translateY(0)' : 'translateY(20px)'
                }}
              >
                {/* New Term Banner */}
                {cls.isNewTerm && (
                  <div className="bg-blue-500 text-white px-3 py-1 text-xs font-medium flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    New Term
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg group flex items-center">
                        {cls.name}
                        {cls.importance === 'high' && (
                          <Award className="h-4 w-4 ml-1 text-amber-500" />
                        )}
                      </CardTitle>
                      <CardDescription>{cls.subject.name}</CardDescription>
                    </div>
                    <div className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-full",
                      cls.importance === 'high' ? "bg-primary/20" : "bg-primary/10"
                    )}>
                      <BookOpen className={cn(
                        "h-5 w-5",
                        cls.importance === 'high' ? "text-primary" : "text-primary/80"
                      )} />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-2">
                  <div className="space-y-4">
                    {/* Teacher */}
                    {cls.teacher && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={cls.teacher.avatar} alt={cls.teacher.name} />
                            <AvatarFallback>{getInitials(cls.teacher.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{cls.teacher.name}</span>
                        </div>
                      </div>
                    )}

                    {/* Schedule */}
                    {cls.schedule && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {cls.schedule.days.join(', ')} • {formatTime(cls.schedule.startTime)} - {formatTime(cls.schedule.endTime)}
                        </span>
                      </div>
                    )}

                    {/* Last Activity */}
                    {cls.lastActivity && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          Last activity: {formatRelativeDate(cls.lastActivity)}
                        </span>
                      </div>
                    )}

                    {/* Progress */}
                    {cls.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{cls.progress}%</span>
                        </div>
                        <Progress
                          value={cls.progress}
                          className={cn(
                            "h-2",
                            cls.progress < 30 ? "bg-red-100" :
                            cls.progress < 70 ? "bg-amber-100" : "bg-green-100"
                          )}
                        />
                      </div>
                    )}

                    {/* Activities */}
                    {cls.activitiesCount !== undefined && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{cls.activitiesCount} Activities</span>
                        </div>
                        <div className="flex gap-1">
                          {cls.pendingActivitiesCount !== undefined && cls.pendingActivitiesCount > 0 && (
                            <Badge variant="warning" className="text-xs">
                              {cls.pendingActivitiesCount} Pending
                            </Badge>
                          )}
                          {cls.hasLimitedTimeActivities && (
                            <Badge variant="destructive" className="text-xs flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {cls.limitedTimeActivitiesCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deadline */}
                    {cls.nextDeadline && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">Next deadline</span>
                        </div>
                        <Badge
                          variant={
                            new Date(cls.nextDeadline).getTime() - new Date().getTime() < 86400000
                              ? "destructive"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {formatRelativeDate(cls.nextDeadline)}
                        </Badge>
                      </div>
                    )}

                    {/* Performance */}
                    <div className="grid grid-cols-2 gap-2">
                      {cls.attendanceRate !== undefined && (
                        <div className={cn(
                          "rounded-md p-2",
                          cls.attendanceRate >= 90 ? "bg-green-100 dark:bg-green-900/20" :
                          cls.attendanceRate >= 75 ? "bg-amber-100 dark:bg-amber-900/20" :
                          "bg-red-100 dark:bg-red-900/20"
                        )}>
                          <div className="text-xs text-muted-foreground mb-1">Attendance</div>
                          <div className="font-medium">{cls.attendanceRate}%</div>
                        </div>
                      )}
                      {cls.averageGrade !== undefined && (
                        <div className={cn(
                          "rounded-md p-2",
                          cls.averageGrade.startsWith('A') ? "bg-green-100 dark:bg-green-900/20" :
                          cls.averageGrade.startsWith('B') ? "bg-blue-100 dark:bg-blue-900/20" :
                          cls.averageGrade.startsWith('C') ? "bg-amber-100 dark:bg-amber-900/20" :
                          "bg-red-100 dark:bg-red-900/20"
                        )}>
                          <div className="text-xs text-muted-foreground mb-1">Grade</div>
                          <div className="font-medium">{cls.averageGrade}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full relative overflow-hidden group"
                    asChild
                  >
                    <ViewTransitionLink
                      href={`/student/class/${cls.id}/dashboard`}
                      hapticFeedback={true}
                      ariaLabel={`View ${cls.name}`}
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        View Class
                        <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </span>
                      <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                    </ViewTransitionLink>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <div className="absolute inset-0 bg-muted rounded-full"></div>
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto relative z-10" />
                </div>
                <h3 className="text-xl font-medium mb-2">No Classes Found</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  {searchTerm
                    ? `No classes matching "${searchTerm}"`
                    : Object.values(filters).some(Boolean)
                      ? "No classes match your current filters"
                      : "You are not enrolled in any classes yet"}
                </p>
                {(searchTerm || Object.values(filters).some(Boolean)) && (
                  <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                    {searchTerm && (
                      <Button
                        variant="outline"
                        onClick={() => setSearchTerm('')}
                        className="relative overflow-hidden group"
                      >
                        <span className="relative z-10">Clear Search</span>
                        <span className="absolute inset-0 bg-background/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                      </Button>
                    )}
                    {Object.values(filters).some(Boolean) && (
                      <Button
                        variant="outline"
                        onClick={() => setFilters({
                          hasActivities: false,
                          hasPendingActivities: false,
                          hasLimitedTimeActivities: false,
                          isNewTerm: false
                        })}
                        className="relative overflow-hidden group"
                      >
                        <span className="relative z-10">Clear Filters</span>
                        <span className="absolute inset-0 bg-background/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentClassList;
