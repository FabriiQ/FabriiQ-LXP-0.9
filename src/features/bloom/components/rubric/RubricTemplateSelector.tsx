'use client';

import React, { useState, useEffect } from 'react';
import { 
  Rubric, 
  RubricType, 
  BloomsTaxonomyLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { BloomsDistributionChart } from '../taxonomy/BloomsDistributionChart';

interface RubricTemplateSelectorProps {
  templates: Rubric[];
  onSelect: (template: Rubric) => void;
  initialType?: RubricType;
  initialBloomsLevels?: BloomsTaxonomyLevel[];
  showFilters?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Component for selecting rubric templates
 * 
 * This component follows mobile-first design principles and aligns with existing UI/UX.
 */
export function RubricTemplateSelector({
  templates,
  onSelect,
  initialType,
  initialBloomsLevels,
  showFilters = true,
  loading = false,
  className = '',
}: RubricTemplateSelectorProps) {
  // Filter states
  const [rubricType, setRubricType] = useState<RubricType | null>(
    initialType || null
  );
  const [bloomsLevels, setBloomsLevels] = useState<BloomsTaxonomyLevel[]>(
    initialBloomsLevels || []
  );
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtered templates
  const [filteredTemplates, setFilteredTemplates] = useState<Rubric[]>(templates);
  
  // Apply filters when templates or filter states change
  useEffect(() => {
    let filtered = [...templates];
    
    // Filter by rubric type
    if (rubricType) {
      filtered = filtered.filter(template => template.type === rubricType);
    }
    
    // Filter by Bloom's levels
    if (bloomsLevels.length > 0) {
      filtered = filtered.filter(template => {
        // Check if the template has any of the selected Bloom's levels
        return bloomsLevels.some(level => {
          const distribution = template.bloomsDistribution || {};
          return distribution[level] > 0;
        });
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(term) ||
        template.description?.toLowerCase().includes(term)
      );
    }
    
    setFilteredTemplates(filtered);
  }, [templates, rubricType, bloomsLevels, searchTerm]);
  
  // Reset filters
  const resetFilters = () => {
    setRubricType(null);
    setBloomsLevels([]);
    setSearchTerm('');
  };
  
  // Toggle Bloom's level selection
  const toggleBloomsLevel = (level: BloomsTaxonomyLevel) => {
    if (bloomsLevels.includes(level)) {
      setBloomsLevels(bloomsLevels.filter(l => l !== level));
    } else {
      setBloomsLevels([...bloomsLevels, level]);
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Filters
            </h3>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Reset
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="Search by title or description"
              />
            </div>
            
            {/* Rubric Type */}
            <div>
              <label htmlFor="rubric-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rubric Type
              </label>
              <select
                id="rubric-type"
                value={rubricType || ''}
                onChange={(e) => setRubricType(e.target.value as RubricType || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                <option value={RubricType.ANALYTIC}>Analytic</option>
                <option value={RubricType.HOLISTIC}>Holistic</option>
              </select>
            </div>
            
            {/* Bloom's Levels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bloom's Levels
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(BloomsTaxonomyLevel).map((level) => {
                  const metadata = BLOOMS_LEVEL_METADATA[level];
                  const isSelected = bloomsLevels.includes(level);
                  
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleBloomsLevel(level)}
                      className={`px-2 py-1 rounded-full text-xs transition-colors ${
                        isSelected
                          ? 'bg-opacity-100'
                          : 'bg-opacity-20'
                      }`}
                      style={{
                        backgroundColor: isSelected ? metadata.color : `${metadata.color}20`,
                        color: isSelected ? 'white' : metadata.color,
                      }}
                    >
                      {metadata.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Templates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Rubric Templates
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTemplates.length} templates
          </span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500 dark:text-gray-400">
              Loading templates...
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex items-center justify-center h-40 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No templates found matching your filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelect(template)}
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {template.title}
                    </h4>
                    <div 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: template.type === RubricType.ANALYTIC ? '#EBF5FF' : '#F0FDF4',
                        color: template.type === RubricType.ANALYTIC ? '#1E40AF' : '#166534',
                      }}
                    >
                      {template.type}
                    </div>
                  </div>
                </div>
                
                {/* Body */}
                <div className="px-4 py-3">
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {template.criteria.length} criteria
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {template.performanceLevels.length} levels
                    </div>
                  </div>
                  
                  {/* Bloom's Distribution */}
                  {template.bloomsDistribution && (
                    <div className="h-20">
                      <BloomsDistributionChart
                        distribution={template.bloomsDistribution}
                        variant="horizontal-bar"
                        showLabels={false}
                        showPercentages={false}
                        height={80}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
