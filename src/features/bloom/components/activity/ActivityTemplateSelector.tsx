'use client';

import React, { useState, useEffect } from 'react';
import { 
  ActivityTemplate, 
  ActivityType, 
  ActivitySetting,
  BloomsTaxonomyLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { BloomsTaxonomySelector } from '../taxonomy/BloomsTaxonomySelector';

interface ActivityTemplateSelectorProps {
  templates: ActivityTemplate[];
  onSelect: (template: ActivityTemplate) => void;
  initialBloomsLevel?: BloomsTaxonomyLevel;
  initialType?: ActivityType;
  initialSetting?: ActivitySetting;
  showFilters?: boolean;
  loading?: boolean;
}

/**
 * Component for selecting activity templates
 */
export function ActivityTemplateSelector({
  templates,
  onSelect,
  initialBloomsLevel,
  initialType,
  initialSetting,
  showFilters = true,
  loading = false,
}: ActivityTemplateSelectorProps) {
  // Filter states
  const [bloomsLevel, setBloomsLevel] = useState<BloomsTaxonomyLevel | null>(
    initialBloomsLevel || null
  );
  const [activityType, setActivityType] = useState<ActivityType | null>(
    initialType || null
  );
  const [activitySetting, setActivitySetting] = useState<ActivitySetting | null>(
    initialSetting || null
  );
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtered templates
  const [filteredTemplates, setFilteredTemplates] = useState<ActivityTemplate[]>(templates);
  
  // Apply filters when templates or filter states change
  useEffect(() => {
    let filtered = [...templates];
    
    // Filter by Bloom's level
    if (bloomsLevel) {
      filtered = filtered.filter(template => template.bloomsLevel === bloomsLevel);
    }
    
    // Filter by activity type
    if (activityType) {
      filtered = filtered.filter(template => template.type === activityType);
    }
    
    // Filter by activity setting
    if (activitySetting) {
      filtered = filtered.filter(template => template.setting === activitySetting);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(term) ||
        template.description.toLowerCase().includes(term) ||
        template.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    setFilteredTemplates(filtered);
  }, [templates, bloomsLevel, activityType, activitySetting, searchTerm]);
  
  // Reset filters
  const resetFilters = () => {
    setBloomsLevel(null);
    setActivityType(null);
    setActivitySetting(null);
    setSearchTerm('');
  };
  
  // Get activity type display name
  const getActivityTypeDisplay = (type: ActivityType) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  // Get activity setting display name
  const getActivitySettingDisplay = (setting: ActivitySetting) => {
    return setting.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  return (
    <div className="space-y-6">
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
                placeholder="Search by title, description, or tags"
              />
            </div>
            
            {/* Bloom's Taxonomy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bloom's Level
              </label>
              <BloomsTaxonomySelector
                value={bloomsLevel}
                onChange={setBloomsLevel}
                variant="dropdown"
                showDescription={false}
              />
            </div>
            
            {/* Activity Type */}
            <div>
              <label htmlFor="activity-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Activity Type
              </label>
              <select
                id="activity-type"
                value={activityType || ''}
                onChange={(e) => setActivityType(e.target.value as ActivityType || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                {Object.values(ActivityType).map((type) => (
                  <option key={type} value={type}>
                    {getActivityTypeDisplay(type)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Activity Setting */}
            <div>
              <label htmlFor="activity-setting" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Activity Setting
              </label>
              <select
                id="activity-setting"
                value={activitySetting || ''}
                onChange={(e) => setActivitySetting(e.target.value as ActivitySetting || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">All Settings</option>
                {Object.values(ActivitySetting).map((setting) => (
                  <option key={setting} value={setting}>
                    {getActivitySettingDisplay(setting)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Templates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Activity Templates
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
            {filteredTemplates.map((template) => {
              const bloomsMetadata = BLOOMS_LEVEL_METADATA[template.bloomsLevel];
              
              return (
                <div
                  key={template.id}
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelect(template)}
                >
                  {/* Header */}
                  <div 
                    className="px-4 py-3 border-b"
                    style={{ borderColor: bloomsMetadata.color }}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {template.title}
                      </h4>
                      <div 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${bloomsMetadata.color}20`, // 20% opacity
                          color: bloomsMetadata.color,
                        }}
                      >
                        {bloomsMetadata.name}
                      </div>
                    </div>
                  </div>
                  
                  {/* Body */}
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                        {getActivityTypeDisplay(template.type)}
                      </div>
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                        {getActivitySettingDisplay(template.setting)}
                      </div>
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                        {template.estimatedDuration} min
                      </div>
                    </div>
                    
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <div
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-500 dark:text-gray-400"
                          >
                            #{tag}
                          </div>
                        ))}
                        {template.tags.length > 3 && (
                          <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-500 dark:text-gray-400">
                            +{template.tags.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
