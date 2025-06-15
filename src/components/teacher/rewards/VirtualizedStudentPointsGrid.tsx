'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { StudentPointsCard, StudentPointsData } from './StudentPointsCard';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VirtualizedStudentPointsGridProps {
  students: StudentPointsData[];
  onViewHistory?: (studentId: string) => void;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

/**
 * VirtualizedStudentPointsGrid
 *
 * A virtualized grid component for displaying student points cards
 * that only renders the cards that are visible in the viewport.
 */
export function VirtualizedStudentPointsGrid({
  students,
  onViewHistory,
  className,
  onLoadMore,
  hasMore = false,
  isLoading = false
}: VirtualizedStudentPointsGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Determine column count based on viewport width
  const [columnCount, setColumnCount] = useState(3);

  // Update column count on resize
  useEffect(() => {
    const updateColumnCount = () => {
      if (window.innerWidth < 640) {
        setColumnCount(1);
      } else if (window.innerWidth < 1024) {
        setColumnCount(2);
      } else {
        setColumnCount(3);
      }
    };

    // Set initial column count
    updateColumnCount();

    // Add resize listener
    window.addEventListener('resize', updateColumnCount);

    // Clean up
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  // Calculate number of rows based on students and column count
  const rowCount = Math.ceil(students.length / columnCount);

  // Create virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220, // Estimated row height
    overscan: 5, // Number of items to render before/after the visible area
  });

  // Handle scroll to load more
  useEffect(() => {
    if (!parentRef.current || !onLoadMore || !hasMore || isLoading) return;

    const scrollElement = parentRef.current;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;

      // Load more when user scrolls to 80% of the container
      if (scrollTop + clientHeight >= scrollHeight * 0.8 && hasMore && !isLoading) {
        onLoadMore();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMore, isLoading]);

  // Render a row of student cards
  const renderRow = useCallback((virtualRow: { index: number, start: number, size: number }) => {
    const rowIndex = virtualRow.index;
    const startIndex = rowIndex * columnCount;

    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        {Array.from({ length: columnCount }).map((_, colIndex) => {
          const studentIndex = startIndex + colIndex;

          // Only render if we have a student at this index
          if (studentIndex < students.length) {
            const student = students[studentIndex];

            return (
              <StudentPointsCard
                key={student.id}
                student={student}
                onViewHistory={onViewHistory}
              />
            );
          }

          // Return an empty div with a key for empty cells
          return <div key={`empty-${rowIndex}-${colIndex}`} className="hidden sm:block"></div>;
        })}
      </div>
    );
  }, [students, columnCount, onViewHistory]);

  // If no students, show empty state
  if (students.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No students found</h3>
        <p className="text-muted-foreground">
          Try a different search term or add students to this class
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("relative overflow-auto", className)}
      style={{ height: '600px' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <React.Fragment key={`row-${virtualRow.index}`}>
            {renderRow(virtualRow)}
          </React.Fragment>
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="py-4 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-muted-foreground">Loading more students...</p>
        </div>
      )}
    </div>
  );
}
