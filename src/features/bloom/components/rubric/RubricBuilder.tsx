'use client';

import React, { useState } from 'react';
import { 
  Rubric, 
  RubricType, 
  RubricCriteria, 
  PerformanceLevel,
  BloomsTaxonomyLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { BloomsTaxonomySelector } from '../taxonomy/BloomsTaxonomySelector';
import { BloomsDistributionChart } from '../taxonomy/BloomsDistributionChart';
import { calculateRubricBloomsDistribution } from '../../utils/rubric-helpers';

interface RubricBuilderProps {
  rubric: Partial<Rubric>;
  onChange: (rubric: Partial<Rubric>) => void;
  showBloomsDistribution?: boolean;
}

/**
 * Enhanced rubric builder component with Bloom's Taxonomy integration
 */
export function RubricBuilder({
  rubric,
  onChange,
  showBloomsDistribution = true,
}: RubricBuilderProps) {
  // State for the currently expanded criteria
  const [expandedCriteriaId, setExpandedCriteriaId] = useState<string | null>(null);
  
  // Calculate Bloom's distribution
  const bloomsDistribution = rubric.criteria && rubric.criteria.length > 0
    ? calculateRubricBloomsDistribution(rubric as Rubric)
    : {};
  
  // Update rubric properties
  const updateRubricProperties = (properties: Partial<Rubric>) => {
    onChange({
      ...rubric,
      ...properties,
    });
  };
  
  // Add a new criteria
  const addCriteria = () => {
    // Create a new criteria with a unique ID
    const newCriteria: RubricCriteria = {
      id: `criteria-${Date.now()}`,
      name: 'New Criteria',
      description: '',
      bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND, // Default level
      weight: 1,
      learningOutcomeIds: [],
      performanceLevels: rubric.performanceLevels?.map(level => ({
        levelId: level.id,
        description: '',
        score: level.scoreRange.min,
      })) || [],
    };
    
    // Add the criteria to the rubric
    onChange({
      ...rubric,
      criteria: [...(rubric.criteria || []), newCriteria],
    });
    
    // Expand the new criteria
    setExpandedCriteriaId(newCriteria.id);
  };
  
  // Update a criteria
  const updateCriteria = (criteriaId: string, updates: Partial<RubricCriteria>) => {
    onChange({
      ...rubric,
      criteria: rubric.criteria?.map(criteria => 
        criteria.id === criteriaId
          ? { ...criteria, ...updates }
          : criteria
      ),
    });
  };
  
  // Remove a criteria
  const removeCriteria = (criteriaId: string) => {
    onChange({
      ...rubric,
      criteria: rubric.criteria?.filter(criteria => criteria.id !== criteriaId),
    });
    
    // If the removed criteria was expanded, collapse it
    if (expandedCriteriaId === criteriaId) {
      setExpandedCriteriaId(null);
    }
  };
  
  // Update a criteria performance level
  const updateCriteriaPerformanceLevel = (
    criteriaId: string,
    levelId: string,
    description: string,
    score: number
  ) => {
    onChange({
      ...rubric,
      criteria: rubric.criteria?.map(criteria => 
        criteria.id === criteriaId
          ? {
              ...criteria,
              performanceLevels: criteria.performanceLevels.map(level => 
                level.levelId === levelId
                  ? { ...level, description, score }
                  : level
              ),
            }
          : criteria
      ),
    });
  };
  
  // Add a performance level
  const addPerformanceLevel = () => {
    // Create a new performance level with a unique ID
    const newLevel: PerformanceLevel = {
      id: `level-${Date.now()}`,
      name: 'New Level',
      description: '',
      scoreRange: { min: 0, max: 100 },
    };
    
    // Add the level to the rubric
    onChange({
      ...rubric,
      performanceLevels: [...(rubric.performanceLevels || []), newLevel],
      // Update criteria to include the new level
      criteria: rubric.criteria?.map(criteria => ({
        ...criteria,
        performanceLevels: [
          ...criteria.performanceLevels,
          {
            levelId: newLevel.id,
            description: '',
            score: newLevel.scoreRange.min,
          },
        ],
      })),
    });
  };
  
  // Update a performance level
  const updatePerformanceLevel = (
    levelId: string,
    updates: Partial<PerformanceLevel>
  ) => {
    onChange({
      ...rubric,
      performanceLevels: rubric.performanceLevels?.map(level => 
        level.id === levelId
          ? { ...level, ...updates }
          : level
      ),
    });
  };
  
  // Remove a performance level
  const removePerformanceLevel = (levelId: string) => {
    onChange({
      ...rubric,
      performanceLevels: rubric.performanceLevels?.filter(level => level.id !== levelId),
      // Update criteria to remove the level
      criteria: rubric.criteria?.map(criteria => ({
        ...criteria,
        performanceLevels: criteria.performanceLevels.filter(level => level.levelId !== levelId),
      })),
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Rubric Header */}
      <div className="space-y-4">
        <div>
          <label htmlFor="rubric-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rubric Title
          </label>
          <input
            id="rubric-title"
            type="text"
            value={rubric.title || ''}
            onChange={(e) => updateRubricProperties({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Enter rubric title"
          />
        </div>
        
        <div>
          <label htmlFor="rubric-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="rubric-description"
            value={rubric.description || ''}
            onChange={(e) => updateRubricProperties({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Enter rubric description"
            rows={2}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rubric Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="rubricType"
                value={RubricType.ANALYTIC}
                checked={rubric.type === RubricType.ANALYTIC}
                onChange={() => updateRubricProperties({ type: RubricType.ANALYTIC })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Analytic (Multiple Criteria)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="rubricType"
                value={RubricType.HOLISTIC}
                checked={rubric.type === RubricType.HOLISTIC}
                onChange={() => updateRubricProperties({ type: RubricType.HOLISTIC })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Holistic (Overall Assessment)
              </span>
            </label>
          </div>
        </div>
        
        <div>
          <label htmlFor="rubric-max-score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Maximum Score
          </label>
          <input
            id="rubric-max-score"
            type="number"
            value={rubric.maxScore || 100}
            onChange={(e) => updateRubricProperties({ maxScore: Number(e.target.value) })}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            min={1}
            max={1000}
          />
        </div>
      </div>
      
      {/* Performance Levels */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Performance Levels
          </h3>
          <button
            type="button"
            onClick={addPerformanceLevel}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Add Level
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Level Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Score Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              {rubric.performanceLevels?.map((level) => (
                <tr key={level.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={level.name}
                      onChange={(e) => updatePerformanceLevel(level.id, { name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={level.description}
                      onChange={(e) => updatePerformanceLevel(level.id, { description: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={level.scoreRange.min}
                        onChange={(e) => updatePerformanceLevel(level.id, { 
                          scoreRange: { ...level.scoreRange, min: Number(e.target.value) } 
                        })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        min={0}
                        max={level.scoreRange.max}
                      />
                      <span>to</span>
                      <input
                        type="number"
                        value={level.scoreRange.max}
                        onChange={(e) => updatePerformanceLevel(level.id, { 
                          scoreRange: { ...level.scoreRange, max: Number(e.target.value) } 
                        })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        min={level.scoreRange.min}
                        max={rubric.maxScore || 100}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="color"
                      value={level.color || '#cccccc'}
                      onChange={(e) => updatePerformanceLevel(level.id, { color: e.target.value })}
                      className="w-8 h-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => removePerformanceLevel(level.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Bloom's Distribution */}
      {showBloomsDistribution && rubric.criteria && rubric.criteria.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Bloom's Taxonomy Distribution
          </h3>
          <div className="h-48">
            <BloomsDistributionChart
              distribution={bloomsDistribution}
              variant="horizontal-bar"
            />
          </div>
        </div>
      )}
      
      {/* Criteria */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Criteria
          </h3>
          <button
            type="button"
            onClick={addCriteria}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Add Criteria
          </button>
        </div>
        
        <div className="space-y-4">
          {rubric.criteria?.map((criteria) => {
            const isExpanded = expandedCriteriaId === criteria.id;
            const bloomsMetadata = BLOOMS_LEVEL_METADATA[criteria.bloomsLevel];
            
            return (
              <div
                key={criteria.id}
                className="border border-gray-200 rounded-md overflow-hidden dark:border-gray-700"
              >
                {/* Criteria Header */}
                <div 
                  className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedCriteriaId(isExpanded ? null : criteria.id)}
                  style={{
                    backgroundColor: isExpanded ? `${bloomsMetadata.color}20` : 'transparent',
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: bloomsMetadata.color }}
                    />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {criteria.name}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({bloomsMetadata.name})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Weight: {criteria.weight}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCriteria(criteria.id);
                      }}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                    <span className="text-gray-500">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                
                {/* Criteria Details */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Criteria Name
                        </label>
                        <input
                          type="text"
                          value={criteria.name}
                          onChange={(e) => updateCriteria(criteria.id, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Weight
                        </label>
                        <input
                          type="number"
                          value={criteria.weight}
                          onChange={(e) => updateCriteria(criteria.id, { weight: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          min={0}
                          max={10}
                          step={0.1}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={criteria.description}
                        onChange={(e) => updateCriteria(criteria.id, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bloom's Taxonomy Level
                      </label>
                      <BloomsTaxonomySelector
                        value={criteria.bloomsLevel}
                        onChange={(level) => updateCriteria(criteria.id, { bloomsLevel: level })}
                        variant="buttons"
                        size="sm"
                      />
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Performance Level Descriptions
                      </h5>
                      <div className="space-y-3">
                        {criteria.performanceLevels.map((level) => {
                          const performanceLevel = rubric.performanceLevels?.find(pl => pl.id === level.levelId);
                          
                          if (!performanceLevel) return null;
                          
                          return (
                            <div key={level.levelId} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {performanceLevel.name}
                                </label>
                              </div>
                              <div className="md:col-span-1">
                                <input
                                  type="text"
                                  value={level.description}
                                  onChange={(e) => updateCriteriaPerformanceLevel(
                                    criteria.id,
                                    level.levelId,
                                    e.target.value,
                                    level.score
                                  )}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                  placeholder={`Description for ${performanceLevel.name}`}
                                />
                              </div>
                              <div className="md:col-span-1">
                                <input
                                  type="number"
                                  value={level.score}
                                  onChange={(e) => updateCriteriaPerformanceLevel(
                                    criteria.id,
                                    level.levelId,
                                    level.description,
                                    Number(e.target.value)
                                  )}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                  min={performanceLevel.scoreRange.min}
                                  max={performanceLevel.scoreRange.max}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
