'use client';

import React, { useState } from 'react';
import { AnalyticsDashboardFilters, AnalyticsTimeRange, AnalyticsTimePeriod } from '../types';

interface DashboardFiltersProps {
  filters: AnalyticsDashboardFilters;
  onFilterChange: (filters: AnalyticsDashboardFilters) => void;
  availableActivityTypes?: string[];
  availableClasses?: Array<{ id: string; name: string }>;
  availableCategories?: Array<{ id: string; name: string }>;
  className?: string;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
  availableActivityTypes = ['quiz', 'reading', 'video', 'assignment', 'discussion'],
  availableClasses = [],
  availableCategories = [],
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handle activity type change
  const handleActivityTypeChange = (type: string, checked: boolean) => {
    const updatedTypes = filters.activityTypes || [];
    
    if (checked) {
      // Add type
      if (!updatedTypes.includes(type)) {
        onFilterChange({
          ...filters,
          activityTypes: [...updatedTypes, type],
        });
      }
    } else {
      // Remove type
      onFilterChange({
        ...filters,
        activityTypes: updatedTypes.filter(t => t !== type),
      });
    }
  };
  
  // Handle time period change
  const handleTimePeriodChange = (period: AnalyticsTimePeriod) => {
    const timeRange: AnalyticsTimeRange = { period };
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | undefined;
    
    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = undefined;
        break;
    }
    
    if (startDate) {
      timeRange.startDate = startDate;
      timeRange.endDate = now;
    }
    
    onFilterChange({
      ...filters,
      timeRange,
    });
  };
  
  // Handle class selection
  const handleClassChange = (classId: string, checked: boolean) => {
    const updatedClasses = filters.classIds || [];
    
    if (checked) {
      // Add class
      if (!updatedClasses.includes(classId)) {
        onFilterChange({
          ...filters,
          classIds: [...updatedClasses, classId],
        });
      }
    } else {
      // Remove class
      onFilterChange({
        ...filters,
        classIds: updatedClasses.filter(id => id !== classId),
      });
    }
  };
  
  // Handle category selection
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const updatedCategories = filters.categoryIds || [];
    
    if (checked) {
      // Add category
      if (!updatedCategories.includes(categoryId)) {
        onFilterChange({
          ...filters,
          categoryIds: [...updatedCategories, categoryId],
        });
      }
    } else {
      // Remove category
      onFilterChange({
        ...filters,
        categoryIds: updatedCategories.filter(id => id !== categoryId),
      });
    }
  };
  
  // Handle clear filters
  const handleClearFilters = () => {
    onFilterChange({});
  };
  
  return (
    <div className={`dashboard-filters ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}>
      <div className="filters-header">
        <h3>Filters</h3>
        <button 
          className="toggle-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      <div className="filters-content">
        <div className="filter-section">
          <h4>Time Range</h4>
          <div className="time-range-options">
            <label className={`time-option ${filters.timeRange?.period === 'day' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="time-period"
                checked={filters.timeRange?.period === 'day'}
                onChange={() => handleTimePeriodChange('day')}
              />
              Today
            </label>
            
            <label className={`time-option ${filters.timeRange?.period === 'week' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="time-period"
                checked={filters.timeRange?.period === 'week'}
                onChange={() => handleTimePeriodChange('week')}
              />
              Last 7 Days
            </label>
            
            <label className={`time-option ${filters.timeRange?.period === 'month' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="time-period"
                checked={filters.timeRange?.period === 'month'}
                onChange={() => handleTimePeriodChange('month')}
              />
              Last 30 Days
            </label>
            
            <label className={`time-option ${filters.timeRange?.period === 'quarter' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="time-period"
                checked={filters.timeRange?.period === 'quarter'}
                onChange={() => handleTimePeriodChange('quarter')}
              />
              Last 3 Months
            </label>
            
            <label className={`time-option ${filters.timeRange?.period === 'year' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="time-period"
                checked={filters.timeRange?.period === 'year'}
                onChange={() => handleTimePeriodChange('year')}
              />
              Last Year
            </label>
            
            <label className={`time-option ${filters.timeRange?.period === 'all' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="time-period"
                checked={filters.timeRange?.period === 'all' || !filters.timeRange?.period}
                onChange={() => handleTimePeriodChange('all')}
              />
              All Time
            </label>
          </div>
        </div>
        
        <div className="filter-section">
          <h4>Activity Types</h4>
          <div className="activity-type-options">
            {availableActivityTypes.map((type) => (
              <label key={type} className="activity-type-option">
                <input
                  type="checkbox"
                  checked={(filters.activityTypes || []).includes(type)}
                  onChange={(e) => handleActivityTypeChange(type, e.target.checked)}
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
        </div>
        
        {availableClasses.length > 0 && (
          <div className="filter-section">
            <h4>Classes</h4>
            <div className="class-options">
              {availableClasses.map((cls) => (
                <label key={cls.id} className="class-option">
                  <input
                    type="checkbox"
                    checked={(filters.classIds || []).includes(cls.id)}
                    onChange={(e) => handleClassChange(cls.id, e.target.checked)}
                  />
                  {cls.name}
                </label>
              ))}
            </div>
          </div>
        )}
        
        {availableCategories.length > 0 && (
          <div className="filter-section">
            <h4>Categories</h4>
            <div className="category-options">
              {availableCategories.map((category) => (
                <label key={category.id} className="category-option">
                  <input
                    type="checkbox"
                    checked={(filters.categoryIds || []).includes(category.id)}
                    onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </div>
        )}
        
        <div className="filter-actions">
          <button 
            className="clear-filters-button"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};
