/**
 * Chart utilities for analytics data
 */
import { 
  AnalyticsChartOptions, 
  AnalyticsChartType,
  AnalyticsChartData
} from '../types';

/**
 * Chart colors
 */
export const CHART_COLORS = {
  primary: '#2196f3',
  secondary: '#ff9800',
  success: '#4caf50',
  danger: '#f44336',
  warning: '#ffeb3b',
  info: '#00bcd4',
  light: '#e0e0e0',
  dark: '#212121',
  purple: '#9c27b0',
  pink: '#e91e63',
  indigo: '#3f51b5',
  teal: '#009688',
  lime: '#cddc39',
  amber: '#ffc107',
  brown: '#795548',
  gray: '#9e9e9e',
};

/**
 * Chart color palettes
 */
export const CHART_PALETTES = {
  default: [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.success,
    CHART_COLORS.danger,
    CHART_COLORS.warning,
    CHART_COLORS.info,
    CHART_COLORS.purple,
    CHART_COLORS.pink,
    CHART_COLORS.indigo,
    CHART_COLORS.teal,
  ],
  sequential: [
    '#0d47a1',
    '#1565c0',
    '#1976d2',
    '#1e88e5',
    '#2196f3',
    '#42a5f5',
    '#64b5f6',
    '#90caf9',
    '#bbdefb',
    '#e3f2fd',
  ],
  diverging: [
    '#b71c1c',
    '#d32f2f',
    '#f44336',
    '#e57373',
    '#ffcdd2',
    '#e3f2fd',
    '#90caf9',
    '#42a5f5',
    '#1e88e5',
    '#0d47a1',
  ],
  categorical: [
    '#2196f3',
    '#f44336',
    '#4caf50',
    '#ff9800',
    '#9c27b0',
    '#00bcd4',
    '#ffeb3b',
    '#795548',
    '#607d8b',
    '#e91e63',
  ],
};

/**
 * Create a chart configuration
 * 
 * @param title Chart title
 * @param type Chart type
 * @param labels Chart labels
 * @param datasets Chart datasets
 * @param options Additional options
 * @returns Chart configuration
 */
export function createChart(
  title: string,
  type: AnalyticsChartType,
  labels: string[],
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>,
  options: {
    height?: number;
    width?: number;
    responsive?: boolean;
    maintainAspectRatio?: boolean;
  } = {}
): AnalyticsChartOptions {
  // Apply default colors if not provided
  const coloredDatasets = datasets.map((dataset, index) => {
    const color = CHART_PALETTES.categorical[index % CHART_PALETTES.categorical.length];
    
    return {
      ...dataset,
      backgroundColor: dataset.backgroundColor || (
        type === 'line' ? `${color}20` : color
      ),
      borderColor: dataset.borderColor || (
        type === 'line' ? color : undefined
      ),
      borderWidth: dataset.borderWidth || (
        type === 'line' ? 2 : 0
      ),
    };
  });
  
  return {
    title,
    type,
    data: {
      labels,
      datasets: coloredDatasets,
    },
    ...options,
  };
}

/**
 * Create a bar chart
 * 
 * @param title Chart title
 * @param labels Chart labels
 * @param data Chart data
 * @param dataLabel Data label
 * @param color Bar color
 * @returns Chart configuration
 */
export function createBarChart(
  title: string,
  labels: string[],
  data: number[],
  dataLabel: string,
  color: string = CHART_COLORS.primary
): AnalyticsChartOptions {
  return createChart(
    title,
    'bar',
    labels,
    [
      {
        label: dataLabel,
        data,
        backgroundColor: color,
      },
    ]
  );
}

/**
 * Create a line chart
 * 
 * @param title Chart title
 * @param labels Chart labels
 * @param data Chart data
 * @param dataLabel Data label
 * @param color Line color
 * @returns Chart configuration
 */
export function createLineChart(
  title: string,
  labels: string[],
  data: number[],
  dataLabel: string,
  color: string = CHART_COLORS.primary
): AnalyticsChartOptions {
  return createChart(
    title,
    'line',
    labels,
    [
      {
        label: dataLabel,
        data,
        borderColor: color,
        backgroundColor: `${color}20`,
      },
    ]
  );
}

/**
 * Create a pie chart
 * 
 * @param title Chart title
 * @param labels Chart labels
 * @param data Chart data
 * @param dataLabel Data label
 * @param colors Slice colors
 * @returns Chart configuration
 */
export function createPieChart(
  title: string,
  labels: string[],
  data: number[],
  dataLabel: string,
  colors: string[] = CHART_PALETTES.categorical
): AnalyticsChartOptions {
  return createChart(
    title,
    'pie',
    labels,
    [
      {
        label: dataLabel,
        data,
        backgroundColor: colors.slice(0, data.length),
      },
    ]
  );
}

/**
 * Create a doughnut chart
 * 
 * @param title Chart title
 * @param labels Chart labels
 * @param data Chart data
 * @param dataLabel Data label
 * @param colors Slice colors
 * @returns Chart configuration
 */
export function createDoughnutChart(
  title: string,
  labels: string[],
  data: number[],
  dataLabel: string,
  colors: string[] = CHART_PALETTES.categorical
): AnalyticsChartOptions {
  return createChart(
    title,
    'doughnut',
    labels,
    [
      {
        label: dataLabel,
        data,
        backgroundColor: colors.slice(0, data.length),
      },
    ]
  );
}

/**
 * Create a multi-series bar chart
 * 
 * @param title Chart title
 * @param labels Chart labels
 * @param datasets Chart datasets
 * @param colors Series colors
 * @returns Chart configuration
 */
export function createMultiBarChart(
  title: string,
  labels: string[],
  datasets: Array<{
    label: string;
    data: number[];
  }>,
  colors: string[] = CHART_PALETTES.categorical
): AnalyticsChartOptions {
  return createChart(
    title,
    'bar',
    labels,
    datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: colors[index % colors.length],
    }))
  );
}

/**
 * Create a multi-series line chart
 * 
 * @param title Chart title
 * @param labels Chart labels
 * @param datasets Chart datasets
 * @param colors Series colors
 * @returns Chart configuration
 */
export function createMultiLineChart(
  title: string,
  labels: string[],
  datasets: Array<{
    label: string;
    data: number[];
  }>,
  colors: string[] = CHART_PALETTES.categorical
): AnalyticsChartOptions {
  return createChart(
    title,
    'line',
    labels,
    datasets.map((dataset, index) => {
      const color = colors[index % colors.length];
      
      return {
        ...dataset,
        borderColor: color,
        backgroundColor: `${color}20`,
      };
    })
  );
}
