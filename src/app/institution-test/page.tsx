'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NavigationLink, NavigationButton } from '@/components/ui/navigation/navigation-link';
import { InstitutionNavigationLink, InstitutionNavigationButton } from '@/components/ui/navigation/institution-navigation-link';
import { useInstitution } from '@/providers/institution-provider';
import { useNavigation } from '@/providers/navigation-provider';

/**
 * Institution Navigation Test Page
 * 
 * This page demonstrates the institution-based navigation components and allows
 * testing different institution contexts.
 */
export default function InstitutionTestPage() {
  const { institutionId, setInstitutionId } = useInstitution();
  const { navigate } = useNavigation();
  const [customInstitutionId, setCustomInstitutionId] = useState('');
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Institution-Based Navigation Test</CardTitle>
          <CardDescription>
            Test institution-aware navigation components and URL handling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <p className="font-semibold">Current Institution Context: <span className="text-primary">{institutionId}</span></p>
          </div>
          
          <div className="mb-6 space-y-4">
            <Label htmlFor="institution-id">Change Institution Context</Label>
            <div className="flex gap-2">
              <Input
                id="institution-id"
                value={customInstitutionId}
                onChange={(e) => setCustomInstitutionId(e.target.value)}
                placeholder="Enter institution ID"
              />
              <Button onClick={() => setInstitutionId(customInstitutionId)}>
                Set Institution
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="standard">
            <TabsList className="mb-4">
              <TabsTrigger value="standard">Standard Navigation</TabsTrigger>
              <TabsTrigger value="institution">Institution Navigation</TabsTrigger>
              <TabsTrigger value="programmatic">Programmatic Navigation</TabsTrigger>
            </TabsList>
            
            {/* Standard Navigation Test */}
            <TabsContent value="standard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Standard Navigation</CardTitle>
                  <CardDescription>
                    These links don't automatically include institution context
                  </CardDescription>
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
            
            {/* Institution Navigation Test */}
            <TabsContent value="institution" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Institution-Aware Navigation</CardTitle>
                  <CardDescription>
                    These links automatically include institution context
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">InstitutionNavigationLink Component</h3>
                      <div className="flex flex-wrap gap-2">
                        <InstitutionNavigationLink href="/dashboard" className="px-4 py-2 bg-primary text-primary-foreground rounded">
                          Dashboard
                        </InstitutionNavigationLink>
                        <InstitutionNavigationLink href="/student/classes" className="px-4 py-2 bg-secondary text-secondary-foreground rounded">
                          Classes
                        </InstitutionNavigationLink>
                        <InstitutionNavigationLink href="/teacher/dashboard" className="px-4 py-2 bg-accent text-accent-foreground rounded">
                          Teacher
                        </InstitutionNavigationLink>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">InstitutionNavigationButton Component</h3>
                      <div className="flex flex-wrap gap-2">
                        <InstitutionNavigationButton href="/dashboard" className="px-4 py-2 bg-primary text-primary-foreground rounded">
                          Dashboard
                        </InstitutionNavigationButton>
                        <InstitutionNavigationButton href="/student/classes" className="px-4 py-2 bg-secondary text-secondary-foreground rounded">
                          Classes
                        </InstitutionNavigationButton>
                        <InstitutionNavigationButton href="/teacher/dashboard" className="px-4 py-2 bg-accent text-accent-foreground rounded">
                          Teacher
                        </InstitutionNavigationButton>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Programmatic Navigation Test */}
            <TabsContent value="programmatic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Programmatic Navigation</CardTitle>
                  <CardDescription>
                    Test programmatic navigation with institution context
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">With Institution Context</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => navigate('/dashboard', { includeInstitution: true })}
                          className="bg-primary text-primary-foreground"
                        >
                          Dashboard
                        </Button>
                        <Button 
                          onClick={() => navigate('/student/classes', { includeInstitution: true })}
                          className="bg-secondary text-secondary-foreground"
                        >
                          Classes
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Without Institution Context</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => navigate('/dashboard', { includeInstitution: false })}
                          className="bg-primary text-primary-foreground"
                        >
                          Dashboard
                        </Button>
                        <Button 
                          onClick={() => navigate('/student/classes', { includeInstitution: false })}
                          className="bg-secondary text-secondary-foreground"
                        >
                          Classes
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
    </div>
  );
}
