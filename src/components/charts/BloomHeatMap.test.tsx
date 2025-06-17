import React from 'react';
import { render, screen } from '@testing-library/react';
import { BloomHeatMap } from './BloomHeatMap'; // Assuming path is correct
import { vi } from 'vitest';

// Mock @nivo/heatmap
const mockResponsiveHeatMap = vi.fn(() => <div data-testid="responsive-heatmap" />);
vi.mock('@nivo/heatmap', () => ({
  ResponsiveHeatMap: mockResponsiveHeatMap,
}));

describe('BloomHeatMap data handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Test 1.1: Null data prop', () => {
    render(<BloomHeatMap data={null as any} />);
    expect(screen.getByText('No data available for heatmap')).toBeInTheDocument();
    expect(mockResponsiveHeatMap).not.toHaveBeenCalled();
  });

  test('Test 1.2: Empty array data prop', () => {
    render(<BloomHeatMap data={[]} />);
    expect(screen.getByText('No data available for heatmap')).toBeInTheDocument();
    expect(mockResponsiveHeatMap).not.toHaveBeenCalled();
  });

  test('Test 2: Series exist but contain no data points', () => {
    render(<BloomHeatMap data={[{ id: 's1', data: [] }]} />);
    expect(screen.getByText('No data points to display in the heatmap')).toBeInTheDocument();
    expect(mockResponsiveHeatMap).not.toHaveBeenCalled();
  });

  test('Test 3: All data points have the same y value', () => {
    render(
      <BloomHeatMap
        data={[{ id: 's1', data: [{ x: 't1', y: 0 }, { x: 't2', y: 0 }] }]}
      />
    );
    expect(
      screen.getByText('All data values are uniform (0). A continuous color scale cannot be meaningfully applied.')
    ).toBeInTheDocument();
    expect(mockResponsiveHeatMap).not.toHaveBeenCalled();
  });

  test('Test 3.1: All data points have the same y value (non-zero)', () => {
    render(
      <BloomHeatMap
        data={[{ id: 's1', data: [{ x: 't1', y: 55 }, { x: 't2', y: 55 }, { x: 't3', y: 55 }] }]}
      />
    );
    expect(
      screen.getByText('All data values are uniform (55). A continuous color scale cannot be meaningfully applied.')
    ).toBeInTheDocument();
    expect(mockResponsiveHeatMap).not.toHaveBeenCalled();
  });


  test('Test 4: Valid, diverse data', () => {
    const validData = [{ id: 's1', data: [{ x: 't1', y: 10 }, { x: 't2', y: 20 }] }];
    render(<BloomHeatMap data={validData} />);
    expect(screen.queryByText(/No data available/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No data points to display/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/All data values are uniform/i)).not.toBeInTheDocument();
    expect(mockResponsiveHeatMap).toHaveBeenCalledTimes(1);
    expect(mockResponsiveHeatMap).toHaveBeenCalledWith(
      expect.objectContaining({
        data: validData, // Nivo component receives the processed validData
      }),
      expect.anything() // Second argument is context for class components, can ignore
    );
  });

  test('Test 5: Ensure validData correctly handles series with non-array data properties', () => {
    const mixedData = [
      { id: 's1', data: null as any },
      { id: 's2', data: [{x: 't1', y: 10}] }
    ];
    const expectedProcessedData = [
        { id: 's1', data: [] },
        { id: 's2', data: [{x: 't1', y: 10}] }
    ];
    render(<BloomHeatMap data={mixedData} />);
    expect(mockResponsiveHeatMap).toHaveBeenCalledTimes(1);
    expect(mockResponsiveHeatMap).toHaveBeenCalledWith(
        expect.objectContaining({
            data: expectedProcessedData,
        }),
        expect.anything()
    );
  });

  test('Test 5.1: Series with undefined data property', () => {
    const dataWithUndefined = [
      { id: 's1', data: undefined as any },
      { id: 's2', data: [{ x: 't1', y: 10 }] },
    ];
    const expectedProcessedData = [
      { id: 's1', data: [] },
      { id: 's2', data: [{ x: 't1', y: 10 }] },
    ];
    render(<BloomHeatMap data={dataWithUndefined} />);
    expect(mockResponsiveHeatMap).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expectedProcessedData,
      }),
      expect.anything()
    );
  });
});
