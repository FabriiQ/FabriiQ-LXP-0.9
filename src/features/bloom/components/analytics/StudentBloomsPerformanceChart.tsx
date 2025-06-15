'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BloomsTaxonomyLevel } from '../../types/bloom-taxonomy';
import { StudentBloomsPerformance } from '../../types/analytics';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import dynamic from 'next/dynamic';

// Dynamically import the ResponsiveRadar component to avoid SSR issues
const ResponsiveRadar = dynamic(
  () => import('@nivo/radar').then(mod => mod.ResponsiveRadar),
  { ssr: false }
);

interface StudentBloomsPerformanceChartProps {
  performance: StudentBloomsPerformance;
  title?: string;
  description?: string;
  height?: number;
  isLoading?: boolean;
  className?: string;
}

export function StudentBloomsPerformanceChart({
  performance,
  title = "Student Cognitive Performance",
  description = "Performance across Bloom's Taxonomy cognitive levels",
  height = 300,
  isLoading = false,
  className = ""
}: StudentBloomsPerformanceChartProps) {
  // Transform performance data for the radar chart
  const chartData = Object.values(BloomsTaxonomyLevel).map(level => {
    const metadata = BLOOMS_LEVEL_METADATA[level];

    return {
      level: metadata.name,
      value: performance[level],
      color: metadata.color
    };
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse bg-gray-200 rounded-md w-full h-4/5" />
            </div>
          ) : (
            <ResponsiveRadar
              data={chartData}
              keys={['value']}
              indexBy="level"
              maxValue={100}
              margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
              borderWidth={2}
              gridLabelOffset={36}
              dotSize={10}
              dotColor={{ theme: 'background' }}
              dotBorderWidth={2}
              colors={item => item.color}
              blendMode="multiply"
              motionConfig="gentle"
              legends={[
                {
                  anchor: 'top-left',
                  direction: 'column',
                  translateX: -50,
                  translateY: -40,
                  itemWidth: 80,
                  itemHeight: 20,
                  itemTextColor: '#999',
                  symbolSize: 12,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: '#000'
                      }
                    }
                  ]
                }
              ]}
              theme={{
                tooltip: {
                  container: {
                    background: 'white',
                    color: 'black',
                    fontSize: '12px',
                    borderRadius: '4px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
                    padding: '5px 9px'
                  }
                }
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
