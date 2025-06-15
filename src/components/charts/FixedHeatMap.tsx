'use client';

import { ResponsiveHeatMap } from '@nivo/heatmap';
import React from 'react';

// Custom hook to recursively remove key props from objects
function removeKeyProps(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => removeKeyProps(item));
  }

  // Handle objects
  const { key, ...rest } = obj;

  // Recursively process all properties
  const result: any = {};
  for (const prop in rest) {
    if (Object.prototype.hasOwnProperty.call(rest, prop)) {
      result[prop] = removeKeyProps(rest[prop]);
    }
  }

  return result;
}

// This is a wrapper component to fix the React key spread issue in Nivo HeatMap
export function FixedResponsiveHeatMap(props: any) {
  // Validate data to prevent the "Cannot read properties of undefined (reading 'forEach')" error
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available for heatmap</p>
      </div>
    );
  }

  // Ensure each item in data has a valid 'data' property that is an array
  const validData = props.data.map((item: any) => ({
    ...item,
    data: Array.isArray(item.data) ? item.data : []
  }));

  // Extract and handle the legends prop separately to fix the key spreading issue
  const { legends, ...restProps } = props;

  // Create a properly formatted legends array if it exists, removing any key props
  const patchedLegends = legends ? legends.map((legend: any) => {
    // Process the legend object to remove any key props at any level
    const cleanedLegend = removeKeyProps(legend);

    return {
      ...cleanedLegend,
      // Preserve the itemComponent if it exists
      itemComponent: legend.itemComponent
    };
  }) : undefined;

  return (
    <ResponsiveHeatMap
      {...restProps}
      data={validData}
      legends={patchedLegends}
    />
  );
}
