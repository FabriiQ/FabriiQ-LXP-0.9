'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Input } from '@/components/ui/forms/input';
import { DataTable } from '@/components/ui/data-display/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/react';
import {
  Search,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { Percent, DollarSign } from '@/components/ui/icons/custom-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define the discount type data type
type DiscountType = {
  id: string;
  name: string;
  description: string | null;
  discountValue: number;
  isPercentage: boolean;
  maxAmount: number | null;
  applicableFor: string[];
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: string;
  updatedById?: string | null;
};

export default function DiscountTypesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch discount types
  const { data: discountTypes, isLoading: discountTypesLoading } = api.discountType.getAll.useQuery();

  // Define table columns
  const columns: ColumnDef<DiscountType>[] = [
    {
      accessorKey: 'name',
      header: 'Discount Type',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'discountValue',
      header: 'Value',
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.isPercentage ? (
            <>
              <Percent className="h-4 w-4 mr-1" />
              {row.original.discountValue}%
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-1" />
              {row.original.discountValue.toLocaleString()}
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'maxAmount',
      header: 'Max Amount',
      cell: ({ row }) => (
        row.original.maxAmount ? `Rs. ${row.original.maxAmount.toLocaleString()}` : 'No limit'
      ),
    },
    {
      accessorKey: 'applicableFor',
      header: 'Applicable For',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.applicableFor.map((type) => (
            <Badge key={type} variant="outline" className="text-xs">
              {type.replace('_', ' ')}
            </Badge>
          ))}
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
            <DropdownMenuItem onClick={() => router.push(`/admin/system/fee-management/discount-types/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/system/fee-management/discount-types/${row.original.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Discount Type
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Discount Type
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
          title="Discount Types"
          description="Manage discount types for fee structures"
        />
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin/system/fee-management/discount-types/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Discount Type
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>Search for discount types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or description"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discount Types</CardTitle>
          <CardDescription>
            {discountTypesLoading
              ? 'Loading discount types...'
              : `Showing ${discountTypes?.length || 0} discount types`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {discountTypesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : discountTypes && discountTypes.length > 0 ? (
            <DataTable
              columns={columns}
              data={discountTypes}
              searchColumn="name"
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No discount types found. Create your first discount type to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
