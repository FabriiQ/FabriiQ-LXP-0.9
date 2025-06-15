'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Input } from '@/components/ui/forms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select';
import { DataTable } from '@/components/ui/data-display/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
// import { api } from '@/trpc/react'; // Will be used when API is implemented
import {
  Search,
  Plus,
  Copy,
  Eye,
  Edit,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define the fee structure data type
type FeeStructure = {
  id: string;
  name: string;
  programName: string;
  programId: string;
  campusName: string;
  campusId: string;
  academicCycleName: string;
  academicCycleId: string;
  baseAmount: number;
  isRecurring: boolean;
  recurringInterval?: string;
  status: string;
  createdAt: Date;
};

export default function FeeStructuresPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedAcademicCycle, setSelectedAcademicCycle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // These API calls are mocked for now
  // Will be implemented when the API endpoints are available
  const campuses = [
    { id: 'camp-1', name: 'Main Campus' },
    { id: 'camp-2', name: 'Branch Campus' }
  ];

  const programs = [
    { id: 'prog-1', name: 'Primary Years Program' },
    { id: 'prog-2', name: 'Middle School Program' }
  ];

  const academicCycles = [
    { id: 'ac-1', name: '2023-2024' },
    { id: 'ac-2', name: '2024-2025' }
  ];

  const feeStructuresLoading = false;

  // Mock data for development
  const mockFeeStructures: FeeStructure[] = [
    {
      id: 'fs-1',
      name: 'Primary Program Annual Fee 2024-2025',
      programName: 'Primary Years Program',
      programId: 'prog-1',
      campusName: 'Main Campus',
      campusId: 'camp-1',
      academicCycleName: '2024-2025',
      academicCycleId: 'ac-1',
      baseAmount: 6500,
      isRecurring: false,
      status: 'ACTIVE',
      createdAt: new Date(),
    },
    {
      id: 'fs-2',
      name: 'Middle School Quarterly Fee 2024-2025',
      programName: 'Middle School Program',
      programId: 'prog-2',
      campusName: 'Branch Campus',
      campusId: 'camp-2',
      academicCycleName: '2024-2025',
      academicCycleId: 'ac-1',
      baseAmount: 2000,
      isRecurring: true,
      recurringInterval: 'QUARTERLY',
      status: 'ACTIVE',
      createdAt: new Date(),
    },
  ];

  // Define table columns
  const columns: ColumnDef<FeeStructure>[] = [
    {
      accessorKey: 'name',
      header: 'Fee Structure',
    },
    {
      accessorKey: 'programName',
      header: 'Program',
    },
    {
      accessorKey: 'campusName',
      header: 'Campus',
    },
    {
      accessorKey: 'academicCycleName',
      header: 'Academic Cycle',
    },
    {
      accessorKey: 'baseAmount',
      header: 'Base Amount',
      cell: ({ row }) => `$${row.original.baseAmount.toLocaleString()}`,
    },
    {
      accessorKey: 'isRecurring',
      header: 'Recurring',
      cell: ({ row }) => (
        <div>
          {row.original.isRecurring ? (
            <Badge variant="outline">{row.original.recurringInterval}</Badge>
          ) : (
            <span>One-time</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'ACTIVE' ? 'success' : 'destructive'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/admin/system/fee-management/structures/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/system/fee-management/structures/${row.original.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Structure
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/system/fee-management/structures/${row.original.id}/clone`)}>
              <Copy className="mr-2 h-4 w-4" />
              Clone Structure
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Structure
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Fee Structures"
          description="Manage fee structures across all campuses"
        />
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin/system/fee-management/structures/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Fee Structure
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter fee structures by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCampus} onValueChange={setSelectedCampus}>
              <SelectTrigger>
                <SelectValue placeholder="Select Campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Campuses</SelectItem>
                {campuses?.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Programs</SelectItem>
                {programs?.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedAcademicCycle} onValueChange={setSelectedAcademicCycle}>
              <SelectTrigger>
                <SelectValue placeholder="Select Academic Cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Academic Cycles</SelectItem>
                {academicCycles?.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fee Structures</CardTitle>
          <CardDescription>
            {feeStructuresLoading
              ? 'Loading fee structures...'
              : `Showing ${mockFeeStructures.length} fee structures`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feeStructuresLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={mockFeeStructures}
              searchColumn="name"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
