'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
// import { api } from '@/trpc/react'; // Will be used when API is implemented
import {
  Edit,
  Trash2,
  Calendar,
  User
} from 'lucide-react';
import { ArrowLeft, Percent, DollarSign, Tag } from '@/components/ui/icons/custom-icons';
import { DataTable } from '@/components/ui/data-display/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function DiscountTypeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // These API calls are mocked for now
  // Will be implemented when the API endpoints are available
  // const discountTypeLoading = false; // Uncomment when needed
  const enrollmentsLoading = false;

  // Mock data for development
  const mockDiscountType = {
    id,
    name: 'Sibling Discount',
    description: 'Discount for siblings enrolled in the institution',
    discountValue: 10,
    isPercentage: true,
    maxAmount: 1000,
    applicableFor: ['SIBLING'],
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
      discountAmount: 650,
      appliedDate: new Date()
    },
    {
      id: 'enr-2',
      studentName: 'Jane Smith',
      studentId: 'STD-002',
      className: 'Grade 1-B',
      classId: 'cls-2',
      campusName: 'Main Campus',
      campusId: 'camp-1',
      discountAmount: 700,
      appliedDate: new Date()
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
      accessorKey: 'discountAmount',
      header: 'Discount Amount',
      cell: ({ row }) => `$${row.original.discountAmount.toLocaleString()}`,
    },
    {
      accessorKey: 'appliedDate',
      header: 'Applied Date',
      cell: ({ row }) => new Date(row.original.appliedDate).toLocaleDateString(),
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
          View Fee
        </Button>
      ),
    },
  ];

  // Handle delete discount type
  const handleDelete = () => {
    // Mock deletion
    toast({
      title: 'Discount type deleted',
      description: 'The discount type has been deleted successfully.',
    });
    router.push('/admin/system/fee-management/discount-types');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{mockDiscountType.name}</h1>
            <p className="text-muted-foreground">
              {mockDiscountType.description}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/system/fee-management/discount-types/${id}/edit`)}>
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
                  This will permanently delete the discount type. This action cannot be undone.
                  {mockEnrollments.length > 0 && (
                    <p className="mt-2 text-destructive font-semibold">
                      Warning: This discount type is used by {mockEnrollments.length} enrollments.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Discount Details</CardTitle>
            <CardDescription>Discount type information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                {mockDiscountType.isPercentage ? (
                  <>
                    <Percent className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Discount Value:</span>
                    <span className="ml-2">{mockDiscountType.discountValue}%</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Discount Value:</span>
                    <span className="ml-2">${mockDiscountType.discountValue.toLocaleString()}</span>
                  </>
                )}
              </div>
              {mockDiscountType.maxAmount && (
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Maximum Amount:</span>
                  <span className="ml-2">${mockDiscountType.maxAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Applicable For:</span>
                <div className="ml-2 flex flex-wrap gap-1">
                  {mockDiscountType.applicableFor.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Created By:</span>
                <span className="ml-2">{mockDiscountType.createdBy.name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Created At:</span>
                <span className="ml-2">{mockDiscountType.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Badge variant={mockDiscountType.status === 'ACTIVE' ? 'success' : 'destructive'}>
                  {mockDiscountType.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>How this discount type is being used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Enrollments:</span>
                <span>{mockEnrollments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Discount Amount:</span>
                <span>${mockEnrollments.reduce((sum, e) => sum + e.discountAmount, 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Average Discount:</span>
                <span>
                  ${(mockEnrollments.reduce((sum, e) => sum + e.discountAmount, 0) /
                    (mockEnrollments.length || 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollments Using This Discount Type</CardTitle>
          <CardDescription>
            {enrollmentsLoading
              ? 'Loading enrollments...'
              : `${mockEnrollments.length} enrollments using this discount type`}
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
              No enrollments are using this discount type
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
