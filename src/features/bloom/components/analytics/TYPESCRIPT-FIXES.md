# TypeScript Error Fixes for Bloom's Taxonomy Analytics Components

This document outlines the specific TypeScript errors in the Bloom's Taxonomy analytics components and provides detailed solutions for each issue.

## 1. InterventionSuggestions.tsx

### Error
```
Type '{ children: string; style: { backgroundColor: string; }; className: string; }' is not assignable to type 'IntrinsicAttributes & BadgeProps'.
Property 'style' does not exist on type 'IntrinsicAttributes & BadgeProps'.
```

### Analysis
The `Badge` component from `@/components/ui/badge` doesn't accept a `style` prop. Instead, it uses a variant-based approach with className for styling.

### Solution

1. **Current Code (Line 56-60):**
```tsx
<Badge 
  style={{ backgroundColor: levelMetadata.color }}
  className="text-white"
>
  {levelMetadata.name}
</Badge>
```

2. **Fix Approach:**
   - Create a custom variant or use className with dynamic color
   - Use the existing variant system if it supports custom colors

3. **Implementation Options:**

   **Option 1: Use className with dynamic color**
   ```tsx
   <Badge 
     className={`text-white bg-[${levelMetadata.color}]`}
   >
     {levelMetadata.name}
   </Badge>
   ```

   **Option 2: Create a custom variant**
   ```tsx
   <Badge 
     variant="custom"
     className={`text-white bloom-level-${suggestion.bloomsLevel.toLowerCase()}`}
   >
     {levelMetadata.name}
   </Badge>
   ```
   
   Then add CSS classes for each Bloom's level in your global CSS:
   ```css
   .bloom-level-remember { background-color: #E57373; }
   .bloom-level-understand { background-color: #FFB74D; }
   /* etc. */
   ```

   **Option 3: Use a wrapper div with style**
   ```tsx
   <div style={{ backgroundColor: levelMetadata.color }} className="rounded-full px-2.5 py-0.5">
     <Badge className="bg-transparent text-white">
       {levelMetadata.name}
     </Badge>
   </div>
   ```

## 2. MasteryHeatmap.tsx

### Error
```
Type '{ id: string; }[]' is not assignable to type 'HeatMapSerie<DefaultHeatMapDatum, { id: string; }>[]'.
Type '{ id: string; }' is not assignable to type 'HeatMapSerie<DefaultHeatMapDatum, { id: string; }>'.
Property 'data' is missing in type '{ id: string; }' but required in type '{ id: string; data: DefaultHeatMapDatum[]; }'.
```

### Analysis
The `ResponsiveHeatMap` component from `@nivo/heatmap` expects data in a specific format. Each item in the data array should have an `id` property and a `data` array property.

### Solution

1. **Current Code (Line 31-42):**
```tsx
const heatmapData = data.studentNames.map((student, studentIndex) => {
  const rowData: Record<string, number> = {};
  
  data.topicNames.forEach((topic, topicIndex) => {
    rowData[topic] = data.heatmapData[studentIndex][topicIndex];
  });
  
  return {
    id: student,
    ...rowData
  };
});
```

2. **Fix Approach:**
   - Transform the data to match the expected HeatMapSerie format
   - Each item needs an id and a data array of objects

3. **Implementation:**
```tsx
const heatmapData = data.studentNames.map((student, studentIndex) => {
  // Create data array with proper format
  const seriesData = data.topicNames.map((topic, topicIndex) => ({
    x: topic,
    y: data.heatmapData[studentIndex][topicIndex]
  }));
  
  return {
    id: student,
    data: seriesData
  };
});
```

## 3. StudentBloomsPerformanceChart.tsx

### Error
```
Cannot find module '@nivo/radar' or its corresponding type declarations.
```

### Analysis
The `@nivo/radar` package is missing from the project dependencies.

### Solution

1. **Fix Approach:**
   - Install the missing package
   - Or create an alternative visualization using available libraries

2. **Implementation Options:**

   **Option 1: Install the missing package**
   ```bash
   npm install @nivo/radar
   # or
   yarn add @nivo/radar
   ```

   **Option 2: Use an alternative visualization**
   - Replace with a different chart type from an already installed library
   - Create a custom radar chart using SVG or Canvas

   **Option 3: Use a temporary placeholder**
   ```tsx
   // Temporary placeholder until @nivo/radar is installed
   const RadarChartPlaceholder = ({ data, height }: { data: any[], height: number }) => (
     <div style={{ height }} className="flex items-center justify-center bg-gray-100 rounded-md">
       <div className="text-center">
         <p className="text-muted-foreground">Radar chart visualization</p>
         <p className="text-sm text-muted-foreground mt-2">
           {data.map(item => `${item.level}: ${item.value}%`).join(', ')}
         </p>
       </div>
     </div>
   );
   ```

## Implementation Plan

1. **Fix InterventionSuggestions.tsx**
   - Implement Option 2 (custom variant with Bloom's level classes)
   - Add the necessary CSS classes to the global stylesheet

2. **Fix MasteryHeatmap.tsx**
   - Transform the data to match the expected HeatMapSerie format
   - Test with sample data to ensure correct rendering

3. **Fix StudentBloomsPerformanceChart.tsx**
   - Install the @nivo/radar package
   - If installation is not possible, implement the temporary placeholder

4. **Testing**
   - Test each component individually with sample data
   - Verify that TypeScript errors are resolved
   - Check for any visual regressions

5. **Documentation**
   - Update component documentation to reflect the changes
   - Add notes about the data format requirements for future reference
