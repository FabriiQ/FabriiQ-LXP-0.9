'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, FilterIcon } from 'lucide-react';
import { SystemTeachersContent } from './SystemTeachersContent';

export default function SystemTeachersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="System Teachers"
          description="Manage all teachers across campuses"
        />
        <Button onClick={() => router.push('/admin/system/teachers/create')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Teacher
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Teachers</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" className="ml-4">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <SystemTeachersContent activeTab={activeTab} />
        </CardContent>
      </Card>
    </div>
  );
}
