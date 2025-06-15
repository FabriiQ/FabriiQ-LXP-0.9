'use client';

import React from 'react';
import { AnalyticsReport, AnalyticsExportFormat } from '../types';
import { MetricCard } from './MetricCard';
import { ChartDisplay } from './ChartDisplay';
import { formatDate } from '../utils/formatting';

interface ReportViewProps {
  report: AnalyticsReport;
  onExport?: (format: AnalyticsExportFormat) => void;
  onEdit?: () => void;
  onBack?: () => void;
  className?: string;
}

export const ReportView: React.FC<ReportViewProps> = ({
  report,
  onExport,
  onEdit,
  onBack,
  className = '',
}) => {
  return (
    <div className={`report-view ${className}`}>
      <div className="report-view-header">
        <div className="header-left">
          {onBack && (
            <button 
              className="back-button"
              onClick={onBack}
            >
              ← Back
            </button>
          )}
          
          <div className="report-info">
            <h2 className="report-title">{report.title}</h2>
            <div className="report-date">
              Generated on {formatDate(report.createdAt, true)}
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          {onEdit && (
            <button 
              className="edit-button"
              onClick={onEdit}
            >
              Edit Report
            </button>
          )}
          
          {onExport && (
            <div className="export-dropdown">
              <button className="export-button">
                Export
              </button>
              <div className="export-options">
                <button onClick={() => onExport('csv')}>CSV</button>
                <button onClick={() => onExport('excel')}>Excel</button>
                <button onClick={() => onExport('pdf')}>PDF</button>
                <button onClick={() => onExport('json')}>JSON</button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="report-description">
        {report.description}
      </div>
      
      {report.metrics.length > 0 && (
        <div className="report-metrics">
          {report.metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              metric={metric}
            />
          ))}
        </div>
      )}
      
      {report.charts.length > 0 && (
        <div className="report-charts">
          {report.charts.map((chart, index) => (
            <div 
              key={index}
              className="chart-container"
            >
              <ChartDisplay chart={chart} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
