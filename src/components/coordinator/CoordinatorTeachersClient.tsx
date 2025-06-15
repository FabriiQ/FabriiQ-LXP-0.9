'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { TeacherGrid } from './TeacherGrid';
import { MobileTeacherGrid } from './MobileTeacherGrid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { Badge } from '@/components/ui/badge';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface CoordinatorTeachersClientProps {
  initialSearch: string;
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
}

export function CoordinatorTeachersClient({
  initialSearch,
  campus
}: CoordinatorTeachersClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cachedTeachers, setCachedTeachers] = useState<any[]>([]);

  // Use offline storage hook
  const {
    isOnline,
    getData: getOfflineData,
    saveData: saveOfflineData,
    sync
  } = useOfflineStorage(OfflineStorageType.TEACHERS);

  // Fetch teachers data
  const { data, isLoading, refetch } = api.coordinator.getTeachers.useQuery(
    {
      search: initialSearch,
      campusId: campus.id
    },
    {
      enabled: isOnline, // Only fetch when online
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data?.teachers) {
          // Cache data for offline use
          saveOfflineData(campus.id, data.teachers);
        }
      },
      onError: (error) => {
        console.error('Error fetching teachers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teachers data',
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
          const cachedData = await getOfflineData(campus.id);
          if (cachedData) {
            console.log('Using cached teachers data');
            setCachedTeachers(cachedData);
          }
        } catch (error) {
          console.error('Error loading offline teachers data:', error);
        }
      };

      loadOfflineData();
    }
  }, [isOnline, data, campus.id, getOfflineData]);

  // Use cached data when offline
  const teachers = data?.teachers || cachedTeachers || [];

  // Handle search
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

    router.push(`/admin/coordinator/teachers?${params.toString()}`);
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
        description: 'Teachers data has been updated',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh teachers data',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <CardTitle>Teacher Management</CardTitle>
            <CardDescription>View and manage teachers for your coordinated programs</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline Mode
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <MobileTeacherGrid
              teachers={teachers}
              isLoading={isLoading && !cachedTeachers.length}
              campusId={campus.id}
              isOffline={!isOnline}
            />
          ) : (
            <TeacherGrid
              teachers={teachers}
              isLoading={isLoading && !cachedTeachers.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={handleSearch}
              isOffline={!isOnline}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
