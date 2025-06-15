'use client';

import React from 'react';
import { BLOOMS_LEVELS } from '../../utils/bloom-integration';

interface CognitiveDistributionChartProps {
  distribution: Record<string, number>;
}

/**
 * CognitiveDistributionChart component for visualizing Bloom's Taxonomy distribution
 * 
 * This component provides a visual representation of the distribution of
 * questions across Bloom's Taxonomy cognitive levels.
 */
export function CognitiveDistributionChart({
  distribution,
}: CognitiveDistributionChartProps) {
  // Check if distribution is empty
  const isEmpty = Object.keys(distribution).length === 0;

  // Get all Bloom's levels for display
  const allLevels = Object.keys(BLOOMS_LEVELS);

  return (
    <div className="cognitive-distribution-chart">
      <div className="space-y-4">
        <h4 className="text-lg font-medium">Cognitive Level Distribution</h4>

        {isEmpty ? (
          <div className="p-4 bg-gray-50 rounded text-center">
            No questions added yet. Add questions to see the cognitive level distribution.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Bar Chart */}
            <div className="space-y-2">
              {allLevels.map((level) => {
                const percentage = distribution[level] || 0;
                const levelInfo = BLOOMS_LEVELS[level as keyof typeof BLOOMS_LEVELS];
                
                return (
                  <div key={level} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{levelInfo?.name || level}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: levelInfo?.color || '#ccc',
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Distribution Summary */}
            <div className="p-3 bg-gray-50 rounded text-sm">
              <div className="font-medium mb-1">Distribution Summary:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-500">Lower Order Thinking:</span>
                  <div className="font-medium">
                    {(distribution['REMEMBER'] || 0) + (distribution['UNDERSTAND'] || 0)}%
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Middle Order Thinking:</span>
                  <div className="font-medium">
                    {(distribution['APPLY'] || 0) + (distribution['ANALYZE'] || 0)}%
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Higher Order Thinking:</span>
                  <div className="font-medium">
                    {(distribution['EVALUATE'] || 0) + (distribution['CREATE'] || 0)}%
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Other:</span>
                  <div className="font-medium">
                    {distribution['Uncategorized'] || 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
