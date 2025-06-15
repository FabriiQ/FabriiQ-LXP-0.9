'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { TransferHistoryList } from '@/components/admin/campus/TransferHistoryList';
import { useToast } from '@/components/ui/use-toast';
import { Download, RefreshCw } from 'lucide-react';

export default function TransfersPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    searchTerm: '',
    transferType: 'all',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current user's campus ID
  const { data: userData } = api.user.getCurrent.useQuery();
  const campusId = userData?.primaryCampusId || '';

  // Get campus details
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
      enabled: !!campusId,
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
    // Implement export functionality
    toast({
      title: 'Export',
      description: 'Export functionality will be implemented soon',
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Transfers</h1>
          <p className="text-muted-foreground">
            View and manage student transfers at {campusData?.name || 'your campus'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

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
    </div>
  );
}
