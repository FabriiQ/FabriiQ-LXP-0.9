'use client';

import React from 'react';
import { 
  Rubric, 
  RubricCriteria, 
  PerformanceLevel,
  BloomsTaxonomyLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';

interface RubricPreviewProps {
  rubric: Rubric;
  studentScore?: Record<string, number>; // Criteria ID to score mapping
  showBloomsLevels?: boolean;
  showScores?: boolean;
  showTotals?: boolean;
  printable?: boolean;
  className?: string;
}

/**
 * Component for previewing a rubric
 * 
 * This component follows mobile-first design principles and aligns with existing UI/UX.
 */
export function RubricPreview({
  rubric,
  studentScore,
  showBloomsLevels = true,
  showScores = true,
  showTotals = true,
  printable = false,
  className = '',
}: RubricPreviewProps) {
  // Calculate total score if student scores are provided
  const totalScore = studentScore
    ? Object.entries(studentScore).reduce((total, [criteriaId, score]) => {
        const criteria = rubric.criteria.find(c => c.id === criteriaId);
        return total + (score * (criteria?.weight || 1));
      }, 0)
    : 0;
  
  // Calculate maximum possible score
  const maxPossibleScore = rubric.criteria.reduce((total, criteria) => {
    const maxLevelScore = Math.max(
      ...criteria.performanceLevels.map(level => level.score)
    );
    return total + (maxLevelScore * criteria.weight);
  }, 0);
  
  // Calculate percentage
  const percentage = maxPossibleScore > 0
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 0;
  
  return (
    <div className={`${printable ? 'print:bg-white print:text-black' : ''} ${className}`}>
      {/* Rubric Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {rubric.title}
        </h2>
        {rubric.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {rubric.description}
          </p>
        )}
      </div>
      
      {/* Rubric Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
          {/* Table Header */}
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                Criteria
                {showBloomsLevels && (
                  <span className="block text-xs font-normal normal-case mt-1">
                    Bloom's Level
                  </span>
                )}
              </th>
              {rubric.performanceLevels.map((level) => (
                <th 
                  key={level.id} 
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 dark:border-gray-700"
                  style={{ color: level.color || '#6B7280' }}
                >
                  {level.name}
                  {showScores && (
                    <span className="block text-xs font-normal normal-case mt-1">
                      {level.scoreRange.min}-{level.scoreRange.max} points
                    </span>
                  )}
                </th>
              ))}
              {studentScore && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Score
                </th>
              )}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {rubric.criteria.map((criteria) => {
              // Find the performance level that matches the student's score
              const criteriaScore = studentScore?.[criteria.id];
              const matchingLevel = criteriaScore !== undefined
                ? criteria.performanceLevels.find(level => level.score === criteriaScore)
                : undefined;
              
              return (
                <tr key={criteria.id}>
                  {/* Criteria */}
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {criteria.name}
                      {criteria.weight !== 1 && (
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          (x{criteria.weight})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {criteria.description}
                    </div>
                    {showBloomsLevels && (
                      <div 
                        className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: `${BLOOMS_LEVEL_METADATA[criteria.bloomsLevel].color}20`,
                          color: BLOOMS_LEVEL_METADATA[criteria.bloomsLevel].color,
                        }}
                      >
                        {BLOOMS_LEVEL_METADATA[criteria.bloomsLevel].name}
                      </div>
                    )}
                  </td>
                  
                  {/* Performance Levels */}
                  {rubric.performanceLevels.map((level) => {
                    const criteriaLevel = criteria.performanceLevels.find(
                      cl => cl.levelId === level.id
                    );
                    
                    const isSelected = matchingLevel?.levelId === level.id;
                    
                    return (
                      <td 
                        key={level.id} 
                        className={`px-4 py-3 text-sm border-r border-gray-200 dark:border-gray-700 ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        {criteriaLevel?.description || '-'}
                        {showScores && criteriaLevel && (
                          <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                            {criteriaLevel.score} points
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  {/* Student Score */}
                  {studentScore && (
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {criteriaScore !== undefined ? (
                        <div>
                          {criteriaScore}
                          {criteria.weight !== 1 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {' '}x {criteria.weight} = {criteriaScore * criteria.weight}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          
          {/* Table Footer */}
          {showTotals && studentScore && (
            <tfoot className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <td 
                  colSpan={rubric.performanceLevels.length + 1} 
                  className="px-4 py-3 text-sm font-medium text-right text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700"
                >
                  Total Score:
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {totalScore} / {maxPossibleScore} ({percentage}%)
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      
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
