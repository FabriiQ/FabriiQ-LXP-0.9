'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/data-display/card';
import { CalendarIcon, PlusIcon, FilterIcon, Eye } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/forms/select';

export default function CalendarManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('holidays');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Calendar Management"
          description="Manage holidays, academic events, and schedule patterns"
        />
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => router.push('/admin/system/calendar/view')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
          <Button onClick={() => {
            switch (activeTab) {
              case 'holidays':
                router.push('/admin/system/calendar/holidays/create');
                break;
              case 'events':
                router.push('/admin/system/calendar/events/create');
                break;
              case 'patterns':
                router.push('/admin/system/calendar/patterns/create');
                break;
            }
          }}>
            <PlusIcon className="h-4 w-4 mr-2" />
            {activeTab === 'holidays' && 'Add Holiday'}
            {activeTab === 'events' && 'Add Academic Event'}
            {activeTab === 'patterns' && 'Add Schedule Pattern'}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="holidays" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="events">Academic Events</TabsTrigger>
            <TabsTrigger value="patterns">Schedule Patterns</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-40">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TabsContent value="holidays">
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">No Holidays Found</h3>
              <p className="mt-1">Get started by creating a holiday.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push('/admin/system/calendar/holidays/create')}
              >
                Create Holiday
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="events">
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">No Academic Events Found</h3>
              <p className="mt-1">Get started by creating an academic event.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push('/admin/system/calendar/events/create')}
              >
                Create Academic Event
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="patterns">
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">No Schedule Patterns Found</h3>
              <p className="mt-1">Get started by creating a schedule pattern.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push('/admin/system/calendar/patterns/create')}
              >
                Create Schedule Pattern
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
} 