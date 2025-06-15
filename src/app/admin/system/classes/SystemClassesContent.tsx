'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/atoms/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { EyeIcon, UsersIcon, CalendarIcon, BookOpenIcon, MapPinIcon, RefreshCw } from 'lucide-react';
import { api } from '@/trpc/react';
import { useSearchParams, useRouter } from 'next/navigation';

interface SystemClassesContentProps {
  activeTab: string;
}

export function SystemClassesContent({ activeTab }: SystemClassesContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get filter values from URL
  const campusId = searchParams.get('campusId') || undefined;
  const programId = searchParams.get('programId') || undefined;
  const termId = searchParams.get('termId') || undefined;
  const search = searchParams.get('search') || undefined;
  const skip = parseInt(searchParams.get('skip') || '0');

  // Map activeTab to status for API
  const getStatusFromTab = (tab: string) => {
    switch (tab) {
      case 'active': return 'ACTIVE';
      case 'upcoming': return 'UPCOMING';
      case 'completed': return 'COMPLETED';
      default: return 'ALL';
    }
  };

  // Fetch classes data
  const {
    data,
    isLoading: loading,
    refetch
  } = api.systemAnalytics.getSystemClasses.useQuery({
    status: getStatusFromTab(activeTab),
    campusId,
    programId,
    termId,
    search,
    skip,
    take: 12
  }, {
    keepPreviousData: true,
    refetchOnWindowFocus: false
  });

  // Fetch filter options
  const { data: filterOptions } = api.systemAnalytics.getFilterOptions.useQuery(undefined, {
    refetchOnWindowFocus: false
  });

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Classes data
  const classes = data?.classes || [];

  // Show filters
  const showFilters = () => {
    if (!filterOptions) return null;

    return (
      <div className="mb-6 p-4 border rounded-lg bg-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Campus filter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Campus</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('campusId', e.target.value);
                } else {
                  url.searchParams.delete('campusId');
                }
                router.push(url.toString());
              }}
              value={campusId || ''}
            >
              <option value="">All Campuses</option>
              {filterOptions.campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>

          {/* Program filter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Program</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('programId', e.target.value);
                } else {
                  url.searchParams.delete('programId');
                }
                router.push(url.toString());
              }}
              value={programId || ''}
            >
              <option value="">All Programs</option>
              {filterOptions.programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          {/* Term filter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Term</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('termId', e.target.value);
                } else {
                  url.searchParams.delete('termId');
                }
                router.push(url.toString());
              }}
              value={termId || ''}
            >
              <option value="">All Terms</option>
              {filterOptions.terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search filter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Search</label>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const searchValue = formData.get('search') as string;

              const url = new URL(window.location.href);
              if (searchValue) {
                url.searchParams.set('search', searchValue);
              } else {
                url.searchParams.delete('search');
              }
              router.push(url.toString());
            }}>
              <div className="flex">
                <input
                  type="text"
                  name="search"
                  placeholder="Search classes..."
                  className="flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={search || ''}
                />
                <Button type="submit" className="rounded-l-none">Search</Button>
              </div>
            </form>
          </div>
        </div>

        {/* Clear filters button */}
        {(campusId || programId || termId || search) && (
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/system/classes')}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Refresh button
  const refreshButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing || loading}
      className="ml-auto mb-4"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
  );

  if (loading) {
    return (
      <>
        {showFilters()}
        <div className="flex justify-end">{refreshButton}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (!loading && classes.length === 0) {
    return (
      <>
        {showFilters()}
        <div className="flex justify-end">{refreshButton}</div>
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No classes found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab !== 'all'
              ? `No ${activeTab.toLowerCase()} classes found. Try selecting a different filter.`
              : "No classes have been created yet."}
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/admin/system/classes/create">Create Class</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {showFilters()}
      <div className="flex justify-end">{refreshButton}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <Card key={cls.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{cls.name}</CardTitle>
                <Badge variant={
                  activeTab === 'active' ? 'success' :
                  activeTab === 'upcoming' ? 'warning' :
                  activeTab === 'completed' ? 'secondary' :
                  'default'
                }>
                  {cls.status.charAt(0) + cls.status.slice(1).toLowerCase()}
                </Badge>
              </div>
              <CardDescription>
                <div className="flex items-center text-xs">
                  <BookOpenIcon className="h-3 w-3 mr-1" />
                  {cls.course.name} ({cls.code})
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{cls.campus.name}</span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{cls.teacher ? cls.teacher.name : 'No teacher assigned'}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{cls.term.name} ({new Date(cls.term.startDate).toLocaleDateString()} - {new Date(cls.term.endDate).toLocaleDateString()})</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="text-center p-2 bg-muted rounded-md">
                  <div className="text-lg font-semibold">{cls.studentCount}</div>
                  <div className="text-xs text-muted-foreground">Students</div>
                </div>
                <div className="text-center p-2 bg-muted rounded-md">
                  <div className="text-lg font-semibold">{cls.teacherCount}</div>
                  <div className="text-xs text-muted-foreground">Teachers</div>
                </div>
                <div className="text-center p-2 bg-muted rounded-md">
                  <div className="text-lg font-semibold">{cls.activityCount}</div>
                  <div className="text-xs text-muted-foreground">Activities</div>
                </div>
                <div className="text-center p-2 bg-muted rounded-md">
                  <div className="text-lg font-semibold">{cls.assessmentCount}</div>
                  <div className="text-xs text-muted-foreground">Assessments</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/admin/system/classes/${cls.id}`}>
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Load more button */}
      {data?.hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={() => {
              const url = new URL(window.location.href);
              const currentSkip = parseInt(url.searchParams.get('skip') || '0');
              const newSkip = currentSkip + 12;
              url.searchParams.set('skip', newSkip.toString());
              router.push(url.toString());
            }}
          >
            Load more classes
          </Button>
        </div>
      )}
    </>
  );
}
