'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssessmentComparison } from '../../types/analytics';
import { BloomsTaxonomyLevel } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { ResponsiveLine } from '@nivo/line';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AssessmentComparisonChartProps {
  comparison: AssessmentComparison;
  title?: string;
  description?: string;
  height?: number;
  className?: string;
  isLoading?: boolean;
}

export function AssessmentComparisonChart({
  comparison,
  title = "Assessment Comparison",
  description = "Comparative analysis across assessments",
  height = 400,
  className = "",
  isLoading = false
}: AssessmentComparisonChartProps) {
  // Transform data for the overall score comparison
  const overallScoreData = [
    {
      id: 'Overall Score',
      color: '#4caf50',
      data: comparison.assessmentNames.map((name, index) => ({
        x: name,
        y: comparison.overallScoreComparison[index]
      }))
    }
  ];

  // Transform data for the Bloom's level comparison
  const bloomsLevelData = Object.entries(comparison.bloomsLevelComparison).map(([level, values]) => {
    const bloomsLevel = level as BloomsTaxonomyLevel;
    const metadata = BLOOMS_LEVEL_METADATA[bloomsLevel];
    
    return {
      id: metadata.name,
      color: metadata.color,
      data: comparison.assessmentNames.map((name, index) => ({
        x: name,
        y: values[index]
      }))
    };
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse bg-gray-200 rounded-md w-full h-4/5" />
          </div>
        ) : (
          <Tabs defaultValue="overall">
            <TabsList className="mb-4">
              <TabsTrigger value="overall">Overall Score</TabsTrigger>
              <TabsTrigger value="blooms">Bloom's Levels</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overall">
              <div style={{ height }}>
                <ResponsiveLine
                  data={overallScoreData}
                  margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                  xScale={{ type: 'point' }}
                  yScale={{
                    type: 'linear',
                    min: 0,
                    max: 100,
                    stacked: false
                  }}
                  curve="monotoneX"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Assessment',
                    legendOffset: 40,
                    legendPosition: 'middle'
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Score',
                    legendOffset: -50,
                    legendPosition: 'middle'
                  }}
                  colors={{ scheme: 'category10' }}
                  pointSize={10}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  legends={[
                    {
                      anchor: 'top-right',
                      direction: 'column',
                      justify: false,
                      translateX: 0,
                      translateY: 0,
                      itemsSpacing: 0,
                      itemDirection: 'left-to-right',
                      itemWidth: 80,
                      itemHeight: 20,
                      itemOpacity: 0.75,
                      symbolSize: 12,
                      symbolShape: 'circle',
                      symbolBorderColor: 'rgba(0, 0, 0, .5)',
                      effects: [
                        {
                          on: 'hover',
                          style: {
                            itemBackground: 'rgba(0, 0, 0, .03)',
                            itemOpacity: 1
                          }
                        }
                      ]
                    }
                  ]}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="blooms">
              <div style={{ height }}>
                <ResponsiveLine
                  data={bloomsLevelData}
                  margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                  xScale={{ type: 'point' }}
                  yScale={{
                    type: 'linear',
                    min: 0,
                    max: 100,
                    stacked: false
                  }}
                  curve="monotoneX"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Assessment',
                    legendOffset: 40,
                    legendPosition: 'middle'
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Percentage',
                    legendOffset: -50,
                    legendPosition: 'middle'
                  }}
                  colors={{ scheme: 'category10' }}
                  pointSize={10}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  legends={[
                    {
                      anchor: 'right',
                      direction: 'column',
                      justify: false,
                      translateX: 100,
                      translateY: 0,
                      itemsSpacing: 0,
                      itemDirection: 'left-to-right',
                      itemWidth: 80,
                      itemHeight: 20,
                      itemOpacity: 0.75,
                      symbolSize: 12,
                      symbolShape: 'circle',
                      symbolBorderColor: 'rgba(0, 0, 0, .5)',
                      effects: [
                        {
                          on: 'hover',
                          style: {
                            itemBackground: 'rgba(0, 0, 0, .03)',
                            itemOpacity: 1
                          }
                        }
                      ]
                    }
                  ]}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
