'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { StudentGrid } from './StudentGrid';
import { MobileStudentGrid } from './MobileStudentGrid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/form/select';
import { Label } from '@/components/ui/label';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw } from '@/components/ui/icons/custom-icons';
import { useToast } from '@/components/ui/use-toast';

interface CoordinatorStudentsClientProps {
  initialSearch: string;
  initialProgramId: string;
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  programCampuses: Array<{
    id: string;
    programId: string;
    program: {
      id: string;
      name: string;
    };
  }>;
}

export function CoordinatorStudentsClient({
  initialSearch,
  initialProgramId,
  campus,
  programCampuses
}: CoordinatorStudentsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedProgramId, setSelectedProgramId] = useState(initialProgramId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cachedStudents, setCachedStudents] = useState<any[]>([]);

  // Use offline storage hook
  const {
    isOnline,
    getData: getOfflineData,
    saveData: saveOfflineData,
    sync
  } = useOfflineStorage(OfflineStorageType.STUDENTS);

  // Fetch students data
  const { data, isLoading, refetch } = api.coordinator.getStudents.useQuery(
    {
      search: initialSearch,
      programId: initialProgramId || undefined,
      campusId: campus.id
    },
    {
      enabled: isOnline, // Only fetch when online
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data?.students) {
          // Cache data for offline use
          const cacheKey = `${campus.id}${initialProgramId ? `-${initialProgramId}` : ''}`;
          saveOfflineData(cacheKey, data.students);
        }
      },
      onError: (error) => {
        console.error('Error fetching students:', error);
        toast({
          title: 'Error',
          description: 'Failed to load students data',
          variant: 'error',
        });
      }
    }
  );

  // Load data from cache if offline
  useEffect(() => {
    if (!isOnline && !data) {
      const loadOfflineData = async () => {
        try {
          const cacheKey = `${campus.id}${initialProgramId ? `-${initialProgramId}` : ''}`;
          const cachedData = await getOfflineData(cacheKey);
          if (cachedData) {
            console.log('Using cached students data');
            setCachedStudents(cachedData);
          }
        } catch (error) {
          console.error('Error loading offline students data:', error);
        }
      };

      loadOfflineData();
    }
  }, [isOnline, data, campus.id, initialProgramId, getOfflineData]);

  // Use cached data when offline
  const students = data?.students || cachedStudents || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      toast({
        title: 'Offline Mode',
        description: 'Search is limited in offline mode',
        variant: 'warning',
      });
      return;
    }

    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedProgramId) params.set('programId', selectedProgramId);

    router.push(`/admin/coordinator/students?${params.toString()}`);
  };

  const handleProgramChange = (value: string) => {
    // Set the selected program ID (use empty string for "all-programs")
    setSelectedProgramId(value === "all-programs" ? "" : value);

    if (!isOnline) {
      toast({
        title: 'Offline Mode',
        description: 'Filtering is limited in offline mode',
        variant: 'warning',
      });
      return;
    }

    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    // Only add programId to URL if it's not "all-programs"
    if (value && value !== "all-programs") params.set('programId', value);

    router.push(`/admin/coordinator/students?${params.toString()}`);
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (!isOnline) {
      // If offline, try to sync
      toast({
        title: 'Offline Mode',
        description: 'You are currently offline. Using cached data.',
        variant: 'warning',
      });

      try {
        await sync();
      } catch (error) {
        console.error('Error syncing data:', error);
      }

      return;
    }

    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'Data refreshed',
        description: 'Students data has been updated',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh students data',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-md flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <div>
            <p className="font-medium">Offline Mode</p>
            <p className="text-xs">You're viewing cached student data. Some features may be limited.</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>View and manage students for your coordinated programs</CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-2 items-end">
              <div className="w-full md:w-64">
                <Label htmlFor="program-select" className="sr-only">Filter by Program</Label>
                <Select value={selectedProgramId} onValueChange={handleProgramChange} disabled={!isOnline}>
                  <SelectTrigger id="program-select">
                    <SelectValue placeholder="Filter by Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-programs">All Programs</SelectItem>
                    {programCampuses.map((pc) => (
                      <SelectItem key={pc.programId} value={pc.programId || "no-program-id"}>
                        {pc.program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hidden md:flex"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <MobileStudentGrid
              students={students}
              isLoading={isLoading && !cachedStudents.length}
              campusId={campus.id}
              programId={selectedProgramId}
              isOffline={!isOnline}
            />
          ) : (
            <StudentGrid
              students={students}
              isLoading={isLoading && !cachedStudents.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={handleSearch}
              isOffline={!isOnline}
              programs={programCampuses.map(pc => ({ id: pc.programId, name: pc.program.name }))}
              onFilter={(filters) => {
                console.log('Applying filters:', filters);
                // In a real implementation, this would update the URL or trigger a new API call
                // For now, we'll just log the filters
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
