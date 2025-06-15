'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BloomHeatMap } from '@/components/charts/BloomHeatMap';

interface MasteryHeatmapProps {
  data: {
    studentIds: string[];
    studentNames: string[];
    topicIds: string[];
    topicNames: string[];
    heatmapData: number[][];
  };
  title?: string;
  description?: string;
  height?: number;
  className?: string;
  isLoading?: boolean;
}

export function MasteryHeatmap({
  data,
  title = "Class Mastery Heatmap",
  description = "Topic mastery levels across students",
  height = 400,
  className = "",
  isLoading = false
}: MasteryHeatmapProps) {
  // Transform data for the heatmap to match HeatMapSerie format
  const heatmapData = data.studentNames.map((student, studentIndex) => {
    // Create data array with proper format for HeatMapSerie
    const seriesData = data.topicNames.map((topic, topicIndex) => ({
      x: topic,
      y: data.heatmapData[studentIndex][topicIndex]
    }));

    return {
      id: student,
      data: seriesData
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
            <BloomHeatMap
              data={heatmapData}
              height={height}
              margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
              valueFormat=">-.2f"
              forceSquare={false}
              axisTop={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Topics',
                legendOffset: -40
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Students',
                legendPosition: 'middle',
                legendOffset: -72
              }}
              colors={{ scheme: 'greens' }}
              legends={[
                {
                  anchor: 'bottom',
                  translateX: 0,
                  translateY: 30,
                  length: 400,
                  thickness: 8,
                  direction: 'row',
                  tickPosition: 'after',
                  tickSize: 3,
                  tickSpacing: 4,
                  tickOverlap: false,
                  tickFormat: '>-.2f',
                  title: 'Mastery Level →',
                  titleAlign: 'start',
                  titleOffset: 4
                }
              ]}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
