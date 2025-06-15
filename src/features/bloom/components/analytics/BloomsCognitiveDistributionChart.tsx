'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BloomsTaxonomyLevel, BloomsDistribution } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { ResponsiveBar } from '@nivo/bar';

interface BloomsCognitiveDistributionChartProps {
  distribution: BloomsDistribution;
  compareDistribution?: BloomsDistribution;
  title?: string;
  description?: string;
  height?: number;
  showLegend?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function BloomsCognitiveDistributionChart({
  distribution,
  compareDistribution,
  title = "Cognitive Level Distribution",
  description = "Distribution of cognitive levels based on Bloom's Taxonomy",
  height = 300,
  showLegend = true,
  isLoading = false,
  className = ""
}: BloomsCognitiveDistributionChartProps) {
  // Transform distribution data for the chart
  const chartData = Object.entries(distribution).map(([level, value]) => {
    const bloomsLevel = level as BloomsTaxonomyLevel;
    const metadata = BLOOMS_LEVEL_METADATA[bloomsLevel];
    const compareValue = compareDistribution ? compareDistribution[bloomsLevel] || 0 : undefined;

    return {
      level: metadata.name,
      value,
      compareValue,
      color: metadata.color
    };
  }).sort((a, b) => {
    // Sort by the order of Bloom's levels (Remember -> Create)
    const levelA = Object.values(BloomsTaxonomyLevel).findIndex(
      level => level === a.level.toUpperCase()
    );
    const levelB = Object.values(BloomsTaxonomyLevel).findIndex(
      level => level === b.level.toUpperCase()
    );
    return levelA - levelB;
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
            <ResponsiveBar
              data={chartData}
              keys={compareDistribution ? ['value', 'compareValue'] : ['value']}
              indexBy="level"
              margin={{ top: 10, right: 20, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={({ id, data }) => id === 'compareValue' ? 'rgba(0,0,0,0.3)' : data.color}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Cognitive Level',
                legendPosition: 'middle',
                legendOffset: 40
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Percentage',
                legendPosition: 'middle',
                legendOffset: -50
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              legends={showLegend && compareDistribution ? [
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ] : []}
              role="application"
              ariaLabel="Bloom's Taxonomy Distribution"
              barAriaLabel={e => `${e.id}: ${e.formattedValue} in level: ${e.indexValue}`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
