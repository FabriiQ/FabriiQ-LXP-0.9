'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  ActivityType, 
  ActivitySetting,
  BloomsTaxonomyLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { BloomsTaxonomySelector } from '../taxonomy/BloomsTaxonomySelector';
import { ActionVerbSuggestions } from '../taxonomy/ActionVerbSuggestions';

interface ActivityCustomizerProps {
  activity: Partial<Activity>;
  onChange: (activity: Partial<Activity>) => void;
  showBloomsTaxonomy?: boolean;
  showActionVerbs?: boolean;
  className?: string;
}

/**
 * Component for customizing activities
 * 
 * This component follows mobile-first design principles and aligns with existing UI/UX.
 */
export function ActivityCustomizer({
  activity,
  onChange,
  showBloomsTaxonomy = true,
  showActionVerbs = true,
  className = '',
}: ActivityCustomizerProps) {
  // State for the currently focused field
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Update activity properties
  const updateActivity = (properties: Partial<Activity>) => {
    onChange({
      ...activity,
      ...properties,
    });
  };
  
  // Add a material
  const addMaterial = () => {
    const materials = activity.materials || [];
    updateActivity({
      materials: [...materials, '']
    });
  };
  
  // Update a material
  const updateMaterial = (index: number, value: string) => {
    const materials = [...(activity.materials || [])];
    materials[index] = value;
    updateActivity({ materials });
  };
  
  // Remove a material
  const removeMaterial = (index: number) => {
    const materials = [...(activity.materials || [])];
    materials.splice(index, 1);
    updateActivity({ materials });
  };
  
  // Handle action verb selection
  const handleVerbSelect = (verb: string) => {
    if (focusedField === 'title') {
      updateActivity({
        title: `${verb} ${activity.title?.split(' ').slice(1).join(' ') || ''}`
      });
    } else if (focusedField === 'description') {
      // Insert at cursor position if possible
      const textarea = document.getElementById('activity-description') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = activity.description || '';
        const newText = text.substring(0, start) + verb + ' ' + text.substring(end);
        updateActivity({ description: newText });
        
        // Set cursor position after the inserted verb
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + verb.length + 1, start + verb.length + 1);
        }, 0);
      } else {
        // Fallback if textarea not found
        updateActivity({
          description: `${verb} ${activity.description || ''}`
        });
      }
    } else if (focusedField === 'instructions') {
      // Insert at cursor position if possible
      const textarea = document.getElementById('activity-instructions') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = activity.instructions || '';
        const newText = text.substring(0, start) + verb + ' ' + text.substring(end);
        updateActivity({ instructions: newText });
        
        // Set cursor position after the inserted verb
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + verb.length + 1, start + verb.length + 1);
        }, 0);
      } else {
        // Fallback if textarea not found
        updateActivity({
          instructions: `${verb} ${activity.instructions || ''}`
        });
      }
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label htmlFor="activity-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activity Title
            </label>
            <input
              id="activity-title"
              type="text"
              value={activity.title || ''}
              onChange={(e) => updateActivity({ title: e.target.value })}
              onFocus={() => setFocusedField('title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Enter activity title"
            />
          </div>
          
          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="activity-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="activity-description"
              value={activity.description || ''}
              onChange={(e) => updateActivity({ description: e.target.value })}
              onFocus={() => setFocusedField('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Enter activity description"
              rows={3}
            />
          </div>
          
          {/* Activity Type */}
          <div>
            <label htmlFor="activity-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activity Type
            </label>
            <select
              id="activity-type"
              value={activity.type || ''}
              onChange={(e) => updateActivity({ type: e.target.value as ActivityType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Select Type</option>
              {Object.values(ActivityType).map((type) => (
                <option key={type} value={type}>
                  {type.split('_').map(word => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                  ).join(' ')}
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
              value={activity.setting || ''}
              onChange={(e) => updateActivity({ setting: e.target.value as ActivitySetting })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Select Setting</option>
              {Object.values(ActivitySetting).map((setting) => (
                <option key={setting} value={setting}>
                  {setting.split('_').map(word => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                  ).join(' ')}
                </option>
              ))}
            </select>
          </div>
          
          {/* Duration */}
          <div>
            <label htmlFor="activity-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <input
              id="activity-duration"
              type="number"
              value={activity.duration || ''}
              onChange={(e) => updateActivity({ duration: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              min={1}
              max={240}
            />
          </div>
          
          {/* Group Size */}
          <div>
            <label htmlFor="activity-group-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Size
            </label>
            <input
              id="activity-group-size"
              type="number"
              value={activity.groupSize || ''}
              onChange={(e) => updateActivity({ groupSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              min={1}
              max={50}
            />
          </div>
        </div>
      </div>
      
      {/* Bloom's Taxonomy */}
      {showBloomsTaxonomy && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Bloom's Taxonomy Level
          </h3>
          
          <BloomsTaxonomySelector
            value={activity.bloomsLevel || BloomsTaxonomyLevel.UNDERSTAND}
            onChange={(level) => updateActivity({ bloomsLevel: level })}
            variant="buttons"
            showDescription={true}
          />
          
          {showActionVerbs && activity.bloomsLevel && (
            <div className="mt-4">
              <ActionVerbSuggestions
                bloomsLevel={activity.bloomsLevel}
                onSelect={handleVerbSelect}
                count={8}
                showExamples={true}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Materials */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Materials
          </h3>
          <button
            type="button"
            onClick={addMaterial}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Add Material
          </button>
        </div>
        
        <div className="space-y-2">
          {(activity.materials || []).map((material, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={material}
                onChange={(e) => updateMaterial(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="Enter material"
              />
              <button
                type="button"
                onClick={() => removeMaterial(index)}
                className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
          
          {(activity.materials || []).length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No materials added yet. Click "Add Material" to add one.
            </div>
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Instructions
        </h3>
        
        <textarea
          id="activity-instructions"
          value={activity.instructions || ''}
          onChange={(e) => updateActivity({ instructions: e.target.value })}
          onFocus={() => setFocusedField('instructions')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Enter detailed instructions for the activity"
          rows={6}
        />
      </div>
    </div>
  );
}
