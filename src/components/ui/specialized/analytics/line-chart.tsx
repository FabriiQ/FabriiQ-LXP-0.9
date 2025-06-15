'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { SimpleCard } from '@/components/ui/extended/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { useTheme } from 'next-themes';
import { designTokens } from '@/styles/design-tokens';
import { ResponsiveLine } from '@nivo/line';

export interface LineChartProps {
  data: Array<{
    id: string;
    data: Array<{ x: string | number; y: number }>;
    color?: string;
  }>;
  title?: string;
  description?: string;
  height?: number;
  width?: string;
  className?: string;
  isLoading?: boolean;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  showPoints?: boolean;
  enableArea?: boolean;
  curve?: 'linear' | 'monotoneX' | 'step' | 'stepAfter' | 'stepBefore' | 'natural' | 'basis' | 'cardinal' | 'catmullRom';
  margin?: { top: number; right: number; bottom: number; left: number };
  xScale?: {
    type: 'point' | 'linear' | 'time';
    format?: string;
    precision?: 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second';
  };
  yScale?: {
    type: 'linear' | 'log';
    min?: 'auto' | number;
    max?: 'auto' | number;
  };
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
    format?: string;
  };
  valueFormat?: string;
  useMesh?: boolean;
  enableSlices?: 'x' | 'y' | false;
}

/**
 * LineChart component for data visualization using Nivo
 * 
 * Features:
 * - Responsive design that adapts to screen size
 * - Touch-friendly tooltips
 * - Loading state with skeleton
 * - Role-specific styling
 * - Multiple curve types
 * - Area fill option
 * 
 * @example
 * ```tsx
 * <LineChart 
 *   data={[
 *     {
 *       id: 'series1',
 *       data: [
 *         { x: 'Jan', y: 12 },
 *         { x: 'Feb', y: 19 },
 *         { x: 'Mar', y: 3 },
 *       ]
 *     }
 *   ]}
 *   title="Monthly Trends"
 *   role="teacher"
 *   curve="monotoneX"
 *   enableArea
 * />
 * ```
 */
export function LineChart({
  data,
  title,
  description,
  height = 300,
  width = '100%',
  className,
  isLoading = false,
  role,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  showPoints = true,
  enableArea = false,
  curve = 'monotoneX',
  margin = { top: 40, right: 80, bottom: 60, left: 80 },
  xScale = { type: 'point' },
  yScale = { type: 'linear', min: 'auto', max: 'auto' },
  axisBottom,
  axisLeft,
  valueFormat,
  useMesh = true,
  enableSlices = false,
}: LineChartProps) {
  const { isMobile } = useResponsive();
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  
  // Get colors based on role
  const getRoleColors = (role?: string) => {
    const baseColors = designTokens.baseColors;
    
    switch (role) {
      case 'systemAdmin':
        return [baseColors.primaryGreen, baseColors.mediumTeal, baseColors.lightMint];
      case 'campusAdmin':
        return [baseColors.darkBlue, baseColors.lightBlue, baseColors.mediumGray];
      case 'teacher':
        return [baseColors.mediumTeal, baseColors.primaryGreen, baseColors.lightMint];
      case 'student':
        return [baseColors.lightBlue, baseColors.darkBlue, baseColors.mediumGray];
      case 'parent':
        return [baseColors.purple, baseColors.orange, baseColors.lightGray];
      default:
        return ['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560'];
    }
  };
  
  // Apply role-specific colors to data
  const colorizedData = React.useMemo(() => {
    if (!role) return data;
    
    const colors = getRoleColors(role);
    return data.map((series, index) => ({
      ...series,
      color: series.color || colors[index % colors.length]
    }));
  }, [data, role]);
  
  // Adjust margins for mobile
  const responsiveMargin = isMobile
    ? { top: 20, right: 40, bottom: 50, left: 50 }
    : margin;
  
  // If loading, show skeleton
  if (isLoading) {
    return (
      <SimpleCard
        className={className}
        title={title}
        description={description}
      >
        <div style={{ height, width }}>
          <div className="flex flex-col space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-40 w-full" />
            {showLegend && (
              <div className="flex justify-center space-x-4 mt-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            )}
          </div>
        </div>
      </SimpleCard>
    );
  }
  
  return (
    <SimpleCard
      className={cn("overflow-hidden", className)}
      title={title}
      description={description}
      role={role}
    >
      <div style={{ height, width }}>
        <ResponsiveLine
          data={colorizedData}
          margin={responsiveMargin}
          xScale={xScale}
          yScale={yScale}
          curve={curve}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: isMobile ? -45 : 0,
            legend: axisBottom?.legend || '',
            legendOffset: axisBottom?.legendOffset || 40,
            legendPosition: axisBottom?.legendPosition || 'middle',
            format: axisBottom?.format,
            truncateTickAt: 0,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: axisLeft?.legend || '',
            legendOffset: axisLeft?.legendOffset || -50,
            legendPosition: axisLeft?.legendPosition || 'middle',
            format: axisLeft?.format,
            truncateTickAt: 0,
          }}
          colors={{ datum: 'color' }}
          lineWidth={isMobile ? 2 : 3}
          pointSize={showPoints ? (isMobile ? 6 : 10) : 0}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          enableArea={enableArea}
          areaOpacity={0.15}
          enableGridX={showGrid}
          enableGridY={showGrid}
          useMesh={useMesh}
          enableSlices={enableSlices}
          legends={showLegend ? [
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
                    itemOpacity: 1
                  }
                }
              ]
            }
          ] : []}
          theme={{
            background: 'transparent',
            textColor: isDarkTheme ? '#e0e0e0' : '#333333',
            fontSize: isMobile ? 10 : 12,
            axis: {
              domain: {
                line: {
                  stroke: isDarkTheme ? '#555555' : '#dddddd',
                  strokeWidth: 1
                }
              },
              ticks: {
                line: {
                  stroke: isDarkTheme ? '#555555' : '#dddddd',
                  strokeWidth: 1
                }
              }
            },
            grid: {
              line: {
                stroke: isDarkTheme ? '#444444' : '#dddddd',
                strokeWidth: 1
              }
            },
            tooltip: {
              container: {
                background: isDarkTheme ? '#333333' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#333333',
                fontSize: isMobile ? 12 : 14,
                borderRadius: 4,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: isMobile ? 8 : 12
              }
            }
          }}
          tooltip={({ point }) => (
            <div
              style={{
                padding: '8px 12px',
                background: isDarkTheme ? '#333333' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#333333',
                border: `1px solid ${point.serieColor}`,
                borderRadius: '4px',
              }}
            >
              <strong>{point.serieId}</strong>
              <div>
                {point.data.xFormatted}: {valueFormat ? point.data.yFormatted : point.data.y}
              </div>
            </div>
          )}
        />
      </div>
    </SimpleCard>
  );
}
