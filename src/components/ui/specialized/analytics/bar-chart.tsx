'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { SimpleCard } from '@/components/ui/extended/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { useTheme } from 'next-themes';
import { designTokens } from '@/styles/design-tokens';
import { ResponsiveBar } from '@nivo/bar';

export interface BarChartProps {
  data: Array<Record<string, any>>;
  keys: string[];
  indexBy: string;
  title?: string;
  description?: string;
  height?: number;
  width?: string;
  className?: string;
  isLoading?: boolean;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  horizontal?: boolean;
  stacked?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  padding?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  valueFormat?: string;
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
}

/**
 * BarChart component for data visualization using Nivo
 * 
 * Features:
 * - Responsive design that adapts to screen size
 * - Touch-friendly tooltips
 * - Loading state with skeleton
 * - Role-specific styling
 * - Horizontal or vertical orientation
 * - Stacked or grouped bars
 * 
 * @example
 * ```tsx
 * <BarChart 
 *   data={[
 *     { month: 'Jan', value1: 12, value2: 8 },
 *     { month: 'Feb', value1: 19, value2: 10 },
 *     { month: 'Mar', value1: 3, value2: 5 },
 *   ]}
 *   keys={['value1', 'value2']}
 *   indexBy="month"
 *   title="Monthly Data"
 *   role="teacher"
 * />
 * ```
 */
export function BarChart({
  data,
  keys,
  indexBy,
  title,
  description,
  height = 300,
  width = '100%',
  className,
  isLoading = false,
  role,
  horizontal = false,
  stacked = false,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  showValues = false,
  padding = 0.3,
  margin = { top: 40, right: 80, bottom: 60, left: 80 },
  valueFormat,
  axisBottom,
  axisLeft,
}: BarChartProps) {
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
        <ResponsiveBar
          data={data}
          keys={keys}
          indexBy={indexBy}
          margin={responsiveMargin}
          padding={padding}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={getRoleColors(role)}
          layout={horizontal ? 'horizontal' : 'vertical'}
          groupMode={stacked ? 'stacked' : 'grouped'}
          borderRadius={4}
          borderWidth={0}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: isMobile ? -45 : 0,
            legend: axisBottom?.legend || '',
            legendPosition: axisBottom?.legendPosition || 'middle',
            legendOffset: axisBottom?.legendOffset || 40,
            truncateTickAt: 0,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: axisLeft?.legend || '',
            legendPosition: axisLeft?.legendPosition || 'middle',
            legendOffset: axisLeft?.legendOffset || -50,
            truncateTickAt: 0,
          }}
          enableGridX={showGrid}
          enableGridY={showGrid}
          enableLabel={showValues}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          legends={showLegend ? [
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
          ariaLabel="Bar chart"
          barAriaLabel={e => `${e.id}: ${e.formattedValue} in ${e.indexValue}`}
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
          valueFormat={valueFormat}
          tooltip={({ id, value, color, indexValue }) => (
            <div
              style={{
                padding: '8px 12px',
                background: isDarkTheme ? '#333333' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#333333',
                border: `1px solid ${color}`,
                borderRadius: '4px',
              }}
            >
              <strong>
                {indexValue}: {id}
              </strong>
              <div>{value}</div>
            </div>
          )}
        />
      </div>
    </SimpleCard>
  );
}
