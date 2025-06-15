import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, Home, Users, GraduationCap, BookOpen } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Offline Mode - Coordinator Portal',
  description: 'You are currently offline. Some features may be limited.',
};

/**
 * Offline Page
 * 
 * This page is displayed when the user is offline.
 * It provides access to cached pages and functionality.
 */
export default function OfflinePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border-amber-200 bg-amber-50/20">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <WifiOff className="h-6 w-6 text-amber-600" />
            <CardTitle>You're Offline</CardTitle>
          </div>
          <CardDescription>
            You are currently offline. Some features may be limited, but you can still access cached data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Any changes you make while offline will be synchronized when you reconnect to the internet.
            </p>
            
            <div className="flex justify-center">
              <Button 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Connection
              </Button>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Available Offline Pages</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Link href="/admin/coordinator" className="no-underline">
                  <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <Home className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Dashboard</h4>
                        <p className="text-xs text-muted-foreground">Main dashboard</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/admin/coordinator/teachers" className="no-underline">
                  <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Teachers</h4>
                        <p className="text-xs text-muted-foreground">Teacher management</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/admin/coordinator/students" className="no-underline">
                  <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Students</h4>
                        <p className="text-xs text-muted-foreground">Student management</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/admin/coordinator/courses" className="no-underline">
                  <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Courses</h4>
                        <p className="text-xs text-muted-foreground">Course management</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
            
            <div className="mt-8 text-sm text-muted-foreground">
              <h3 className="text-lg font-medium mb-2">Offline Capabilities</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>View cached teacher and student data</li>
                <li>View cached course information</li>
                <li>Access previously loaded analytics</li>
                <li>Make changes that will sync when back online</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
