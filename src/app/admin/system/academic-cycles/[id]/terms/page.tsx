'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-display/data-table';
import { Select } from '@/components/ui/forms/select';
import { Input } from '@/components/ui/input';
import { api } from '@/trpc/react';
import { formatDate } from '@/lib/utils';
import { PlusIcon, FilterIcon, ArrowLeftIcon } from 'lucide-react';
import { Badge } from '@/components/ui/data-display/badge';
import { TermType, TermPeriod, SystemStatus } from '@/server/api/constants';

// Define column types for DataTable
type Term = {
  id: string;
  code: string;
  name: string;
  termType: string;
  termPeriod: string;
  periodNumber?: number;
  startDate: Date;
  endDate: Date;
  status: string;
};

export default function TermsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // Define filters state with proper typing
  const [filters, setFilters] = useState<{
    termType: TermType | undefined;
    termPeriod: TermPeriod | undefined;
    status: SystemStatus | undefined;
    searchQuery: string;
  }>({
    termType: undefined,
    termPeriod: undefined,
    status: undefined,
    searchQuery: '',
  });
  
  // Fetch academic cycle details
  const { data: academicCycle, isLoading: isLoadingCycle } = api.academicCycle.getById.useQuery({
    id: params.id,
  });
  
  // Fetch terms for this academic cycle
  const { data: termsData, isLoading: isLoadingTerms } = api.term.list.useQuery({
    academicCycleId: params.id,
    termType: filters.termType,
    termPeriod: filters.termPeriod,
    status: filters.status,
    searchQuery: filters.searchQuery || undefined,
  });
  
  const columns = [
    {
      accessorKey: 'code',
      header: 'Code',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'termType',
      header: 'Type',
      cell: ({ row }: { row: { original: Term } }) => {
        const type = row.original.termType;
        return <span className="capitalize">{type.toLowerCase()}</span>;
      },
    },
    {
      accessorKey: 'termPeriod',
      header: 'Period',
      cell: ({ row }: { row: { original: Term } }) => {
        const period = row.original.termPeriod;
        const periodNumber = row.original.periodNumber;
        return (
          <span>
            {period.replace('_', ' ')}
            {periodNumber ? ` (${periodNumber})` : ''}
          </span>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }: { row: { original: Term } }) => formatDate(row.original.startDate),
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }: { row: { original: Term } }) => formatDate(row.original.endDate),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Term } }) => {
        const status = row.original.status;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
            status === 'ARCHIVED' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Term } }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/system/academic-cycles/${params.id}/terms/${row.original.id}`)}
          >
            View
          </Button>
        );
      },
    },
  ];
  
  const isLoading = isLoadingCycle || isLoadingTerms;
  
  return (
    <PageLayout
      title={`Terms - ${academicCycle?.name || 'Loading...'}`}
      description={`Manage terms for the academic cycle ${academicCycle?.code || ''}`}
      breadcrumbs={[
        { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
        { label: academicCycle?.name || 'Academic Cycle', href: `/admin/system/academic-cycles/${params.id}` },
        { label: 'Terms', href: `/admin/system/academic-cycles/${params.id}/terms` },
      ]}
      actions={
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push(`/admin/system/academic-cycles/${params.id}`)}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Cycle
          </Button>
          <Button onClick={() => router.push(`/admin/system/academic-cycles/${params.id}/terms/create`)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Term
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <FilterIcon className="mr-2 h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="w-32">
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.termType || ''}
              onChange={(e) => setFilters({ ...filters, termType: e.target.value as TermType | undefined })}
            >
              <option value="">Type</option>
              <option value="SEMESTER">Semester</option>
              <option value="TRIMESTER">Trimester</option>
              <option value="QUARTER">Quarter</option>
              <option value="THEME_BASED">Theme Based</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          
          <div className="w-40">
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.termPeriod || ''}
              onChange={(e) => setFilters({ ...filters, termPeriod: e.target.value as TermPeriod | undefined })}
            >
              <option value="">Period</option>
              <option value="FALL">Fall</option>
              <option value="SPRING">Spring</option>
              <option value="SUMMER">Summer</option>
              <option value="WINTER">Winter</option>
              <option value="FIRST_QUARTER">First Quarter</option>
              <option value="SECOND_QUARTER">Second Quarter</option>
              <option value="THIRD_QUARTER">Third Quarter</option>
              <option value="FOURTH_QUARTER">Fourth Quarter</option>
              <option value="FIRST_TRIMESTER">First Trimester</option>
              <option value="SECOND_TRIMESTER">Second Trimester</option>
              <option value="THIRD_TRIMESTER">Third Trimester</option>
              <option value="THEME_UNIT">Theme Unit</option>
            </select>
          </div>
          
          <div className="w-32">
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as SystemStatus | undefined })}
            >
              <option value="">Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          
          <Input
            placeholder="Search..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="w-64"
          />
          
          <Button variant="outline" onClick={() => setFilters({
            termType: undefined,
            termPeriod: undefined,
            status: undefined,
            searchQuery: '',
          })}>
            Clear
          </Button>
        </div>
        
        <DataTable
          columns={columns}
          data={termsData?.terms || []}
          isLoading={isLoading}
        />
      </div>
    </PageLayout>
  );
} 