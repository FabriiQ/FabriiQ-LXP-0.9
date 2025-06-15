import React, { useMemo } from 'react';
// @ts-ignore - Type issues with Nivo HeatMap
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { BaseChart, BaseChartProps } from './BaseChart';
import { AnalyticsDataset } from '../types';
import { useTheme } from 'next-themes';

export interface HeatMapProps extends Omit<BaseChartProps, 'children'> {
  dataset: AnalyticsDataset;
  showValues?: boolean;
  showLegend?: boolean;
  colorScheme?: string;
  forceSquare?: boolean;
  sizeVariation?: number;
  padding?: number;
  hoverTarget?: 'cell' | 'row' | 'column' | 'rowColumn';
  axisTop?: {
    legend?: string;
    legendOffset?: number;
    legendPosition?: 'start' | 'middle' | 'end';
  };
  axisLeft?: {
    legend?: string;
    legendOffset?: number;
    legendPosition?: 'start' | 'middle' | 'end';
  };
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export function HeatMap({
  dataset,
  showValues = true,
  showLegend = true,
  colorScheme = 'blues',
  forceSquare = true,
  sizeVariation = 0.5,
  padding = 4,
  hoverTarget = 'cell',
  axisTop,
  axisLeft,
  margin = {
    top: 60,
    right: 90,
    bottom: 60,
    left: 90,
  },
  ...rest
}: HeatMapProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Transform dataset into Nivo heatmap format
  // Transform dataset into Nivo heatmap format
  const data = useMemo(() => {
    // Get all unique categories across all series
    const allCategories = new Set<string>();
    const allTimestamps = new Set<string>();

    dataset.series.forEach(series => {
      series.data.forEach(point => {
        if (point.category) {
          allCategories.add(point.category);
        }
        allTimestamps.add(point.timestamp.toISOString().split('T')[0]);
      });
    });

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort();

    // Create data array for heatmap
    return Array.from(allCategories).map(category => {
      const dataPoint: Record<string, any> = { id: category };

      sortedTimestamps.forEach(timestamp => {
        let value = 0;

        dataset.series.forEach(series => {
          const point = series.data.find(p =>
            p.category === category &&
            p.timestamp.toISOString().split('T')[0] === timestamp
          );

          if (point) {
            value += point.value;
          }
        });

        dataPoint[timestamp] = value;
      });

      return dataPoint;
    });
  }, [dataset]);

  // Get keys for the heatmap
  const keys = useMemo(() => {
    const allTimestamps = new Set<string>();
    dataset.series.forEach(series => {
      series.data.forEach(point => {
        allTimestamps.add(point.timestamp.toISOString().split('T')[0]);
      });
    });
    return Array.from(allTimestamps).sort();
  }, [dataset]);

  return (
    <BaseChart dataset={dataset} {...rest}>
      <ResponsiveHeatMap
        data={data}
        keys={keys}
        indexBy="id"
        margin={{
          top: margin.top || 60,
          right: margin.right || 90,
          bottom: margin.bottom || 60,
          left: margin.left || 90,
        }}
        forceSquare={forceSquare}
        sizeVariation={false}
        padding={padding}
        colors={{
          type: 'sequential',
          scheme: 'blues',
        }}
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: axisTop?.legend || 'Date',
          legendOffset: axisTop?.legendOffset || -40,
          legendPosition: axisTop?.legendPosition || 'middle',
          truncateTickAt: 0,
        }}
        axisRight={null}
        axisBottom={null}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: axisLeft?.legend || 'Category',
          legendPosition: axisLeft?.legendPosition || 'middle',
          legendOffset: axisLeft?.legendOffset || -72,
          truncateTickAt: 0,
        }}
        cellOpacity={1}
        cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
        hoverTarget={hoverTarget}
        cellHoverOthersOpacity={0.25}
        cellHoverOpacity={1}
        animate={true}
        motionStiffness={80}
        motionDamping={9}
        enableLabels={showValues}
        legends={
          showLegend
            ? [
                {
                  anchor: 'right',
                  translateX: 30,
                  translateY: 0,
                  length: 120,
                  thickness: 8,
                  direction: 'column',
                  tickPosition: 'after',
                  tickSize: 3,
                  tickSpacing: 4,
                  tickOverlap: false,
                  tickFormat: '>-.2s',
                  title: dataset.metricName,
                  titleAlign: 'start',
                  titleOffset: 4,
                },
              ]
            : []
        }
        theme={{
          text: {
            fill: isDark ? '#f8f9fa' : '#333333',
          },
          axis: {
            ticks: {
              text: {
                fill: isDark ? '#ced4da' : '#666666',
              },
              line: {
                stroke: isDark ? '#495057' : '#dddddd',
              },
            },
            legend: {
              text: {
                fill: isDark ? '#f8f9fa' : '#333333',
              },
            },
          },
          tooltip: {
            container: {
              background: isDark ? '#212529' : '#ffffff',
              color: isDark ? '#f8f9fa' : '#333333',
              boxShadow: '0 3px 9px rgba(0, 0, 0, 0.5)',
            },
          },
        }}
      />
    </BaseChart>
  );
}
