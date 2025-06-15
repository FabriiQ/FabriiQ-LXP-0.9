import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { BaseChart, BaseChartProps } from './BaseChart';
import { AnalyticsDataset } from '../types';

export interface MetricCardProps extends Omit<BaseChartProps, 'children'> {
  dataset: AnalyticsDataset;
  value?: number;
  previousValue?: number;
  showChange?: boolean;
  showPercentage?: boolean;
  precision?: number;
  prefix?: string;
  suffix?: string;
  positiveChangeIsGood?: boolean;
  thresholds?: {
    good?: number;
    warning?: number;
  };
}

export function MetricCard({
  dataset,
  value,
  previousValue,
  showChange = true,
  showPercentage = true,
  precision = 2,
  prefix = '',
  suffix = '',
  positiveChangeIsGood = true,
  thresholds = {
    good: 0,
    warning: 0,
  },
  ...rest
}: MetricCardProps) {
  // Calculate the current value if not provided
  const currentValue = value !== undefined
    ? value
    : dataset.series[0]?.data[dataset.series[0].data.length - 1]?.value || 0;

  // Calculate the previous value if not provided
  const prevValue = previousValue !== undefined
    ? previousValue
    : dataset.series[0]?.data[dataset.series[0].data.length - 2]?.value;

  // Calculate change and percentage
  const change = prevValue !== undefined ? currentValue - prevValue : undefined;
  const percentChange = prevValue !== undefined && prevValue !== 0
    ? ((currentValue - prevValue) / Math.abs(prevValue)) * 100
    : undefined;

  // Determine if change is positive, negative, or neutral
  const changeDirection = change === undefined
    ? 'neutral'
    : change > 0
      ? 'positive'
      : change < 0
        ? 'negative'
        : 'neutral';

  // Determine if the change is good or bad based on direction and configuration
  const isGoodChange = changeDirection === 'neutral'
    ? true
    : positiveChangeIsGood
      ? changeDirection === 'positive'
      : changeDirection === 'negative';

  // Determine color based on thresholds or change
  const getValueColor = () => {
    if (thresholds.good !== undefined && thresholds.warning !== undefined) {
      if (positiveChangeIsGood) {
        if (currentValue >= thresholds.good) return 'text-success';
        if (currentValue >= thresholds.warning) return 'text-warning';
        return 'text-destructive';
      } else {
        if (currentValue <= thresholds.good) return 'text-success';
        if (currentValue <= thresholds.warning) return 'text-warning';
        return 'text-destructive';
      }
    }

    return '';
  };

  // Format the value with proper precision and prefix/suffix
  const formatValue = (val: number) => {
    let formattedValue = val.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });

    return `${prefix}${formattedValue}${suffix}`;
  };

  return (
    <BaseChart dataset={dataset} {...rest}>
      <div className="flex flex-col items-center justify-center h-full">
        <div className={`text-4xl font-bold ${getValueColor()}`}>
          {formatValue(currentValue)}
        </div>

        {showChange && change !== undefined && (
          <div className="flex items-center mt-2">
            {changeDirection === 'positive' ? (
              <ArrowUp className={`h-4 w-4 mr-1 ${isGoodChange ? 'text-success' : 'text-destructive'}`} />
            ) : changeDirection === 'negative' ? (
              <ArrowDown className={`h-4 w-4 mr-1 ${isGoodChange ? 'text-success' : 'text-destructive'}`} />
            ) : (
              <span className="h-4 w-4 mr-1 text-muted-foreground">-</span>
            )}

            <span className={`text-sm ${isGoodChange ? 'text-success' : 'text-destructive'}`}>
              {formatValue(Math.abs(change))}
              {showPercentage && percentChange !== undefined && (
                <span className="ml-1">
                  ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
        )}

        <div className="text-sm text-muted-foreground mt-2">
          {dataset.metricName}
        </div>
      </div>
    </BaseChart>
  );
}
