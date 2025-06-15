'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/atoms/badge';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { formatDate } from '@/lib/utils';
import { EditIcon, CalendarIcon, TrashIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, BookIcon, UsersIcon } from 'lucide-react';
import { Dialog } from '@/components/ui/custom-dialog';

export default function TermDetailPage({ params }: { params: { id: string; termId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  
  // Mock data for academic cycle
  const academicCycle = {
    id: params.id,
    code: 'AY-2023-24',
    name: 'Academic Year 2023-2024',
    type: 'ANNUAL',
    startDate: new Date('2023-08-01'),
    endDate: new Date('2024-07-31'),
    status: 'ACTIVE',
    description: 'This is the academic year 2023-2024',
    duration: 12,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    createdBy: 'admin',
    updatedBy: 'admin',
    institutionId: '1',
  };
  
  // Mock data for term
  const term = {
    id: params.termId,
    code: 'FALL-2023',
    name: 'Fall Semester 2023',
    termType: 'SEMESTER',
    termPeriod: 'FALL',
    startDate: new Date('2023-08-01'),
    endDate: new Date('2023-12-15'),
    status: 'ACTIVE',
    description: 'Fall semester for the 2023-2024 academic year',
    academicCycleId: params.id,
    courseId: '1',
    course: {
      id: '1',
      name: 'Computer Science',
      code: 'CS-101',
    },
    academicCycle: {
      id: params.id,
      name: 'Academic Year 2023-2024',
    },
    _count: {
      classes: 3,
      assessments: 5,
    },
  };
  
  const isLoading = false;
  const error = null;
  
  // Mock delete term mutation
  const deleteTerm = {
    mutate: (data: { id: string }) => {
      toast({
        title: 'Success',
        description: 'Term deleted successfully',
        variant: 'success',
      });
      router.push(`/admin/system/academic-cycles/${params.id}/terms`);
    },
    isLoading: false,
  };
  
  // Mock update term status mutation
  const updateTermStatus = {
    mutate: (data: { id: string, status: string }) => {
      toast({
        title: 'Success',
        description: `Term status updated to ${newStatus}`,
        variant: 'success',
      });
      setIsStatusDialogOpen(false);
    },
    isLoading: false,
  };
  
  const handleDelete = () => {
    deleteTerm.mutate({ id: params.termId });
  };
  
  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setIsStatusDialogOpen(true);
  };
  
  const confirmStatusChange = () => {
    if (newStatus) {
      updateTermStatus.mutate({
        id: params.termId,
        status: newStatus,
      });
    }
  };
  
  if (isLoading) {
    return (
      <PageLayout
        title="Term Details"
        description="Loading..."
        breadcrumbs={[
          { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
          { label: 'Academic Cycle', href: `/admin/system/academic-cycles/${params.id}` },
          { label: 'Terms', href: `/admin/system/academic-cycles/${params.id}/terms` },
          { label: 'Details', href: '#' },
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }
  
  if (error || !term) {
    return (
      <PageLayout
        title="Error"
        description="Failed to load term details"
        breadcrumbs={[
          { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
          { label: 'Academic Cycle', href: `/admin/system/academic-cycles/${params.id}` },
          { label: 'Terms', href: `/admin/system/academic-cycles/${params.id}/terms` },
          { label: 'Error', href: '#' },
        ]}
      >
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error ? ((error as unknown) as { message?: string })?.message || 'Term not found' : 'Term not found'}
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout
      title={term.name}
      description={`Term: ${term.code}`}
      breadcrumbs={[
        { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
        { label: academicCycle?.name || 'Academic Cycle', href: `/admin/system/academic-cycles/${params.id}` },
        { label: 'Terms', href: `/admin/system/academic-cycles/${params.id}/terms` },
        { label: term.name, href: '#' },
      ]}
      actions={
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/system/academic-cycles/${params.id}/terms`)}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Terms
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/system/academic-cycles/${params.id}/terms/${params.termId}/edit`)}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Term Information</CardTitle>
              <Badge
                variant={
                  term.status === 'ACTIVE' ? 'success' :
                  term.status === 'INACTIVE' ? 'warning' :
                  term.status === 'ARCHIVED' ? 'secondary' :
                  'destructive'
                }
              >
                {term.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Code</h3>
                <p className="mt-1">{term.code}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="mt-1">{term.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <p className="mt-1 capitalize">{term.termType.toLowerCase().replace('_', ' ')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Period</h3>
                <p className="mt-1 capitalize">{term.termPeriod.toLowerCase().replace('_', ' ')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                <p className="mt-1">{formatDate(term.startDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                <p className="mt-1">{formatDate(term.endDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Course</h3>
                <p className="mt-1">{term.course?.name || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Academic Cycle</h3>
                <p className="mt-1">{term.academicCycle?.name || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{term.description || 'No description provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleStatusChange('ACTIVE')}
                disabled={term.status === 'ACTIVE'}
              >
                <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />
                Set as Active
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange('INACTIVE')}
                disabled={term.status === 'INACTIVE'}
              >
                <XCircleIcon className="mr-2 h-4 w-4 text-yellow-500" />
                Set as Inactive
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange('ARCHIVED')}
                disabled={term.status === 'ARCHIVED'}
              >
                <ClockIcon className="mr-2 h-4 w-4 text-gray-500" />
                Archive
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="classes">
          <TabsList>
            <TabsTrigger value="classes">Classes ({term._count?.classes || 0})</TabsTrigger>
            <TabsTrigger value="assessments">Assessments ({term._count?.assessments || 0})</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="classes" className="mt-4">
            {term._count?.classes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Classes would be mapped here */}
                <Card className="hover:bg-gray-50 cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Sample Class</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-500">This is a placeholder for class data</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">No classes found</h3>
                <p className="mt-2 text-gray-500">No classes have been assigned to this term yet.</p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push(`/admin/system/classes/create?termId=${params.termId}`)}
                >
                  <BookIcon className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="assessments" className="mt-4">
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Assessments</h3>
              <p className="mt-2 text-gray-500">Manage assessments for this term.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push(`/admin/system/assessments?termId=${params.termId}`)}
              >
                <BookIcon className="mr-2 h-4 w-4" />
                Manage Assessments
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule" className="mt-4">
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Schedule</h3>
              <p className="mt-2 text-gray-500">Manage schedule for this term.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push(`/admin/system/schedule?termId=${params.termId}`)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Manage Schedule
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Term"
        description="Are you sure you want to delete this term? This action cannot be undone."
        actions={
          <>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      />
      
      {/* Status Change Dialog */}
      <Dialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        title={`Change Status to ${newStatus}`}
        description={`Are you sure you want to change the status of this term to ${newStatus}?`}
        actions={
          <>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={confirmStatusChange}>
              Confirm
            </Button>
          </>
        }
      />
    </PageLayout>
  );
} 