'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface QuestionSortProps {
  value: {
    field: 'title' | 'createdAt' | 'updatedAt' | 'difficulty' | 'year';
    direction: 'asc' | 'desc';
  };
  onChange: (value: QuestionSortProps['value']) => void;
  className?: string;
}

/**
 * Question Sort Component
 * 
 * This component provides sorting options for questions in the question bank.
 */
export const QuestionSort: React.FC<QuestionSortProps> = ({
  value,
  onChange,
  className = '',
}) => {
  // Sort field options
  const sortFields = [
    { value: 'title', label: 'Title' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'year', label: 'Year' },
  ];
  
  // Handle sort field change
  const handleSortFieldChange = (field: QuestionSortProps['value']['field']) => {
    onChange({
      ...value,
      field,
    });
  };
  
  // Handle sort direction change
  const handleSortDirectionChange = () => {
    onChange({
      ...value,
      direction: value.direction === 'asc' ? 'desc' : 'asc',
    });
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select
        value={value.field}
        onValueChange={(val) => handleSortFieldChange(val as QuestionSortProps['value']['field'])}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortFields.map((field) => (
            <SelectItem key={field.value} value={field.value}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleSortDirectionChange}
        title={value.direction === 'asc' ? 'Ascending' : 'Descending'}
      >
        {value.direction === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default QuestionSort;
