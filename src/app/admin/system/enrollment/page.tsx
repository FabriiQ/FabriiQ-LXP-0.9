'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Input } from '@/components/ui/forms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-display/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  FileText,
  Download,
  Upload,
  Eye,
  Edit,
  DollarSign
} from 'lucide-react';

// Define the enrollment data type
type Enrollment = {
  id: string;
  studentName: string;
  studentId: string;
  campusName: string;
  campusId: string;
  className: string;
  classId: string;
  programName: string;
  programId: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  hasFee: boolean;
};

export default function SystemEnrollmentPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Fetch campuses for filter
  const { data: campuses, isLoading: campusesLoading } = api.campus.getAllCampuses.useQuery();

  // Fetch programs for filter
  const { data: programs, isLoading: programsLoading } = api.program.getAllPrograms.useQuery();

  // Fetch enrollments with filters
  const { data: enrollments, isLoading: enrollmentsLoading } = api.enrollment.getAllEnrollments.useQuery({
    campusId: selectedCampus,
    programId: selectedProgram,
    status: selectedStatus,
    search: searchTerm,
  });

  // Define table columns
  const columns: ColumnDef<Enrollment>[] = [
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.studentName}</div>
          <div className="text-xs text-muted-foreground">{row.original.studentId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'campusName',
      header: 'Campus',
    },
    {
      accessorKey: 'className',
      header: 'Class',
    },
    {
      accessorKey: 'programName',
      header: 'Program',
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === 'ACTIVE' ? 'success' :
          row.original.status === 'PENDING' ? 'warning' :
          row.original.status === 'COMPLETED' ? 'info' :
          'destructive'
        }>
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
            <DropdownMenuItem onClick={() => router.push(`/admin/system/enrollment/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/system/enrollment/${row.original.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Enrollment
            </DropdownMenuItem>
            {row.original.hasFee ? (
              <DropdownMenuItem onClick={() => router.push(`/admin/system/enrollment/${row.original.id}/fee`)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Manage Fee
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => router.push(`/admin/system/enrollment/${row.original.id}/assign-fee`)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Assign Fee
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="System Enrollment Management"
          description="Manage student enrollments across all campuses"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/system/enrollment/export')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push('/admin/system/enrollment/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Enrollment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Enrollments</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter enrollments by various criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name or ID"
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
                    <SelectItem value="all">All Campuses</SelectItem>
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
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs?.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
              <CardDescription>
                {enrollmentsLoading
                  ? 'Loading enrollments...'
                  : `Showing ${enrollments?.length || 0} enrollments`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={enrollments || []}
                  searchKey="studentName"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents would be similar but with pre-filtered data */}
        <TabsContent value="active" className="space-y-4">
          {/* Similar content as "all" but filtered for active enrollments */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
