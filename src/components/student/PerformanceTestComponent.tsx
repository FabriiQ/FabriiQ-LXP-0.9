'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNetworkSimulation, NETWORK_CONDITIONS } from '@/hooks/useNetworkSimulation';
import { EducationalLoadingFact } from '@/components/ui/loading/EducationalLoadingFact';
import { LaborIllusionLoader } from '@/components/ui/loading/LaborIllusionLoader';
import { EnhancedVirtualizedActivityList } from '@/components/student/EnhancedVirtualizedActivityList';
import { BlurImage } from '@/components/ui/media/BlurImage';
import { ProgressiveLoader } from '@/components/ui/loading/ProgressiveLoader';
import { useChronoception } from '@/hooks/useChronoception';
import { Progress } from '@/components/ui/progress';

/**
 * Component for testing performance optimizations
 */
export function PerformanceTestComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('network');
  
  // Network simulation
  const { 
    isEnabled: isNetworkSimEnabled, 
    currentCondition,
    setEnabled: setNetworkSimEnabled,
    setCondition: setNetworkCondition,
    conditions
  } = useNetworkSimulation({
    enabled: false,
    initialCondition: NETWORK_CONDITIONS.GOOD
  });
  
  // Chronoception timer
  const { 
    formattedTime, 
    progress, 
    isRunning,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer
  } = useChronoception({
    actualTimeSeconds: 30,
    autoStart: false
  });
  
  // Generate mock activities
  const generateMockActivities = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `activity-${i}`,
      title: `Activity ${i + 1}`,
      type: i % 5 === 0 ? 'quiz' : i % 4 === 0 ? 'assignment' : i % 3 === 0 ? 'reading' : i % 2 === 0 ? 'video' : 'interactive',
      status: i % 4 === 0 ? 'completed' : i % 3 === 0 ? 'in-progress' : i % 2 === 0 ? 'pending' : 'overdue',
      dueDate: new Date(Date.now() + (i * 86400000)), // i days from now
      score: i % 4 === 0 ? Math.floor(Math.random() * 100) : undefined,
      totalScore: i % 4 === 0 ? 100 : undefined,
      className: 'Test Subject',
      chapter: `Chapter ${Math.floor(i / 10) + 1}`,
      content: {
        activityType: i % 5 === 0 ? 'quiz' : i % 4 === 0 ? 'assignment' : i % 3 === 0 ? 'reading' : i % 2 === 0 ? 'video' : 'interactive'
      },
      isNew: i % 7 === 0,
      completionPercentage: i % 4 === 0 ? 100 : i % 3 === 0 ? Math.floor(Math.random() * 100) : 0
    }));
  };
  
  // Mock activities
  const [mockActivities, setMockActivities] = useState(generateMockActivities(20));
  
  // Handle load test
  const handleLoadTest = (count: number) => {
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      setMockActivities(generateMockActivities(count));
      setIsLoading(false);
    }, 2000);
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Performance Testing Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="network">Network Simulation</TabsTrigger>
          <TabsTrigger value="loading">Loading Components</TabsTrigger>
          <TabsTrigger value="activities">Activity List</TabsTrigger>
          <TabsTrigger value="images">Image Loading</TabsTrigger>
        </TabsList>
        
        {/* Network Simulation Tab */}
        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Simulation</CardTitle>
              <CardDescription>
                Test the application under different network conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button 
                    variant={isNetworkSimEnabled ? "destructive" : "default"}
                    onClick={() => setNetworkSimEnabled(!isNetworkSimEnabled)}
                  >
                    {isNetworkSimEnabled ? "Disable Simulation" : "Enable Simulation"}
                  </Button>
                  
                  {isNetworkSimEnabled && (
                    <p className="text-sm">
                      Currently simulating: <strong>{currentCondition.name}</strong> network
                    </p>
                  )}
                </div>
                
                {isNetworkSimEnabled && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.values(conditions).map((condition) => (
                      <Button
                        key={condition.name}
                        variant={currentCondition.name === condition.name ? "secondary" : "outline"}
                        onClick={() => setNetworkCondition(condition)}
                        className="h-auto py-2"
                      >
                        {condition.name}
                        {condition.name !== 'Fast' && condition.name !== 'Offline' && (
                          <span className="block text-xs mt-1">
                            {condition.latency}ms / {(condition.downloadSpeed / 1024 / 1024).toFixed(1)}Mbps
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Loading Components Tab */}
        <TabsContent value="loading">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Educational Loading Facts</CardTitle>
                <CardDescription>
                  Display educational facts during loading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EducationalLoadingFact 
                  isLoading={true} 
                  showControls={true}
                  autoRotate={true}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Labor Illusion Loader</CardTitle>
                <CardDescription>
                  Show loading sequences that display work being done
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LaborIllusionLoader 
                  isLoading={true}
                  showTimeRemaining={true}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Chronoception Timer</CardTitle>
                <CardDescription>
                  Time remaining indicators that slightly underestimate actual time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={progress} className="h-2" />
                  
                  <p className="text-center text-2xl font-mono">
                    {formattedTime}
                  </p>
                  
                  <div className="flex justify-center gap-2">
                    {!isRunning ? (
                      <Button onClick={startTimer}>Start</Button>
                    ) : (
                      <Button onClick={pauseTimer}>Pause</Button>
                    )}
                    <Button variant="outline" onClick={resetTimer}>Reset</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Progressive Loader</CardTitle>
                <CardDescription>
                  Progressive loading with priority for visible content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 5, 10].map((priority) => (
                    <ProgressiveLoader 
                      key={priority}
                      priority={priority}
                      delay={500}
                    >
                      <div className="p-4 border rounded-md">
                        <p className="font-medium">Priority {priority} content</p>
                        <p className="text-sm text-muted-foreground">
                          This content has priority level {priority} (higher loads faster)
                        </p>
                      </div>
                    </ProgressiveLoader>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Activity List Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity List Performance</CardTitle>
              <CardDescription>
                Test performance with different numbers of activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleLoadTest(20)}>20 Activities</Button>
                  <Button onClick={() => handleLoadTest(100)}>100 Activities</Button>
                  <Button onClick={() => handleLoadTest(500)}>500 Activities</Button>
                  <Button onClick={() => handleLoadTest(1000)}>1,000 Activities</Button>
                  <Button onClick={() => handleLoadTest(5000)}>5,000 Activities</Button>
                </div>
                
                <div className="border rounded-md p-4">
                  <p className="mb-2 font-medium">
                    Showing {mockActivities.length} activities
                    {isLoading && ' (Loading...)'}
                  </p>
                  
                  {isLoading ? (
                    <div className="space-y-4">
                      <EducationalLoadingFact isLoading={true} />
                      <LaborIllusionLoader isLoading={true} />
                    </div>
                  ) : (
                    <div className="h-[400px] overflow-auto">
                      <EnhancedVirtualizedActivityList
                        activities={mockActivities}
                        isLoading={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Image Loading Tab */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Image Loading</CardTitle>
              <CardDescription>
                Test lazy loading images with blur-up previews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'https://source.unsplash.com/random/800x600?nature',
                  'https://source.unsplash.com/random/800x600?city',
                  'https://source.unsplash.com/random/800x600?people',
                  'https://source.unsplash.com/random/800x600?technology',
                  'https://source.unsplash.com/random/800x600?food',
                  'https://source.unsplash.com/random/800x600?animals'
                ].map((src, index) => (
                  <BlurImage
                    key={index}
                    src={src}
                    alt={`Test image ${index + 1}`}
                    width={400}
                    height={300}
                    className="rounded-md overflow-hidden"
                    placeholderColor="#e5e7eb"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
