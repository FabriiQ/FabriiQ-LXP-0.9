'use client';

import React from 'react';
import { AnalyticsMetric } from '../types';
import { formatMetricValue, formatChange, getChangeColor } from '../utils/formatting';

interface MetricCardProps {
  metric: AnalyticsMetric;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  className = '',
}) => {
  // Determine change direction icon
  const changeIcon = metric.changeDirection === 'up' 
    ? '↑' 
    : metric.changeDirection === 'down' 
      ? '↓' 
      : '→';
  
  // Determine change color
  const changeColor = metric.change !== undefined 
    ? getChangeColor(metric.change) 
    : '#9e9e9e';
  
  return (
    <div 
      className={`metric-card ${className}`}
      style={{ borderColor: metric.color }}
    >
      <div className="metric-header">
        <span className="metric-label">{metric.label}</span>
        {metric.icon && (
          <span 
            className="metric-icon"
            style={{ color: metric.color }}
          >
            {metric.icon}
          </span>
        )}
      </div>
      
      <div className="metric-value">
        {formatMetricValue(metric.value, metric.format)}
      </div>
      
      {metric.previousValue !== undefined && metric.change !== undefined && (
        <div className="metric-change">
          <span 
            className="change-direction"
            style={{ color: changeColor }}
          >
            {changeIcon}
          </span>
          <span 
            className="change-value"
            style={{ color: changeColor }}
          >
            {formatChange(metric.change)}
          </span>
          <span className="previous-value">
            from {formatMetricValue(metric.previousValue, metric.format)}
          </span>
        </div>
      )}
    </div>
  );
};
