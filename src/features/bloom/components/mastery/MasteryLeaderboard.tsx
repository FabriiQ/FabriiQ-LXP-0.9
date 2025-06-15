'use client';

import React from 'react';
import { BloomsTaxonomyLevel } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { 
  MASTERY_LEVEL_COLORS,
  MASTERY_LEVEL_DESCRIPTIONS
} from '../../constants/mastery-thresholds';
import { getMasteryLevel } from '../../utils/mastery-helpers';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  overallMastery: number;
  bloomsLevels?: Partial<Record<BloomsTaxonomyLevel, number>>;
}

interface MasteryLeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  limit?: number;
  showBloomsLevels?: boolean;
  highlightUserId?: string;
  onEntryClick?: (entry: LeaderboardEntry) => void;
}

/**
 * Component for displaying a mastery leaderboard
 */
export function MasteryLeaderboard({
  entries,
  title = 'Mastery Leaderboard',
  limit = 10,
  showBloomsLevels = false,
  highlightUserId,
  onEntryClick,
}: MasteryLeaderboardProps) {
  // Sort entries by overall mastery (descending)
  const sortedEntries = [...entries].sort((a, b) => b.overallMastery - a.overallMastery);
  
  // Limit the number of entries
  const limitedEntries = sortedEntries.slice(0, limit);
  
  // Find the highlighted user's position
  const highlightedUserPosition = highlightUserId
    ? sortedEntries.findIndex(entry => entry.id === highlightUserId) + 1
    : null;
  
  // Find the highlighted user's entry
  const highlightedUserEntry = highlightUserId
    ? sortedEntries.find(entry => entry.id === highlightUserId)
    : null;
  
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>
      
      {/* Leaderboard */}
      <div className="divide-y">
        {limitedEntries.map((entry, index) => {
          const position = index + 1;
          const masteryLevel = getMasteryLevel(entry.overallMastery);
          const masteryColor = MASTERY_LEVEL_COLORS[masteryLevel];
          const isHighlighted = entry.id === highlightUserId;
          
          return (
            <div
              key={entry.id}
              className={`
                px-4 py-3 flex items-center
                ${onEntryClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                ${isHighlighted ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              `}
              onClick={() => onEntryClick?.(entry)}
            >
              {/* Position */}
              <div className="w-8 text-center font-bold text-gray-500 dark:text-gray-400">
                {position}
              </div>
              
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                {entry.avatar ? (
                  <img
                    src={entry.avatar}
                    alt={entry.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {entry.name.charAt(0)}
                  </span>
                )}
              </div>
              
              {/* Name and mastery */}
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {entry.name}
                  {isHighlighted && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                      (You)
                    </span>
                  )}
                </div>
                
                {showBloomsLevels && entry.bloomsLevels && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(entry.bloomsLevels).map(([level, value]) => {
                      const bloomsLevel = level as BloomsTaxonomyLevel;
                      const metadata = BLOOMS_LEVEL_METADATA[bloomsLevel];
                      
                      return (
                        <div
                          key={level}
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            backgroundColor: `${metadata.color}20`, // 20% opacity
                            color: metadata.color,
                          }}
                        >
                          {metadata.name}: {Math.round(value || 0)}%
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Mastery score */}
              <div className="text-right">
                <div className="text-xl font-bold" style={{ color: masteryColor }}>
                  {Math.round(entry.overallMastery)}%
                </div>
                <div className="text-xs" style={{ color: masteryColor }}>
                  {masteryLevel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Highlighted user (if not in top entries) */}
      {highlightUserId && highlightedUserPosition && highlightedUserPosition > limit && highlightedUserEntry && (
        <>
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
            • • •
          </div>
          <div className="px-4 py-3 flex items-center bg-blue-50 dark:bg-blue-900/20">
            {/* Position */}
            <div className="w-8 text-center font-bold text-gray-500 dark:text-gray-400">
              {highlightedUserPosition}
            </div>
            
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
              {highlightedUserEntry.avatar ? (
                <img
                  src={highlightedUserEntry.avatar}
                  alt={highlightedUserEntry.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {highlightedUserEntry.name.charAt(0)}
                </span>
              )}
            </div>
            
            {/* Name and mastery */}
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {highlightedUserEntry.name}
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                  (You)
                </span>
              </div>
              
              {showBloomsLevels && highlightedUserEntry.bloomsLevels && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(highlightedUserEntry.bloomsLevels).map(([level, value]) => {
                    const bloomsLevel = level as BloomsTaxonomyLevel;
                    const metadata = BLOOMS_LEVEL_METADATA[bloomsLevel];
                    
                    return (
                      <div
                        key={level}
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: `${metadata.color}20`, // 20% opacity
                          color: metadata.color,
                        }}
                      >
                        {metadata.name}: {Math.round(value || 0)}%
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Mastery score */}
            <div className="text-right">
              <div className="text-xl font-bold" style={{ color: MASTERY_LEVEL_COLORS[getMasteryLevel(highlightedUserEntry.overallMastery)] }}>
                {Math.round(highlightedUserEntry.overallMastery)}%
              </div>
              <div className="text-xs" style={{ color: MASTERY_LEVEL_COLORS[getMasteryLevel(highlightedUserEntry.overallMastery)] }}>
                {getMasteryLevel(highlightedUserEntry.overallMastery)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
