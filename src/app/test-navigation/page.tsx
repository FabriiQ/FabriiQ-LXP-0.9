'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Button } from '@/components/ui/core/button';
import { PageHeader } from '@/components/ui/atoms/page-header';

export default function TestNavigationPage() {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader
        title="Navigation Test Page"
        description="This page is used for testing navigation components"
      />

      <Card>
        <CardHeader>
          <CardTitle>Navigation Components Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="basic">Basic Navigation</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Navigation</TabsTrigger>
              <TabsTrigger value="mobile">Mobile Navigation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Navigation Test</h3>
                <p>This tab tests basic navigation components.</p>
                <div className="flex space-x-2">
                  <Button variant="default">Default Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Advanced Navigation Test</h3>
                <p>This tab tests advanced navigation components.</p>
                <div className="flex space-x-2">
                  <Button variant="default">Advanced Option 1</Button>
                  <Button variant="outline">Advanced Option 2</Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="mobile" className="p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Mobile Navigation Test</h3>
                <p>This tab tests mobile-specific navigation components.</p>
                <div className="flex space-x-2">
                  <Button variant="default">Mobile Option 1</Button>
                  <Button variant="outline">Mobile Option 2</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
