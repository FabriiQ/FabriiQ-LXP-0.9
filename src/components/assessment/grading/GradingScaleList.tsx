'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-display/data-table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { SystemStatus, GradingScale } from '@/server/api/constants';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

interface GradingScaleRow {
  id: string;
  name: string;
  type: GradingScale;
  scale: GradingScale;
  status: SystemStatus;
  minScore: number;
  maxScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export const GradingScaleList = () => {
  const router = useRouter();

  // Mock data for grading scales
  const mockGradingScales: GradingScaleRow[] = [
    {
      id: '1',
      name: 'Standard Percentage Scale',
      type: GradingScale.PERCENTAGE,
      scale: GradingScale.PERCENTAGE,
      status: SystemStatus.ACTIVE,
      minScore: 0,
      maxScore: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Letter Grade Scale',
      type: GradingScale.LETTER_GRADE,
      scale: GradingScale.LETTER_GRADE,
      status: SystemStatus.ACTIVE,
      minScore: 0,
      maxScore: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'GPA Scale',
      type: GradingScale.GPA,
      scale: GradingScale.GPA,
      status: SystemStatus.ACTIVE,
      minScore: 0,
      maxScore: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const isLoading = false;

  // Mock delete function
  const handleDelete = (id: string) => {
    console.log(`Deleting scale with ID: ${id}`);
    toast.success('Grading scale deleted successfully');
  };

  const columns: ColumnDef<GradingScaleRow>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue('type')}
        </Badge>
      ),
    },
    {
      accessorKey: 'scale',
      header: 'Scale',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue('scale')}
        </Badge>
      ),
    },
    {
      accessorKey: 'minScore',
      header: 'Min Score',
    },
    {
      accessorKey: 'maxScore',
      header: 'Max Score',
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
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/assessment/grading-scales/${row.original.id}`)}
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
        <CardTitle>Grading Scales</CardTitle>
        <Button
          onClick={() => router.push('/assessment/grading-scales/new')}
        >
          Add Scale
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={mockGradingScales}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
};

export default GradingScaleList; 