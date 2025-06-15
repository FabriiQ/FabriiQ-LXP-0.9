'use client';

import React, { useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BloomsTaxonomyLevel } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { cn } from '@/lib/utils';

interface RubricCriterion {
  id: string;
  name: string;
  description?: string;
  bloomsLevel?: BloomsTaxonomyLevel;
  weight?: number;
}

interface RubricLevel {
  id: string;
  name: string;
  points: number;
}

interface RubricDescriptor {
  criterionId: string;
  levelId: string;
  description: string;
}

interface VirtualizedRubricTableProps {
  criteria: RubricCriterion[];
  levels: RubricLevel[];
  descriptors: RubricDescriptor[];
  className?: string;
  onDescriptorChange?: (descriptor: RubricDescriptor) => void;
  isEditable?: boolean;
}

export function VirtualizedRubricTable({
  criteria,
  levels,
  descriptors,
  className,
  onDescriptorChange,
  isEditable = false
}: VirtualizedRubricTableProps) {
  // Create a parent ref for the virtualized list
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Set up the row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: criteria.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimate row height
    overscan: 5, // Number of items to render outside of the visible area
  });

  // Get descriptor for a criterion and level
  const getDescriptor = useCallback(
    (criterionId: string, levelId: string) => {
      return descriptors.find(
        d => d.criterionId === criterionId && d.levelId === levelId
      )?.description || '';
    },
    [descriptors]
  );

  // Handle descriptor change
  const handleDescriptorChange = useCallback(
    (criterionId: string, levelId: string, description: string) => {
      if (onDescriptorChange) {
        onDescriptorChange({
          criterionId,
          levelId,
          description
        });
      }
    },
    [onDescriptorChange]
  );

  // Get Bloom's level color
  const getBloomsLevelColor = useCallback((level?: BloomsTaxonomyLevel) => {
    if (!level) return 'bg-gray-100';
    return `bg-[${BLOOMS_LEVEL_METADATA[level].color}15] border-l-4 border-[${BLOOMS_LEVEL_METADATA[level].color}]`;
  }, []);

  return (
    <div className={cn('virtualized-rubric-table', className)}>
      {/* Header row */}
      <div className="flex border-b">
        <div className="w-1/4 p-2 font-medium bg-gray-50 border-r">Criteria</div>
        {levels.map(level => (
          <div
            key={level.id}
            className="flex-1 p-2 font-medium bg-gray-50 border-r text-center"
          >
            {level.name} ({level.points} pts)
          </div>
        ))}
      </div>

      {/* Virtualized body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: '500px', // Fixed height for virtualization
          width: '100%',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const criterion = criteria[virtualRow.index];
            return (
              <div
                key={criterion.id}
                className="absolute top-0 left-0 flex w-full border-b"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className={cn('w-1/4 p-2 border-r flex flex-col', getBloomsLevelColor(criterion.bloomsLevel))}>
                  <div className="font-medium">{criterion.name}</div>
                  {criterion.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {criterion.description}
                    </div>
                  )}
                  {criterion.bloomsLevel && (
                    <div className="text-xs mt-1 text-muted-foreground">
                      Bloom's Level: {BLOOMS_LEVEL_METADATA[criterion.bloomsLevel].name}
                    </div>
                  )}
                  {criterion.weight && (
                    <div className="text-xs mt-1 text-muted-foreground">
                      Weight: {criterion.weight}%
                    </div>
                  )}
                </div>
                {levels.map(level => (
                  <div key={level.id} className="flex-1 p-2 border-r">
                    {isEditable ? (
                      <textarea
                        className="w-full h-full min-h-[80px] p-2 text-sm border rounded-md"
                        value={getDescriptor(criterion.id, level.id)}
                        onChange={e =>
                          handleDescriptorChange(
                            criterion.id,
                            level.id,
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      <div className="text-sm">
                        {getDescriptor(criterion.id, level.id)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
