'use client';

import React from 'react';
import { BloomsTaxonomyLevel, BloomsDistribution } from '../../types';
import { BLOOMS_LEVEL_METADATA, ORDERED_BLOOMS_LEVELS } from '../../constants/bloom-levels';

interface BloomsDistributionChartProps {
  distribution: BloomsDistribution;
  compareDistribution?: BloomsDistribution;
  onChange?: (distribution: BloomsDistribution) => void;
  editable?: boolean;
  showLabels?: boolean;
  showPercentages?: boolean;
  showLegend?: boolean;
  height?: number;
  variant?: 'bar' | 'horizontal-bar' | 'pie' | 'radar';
}

/**
 * Component for visualizing Bloom's Taxonomy distribution
 */
export function BloomsDistributionChart({
  distribution,
  compareDistribution,
  onChange,
  editable = false,
  showLabels = true,
  showPercentages = true,
  showLegend = true,
  height = 200,
  variant = 'bar',
}: BloomsDistributionChartProps) {
  // Validate total percentage doesn't exceed 100%
  const validateDistribution = (newDistribution: BloomsDistribution): boolean => {
    const total = Object.values(newDistribution).reduce((sum, value) => sum + (value || 0), 0);
    return total <= 100;
  };

  // Handle bar click for editable charts
  const handleBarClick = (level: BloomsTaxonomyLevel, increment: boolean) => {
    if (!editable || !onChange) return;

    // Calculate current total
    const currentTotal = Object.values(distribution).reduce((sum, value) => sum + (value || 0), 0);

    // Get current value for this level
    const currentValue = distribution[level] || 0;

    // Calculate how much we can adjust while keeping total at 100%
    let adjustmentAmount = 5;

    if (increment) {
      // When increasing, check if we need to limit the increase to stay at 100%
      if (currentTotal >= 100) {
        // Already at 100%, can't increase unless we decrease others
        return;
      }

      // Limit increase to whatever is needed to reach 100%
      adjustmentAmount = Math.min(5, 100 - currentTotal);
    } else {
      // When decreasing, don't go below 0
      adjustmentAmount = Math.min(5, currentValue);
    }

    // Calculate new value
    const newValue = increment
      ? currentValue + adjustmentAmount
      : currentValue - adjustmentAmount;

    // Create new distribution object
    const newDistribution = {
      ...distribution,
      [level]: newValue,
    };

    // Validate and update distribution
    if (validateDistribution(newDistribution)) {
      onChange(newDistribution);
    }
  };

  // Render bar chart
  const renderBarChart = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-end h-full space-x-1">
          {ORDERED_BLOOMS_LEVELS.map((level) => {
            const metadata = BLOOMS_LEVEL_METADATA[level];
            const value = distribution[level] || 0;
            const barHeight = `${value}%`;

            return (
              <div
                key={level}
                className="flex flex-col items-center flex-1"
              >
                {editable && onChange && (
                  <button
                    type="button"
                    onClick={() => handleBarClick(level, true)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-1"
                  >
                    +
                  </button>
                )}

                <div className="relative w-full flex-1">
                  <div
                    className="absolute bottom-0 w-full rounded-t-md transition-all duration-300"
                    style={{
                      height: barHeight,
                      backgroundColor: metadata.color,
                    }}
                  />
                </div>

                {editable && onChange && (
                  <button
                    type="button"
                    onClick={() => handleBarClick(level, false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-1"
                  >
                    -
                  </button>
                )}

                {showPercentages && (
                  <div className="text-xs font-medium mt-1">
                    {value}%
                  </div>
                )}

                {showLabels && (
                  <div className="text-xs mt-1 text-center">
                    {metadata.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render horizontal bar chart
  const renderHorizontalBarChart = () => {
    return (
      <div className="flex flex-col space-y-4">
        {ORDERED_BLOOMS_LEVELS.map((level) => {
          const metadata = BLOOMS_LEVEL_METADATA[level];
          const value = distribution[level] || 0;

          return (
            <div key={level} className="flex flex-col sm:flex-row sm:items-center gap-2">
              {/* Level name - full width on mobile, fixed width on larger screens */}
              {showLabels && (
                <div className="w-full sm:w-24 text-sm font-medium">
                  {metadata.name}
                </div>
              )}

              <div className="flex items-center w-full gap-2">
                {/* Progress bar */}
                <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-300"
                    style={{
                      width: `${value}%`,
                      backgroundColor: metadata.color,
                    }}
                  />
                </div>

                {/* Percentage display */}
                {showPercentages && (
                  <div className="w-10 text-sm text-right flex-shrink-0">
                    {value}%
                  </div>
                )}

                {/* Edit buttons */}
                {editable && onChange && (
                  <div className="flex space-x-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleBarClick(level, false)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      aria-label={`Decrease ${metadata.name}`}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBarClick(level, true)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      aria-label={`Increase ${metadata.name}`}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Total percentage display */}
        <div className="flex justify-between text-sm font-medium pt-2 border-t">
          <span>Total:</span>
          <span>
            {Object.values(distribution).reduce((sum, value) => sum + (value || 0), 0)}%
          </span>
        </div>
      </div>
    );
  };

  // Render pie chart (simplified)
  const renderPieChart = () => {
    // This is a simplified pie chart implementation
    // For a real application, you would use a charting library

    // Calculate total to ensure percentages add up to 100%
    const total = Object.values(distribution).reduce((sum, value) => sum + (value || 0), 0);

    // If total is 0, show a placeholder
    if (total === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="text-lg mb-2">No Data Available</div>
            <div className="text-sm">Create learning outcomes to see distribution</div>
          </div>
        </div>
      );
    }

    // Calculate segments for primary distribution
    let currentAngle = 0;
    const segments = ORDERED_BLOOMS_LEVELS.map((level) => {
      const metadata = BLOOMS_LEVEL_METADATA[level];
      const value = distribution[level] || 0;
      const normalizedValue = total > 0 ? (value / total) * 100 : 0;
      const angle = (normalizedValue / 100) * 360;

      const segment = {
        level,
        color: metadata.color,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        percentage: normalizedValue,
      };

      currentAngle += angle;
      return segment;
    });

    // Calculate segments for comparison distribution if provided
    let compareSegments: any[] = [];
    if (compareDistribution) {
      const compareTotal = Object.values(compareDistribution).reduce((sum, value) => sum + (value || 0), 0) || 100;

      let compareAngle = 0;
      compareSegments = ORDERED_BLOOMS_LEVELS.map((level) => {
        const metadata = BLOOMS_LEVEL_METADATA[level];
        const value = compareDistribution[level] || 0;
        const normalizedValue = compareTotal > 0 ? (value / compareTotal) * 100 : 0;
        const angle = (normalizedValue / 100) * 360;

        const segment = {
          level,
          // Use a lighter version of the color for comparison
          color: `${metadata.color}80`, // 50% opacity
          startAngle: compareAngle,
          endAngle: compareAngle + angle,
          percentage: normalizedValue,
        };

        compareAngle += angle;
        return segment;
      });
    }

    // SVG dimensions
    const size = height;
    const radius = size / 2;
    const compareRadius = radius * 0.8; // Smaller radius for comparison
    const center = size / 2;

    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Render comparison segments first (if provided) */}
          {compareDistribution && compareSegments.map((segment, index) => {
            if (segment.percentage === 0) return null;

            // Convert angles to radians
            const startAngle = (segment.startAngle - 90) * (Math.PI / 180);
            const endAngle = (segment.endAngle - 90) * (Math.PI / 180);

            // Calculate path
            const x1 = center + compareRadius * Math.cos(startAngle);
            const y1 = center + compareRadius * Math.sin(startAngle);
            const x2 = center + compareRadius * Math.cos(endAngle);
            const y2 = center + compareRadius * Math.sin(endAngle);

            // Determine if the arc should be drawn as a large arc
            const largeArcFlag = segment.endAngle - segment.startAngle > 180 ? 1 : 0;

            // Create path
            const path = [
              `M ${center},${center}`,
              `L ${x1},${y1}`,
              `A ${compareRadius},${compareRadius} 0 ${largeArcFlag},1 ${x2},${y2}`,
              'Z',
            ].join(' ');

            return (
              <path
                key={`compare-${index}`}
                d={path}
                fill={segment.color}
                stroke="white"
                strokeWidth="0.5"
                opacity="0.7"
              />
            );
          })}

          {/* Render primary segments */}
          {segments.map((segment, index) => {
            if (segment.percentage === 0) return null;

            // Convert angles to radians
            const startAngle = (segment.startAngle - 90) * (Math.PI / 180);
            const endAngle = (segment.endAngle - 90) * (Math.PI / 180);

            // Calculate path
            const x1 = center + radius * Math.cos(startAngle);
            const y1 = center + radius * Math.sin(startAngle);
            const x2 = center + radius * Math.cos(endAngle);
            const y2 = center + radius * Math.sin(endAngle);

            // Determine if the arc should be drawn as a large arc
            const largeArcFlag = segment.endAngle - segment.startAngle > 180 ? 1 : 0;

            // Create path
            const path = [
              `M ${center},${center}`,
              `L ${x1},${y1}`,
              `A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2}`,
              'Z',
            ].join(' ');

            return (
              <path
                key={index}
                d={path}
                fill={segment.color}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>

        {showLegend && (
          <div className="flex flex-wrap justify-center mt-4 gap-3">
            {ORDERED_BLOOMS_LEVELS.map((level) => {
              const metadata = BLOOMS_LEVEL_METADATA[level];
              const value = distribution[level] || 0;
              const compareValue = compareDistribution ? compareDistribution[level] || 0 : null;

              return (
                <div key={level} className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: metadata.color }}
                  />
                  <div className="text-xs">
                    {metadata.name}
                    {showPercentages && ` (${Math.round(value)}%${compareValue !== null ? ` / ${Math.round(compareValue)}%` : ''})`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render the appropriate variant
  switch (variant) {
    case 'horizontal-bar':
      return renderHorizontalBarChart();
    case 'pie':
      return renderPieChart();
    case 'radar':
      // For a real radar chart, you would use a charting library
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-gray-500">
            Radar chart requires a charting library
          </div>
        </div>
      );
    case 'bar':
    default:
      return renderBarChart();
  }
}
