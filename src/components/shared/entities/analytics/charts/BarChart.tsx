import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { BaseChart, BaseChartProps } from './BaseChart';
import { AnalyticsDataset } from '../types';
import { useTheme } from 'next-themes';

export interface BarChartProps extends Omit<BaseChartProps, 'children'> {
  dataset: AnalyticsDataset;
  horizontal?: boolean;
  groupMode?: 'grouped' | 'stacked';
  showValues?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  enableLabel?: boolean;
  colorScheme?: string;
  axisBottom?: {
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

export function BarChart({
  dataset,
  horizontal = false,
  groupMode = 'grouped',
  showValues = true,
  showLegend = true,
  showGrid = true,
  enableLabel = true,
  colorScheme = 'nivo',
  axisBottom,
  axisLeft,
  margin = {
    top: 20,
    right: 20,
    bottom: 50,
    left: 60,
  },
  ...rest
}: BarChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Transform dataset into Nivo bar chart format
  const chartData = useMemo(() => {
    // Get all unique categories across all series
    const allCategories = new Set<string>();
    dataset.series.forEach(series => {
      series.data.forEach(point => {
        if (point.category) {
          allCategories.add(point.category);
        }
      });
    });
    
    // If no categories, use timestamps as categories
    if (allCategories.size === 0) {
      dataset.series.forEach(series => {
        series.data.forEach(point => {
          allCategories.add(point.timestamp.toISOString());
        });
      });
    }
    
    // Create data array for bar chart
    return Array.from(allCategories).map(category => {
      const dataPoint: Record<string, any> = { category };
      
      dataset.series.forEach(series => {
        const point = series.data.find(p => 
          p.category === category || 
          p.timestamp.toISOString() === category
        );
        
        if (point) {
          dataPoint[series.name] = point.value;
        } else {
          dataPoint[series.name] = 0;
        }
      });
      
      return dataPoint;
    });
  }, [dataset]);
  
  // Get keys for the bar chart (series names)
  const keys = useMemo(() => {
    return dataset.series.map(series => series.name);
  }, [dataset]);
  
  // Get colors for the bar chart
  const colors = useMemo(() => {
    return dataset.series.map(series => series.color || undefined);
  }, [dataset]);

  return (
    <BaseChart dataset={dataset} {...rest}>
      <ResponsiveBar
        data={chartData}
        keys={keys}
        indexBy="category"
        margin={{
          top: margin.top || 20,
          right: margin.right || 20,
          bottom: margin.bottom || 50,
          left: margin.left || 60,
        }}
        padding={0.3}
        layout={horizontal ? 'horizontal' : 'vertical'}
        groupMode={groupMode}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={colors.every(c => c) ? colors as string[] : { scheme: colorScheme }}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: axisBottom?.legend || '',
          legendPosition: axisBottom?.legendPosition || 'middle',
          legendOffset: axisBottom?.legendOffset || 32,
          truncateTickAt: 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: axisLeft?.legend || dataset.metricName,
          legendPosition: axisLeft?.legendPosition || 'middle',
          legendOffset: axisLeft?.legendOffset || -40,
          truncateTickAt: 0,
        }}
        enableGridX={showGrid}
        enableGridY={showGrid}
        enableLabel={enableLabel}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1.6]],
        }}
        legends={
          showLegend
            ? [
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
                        itemOpacity: 1,
                      },
                    },
                  ],
                },
              ]
            : []
        }
        role="application"
        ariaLabel={`${dataset.title} bar chart`}
        barAriaLabel={e => `${e.id}: ${e.formattedValue} in category: ${e.indexValue}`}
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
          grid: {
            line: {
              stroke: isDark ? '#343a40' : '#eeeeee',
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
