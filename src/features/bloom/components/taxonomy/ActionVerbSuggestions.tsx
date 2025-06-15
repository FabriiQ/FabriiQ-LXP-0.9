'use client';

import React, { useState, useEffect } from 'react';
import { BloomsTaxonomyLevel, ActionVerb } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { getRandomActionVerbsForLevel } from '../../utils/bloom-helpers';
import { ACTION_VERBS_BY_LEVEL } from '../../constants/action-verbs';

interface ActionVerbSuggestionsProps {
  bloomsLevel: BloomsTaxonomyLevel;
  onSelect?: (verb: string) => void;
  count?: number;
  showExamples?: boolean;
  showRefreshButton?: boolean;
  selectedVerbs?: string[]; // Array of currently selected verbs
}

/**
 * Component for suggesting action verbs based on Bloom's level
 */
export function ActionVerbSuggestions({
  bloomsLevel,
  onSelect,
  count = 5,
  showExamples = true,
  showRefreshButton = true,
  selectedVerbs = [],
}: ActionVerbSuggestionsProps) {
  // Get all verbs for this level and use dynamic count
  const allVerbsForLevel = ACTION_VERBS_BY_LEVEL[bloomsLevel] || [];
  const dynamicCount = Math.min(count, allVerbsForLevel.length);

  // State for suggested verbs
  const [suggestedVerbs, setSuggestedVerbs] = useState<ActionVerb[]>(
    getRandomActionVerbsForLevel(bloomsLevel, dynamicCount)
  );

  // Get metadata for the Bloom's level
  const metadata = BLOOMS_LEVEL_METADATA[bloomsLevel];

  // Update verbs when bloomsLevel changes
  useEffect(() => {
    setSuggestedVerbs(getRandomActionVerbsForLevel(bloomsLevel, dynamicCount));
  }, [bloomsLevel, dynamicCount]);

  // Refresh suggested verbs
  const refreshVerbs = () => {
    setSuggestedVerbs(getRandomActionVerbsForLevel(bloomsLevel, dynamicCount));
  };

  // Handle verb selection
  const handleSelect = (verb: string) => {
    if (onSelect) {
      onSelect(verb);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {showRefreshButton && (
          <button
            type="button"
            onClick={refreshVerbs}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-auto"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestedVerbs.map((verbObj) => {
          // Ensure we're using the current level's color for each verb
          const verbMetadata = BLOOMS_LEVEL_METADATA[bloomsLevel];
          const isSelected = selectedVerbs.includes(verbObj.verb);

          return (
            <button
              key={verbObj.verb}
              type="button"
              onClick={() => handleSelect(verbObj.verb)}
              className="px-3 py-1 text-sm rounded-full transition-colors hover:shadow-md"
              style={{
                backgroundColor: isSelected
                  ? `${verbMetadata.color}30` // 30% opacity for selected
                  : 'transparent', // Transparent for unselected
                color: isSelected
                  ? verbMetadata.color
                  : '#6B7280', // Gray for unselected
                borderColor: isSelected
                  ? verbMetadata.color
                  : '#D1D5DB', // Light gray border for unselected
                borderWidth: '1px',
              }}
            >
              {verbObj.verb}
            </button>
          );
        })}
      </div>

      {showExamples && suggestedVerbs.length > 0 && suggestedVerbs[0].examples && (
        <div className="mt-2">
          <h4
            className="text-xs font-medium mb-1"
            style={{ color: metadata.color }}
          >
            Example:
          </h4>
          <p
            className="text-xs italic"
            style={{
              color: `${metadata.color}CC`, // 80% opacity
              borderLeft: `2px solid ${metadata.color}`,
              paddingLeft: '8px'
            }}
          >
            {suggestedVerbs[0].examples[0]}
          </p>
        </div>
      )}
    </div>
  );
}
