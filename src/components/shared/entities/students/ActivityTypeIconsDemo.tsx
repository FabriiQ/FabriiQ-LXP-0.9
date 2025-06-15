'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomActivityTypeIcon } from './CustomActivityTypeIcons';
import { ActivityTypeIcon } from './ActivityTypeIcons';
import { LearningActivityType } from '@/server/api/constants';

/**
 * Demo component to showcase the custom activity type icons
 * This component displays all activity types with their custom icons
 * in different colors and sizes
 */
export function ActivityTypeIconsDemo() {
  // Brand colors from the design system
  const brandColors = {
    primaryGreen: '#1F504B',
    mediumTeal: '#5A8A84',
    lightMint: '#D8E3E0',
    red: '#D92632',
    orange: '#FF9852',
    purple: '#6126AE',
    darkBlue: '#004EB2',
    lightBlue: '#2F96F4',
  };

  // Convert LearningActivityType enum to array
  const activityTypes = Object.values(LearningActivityType);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Custom Activity Type Icons</CardTitle>
          <CardDescription>
            Modern, visually distinct icons for different activity types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activityTypes.map((type) => (
              <div key={type} className="flex flex-col items-center p-4 border rounded-md">
                <div className="mb-2">
                  <CustomActivityTypeIcon 
                    type={type} 
                    size={32} 
                    primaryColor={brandColors.primaryGreen}
                    secondaryColor={brandColors.mediumTeal}
                  />
                </div>
                <span className="text-sm text-center">{type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Variations</CardTitle>
          <CardDescription>
            The same icons with different color schemes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Green Theme */}
            <div className="space-y-2">
              <h3 className="font-medium">Primary Green</h3>
              <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-md">
                {activityTypes.slice(0, 6).map((type) => (
                  <div key={`green-${type}`} className="flex flex-col items-center">
                    <CustomActivityTypeIcon 
                      type={type} 
                      size={24} 
                      primaryColor={brandColors.primaryGreen}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Medium Teal Theme */}
            <div className="space-y-2">
              <h3 className="font-medium">Medium Teal</h3>
              <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-md">
                {activityTypes.slice(0, 6).map((type) => (
                  <div key={`teal-${type}`} className="flex flex-col items-center">
                    <CustomActivityTypeIcon 
                      type={type} 
                      size={24} 
                      primaryColor={brandColors.mediumTeal}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Light Blue Theme */}
            <div className="space-y-2">
              <h3 className="font-medium">Light Blue</h3>
              <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-md">
                {activityTypes.slice(0, 6).map((type) => (
                  <div key={`blue-${type}`} className="flex flex-col items-center">
                    <CustomActivityTypeIcon 
                      type={type} 
                      size={24} 
                      primaryColor={brandColors.lightBlue}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Size Variations</CardTitle>
          <CardDescription>
            The same icons in different sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 items-end">
            {[16, 24, 32, 48].map((size) => (
              <div key={`size-${size}`} className="flex flex-col items-center">
                <CustomActivityTypeIcon 
                  type="MULTIPLE_CHOICE" 
                  size={size} 
                  primaryColor={brandColors.primaryGreen}
                />
                <span className="text-xs mt-1">{size}px</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration with ActivityTypeIcon</CardTitle>
          <CardDescription>
            How the custom icons look when used through the ActivityTypeIcon component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activityTypes.slice(0, 8).map((type) => (
              <div key={`integrated-${type}`} className="flex items-center gap-2 p-2 border rounded-md">
                <ActivityTypeIcon type={type} className="h-5 w-5" color={brandColors.primaryGreen} />
                <span className="text-sm">{type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
