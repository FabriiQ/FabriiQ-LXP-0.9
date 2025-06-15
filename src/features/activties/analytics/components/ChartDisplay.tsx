'use client';

import React from 'react';
import { AnalyticsChartOptions } from '../types';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

interface ChartDisplayProps {
  chart: AnalyticsChartOptions;
  className?: string;
}

export const ChartDisplay: React.FC<ChartDisplayProps> = ({
  chart,
  className = '',
}) => {
  // Convert chart data to nivo format
  const getNivoData = () => {
    switch (chart.type) {
      case 'bar':
        return chart.data.labels.map((label, index) => {
          const dataPoint: Record<string, any> = { id: label };
          chart.data.datasets.forEach(dataset => {
            dataPoint[dataset.label] = dataset.data[index] || 0;
          });
          return dataPoint;
        });
      case 'line':
        return chart.data.datasets.map(dataset => ({
          id: dataset.label,
          color: dataset.borderColor as string,
          data: chart.data.labels.map((label, index) => ({
            x: label,
            y: dataset.data[index] || 0
          }))
        }));
      case 'pie':
      case 'doughnut':
        return chart.data.labels.map((label, index) => {
          // Use the first dataset for pie charts
          const dataset = chart.data.datasets[0];
          return {
            id: label,
            label,
            value: dataset.data[index] || 0,
            color: Array.isArray(dataset.backgroundColor)
              ? dataset.backgroundColor[index]
              : dataset.backgroundColor
          };
        });
      default:
        return [];
    }
  };

  // Render appropriate chart based on type
  const renderChart = () => {
    const data = getNivoData();
    const commonProps = {
      margin: { top: 40, right: 40, bottom: 60, left: 60 },
      animate: true,
      theme: {
        fontSize: 12,
        textColor: '#333',
        axis: {
          domain: {
            line: {
              stroke: '#ddd',
              strokeWidth: 1
            }
          },
          ticks: {
            line: {
              stroke: '#ddd',
              strokeWidth: 1
            }
          }
        },
        grid: {
          line: {
            stroke: '#ddd',
            strokeWidth: 1
          }
        }
      }
    };

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveBar
            data={data}
            keys={chart.data.datasets.map(d => d.label)}
            indexBy="id"
            padding={0.3}
            labelSkipWidth={12}
            labelSkipHeight={12}
            colors={{ scheme: 'nivo' }}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: chart.title || '',
              legendPosition: 'middle',
              legendOffset: 40
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: '',
              legendPosition: 'middle',
              legendOffset: -40
            }}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: 50,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            {...commonProps}
          />
        );
      case 'line':
        return (
          <ResponsiveLine
            data={data}
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: chart.title || '',
              legendOffset: 36,
              legendPosition: 'middle'
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: '',
              legendOffset: -40,
              legendPosition: 'middle'
            }}
            pointSize={10}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemBackground: 'rgba(0, 0, 0, .03)',
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            {...commonProps}
          />
        );
      case 'pie':
      case 'doughnut':
        return (
          <ResponsivePie
            data={data}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={chart.type === 'doughnut' ? 0.5 : 0}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: 56,
                itemsSpacing: 0,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: '#999',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemTextColor: '#000'
                    }
                  }
                ]
              }
            ]}
            {...commonProps}
          />
        );
      default:
        return <div>Unsupported chart type: {chart.type}</div>;
    }
  };

  return (
    <div
      className={`chart-display ${className}`}
      style={{
        width: chart.width ? `${chart.width}px` : '100%',
        height: chart.height ? `${chart.height}px` : '300px',
      }}
    >
      {renderChart()}
    </div>
  );
};
