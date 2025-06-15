'use client';

import React from 'react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA, ORDERED_BLOOMS_LEVELS } from '@/features/bloom/constants/bloom-levels';

interface BloomsRadarChartProps {
  data: Record<BloomsTaxonomyLevel, number>;
  size?: number;
  showLabels?: boolean;
  showLegend?: boolean;
}

/**
 * BloomsRadarChart
 * 
 * A radar chart visualization for Bloom's Taxonomy levels
 */
export function BloomsRadarChart({
  data,
  size = 200,
  showLabels = false,
  showLegend = false,
}: BloomsRadarChartProps) {
  const center = size / 2;
  const radius = size * 0.4;
  const levels = ORDERED_BLOOMS_LEVELS;
  const angleStep = (2 * Math.PI) / levels.length;
  
  // Calculate points for each level
  const points = levels.map((level, i) => {
    const value = data[level] || 0;
    const angle = i * angleStep - Math.PI / 2; // Start from top
    const distance = (value / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y, level, value };
  });
  
  // Create polygon points string
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  
  // Create grid circles
  const gridCircles = [0.2, 0.4, 0.6, 0.8, 1].map(factor => {
    const r = radius * factor;
    return (
      <circle
        key={factor}
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="1"
        strokeDasharray="2,2"
      />
    );
  });
  
  // Create grid lines
  const gridLines = levels.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x2 = center + radius * Math.cos(angle);
    const y2 = center + radius * Math.sin(angle);
    return (
      <line
        key={i}
        x1={center}
        y1={center}
        x2={x2}
        y2={y2}
        stroke="#e2e8f0"
        strokeWidth="1"
        strokeDasharray="2,2"
      />
    );
  });
  
  // Create labels
  const labels = showLabels ? levels.map((level, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelDistance = radius * 1.15;
    const x = center + labelDistance * Math.cos(angle);
    const y = center + labelDistance * Math.sin(angle);
    
    // Adjust text anchor based on position
    let textAnchor = 'middle';
    if (angle > -Math.PI / 4 && angle < Math.PI / 4) textAnchor = 'start';
    else if (angle > Math.PI * 3/4 || angle < -Math.PI * 3/4) textAnchor = 'end';
    
    return (
      <text
        key={level}
        x={x}
        y={y}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fontSize="10"
        fill={BLOOMS_LEVEL_METADATA[level].color}
        fontWeight="500"
      >
        {BLOOMS_LEVEL_METADATA[level].name}
      </text>
    );
  }) : null;
  
  // Create value labels
  const valueLabels = showLabels ? points.map((point, i) => {
    if (point.value < 5) return null; // Don't show very small values
    
    const angle = i * angleStep - Math.PI / 2;
    const labelDistance = (point.value / 100) * radius * 0.85;
    const x = center + labelDistance * Math.cos(angle);
    const y = center + labelDistance * Math.sin(angle);
    
    return (
      <text
        key={`value-${point.level}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fill="#64748b"
        fontWeight="bold"
      >
        {Math.round(point.value)}%
      </text>
    );
  }) : null;
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridCircles}
        {gridLines}
        
        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(99, 102, 241, 0.2)"
          stroke="rgba(99, 102, 241, 0.8)"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={BLOOMS_LEVEL_METADATA[point.level].color}
            stroke="white"
            strokeWidth="1"
          />
        ))}
        
        {/* Labels */}
        {labels}
        {valueLabels}
      </svg>
      
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {levels.map(level => (
            <div key={level} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: BLOOMS_LEVEL_METADATA[level].color }}
              />
              <span className="text-xs">{BLOOMS_LEVEL_METADATA[level].name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
