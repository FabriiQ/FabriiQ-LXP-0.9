import React, { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { BaseChart, BaseChartProps } from './BaseChart';
import { AnalyticsDataset } from '../types';
import { useTheme } from 'next-themes';

export interface LineChartProps extends Omit<BaseChartProps, 'children'> {
  dataset: AnalyticsDataset;
  enableArea?: boolean;
  enablePoints?: boolean;
  enableCrosshair?: boolean;
  enableGridX?: boolean;
  enableGridY?: boolean;
  curve?: 'linear' | 'monotoneX' | 'step' | 'stepAfter' | 'stepBefore' | 'natural';
  lineWidth?: number;
  pointSize?: number;
  showLegend?: boolean;
  colorScheme?: string;
  axisBottom?: {
    legend?: string;
    legendOffset?: number;
    legendPosition?: 'start' | 'middle' | 'end';
    format?: string;
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

export function LineChart({
  dataset,
  enableArea = false,
  enablePoints = true,
  enableCrosshair = true,
  enableGridX = true,
  enableGridY = true,
  curve = 'monotoneX',
  lineWidth = 2,
  pointSize = 6,
  showLegend = true,
  colorScheme = 'nivo',
  axisBottom,
  axisLeft,
  margin = {
    top: 20,
    right: 110,
    bottom: 50,
    left: 60,
  },
  ...rest
}: LineChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Transform dataset into Nivo line chart format
  const chartData = useMemo(() => {
    return dataset.series.map(series => {
      return {
        id: series.name,
        color: series.color,
        data: series.data.map(point => ({
          x: point.timestamp,
          y: point.value,
        })),
      };
    });
  }, [dataset]);

  return (
    <BaseChart dataset={dataset} {...rest}>
      <ResponsiveLine
        data={chartData}
        margin={{
          top: margin.top || 20,
          right: margin.right || 110,
          bottom: margin.bottom || 50,
          left: margin.left || 60,
        }}
        xScale={{
          type: 'time',
          format: 'native',
          precision: 'day',
        }}
        xFormat="time:%Y-%m-%d"
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
          reverse: false,
        }}
        curve={curve}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          format: axisBottom?.format || '%b %d',
          tickValues: 'every 2 days',
          legend: axisBottom?.legend || 'Date',
          legendOffset: axisBottom?.legendOffset || 36,
          legendPosition: axisBottom?.legendPosition || 'middle',
        }}
        axisLeft={{
          legend: axisLeft?.legend || dataset.metricName,
          legendOffset: axisLeft?.legendOffset || -40,
          legendPosition: axisLeft?.legendPosition || 'middle',
        }}
        enableGridX={enableGridX}
        enableGridY={enableGridY}
        colors={chartData.every(d => d.color) ? { datum: 'color' } : { scheme: colorScheme }}
        lineWidth={lineWidth}
        pointSize={pointSize}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        enableArea={enableArea}
        areaOpacity={0.15}
        enablePoints={enablePoints}
        useMesh={true}
        enableCrosshair={enableCrosshair}
        legends={
          showLegend
            ? [
                {
                  anchor: 'bottom-right',
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
                        itemOpacity: 1,
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
          crosshair: {
            line: {
              stroke: isDark ? '#f8f9fa' : '#333333',
              strokeWidth: 1,
              strokeOpacity: 0.35,
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
