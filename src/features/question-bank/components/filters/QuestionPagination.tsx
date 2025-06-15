'use client';

import React from 'react';
import { Pagination } from '@/components/ui/composite/pagination';

interface QuestionPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

/**
 * Question Pagination Component
 * 
 * This component provides pagination for questions in the question bank.
 * It wraps the Pagination component from the UI library.
 */
export const QuestionPagination: React.FC<QuestionPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
}) => {
  return (
    <div className={className}>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
        totalItems={totalItems}
        showPageSizeSelector={!!onPageSizeChange}
        showItemsCount={true}
        role="teacher"
        variant="default"
      />
    </div>
  );
};

export default QuestionPagination;
