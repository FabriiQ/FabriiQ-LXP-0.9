'use client';

import React from 'react';
import { 
  Activity, 
  ActivityType, 
  ActivitySetting,
  BloomsTaxonomyLevel,
  Rubric
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { RubricPreview } from '../rubric/RubricPreview';

interface ActivityPreviewProps {
  activity: Partial<Activity>;
  rubric?: Rubric;
  showBloomsLevel?: boolean;
  showRubric?: boolean;
  printable?: boolean;
  className?: string;
}

/**
 * Component for previewing an activity
 * 
 * This component follows mobile-first design principles and aligns with existing UI/UX.
 */
export function ActivityPreview({
  activity,
  rubric,
  showBloomsLevel = true,
  showRubric = true,
  printable = false,
  className = '',
}: ActivityPreviewProps) {
  // Format activity type for display
  const formatActivityType = (type?: ActivityType) => {
    if (!type) return '';
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  // Format activity setting for display
  const formatActivitySetting = (setting?: ActivitySetting) => {
    if (!setting) return '';
    return setting.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  return (
    <div className={`${printable ? 'print:bg-white print:text-black' : ''} ${className}`}>
      {/* Activity Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {activity.title || 'Untitled Activity'}
        </h2>
        
        {activity.description && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {activity.description}
          </p>
        )}
        
        {/* Activity Metadata */}
        <div className="mt-4 flex flex-wrap gap-2">
          {activity.type && (
            <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
              Type: {formatActivityType(activity.type)}
            </div>
          )}
          
          {activity.setting && (
            <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
              Setting: {formatActivitySetting(activity.setting)}
            </div>
          )}
          
          {activity.duration && (
            <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
              Duration: {activity.duration} min
            </div>
          )}
          
          {activity.groupSize && (
            <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
              Group Size: {activity.groupSize}
            </div>
          )}
          
          {showBloomsLevel && activity.bloomsLevel && (
            <div 
              className="px-2 py-1 rounded-full text-xs"
              style={{
                backgroundColor: `${BLOOMS_LEVEL_METADATA[activity.bloomsLevel].color}20`,
                color: BLOOMS_LEVEL_METADATA[activity.bloomsLevel].color,
              }}
            >
              {BLOOMS_LEVEL_METADATA[activity.bloomsLevel].name} Level
            </div>
          )}
        </div>
      </div>
      
      {/* Materials */}
      {activity.materials && activity.materials.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Materials
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {activity.materials.map((material, index) => (
              <li key={index}>{material}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Instructions */}
      {activity.instructions && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Instructions
          </h3>
          <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
            {/* Split by newlines and create paragraphs */}
            {activity.instructions.split('\n\n').map((paragraph, index) => (
              <p key={index}>
                {paragraph.split('\n').map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    {line}
                    {lineIndex < paragraph.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>
        </div>
      )}
      
      {/* Assessment Strategy */}
      {activity.assessmentStrategy && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Assessment Strategy
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {activity.assessmentStrategy}
          </p>
        </div>
      )}
      
      {/* Differentiation */}
      {(activity.differentiationAdvanced || activity.differentiationStruggling) && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Differentiation
          </h3>
          
          <div className="space-y-3">
            {activity.differentiationAdvanced && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  For Advanced Students
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  {activity.differentiationAdvanced}
                </p>
              </div>
            )}
            
            {activity.differentiationStruggling && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-3">
                <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  For Struggling Students
                </h4>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  {activity.differentiationStruggling}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Rubric */}
      {showRubric && rubric && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Assessment Rubric
          </h3>
          
          <RubricPreview
            rubric={rubric}
            showBloomsLevels={showBloomsLevel}
            printable={printable}
          />
        </div>
      )}
      
      {/* Print-only information */}
      {printable && (
        <div className="hidden print:block mt-8 text-sm text-gray-500">
          <p>Printed from {window.location.origin}</p>
          <p>Date: {new Date().toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
