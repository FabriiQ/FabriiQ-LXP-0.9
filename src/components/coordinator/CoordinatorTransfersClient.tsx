'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { TransferHistoryList } from '@/components/admin/campus/TransferHistoryList';
import { useToast } from '@/components/ui/use-toast';
import { Download, RefreshCw, UserPlus } from 'lucide-react';
import { ClassTransferManager } from './teachers/ClassTransferManager';
import { useRouter } from 'next/navigation';

/**
 * CoordinatorTransfersClient Component
 * 
 * This component manages student transfers for coordinators.
 * It reuses existing components from the campus admin portal.
 */
export function CoordinatorTransfersClient() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('history');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    transferType: 'all',
    startDate: undefined,
    endDate: undefined,
  });

  // Get current user's data
  const { data: userData } = api.user.getCurrent.useQuery();
  const campusId = userData?.primaryCampusId || '';

  // Get campus data
  const { data: campusData } = api.campus.getById.useQuery(
    { id: campusId },
    { enabled: !!campusId }
  );

  // Get transfer history
  const {
    data: transferData,
    isLoading,
    refetch
  } = api.enrollment.getTransferHistory.useQuery(
    {
      campusId,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      transferType: filters.transferType as 'class' | 'campus' | 'all',
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    {
      enabled: !!campusId && activeTab === 'history',
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load transfer history',
          variant: 'destructive',
        });
      },
    }
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your transfer history export is being prepared.',
    });
    // In a real implementation, this would trigger an API call to export the data
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground">
            Manage student transfers at {campusData?.name || 'your campus'}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'history' && (
            <>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </>
          )}
          <Button onClick={() => router.push('/admin/coordinator/students')}>
            <UserPlus className="mr-2 h-4 w-4" /> Transfer Student
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="history">Transfer History</TabsTrigger>
          <TabsTrigger value="batch">Batch Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <TransferHistoryList
                transfers={transferData?.transfers || []}
                totalCount={transferData?.totalCount || 0}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onFilterChange={handleFilterChange}
                isLoading={isLoading}
                emptyMessage="No student transfers found. When students are transferred between classes or campuses, the records will appear here."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch">
          <Card>
            <CardContent className="pt-6">
              <ClassTransferManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
