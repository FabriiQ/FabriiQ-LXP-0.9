'use client';

import React from 'react';
import { AnalyticsReport } from '../types';
import { formatDate } from '../utils/formatting';

interface ReportCardProps {
  report: AnalyticsReport;
  onView?: (report: AnalyticsReport) => void;
  onEdit?: (report: AnalyticsReport) => void;
  onDelete?: (report: AnalyticsReport) => void;
  onExport?: (report: AnalyticsReport) => void;
  className?: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onView,
  onEdit,
  onDelete,
  onExport,
  className = '',
}) => {
  return (
    <div className={`report-card ${className}`}>
      <div className="report-header">
        <h3 className="report-title">{report.title}</h3>
        <div className="report-date">
          {formatDate(report.createdAt, true)}
        </div>
      </div>
      
      <div className="report-content">
        <p className="report-description">{report.description}</p>
        
        <div className="report-stats">
          <div className="stat-item">
            <span className="stat-label">Metrics:</span>
            <span className="stat-value">{report.metrics.length}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Charts:</span>
            <span className="stat-value">{report.charts.length}</span>
          </div>
        </div>
      </div>
      
      <div className="report-actions">
        {onView && (
          <button 
            className="view-button"
            onClick={() => onView(report)}
          >
            View
          </button>
        )}
        
        {onEdit && (
          <button 
            className="edit-button"
            onClick={() => onEdit(report)}
          >
            Edit
          </button>
        )}
        
        {onExport && (
          <button 
            className="export-button"
            onClick={() => onExport(report)}
          >
            Export
          </button>
        )}
        
        {onDelete && (
          <button 
            className="delete-button"
            onClick={() => onDelete(report)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
