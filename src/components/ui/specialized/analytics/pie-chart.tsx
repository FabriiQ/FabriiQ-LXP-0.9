'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { SimpleCard } from '@/components/ui/extended/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { useTheme } from 'next-themes';
import { designTokens } from '@/styles/design-tokens';
import { ResponsivePie } from '@nivo/pie';

export interface PieChartProps {
  data: Array<{
    id: string;
    label: string;
    value: number;
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
  showLabels?: boolean;
  innerRadius?: number;
  padAngle?: number;
  cornerRadius?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  sortByValue?: boolean;
  activeOuterRadiusOffset?: number;
  valueFormat?: string;
  arcLinkLabelsSkipAngle?: number;
  arcLinkLabelsTextColor?: string;
  arcLabelsSkipAngle?: number;
  enableArcLabels?: boolean;
  enableArcLinkLabels?: boolean;
}

/**
 * PieChart component for data visualization using Nivo
 * 
 * Features:
 * - Responsive design that adapts to screen size
 * - Touch-friendly tooltips
 * - Loading state with skeleton
 * - Role-specific styling
 * - Donut chart option with innerRadius
 * - Customizable labels and legends
 * 
 * @example
 * ```tsx
 * <PieChart 
 *   data={[
 *     { id: 'A', label: 'A', value: 40 },
 *     { id: 'B', label: 'B', value: 30 },
 *     { id: 'C', label: 'C', value: 20 },
 *     { id: 'D', label: 'D', value: 10 },
 *   ]}
 *   title="Distribution"
 *   role="teacher"
 *   innerRadius={0.6}
 *   valueFormat=">-.2p"
 * />
 * ```
 */
export function PieChart({
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
  showLabels = true,
  innerRadius = 0,
  padAngle = 0.7,
  cornerRadius = 3,
  margin = { top: 40, right: 80, bottom: 40, left: 80 },
  sortByValue = false,
  activeOuterRadiusOffset = 8,
  valueFormat,
  arcLinkLabelsSkipAngle = 10,
  arcLinkLabelsTextColor,
  arcLabelsSkipAngle = 10,
  enableArcLabels = true,
  enableArcLinkLabels = true,
}: PieChartProps) {
  const { isMobile } = useResponsive();
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  
  // Get colors based on role
  const getRoleColors = (role?: string) => {
    const baseColors = designTokens.baseColors;
    
    switch (role) {
      case 'systemAdmin':
        return [baseColors.primaryGreen, baseColors.mediumTeal, baseColors.lightMint, baseColors.darkGray, baseColors.lightGray];
      case 'campusAdmin':
        return [baseColors.darkBlue, baseColors.lightBlue, baseColors.mediumGray, baseColors.lightGray, baseColors.black];
      case 'teacher':
        return [baseColors.mediumTeal, baseColors.primaryGreen, baseColors.lightMint, baseColors.darkGray, baseColors.lightGray];
      case 'student':
        return [baseColors.lightBlue, baseColors.darkBlue, baseColors.mediumGray, baseColors.lightGray, baseColors.black];
      case 'parent':
        return [baseColors.purple, baseColors.orange, baseColors.lightGray, baseColors.darkGray, baseColors.black];
      default:
        return ['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560', '#e25c3b'];
    }
  };
  
  // Apply role-specific colors to data
  const colorizedData = React.useMemo(() => {
    if (!role) return data;
    
    const colors = getRoleColors(role);
    return data.map((item, index) => ({
      ...item,
      color: item.color || colors[index % colors.length]
    }));
  }, [data, role]);
  
  // Adjust margins for mobile
  const responsiveMargin = isMobile
    ? { top: 20, right: 20, bottom: 20, left: 20 }
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
            <div className="flex justify-center">
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>
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
        <ResponsivePie
          data={colorizedData}
          margin={responsiveMargin}
          innerRadius={innerRadius}
          padAngle={padAngle}
          cornerRadius={cornerRadius}
          activeOuterRadiusOffset={activeOuterRadiusOffset}
          colors={{ datum: 'data.color' }}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsSkipAngle={arcLinkLabelsSkipAngle}
          arcLinkLabelsTextColor={arcLinkLabelsTextColor || (isDarkTheme ? '#e0e0e0' : '#333333')}
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={arcLabelsSkipAngle}
          arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          enableArcLabels={enableArcLabels && showLabels}
          enableArcLinkLabels={enableArcLinkLabels && showLabels}
          sortByValue={sortByValue}
          legends={showLegend ? [
            {
              anchor: 'bottom',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: 56,
              itemsSpacing: 0,
              itemWidth: 100,
              itemHeight: 18,
              itemTextColor: isDarkTheme ? '#e0e0e0' : '#333333',
              itemDirection: 'left-to-right',
              itemOpacity: 1,
              symbolSize: 18,
              symbolShape: 'circle',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: isDarkTheme ? '#ffffff' : '#000000'
                  }
                }
              ]
            }
          ] : []}
          theme={{
            background: 'transparent',
            textColor: isDarkTheme ? '#e0e0e0' : '#333333',
            fontSize: isMobile ? 10 : 12,
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
          tooltip={({ datum }) => (
            <div
              style={{
                padding: '8px 12px',
                background: isDarkTheme ? '#333333' : '#ffffff',
                color: isDarkTheme ? '#ffffff' : '#333333',
                border: `1px solid ${datum.color}`,
                borderRadius: '4px',
              }}
            >
              <strong>{datum.label}</strong>
              <div>
                {valueFormat ? datum.formattedValue : datum.value} 
                {!valueFormat && ` (${((datum.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)`}
              </div>
            </div>
          )}
        />
      </div>
    </SimpleCard>
  );
}
