'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { api } from '@/trpc/react';
import { VirtualizedStudentGrid } from '@/components/admin/system/students/VirtualizedStudentGrid';

interface SystemStudentsContentProps {
  activeTab: string;
}


export function SystemStudentsContent({ activeTab }: SystemStudentsContentProps) {
  const searchParamsObj = useSearchParams();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get filter values from URL
  const campusId = searchParamsObj?.get('campusId') || undefined;
  const programId = searchParamsObj?.get('programId') || undefined;
  const search = searchParamsObj?.get('search') || undefined;
  const skip = parseInt(searchParamsObj?.get('skip') || '0');

  // Map activeTab to status for API
  const getStatusFromTab = (tab: string) => {
    switch (tab) {
      case 'active': return 'ACTIVE';
      case 'inactive': return 'INACTIVE';
      case 'archived': return 'ARCHIVED';
      default: return 'ALL';
    }
  };

  // Fetch students data with larger page size for virtualization
  const {
    data,
    isLoading: loading,
    refetch
  } = api.systemAnalytics.getSystemStudents.useQuery({
    status: getStatusFromTab(activeTab),
    campusId,
    programId,
    search,
    skip,
    take: 50 // Increased page size for virtualization
  }, {
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  // Track loading state for next page
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

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

  // Students data
  const students = data?.students || [];

  // Show filters
  const showFilters = () => {
    if (!filterOptions) return null;

    return (
      <div className="mb-6 p-4 border rounded-lg bg-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  placeholder="Search students..."
                  className="flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={search || ''}
                />
                <Button type="submit" className="rounded-l-none">Search</Button>
              </div>
            </form>
          </div>
        </div>

        {/* Clear filters button */}
        {(campusId || programId || search) && (
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/system/students')}
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
      <ArrowRight className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
  );

  // Handle loading more students
  const handleLoadMore = () => {
    if (data?.hasMore && !isFetchingNextPage) {
      setIsFetchingNextPage(true);
      const url = new URL(window.location.href);
      const currentSkip = parseInt(url.searchParams.get('skip') || '0');
      const newSkip = currentSkip + 50;
      url.searchParams.set('skip', newSkip.toString());
      router.push(url.toString());

      // Reset loading state after navigation
      setTimeout(() => {
        setIsFetchingNextPage(false);
      }, 500);
    }
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900">No students found</h3>
      <p className="text-sm text-gray-500 mt-1">
        {activeTab !== 'all'
          ? `No ${activeTab.toLowerCase()} students found. Try selecting a different filter.`
          : "No students have been created yet."}
      </p>
      <div className="mt-4">
        <Button asChild>
          <Link href="/admin/system/students/create">Create Student</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {showFilters()}
      <div className="flex justify-end">{refreshButton}</div>

      {!loading && students.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6">
          <VirtualizedStudentGrid
            students={students}
            isLoading={loading}
            containerHeight={800}
            columnCount={3}
            estimatedRowHeight={320}
            overscan={5}
            hasMore={data?.hasMore}
            onLoadMore={handleLoadMore}
          />
        </div>
      )}
    </>
  );
}
