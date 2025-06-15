'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Award, Clock, Target, BookOpen, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonalBest {
  id: string;
  title: string;
  value: string | number;
  date: Date;
  type: string;
  icon?: string;
}

interface PersonalBestsChartProps {
  personalBests: PersonalBest[];
  className?: string;
}

/**
 * PersonalBestsChart component displays a student's personal bests in a visually appealing way
 * 
 * Features:
 * - Visual representation of different types of personal bests
 * - Appropriate icons for different achievement types
 * - Responsive grid layout
 * - Gradient backgrounds for visual appeal
 */
export function PersonalBestsChart({ personalBests, className }: PersonalBestsChartProps) {
  if (!personalBests || personalBests.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <h3 className="text-lg font-medium">No Personal Bests Yet</h3>
        <p className="mt-1">Complete activities to set personal records</p>
      </div>
    );
  }

  // Get icon based on personal best type
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'score':
      case 'grade':
        return <Award className="h-5 w-5" />;
      case 'time':
      case 'speed':
      case 'completion_time':
        return <Clock className="h-5 w-5" />;
      case 'streak':
      case 'consistency':
        return <Target className="h-5 w-5" />;
      case 'activity_count':
      case 'completion_count':
        return <BookOpen className="h-5 w-5" />;
      case 'skill':
      case 'mastery':
        return <Brain className="h-5 w-5" />;
      default:
        return <Trophy className="h-5 w-5" />;
    }
  };

  // Get background gradient based on personal best type
  const getBackground = (type: string, index: number) => {
    const gradients = [
      'from-amber-50 to-yellow-100 border-amber-200',
      'from-blue-50 to-indigo-100 border-blue-200',
      'from-green-50 to-emerald-100 border-green-200',
      'from-purple-50 to-violet-100 border-purple-200',
      'from-pink-50 to-rose-100 border-pink-200',
    ];
    
    // Use type to determine gradient, with fallback to index-based selection
    switch (type.toLowerCase()) {
      case 'score':
      case 'grade':
        return gradients[0];
      case 'time':
      case 'speed':
      case 'completion_time':
        return gradients[1];
      case 'streak':
      case 'consistency':
        return gradients[2];
      case 'activity_count':
      case 'completion_count':
        return gradients[3];
      case 'skill':
      case 'mastery':
        return gradients[4];
      default:
        return gradients[index % gradients.length];
    }
  };

  // Format value based on type
  const formatValue = (value: string | number, type: string) => {
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const numValue = typeof value === 'number' ? value : Number(value);
      
      if (type.toLowerCase().includes('time') || type.toLowerCase().includes('speed')) {
        // Format as time (minutes/seconds)
        if (numValue < 60) {
          return `${numValue}s`;
        } else {
          const minutes = Math.floor(numValue / 60);
          const seconds = numValue % 60;
          return `${minutes}m ${seconds}s`;
        }
      } else if (type.toLowerCase().includes('score') || type.toLowerCase().includes('grade')) {
        // Format as percentage
        return `${numValue}%`;
      } else {
        // Default number formatting
        return numValue.toString();
      }
    }
    
    return value;
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {personalBests.map((best, index) => (
        <Card 
          key={best.id} 
          className={cn(
            "bg-gradient-to-br border", 
            getBackground(best.type, index)
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-2 bg-white/80 text-amber-600 flex-shrink-0">
                {getIcon(best.type)}
              </div>
              <div>
                <h4 className="font-medium">{best.title}</h4>
                <p className="text-lg font-bold mt-1">
                  {formatValue(best.value, best.type)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(best.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
