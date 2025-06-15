'use client';

import React from 'react';
import { TopicMasteryData, MasteryLevel } from '../../types';
import { BloomsTaxonomyLevel } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { 
  DEFAULT_MASTERY_THRESHOLDS,
  MASTERY_LEVEL_COLORS,
  MASTERY_LEVEL_DESCRIPTIONS
} from '../../constants/mastery-thresholds';
import { getMasteryLevel } from '../../utils/mastery-helpers';

interface TopicMasteryCardProps {
  masteryData: TopicMasteryData;
  topicName: string;
  subjectName?: string;
  showDetails?: boolean;
  showLastAssessment?: boolean;
  onClick?: () => void;
}

/**
 * Component for displaying topic mastery
 */
export function TopicMasteryCard({
  masteryData,
  topicName,
  subjectName,
  showDetails = true,
  showLastAssessment = true,
  onClick,
}: TopicMasteryCardProps) {
  // Get mastery level
  const masteryLevel = getMasteryLevel(masteryData.overallMastery);
  
  // Get mastery color
  const masteryColor = MASTERY_LEVEL_COLORS[masteryLevel];
  
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };
  
  return (
    <div 
      className={`
        border rounded-lg overflow-hidden shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      `}
      style={{ borderColor: masteryColor }}
      onClick={onClick}
    >
      {/* Header */}
      <div 
        className="px-4 py-3"
        style={{ backgroundColor: `${masteryColor}20` }} // 20% opacity
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {topicName}
            </h3>
            {subjectName && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subjectName}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className="text-2xl font-bold" style={{ color: masteryColor }}>
              {Math.round(masteryData.overallMastery)}%
            </div>
            <div className="text-sm font-medium" style={{ color: masteryColor }}>
              {masteryLevel}
            </div>
          </div>
        </div>
      </div>
      
      {/* Details */}
      {showDetails && (
        <div className="px-4 py-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {MASTERY_LEVEL_DESCRIPTIONS[masteryLevel]}
          </p>
          
          <div className="space-y-2">
            {Object.values(BloomsTaxonomyLevel).map((level) => {
              const metadata = BLOOMS_LEVEL_METADATA[level];
              const value = masteryData[level];
              const levelMasteryLevel = getMasteryLevel(value);
              const levelColor = MASTERY_LEVEL_COLORS[levelMasteryLevel];
              
              return (
                <div key={level} className="flex items-center space-x-2">
                  <div className="w-24 text-xs font-medium text-gray-700 dark:text-gray-300">
                    {metadata.name}
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${value}%`,
                        backgroundColor: levelColor,
                      }}
                    />
                  </div>
                  <div className="w-10 text-xs text-right font-medium" style={{ color: levelColor }}>
                    {Math.round(value)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Footer */}
      {showLastAssessment && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
          Last assessment: {formatDate(masteryData.lastAssessmentDate)}
        </div>
      )}
    </div>
  );
}
