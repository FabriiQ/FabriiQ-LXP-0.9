'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestActivitiesPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Activities</CardTitle>
          <CardDescription>
            This is a test page for activities functionality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Activities testing functionality will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
