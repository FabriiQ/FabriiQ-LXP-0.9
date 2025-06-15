import React, { useMemo } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { BaseChart, BaseChartProps } from './BaseChart';
import { AnalyticsDataset } from '../types';
import { useTheme } from 'next-themes';

export interface PieChartProps extends Omit<BaseChartProps, 'children'> {
  dataset: AnalyticsDataset;
  innerRadius?: number;
  padAngle?: number;
  cornerRadius?: number;
  activeOuterRadiusOffset?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  colorScheme?: string;
  sortByValue?: boolean;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export function PieChart({
  dataset,
  innerRadius = 0.5,
  padAngle = 0.7,
  cornerRadius = 3,
  activeOuterRadiusOffset = 8,
  showLegend = true,
  showLabels = true,
  showValues = true,
  colorScheme = 'nivo',
  sortByValue = false,
  margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  ...rest
}: PieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Transform dataset into Nivo pie chart format
  const chartData = useMemo(() => {
    // If we have multiple series, use the first one
    const series = dataset.series[0];
    
    if (!series) return [];
    
    return series.data.map(point => {
      return {
        id: point.label || point.category || point.timestamp.toISOString(),
        label: point.label || point.category || point.timestamp.toISOString(),
        value: point.value,
        color: point.metadata?.color,
      };
    });
  }, [dataset]);
  
  // Get colors for the pie chart
  const colors = useMemo(() => {
    const colorsFromData = chartData.map(d => d.color).filter(Boolean);
    if (colorsFromData.length === chartData.length) {
      return { datum: 'color' };
    }
    return { scheme: colorScheme };
  }, [chartData, colorScheme]);

  return (
    <BaseChart dataset={dataset} {...rest}>
      <ResponsivePie
        data={chartData}
        margin={{
          top: margin.top || 20,
          right: margin.right || 20,
          bottom: margin.bottom || 20,
          left: margin.left || 20,
        }}
        innerRadius={innerRadius}
        padAngle={padAngle}
        cornerRadius={cornerRadius}
        activeOuterRadiusOffset={activeOuterRadiusOffset}
        borderWidth={1}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.2]],
        }}
        colors={colors}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor={isDark ? '#f8f9fa' : '#333333'}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 2]],
        }}
        enableArcLabels={showLabels}
        enableArcLinkLabels={showLabels}
        sortByValue={sortByValue}
        legends={
          showLegend
            ? [
                {
                  anchor: 'right',
                  direction: 'column',
                  justify: false,
                  translateX: 0,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: isDark ? '#f8f9fa' : '#333333',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: isDark ? '#ffffff' : '#000000',
                      },
                    },
                  ],
                },
              ]
            : []
        }
        theme={{
          text: {
            fill: isDark ? '#f8f9fa' : '#333333',
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
