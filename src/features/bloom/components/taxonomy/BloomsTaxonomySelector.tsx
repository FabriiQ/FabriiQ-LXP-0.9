'use client';

import React from 'react';
import { BloomsTaxonomyLevel } from '../../types';
import { BLOOMS_LEVEL_METADATA, ORDERED_BLOOMS_LEVELS } from '../../constants/bloom-levels';

interface BloomsTaxonomySelectorProps {
  value: BloomsTaxonomyLevel | null;
  onChange: (level: BloomsTaxonomyLevel) => void;
  disabled?: boolean;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'buttons' | 'dropdown' | 'radio';
}

/**
 * Component for selecting a Bloom's Taxonomy level
 */
export function BloomsTaxonomySelector({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  size = 'md',
  variant = 'buttons',
}: BloomsTaxonomySelectorProps) {
  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1 px-2';
      case 'lg':
        return 'text-base py-2 px-4';
      case 'md':
      default:
        return 'text-sm py-1.5 px-3';
    }
  };
  
  // Render buttons variant
  const renderButtons = () => {
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex flex-wrap gap-2">
          {ORDERED_BLOOMS_LEVELS.map((level) => {
            const metadata = BLOOMS_LEVEL_METADATA[level];
            const isSelected = value === level;
            
            return (
              <button
                key={level}
                type="button"
                onClick={() => onChange(level)}
                disabled={disabled}
                className={`
                  rounded-md font-medium transition-colors
                  ${getSizeClasses()}
                  ${isSelected 
                    ? 'text-white' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{
                  backgroundColor: isSelected ? metadata.color : 'transparent',
                  borderColor: metadata.color,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                {metadata.name}
              </button>
            );
          })}
        </div>
        
        {showDescription && value && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {BLOOMS_LEVEL_METADATA[value].description}
          </div>
        )}
      </div>
    );
  };
  
  // Render dropdown variant
  const renderDropdown = () => {
    return (
      <div className="flex flex-col space-y-2">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value as BloomsTaxonomyLevel)}
          disabled={disabled}
          className={`
            rounded-md border border-gray-300 bg-white 
            dark:border-gray-700 dark:bg-gray-900
            ${getSizeClasses()}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <option value="">Select a level</option>
          {ORDERED_BLOOMS_LEVELS.map((level) => (
            <option key={level} value={level}>
              {BLOOMS_LEVEL_METADATA[level].name}
            </option>
          ))}
        </select>
        
        {showDescription && value && (
          <div 
            className="mt-2 text-sm p-2 rounded-md"
            style={{
              backgroundColor: `${BLOOMS_LEVEL_METADATA[value].color}20`, // 20% opacity
              color: BLOOMS_LEVEL_METADATA[value].color,
            }}
          >
            {BLOOMS_LEVEL_METADATA[value].description}
          </div>
        )}
      </div>
    );
  };
  
  // Render radio variant
  const renderRadio = () => {
    return (
      <div className="flex flex-col space-y-2">
        {ORDERED_BLOOMS_LEVELS.map((level) => {
          const metadata = BLOOMS_LEVEL_METADATA[level];
          const isSelected = value === level;
          
          return (
            <label
              key={level}
              className={`
                flex items-center space-x-2 p-2 rounded-md transition-colors
                ${isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <input
                type="radio"
                name="bloomsLevel"
                value={level}
                checked={isSelected}
                onChange={() => onChange(level)}
                disabled={disabled}
                className="h-4 w-4"
                style={{ accentColor: metadata.color }}
              />
              <div>
                <div className="font-medium" style={{ color: metadata.color }}>
                  {metadata.name}
                </div>
                {showDescription && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {metadata.description}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    );
  };
  
  // Render the appropriate variant
  switch (variant) {
    case 'dropdown':
      return renderDropdown();
    case 'radio':
      return renderRadio();
    case 'buttons':
    default:
      return renderButtons();
  }
}
