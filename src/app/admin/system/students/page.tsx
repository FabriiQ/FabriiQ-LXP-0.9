'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/atoms/button';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { PlusIcon } from 'lucide-react';
import { SystemStudentsContent } from './SystemStudentsContent';
import { SystemStudentImportDialog } from '@/components/admin/system/students/SystemStudentImportDialog';
import { SystemStudentExportDialog } from '@/components/admin/system/students/SystemStudentExportDialog';

export default function SystemStudentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="System Students"
          description="Manage all students across campuses"
        />
        <div className="flex gap-2">
          <SystemStudentImportDialog />
          <SystemStudentExportDialog />
          <Button onClick={() => router.push('/admin/system/students/create')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Student
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Students</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <SystemStudentsContent activeTab={activeTab} />
        </CardContent>
      </Card>
    </div>
  );
}
