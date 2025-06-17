'use client';

import React from 'react';
// @ts-ignore - Ignore type issues with Nivo HeatMap
import { ResponsiveHeatMap } from '@nivo/heatmap';

interface HeatMapDataPoint {
  x: string;
  y: number;
}

interface HeatMapSeries {
  id: string;
  data: HeatMapDataPoint[];
}

interface BloomHeatMapProps {
  data: HeatMapSeries[];
  height?: number | string;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  colors?: string[] | { scheme: string };
  valueFormat?: string;
  axisTop?: any;
  axisRight?: any;
  axisBottom?: any;
  axisLeft?: any;
  legends?: any[];
  animate?: boolean;
  motionConfig?: string;
  hoverTarget?: 'cell' | 'row' | 'column' | 'rowColumn';
  forceSquare?: boolean;
  className?: string;
}

/**
 * A wrapper component for Nivo's ResponsiveHeatMap that handles TypeScript issues
 */
export function BloomHeatMap({
  data,
  height = 400,
  margin = { top: 60, right: 90, bottom: 60, left: 90 },
  colors = { scheme: 'blues' },
  valueFormat = '>-.2f',
  axisTop,
  axisRight = null,
  axisBottom = null,
  axisLeft,
  legends = [],
  animate = true,
  motionConfig = 'gentle',
  hoverTarget = 'cell',
  forceSquare = false,
  className
}: BloomHeatMapProps) {
  // Validate data to prevent errors
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available for heatmap</p>
      </div>
    );
  }

  // Ensure each item in data has a valid 'data' property that is an array
  const validData = data.map((item: any) => ({
    ...item,
    data: Array.isArray(item.data) ? item.data : []
  }));

  // Flatten all data points to check for content and uniformity
  const allDataPoints = validData.flatMap(series => series.data);

  // Case 1: Series exist but are empty (no data points)
  if (validData.length > 0 && allDataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data points to display in the heatmap</p>
      </div>
    );
  }

  // Case 2: All data points have the same y value
  if (allDataPoints.length > 0) {
    const allYValues = allDataPoints.map(point => point.y);
    const firstYValue = allYValues[0];
    const allValuesAreSame = allYValues.every(value => value === firstYValue);

    if (allValuesAreSame) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">
            All data values are uniform ({firstYValue}). A continuous color scale cannot be meaningfully applied.
          </p>
        </div>
      );
    }
  }

  return (
    <div style={{ height }} className={className}>
      {/* @ts-ignore - Ignore type issues with Nivo HeatMap */}
      <ResponsiveHeatMap
        data={validData}
        margin={margin}
        valueFormat={valueFormat}
        colors={colors}
        axisTop={axisTop}
        axisRight={axisRight}
        axisBottom={axisBottom}
        axisLeft={axisLeft}
        legends={legends}
        animate={animate}
        motionConfig={motionConfig}
        hoverTarget={hoverTarget}
        forceSquare={forceSquare}
        // Add any other props needed
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
    </div>
  );
}
