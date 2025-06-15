'use client';

import React, { useState } from 'react';
import { BLOOMS_LEVELS, getSuggestedVerbs } from '../../utils/bloom-integration';

interface BloomsTaxonomySelectorProps {
  selectedLevel: string;
  onChange: (level: string) => void;
}

/**
 * BloomsTaxonomySelector component for selecting Bloom's Taxonomy levels
 * 
 * This component provides an interface for selecting Bloom's Taxonomy
 * cognitive levels with action verb suggestions.
 */
export function BloomsTaxonomySelector({
  selectedLevel,
  onChange,
}: BloomsTaxonomySelectorProps) {
  const [showVerbSuggestions, setShowVerbSuggestions] = useState(false);

  // Get suggested verbs for the selected level
  const suggestedVerbs = getSuggestedVerbs(selectedLevel);

  // Handle level selection
  const handleLevelSelect = (level: string) => {
    onChange(level);
  };

  return (
    <div className="blooms-taxonomy-selector">
      {/* Level Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {Object.values(BLOOMS_LEVELS).map((level) => (
          <button
            key={level.id}
            type="button"
            onClick={() => handleLevelSelect(level.id)}
            className={`p-2 rounded text-center transition-colors ${
              selectedLevel === level.id
                ? 'border-2 border-blue-500 font-medium'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: selectedLevel === level.id ? `${level.color}30` : undefined,
            }}
          >
            <div className="font-medium">{level.name}</div>
            <div className="text-xs text-gray-600 mt-1 truncate">{level.description}</div>
          </button>
        ))}
      </div>

      {/* Level Description */}
      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-medium">
              {BLOOMS_LEVELS[selectedLevel as keyof typeof BLOOMS_LEVELS]?.name || 'Selected Level'}:
            </span>{' '}
            {BLOOMS_LEVELS[selectedLevel as keyof typeof BLOOMS_LEVELS]?.description || ''}
          </div>
          <button
            type="button"
            onClick={() => setShowVerbSuggestions(!showVerbSuggestions)}
            className="text-blue-600 hover:underline text-xs"
          >
            {showVerbSuggestions ? 'Hide Verbs' : 'Show Action Verbs'}
          </button>
        </div>

        {/* Action Verb Suggestions */}
        {showVerbSuggestions && (
          <div className="mt-2">
            <div className="text-xs font-medium mb-1">Suggested Action Verbs:</div>
            <div className="flex flex-wrap gap-1">
              {suggestedVerbs.map((verb) => (
                <span
                  key={verb}
                  className="px-2 py-1 bg-white border rounded-full text-xs"
                >
                  {verb}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
