'use client';

import { useState } from 'react';
import { NavigationLink, NavigationButton } from '@/components/ui/navigation/navigation-link';
import { NavigationDebugger } from '@/components/ui/navigation/navigation-debugger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigation } from '@/providers/navigation-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Navigation Test Page
 * 
 * This page demonstrates different navigation methods and allows testing
 * the improved navigation components.
 */
export default function NavigationTestPage() {
  const router = useRouter();
  const { navigate, isNavigating } = useNavigation();
  const [clickCount, setClickCount] = useState(0);
  
  // Handle rapid clicks to test debouncing
  const handleRapidClick = (href: string) => {
    setClickCount(prev => prev + 1);
    navigate(href);
  };
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Navigation Test Page</CardTitle>
          <CardDescription>
            Test different navigation methods and components to identify and fix issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This page allows you to test different navigation methods and components.
            Use the tabs below to switch between different test scenarios.
          </p>
          
          <Tabs defaultValue="standard">
            <TabsList className="mb-4">
              <TabsTrigger value="standard">Standard Navigation</TabsTrigger>
              <TabsTrigger value="rapid">Rapid Clicks</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>
            
            {/* Standard Navigation Test */}
            <TabsContent value="standard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Standard Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">NavigationLink Component</h3>
                      <div className="flex flex-wrap gap-2">
                        <NavigationLink href="/dashboard" className="px-4 py-2 bg-primary text-primary-foreground rounded">
                          Dashboard
                        </NavigationLink>
                        <NavigationLink href="/student/classes" className="px-4 py-2 bg-secondary text-secondary-foreground rounded">
                          Classes
                        </NavigationLink>
                        <NavigationLink href="/teacher/dashboard" className="px-4 py-2 bg-accent text-accent-foreground rounded">
                          Teacher
                        </NavigationLink>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">NavigationButton Component</h3>
                      <div className="flex flex-wrap gap-2">
                        <NavigationButton href="/dashboard" className="px-4 py-2 bg-primary text-primary-foreground rounded">
                          Dashboard
                        </NavigationButton>
                        <NavigationButton href="/student/classes" className="px-4 py-2 bg-secondary text-secondary-foreground rounded">
                          Classes
                        </NavigationButton>
                        <NavigationButton href="/teacher/dashboard" className="px-4 py-2 bg-accent text-accent-foreground rounded">
                          Teacher
                        </NavigationButton>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Rapid Clicks Test */}
            <TabsContent value="rapid" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rapid Clicks Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Click rapidly on these buttons to test debouncing:</p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Click count: {clickCount}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => handleRapidClick('/dashboard')}
                          disabled={isNavigating}
                        >
                          Rapid Click Test
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">NavigationLink with debouncing:</p>
                      <div className="flex flex-wrap gap-2">
                        <NavigationLink 
                          href="/dashboard" 
                          className="px-4 py-2 bg-primary text-primary-foreground rounded"
                          onClick={() => setClickCount(prev => prev + 1)}
                        >
                          Dashboard (Debounced)
                        </NavigationLink>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Comparison Test */}
            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Navigation Method Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Next.js Link</h3>
                      <div className="flex flex-wrap gap-2">
                        <Link href="/dashboard" className="px-4 py-2 bg-primary text-primary-foreground rounded">
                          Dashboard
                        </Link>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">router.push()</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => router.push('/dashboard')}
                          className="px-4 py-2 bg-secondary text-secondary-foreground"
                        >
                          Dashboard
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">window.location</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => window.location.href = '/dashboard'}
                          className="px-4 py-2 bg-accent text-accent-foreground"
                        >
                          Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Navigation Debugger */}
      <NavigationDebugger />
    </div>
  );
}
