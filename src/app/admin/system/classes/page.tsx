'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon } from 'lucide-react';
import { SystemClassesContent } from './SystemClassesContent';

export default function SystemClassesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="System Classes"
          description="Manage all classes across campuses"
        />
        <Button onClick={() => router.push('/admin/system/classes/create')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Class
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Classes</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <SystemClassesContent activeTab={activeTab} />
        </CardContent>
      </Card>
    </div>
  );
}
