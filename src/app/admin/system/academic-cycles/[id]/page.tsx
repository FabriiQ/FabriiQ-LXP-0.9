'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/data-display/card';
import { Badge } from '@/components/ui/atoms/badge';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { formatDate } from '@/lib/utils';
import { EditIcon, TrashIcon } from 'lucide-react';
import { SystemStatus } from "@prisma/client";
import type { Term, Course, AcademicCycle } from '@prisma/client';

interface TermWithRelations extends Term {
  course?: Course;
  academicCycle?: AcademicCycle;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function AcademicCycleDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();
  // Unwrap params properly using React.use() for future compatibility
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const id = unwrappedParams.id;

  const {
    data: academicCycle,
    isLoading,
    error
  } = api.academicCycle.getById.useQuery(
    { id },
    {
      retry: 1,
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'error',
        });
      }
    }
  );

  const { data: termsData } = api.term.list.useQuery(
    { academicCycleId: id },
    {
      enabled: !!academicCycle,
      retry: 1
    }
  );

  const deleteMutation = api.academicCycle.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Academic cycle deleted successfully',
        variant: 'success',
      });
      router.push('/admin/system/academic-cycles');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    }
  });

  if (isLoading) {
    return (
      <PageLayout
        title="Loading..."
        description="Loading academic cycle details"
        breadcrumbs={[
          { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
          { label: 'Loading...', href: '#' },
        ]}
      >
        <div className="animate-pulse">
          <Card className="mb-6">
            <CardContent className="h-32" />
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (error || !academicCycle) {
    return (
      <PageLayout
        title="Not Found"
        description="Academic cycle not found"
        breadcrumbs={[
          { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
          { label: 'Not Found', href: '#' },
        ]}
      >
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error?.message || 'The requested academic cycle could not be found.'}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/admin/system/academic-cycles')}
          >
            Return to Academic Cycles
          </Button>
        </div>
      </PageLayout>
    );
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this academic cycle?')) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <PageLayout
      title={academicCycle.name}
      description={`Academic Cycle: ${academicCycle.code}`}
      breadcrumbs={[
        { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
        { label: academicCycle.name, href: '#' },
      ]}
      actions={[
        <Button
          key="edit"
          variant="outline"
          onClick={() => router.push(`/admin/system/academic-cycles/${id}/edit`)}
        >
          <EditIcon className="h-4 w-4 mr-2" />
          Edit
        </Button>,
        <Button
          key="delete"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteMutation.isLoading}
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete
        </Button>
      ]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{academicCycle.code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{academicCycle.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{academicCycle.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <Badge variant={academicCycle.status === SystemStatus.ACTIVE ? 'success' : 'warning'}>
                    {academicCycle.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(academicCycle.startDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">End Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(academicCycle.endDate)}</dd>
              </div>
              {academicCycle.description && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{academicCycle.description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Terms</CardTitle>
            <Button
              onClick={() => router.push(`/admin/system/academic-cycles/${id}/terms/create`)}
            >
              Add Term
            </Button>
          </CardHeader>
          <CardContent>
            {termsData?.terms && termsData.terms.length > 0 ? (
              <div className="space-y-4">
                {termsData.terms.map((term: TermWithRelations) => (
                  <div
                    key={term.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/system/academic-cycles/${id}/terms/${term.id}`)}
                  >
                    <div>
                      <h3 className="text-sm font-medium">{term.name}</h3>
                      <p className="text-sm text-gray-500">{term.code}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={term.status === SystemStatus.ACTIVE ? 'success' : 'warning'}>
                        {term.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/system/academic-cycles/${id}/terms/${term.id}/edit`);
                        }}
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No terms found. Click "Add Term" to create one.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
