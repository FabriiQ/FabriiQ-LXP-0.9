'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
// import { api } from '@/trpc/react'; // Will be used when API is implemented
import {
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  DollarSign,
  Calendar,
  School,
  GraduationCap,
  Clock,
  User,
  Users
} from 'lucide-react';
import { FeeComponentList, FeeComponent } from '@/components/shared/entities/fee';
import { DataTable } from '@/components/ui/data-display/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function FeeStructureDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // These API calls are mocked for now
  // Will be implemented when the API endpoints are available
  const feeStructureLoading = false;
  const enrollmentsLoading = false;

  // Mock data for development
  const mockFeeStructure = {
    id,
    name: 'Primary Program Annual Fee 2024-2025',
    description: 'Annual fee structure for Primary Years Program',
    programName: 'Primary Years Program',
    programId: 'prog-1',
    programCampusId: 'pc-1',
    campusName: 'Main Campus',
    campusId: 'camp-1',
    academicCycleName: '2024-2025',
    academicCycleId: 'ac-1',
    termName: 'Term 1',
    termId: 'term-1',
    components: [
      {
        id: 'comp-1',
        name: 'Tuition Fee',
        type: 'TUITION',
        amount: 5000,
        description: 'Basic tuition fee'
      },
      {
        id: 'comp-2',
        name: 'Library Fee',
        type: 'LIBRARY',
        amount: 500,
        description: 'Access to library resources'
      },
      {
        id: 'comp-3',
        name: 'Laboratory Fee',
        type: 'LABORATORY',
        amount: 1000,
        description: 'Access to laboratory facilities'
      },
      {
        id: 'comp-4',
        name: 'Sports Fee',
        type: 'SPORTS',
        amount: 200,
        description: 'Access to sports facilities'
      },
      {
        id: 'comp-5',
        name: 'Examination Fee',
        type: 'EXAMINATION',
        amount: 300,
        description: 'Examination and assessment costs'
      }
    ],
    baseAmount: 7000,
    isRecurring: false,
    recurringInterval: null,
    status: 'ACTIVE',
    createdAt: new Date(),
    createdBy: {
      id: 'user-1',
      name: 'Admin User'
    }
  };

  // Mock enrollments data
  const mockEnrollments = [
    {
      id: 'enr-1',
      studentName: 'John Doe',
      studentId: 'STD-001',
      className: 'Grade 1-A',
      classId: 'cls-1',
      campusName: 'Main Campus',
      campusId: 'camp-1',
      status: 'ACTIVE',
      startDate: new Date(),
      feeStatus: 'PAID',
      feeAmount: 7000
    },
    {
      id: 'enr-2',
      studentName: 'Jane Smith',
      studentId: 'STD-002',
      className: 'Grade 1-B',
      classId: 'cls-2',
      campusName: 'Main Campus',
      campusId: 'camp-1',
      status: 'ACTIVE',
      startDate: new Date(),
      feeStatus: 'PENDING',
      feeAmount: 7000
    }
  ];

  // Define enrollments table columns
  const enrollmentsColumns: ColumnDef<any>[] = [
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
      accessorKey: 'className',
      header: 'Class',
    },
    {
      accessorKey: 'campusName',
      header: 'Campus',
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
      accessorKey: 'feeStatus',
      header: 'Fee Status',
      cell: ({ row }) => (
        <Badge variant={
          row.original.feeStatus === 'PAID' ? 'success' :
          row.original.feeStatus === 'PENDING' ? 'warning' :
          row.original.feeStatus === 'PARTIAL' ? 'info' :
          'destructive'
        }>
          {row.original.feeStatus}
        </Badge>
      ),
    },
    {
      accessorKey: 'feeAmount',
      header: 'Fee Amount',
      cell: ({ row }) => `$${row.original.feeAmount.toLocaleString()}`,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/system/enrollment/${row.original.id}/fee`)}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Manage Fee
        </Button>
      ),
    },
  ];

  // Handle delete fee structure
  const handleDelete = () => {
    // Mock deletion
    toast({
      title: 'Fee structure deleted',
      description: 'The fee structure has been deleted successfully.',
    });
    router.push('/admin/system/fee-management/structures');
  };

  // Handle clone fee structure
  const handleClone = () => {
    router.push(`/admin/system/fee-management/structures/${id}/clone`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{mockFeeStructure.name}</h1>
            <p className="text-muted-foreground">
              Fee structure for {mockFeeStructure.programName} at {mockFeeStructure.campusName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClone}>
            <Copy className="h-4 w-4 mr-2" />
            Clone
          </Button>
          <Button variant="outline" onClick={() => router.push(`/admin/system/fee-management/structures/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the fee structure. This action cannot be undone.
                  {mockEnrollments.length > 0 && (
                    <p className="mt-2 text-destructive font-semibold">
                      Warning: This fee structure is used by {mockEnrollments.length} enrollments.
                      Deleting it may affect those enrollments.
                    </p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Fee Components</CardTitle>
            <CardDescription>Components that make up this fee structure</CardDescription>
          </CardHeader>
          <CardContent>
            <FeeComponentList
              components={mockFeeStructure.components as FeeComponent[]}
              showTotal={true}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Fee structure information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Program:</span>
                <span className="ml-2">{mockFeeStructure.programName}</span>
              </div>
              <div className="flex items-center">
                <School className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Campus:</span>
                <span className="ml-2">{mockFeeStructure.campusName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Academic Cycle:</span>
                <span className="ml-2">{mockFeeStructure.academicCycleName}</span>
              </div>
              {mockFeeStructure.termName && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Term:</span>
                  <span className="ml-2">{mockFeeStructure.termName}</span>
                </div>
              )}
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Base Amount:</span>
                <span className="ml-2">${mockFeeStructure.baseAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Recurring:</span>
                <span className="ml-2">
                  {mockFeeStructure.isRecurring ? mockFeeStructure.recurringInterval : 'No'}
                </span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Created By:</span>
                <span className="ml-2">{mockFeeStructure.createdBy.name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Created At:</span>
                <span className="ml-2">{mockFeeStructure.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Badge variant={mockFeeStructure.status === 'ACTIVE' ? 'success' : 'destructive'}>
                  {mockFeeStructure.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollments Using This Fee Structure</CardTitle>
          <CardDescription>
            {enrollmentsLoading
              ? 'Loading enrollments...'
              : `${mockEnrollments.length} enrollments using this fee structure`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrollmentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : mockEnrollments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No enrollments are using this fee structure
            </p>
          ) : (
            <DataTable
              columns={enrollmentsColumns}
              data={mockEnrollments}
              searchColumn="studentName"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
