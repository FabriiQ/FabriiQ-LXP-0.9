'use client';

import React, { useState } from 'react';
import StudentClassList, { ClassData } from './StudentClassList';

interface StudentClassListClientProps {
  classes: ClassData[];
  defaultSortBy?: 'name' | 'lastActivity' | 'importance' | 'deadline' | 'progress';
  defaultSortOrder?: 'asc' | 'desc';
  showFilters?: boolean;
  showSearch?: boolean;
}

/**
 * Client-side wrapper for StudentClassList that adds refresh functionality
 * This component handles client-side interactions that can't be done in server components
 */
export function StudentClassListClient({
  classes,
  defaultSortBy,
  defaultSortOrder,
  showFilters,
  showSearch,
}: StudentClassListClientProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Simulate a refresh with a delay
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // In a real implementation, this would fetch fresh data from the API
    // For now, we'll just simulate a refresh with a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsRefreshing(false);
  };
  
  return (
    <StudentClassList
      classes={classes}
      defaultSortBy={defaultSortBy}
      defaultSortOrder={defaultSortOrder}
      showFilters={showFilters}
      showSearch={showSearch}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    />
  );
}

export default StudentClassListClient;
