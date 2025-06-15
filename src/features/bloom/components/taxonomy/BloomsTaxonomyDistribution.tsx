'use client';

import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/taxonomy';
import { Progress } from '@/components/ui/progress';

interface BloomsTaxonomyDistributionProps {
  distribution: Record<BloomsTaxonomyLevel, number>;
  onChange: (distribution: Record<BloomsTaxonomyLevel, number>) => void;
  readOnly?: boolean;
}

/**
 * BloomsTaxonomyDistribution component
 * 
 * Allows users to adjust the distribution of Bloom's Taxonomy levels
 * with sliders and visual feedback.
 */
export function BloomsTaxonomyDistribution({
  distribution,
  onChange,
  readOnly = false
}: BloomsTaxonomyDistributionProps) {
  const [localDistribution, setLocalDistribution] = useState<Record<BloomsTaxonomyLevel, number>>(distribution);
  const [total, setTotal] = useState<number>(100);

  // Update local distribution when prop changes
  useEffect(() => {
    setLocalDistribution(distribution);
    calculateTotal(distribution);
  }, [distribution]);

  // Calculate total percentage
  const calculateTotal = (dist: Record<BloomsTaxonomyLevel, number>) => {
    const sum = Object.values(dist).reduce((acc, val) => acc + val, 0);
    setTotal(sum);
    return sum;
  };

  // Handle slider change
  const handleChange = (level: BloomsTaxonomyLevel, value: number[]) => {
    if (readOnly) return;
    
    const newValue = value[0];
    const newDistribution = { ...localDistribution, [level]: newValue };
    
    // Adjust other values to maintain total of 100%
    const currentTotal = calculateTotal(newDistribution);
    if (currentTotal !== 100) {
      const diff = 100 - currentTotal;
      const otherLevels = Object.keys(newDistribution).filter(
        key => key !== level
      ) as BloomsTaxonomyLevel[];
      
      // Distribute the difference proportionally among other levels
      const totalOthers = otherLevels.reduce(
        (acc, key) => acc + newDistribution[key as BloomsTaxonomyLevel], 
        0
      );
      
      if (totalOthers > 0) {
        otherLevels.forEach(key => {
          const proportion = newDistribution[key] / totalOthers;
          newDistribution[key] = Math.max(0, Math.min(100, newDistribution[key] + diff * proportion));
        });
      }
    }
    
    // Round all values to integers and ensure they sum to 100
    let roundedDistribution = Object.fromEntries(
      Object.entries(newDistribution).map(([key, val]) => [key, Math.round(val)])
    ) as Record<BloomsTaxonomyLevel, number>;
    
    // Adjust for rounding errors
    const roundedTotal = Object.values(roundedDistribution).reduce((acc, val) => acc + val, 0);
    if (roundedTotal !== 100) {
      const diff = 100 - roundedTotal;
      // Add or subtract the difference from the largest or smallest value
      const entries = Object.entries(roundedDistribution).sort((a, b) => 
        diff > 0 ? a[1] - b[1] : b[1] - a[1]
      );
      roundedDistribution[entries[0][0] as BloomsTaxonomyLevel] += diff;
    }
    
    setLocalDistribution(roundedDistribution);
    onChange(roundedDistribution);
  };

  return (
    <div className="space-y-4">
      {/* Total indicator */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Total Distribution</span>
        <span 
          className={`text-sm font-bold ${
            total === 100 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {total}%
        </span>
      </div>
      
      {/* Distribution bars */}
      <div className="grid grid-cols-1 gap-6">
        {Object.values(BloomsTaxonomyLevel).map(level => {
          const metadata = BLOOMS_LEVEL_METADATA[level];
          const value = localDistribution[level];
          
          return (
            <div key={level} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: metadata.color }}
                  />
                  <span className="text-sm font-medium">{metadata.name}</span>
                </div>
                <span className="text-sm font-bold">{value}%</span>
              </div>
              
              {readOnly ? (
                <Progress 
                  value={value} 
                  className="h-2" 
                  indicatorClassName={`bg-[${metadata.color}]`}
                />
              ) : (
                <Slider
                  value={[value]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => handleChange(level, val)}
                  className="py-1"
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Distribution guidance */}
      {!readOnly && (
        <div className="text-sm text-muted-foreground mt-4">
          <p>Recommended distribution:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Lower levels (Remember, Understand): 30-40%</li>
            <li>Middle levels (Apply, Analyze): 40-50%</li>
            <li>Higher levels (Evaluate, Create): 10-30%</li>
          </ul>
        </div>
      )}
    </div>
  );
}
