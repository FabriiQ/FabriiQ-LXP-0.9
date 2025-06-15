'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/atoms/button';
import { DataTable } from '@/components/ui/data-display/data-table';
import { Badge } from '@/components/ui/atoms/badge';
import { toast } from 'react-hot-toast';
import { SystemStatus } from '@/server/api/constants';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

interface PolicyRow {
  id: string;
  name: string;
  description: string;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const PolicyList = () => {
  const router = useRouter();

  // Mock policy data
  const mockPolicies: PolicyRow[] = [
    {
      id: '1',
      name: 'Standard Assessment Policy',
      description: 'Default policy for regular assessments',
      status: SystemStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Final Exam Policy',
      description: 'Policy for final examinations',
      status: SystemStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Makeup Assessment Policy',
      description: 'Policy for makeup assessments',
      status: SystemStatus.INACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const isLoading = false;

  // Mock delete function
  const handleDelete = (id: string) => {
    console.log(`Deleting policy with ID: ${id}`);
    toast.success('Assessment policy deleted successfully');
  };

  const columns: ColumnDef<PolicyRow>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('status') === SystemStatus.ACTIVE ? 'success' : 'secondary'}>
          {row.getValue('status')}
        </Badge>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ row }) => new Date(row.getValue('updatedAt')).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/assessment/policies/${row.original.id}`)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assessment Policies</CardTitle>
        <Button
          onClick={() => router.push('/assessment/policies/new')}
        >
          Add Policy
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={mockPolicies}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
};

export default PolicyList; 