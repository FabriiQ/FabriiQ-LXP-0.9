'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Video, Users, Clock, Target } from 'lucide-react';

/**
 * TeacherActivitiesExample Component
 * 
 * This is an example component showcasing the activities feature.
 * It demonstrates various activity types and their capabilities.
 */
export function TeacherActivitiesExample() {
  const exampleActivities = [
    {
      id: '1',
      title: 'Reading Comprehension: Solar System',
      type: 'reading',
      description: 'Students read about planets and answer comprehension questions',
      icon: BookOpen,
      duration: '30 min',
      difficulty: 'Intermediate',
      capabilities: ['Gradable', 'Interactive'],
      status: 'Active'
    },
    {
      id: '2',
      title: 'Math Quiz: Fractions',
      type: 'quiz',
      description: 'Multiple choice quiz covering fraction operations',
      icon: FileText,
      duration: '20 min',
      difficulty: 'Beginner',
      capabilities: ['Auto-graded', 'Timed'],
      status: 'Draft'
    },
    {
      id: '3',
      title: 'Science Video: Photosynthesis',
      type: 'video',
      description: 'Educational video with embedded questions',
      icon: Video,
      duration: '45 min',
      difficulty: 'Advanced',
      capabilities: ['Interactive', 'Progress Tracking'],
      status: 'Active'
    },
    {
      id: '4',
      title: 'Group Project: History Timeline',
      type: 'manual-grading',
      description: 'Collaborative timeline creation project',
      icon: Users,
      duration: '2 weeks',
      difficulty: 'Advanced',
      capabilities: ['Manual Grading', 'Collaborative'],
      status: 'Active'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-blue-100 text-blue-800';
      case 'Intermediate':
        return 'bg-orange-100 text-orange-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Teacher Activities Example</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This is an example page showcasing the activities feature. It demonstrates
          various activity types, their capabilities, and how they can be used in
          educational contexts.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {exampleActivities.map((activity) => {
          const IconComponent = activity.icon;
          
          return (
            <Card key={activity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{activity.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} Activity
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{activity.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <Badge variant="outline" className={getDifficultyColor(activity.difficulty)}>
                      {activity.difficulty}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Capabilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {activity.capabilities.map((capability) => (
                      <Badge key={capability} variant="secondary" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Edit Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About This Example</CardTitle>
          <CardDescription>
            Understanding the Activities Feature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Activity Types</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Reading activities with comprehension questions</li>
                <li>• Interactive quizzes with multiple question types</li>
                <li>• Video activities with embedded interactions</li>
                <li>• Manual grading activities for projects</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Key Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic and manual grading options</li>
                <li>• Progress tracking and analytics</li>
                <li>• Collaborative and individual activities</li>
                <li>• Flexible difficulty and duration settings</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              This example demonstrates the structure and capabilities of the activities system.
              In a real implementation, these activities would be connected to the database
              and include full CRUD operations, student submissions, and grading workflows.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
