'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AnalyticsReport,
  AnalyticsMetric,
  AnalyticsChartOptions,
  AnalyticsDashboardFilters,
  AnalyticsExportOptions
} from '../types';
import { reportsService } from '../services/reports';

/**
 * Hook for using analytics reports
 * 
 * @returns Reports hook
 */
export function useReports() {
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [currentReport, setCurrentReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Load all reports
   */
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const reports = await reportsService.getReports();
      setReports(reports);
    } catch (error) {
      console.error('Error loading reports:', error);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Load a report by ID
   * 
   * @param reportId Report ID
   */
  const loadReport = useCallback(async (reportId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const report = await reportsService.getReport(reportId);
      setCurrentReport(report);
    } catch (error) {
      console.error('Error loading report:', error);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Create a report
   * 
   * @param title Report title
   * @param description Report description
   * @param metrics Report metrics
   * @param charts Report charts
   * @param filters Report filters
   * @returns Created report
   */
  const createReport = useCallback(async (
    title: string,
    description: string,
    metrics: AnalyticsMetric[],
    charts: AnalyticsChartOptions[],
    filters: AnalyticsDashboardFilters
  ): Promise<AnalyticsReport | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const report = await reportsService.createReport(
        title,
        description,
        metrics,
        charts,
        filters
      );
      
      // Update reports list
      setReports(prev => [...prev, report]);
      
      return report;
    } catch (error) {
      console.error('Error creating report:', error);
      setError('Failed to create report');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Update a report
   * 
   * @param reportId Report ID
   * @param updates Report updates
   * @returns Updated report
   */
  const updateReport = useCallback(async (
    reportId: string,
    updates: Partial<Omit<AnalyticsReport, 'id' | 'createdAt'>>
  ): Promise<AnalyticsReport | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const report = await reportsService.updateReport(reportId, updates);
      
      if (report) {
        // Update reports list
        setReports(prev => 
          prev.map(r => r.id === reportId ? report : r)
        );
        
        // Update current report if it's the one being updated
        if (currentReport && currentReport.id === reportId) {
          setCurrentReport(report);
        }
      }
      
      return report;
    } catch (error) {
      console.error('Error updating report:', error);
      setError('Failed to update report');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentReport]);
  
  /**
   * Delete a report
   * 
   * @param reportId Report ID
   * @returns Whether the report was deleted
   */
  const deleteReport = useCallback(async (reportId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const deleted = await reportsService.deleteReport(reportId);
      
      if (deleted) {
        // Update reports list
        setReports(prev => prev.filter(r => r.id !== reportId));
        
        // Clear current report if it's the one being deleted
        if (currentReport && currentReport.id === reportId) {
          setCurrentReport(null);
        }
      }
      
      return deleted;
    } catch (error) {
      console.error('Error deleting report:', error);
      setError('Failed to delete report');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentReport]);
  
  /**
   * Generate an activity report
   * 
   * @param activityId Activity ID
   * @returns Generated report
   */
  const generateActivityReport = useCallback(async (activityId: string): Promise<AnalyticsReport | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const report = await reportsService.generateActivityReport(activityId);
      
      if (report) {
        // Update reports list
        setReports(prev => [...prev, report]);
        
        // Set as current report
        setCurrentReport(report);
      }
      
      return report;
    } catch (error) {
      console.error('Error generating activity report:', error);
      setError('Failed to generate activity report');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Generate a user report
   * 
   * @param userId User ID
   * @returns Generated report
   */
  const generateUserReport = useCallback(async (userId: string): Promise<AnalyticsReport | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const report = await reportsService.generateUserReport(userId);
      
      if (report) {
        // Update reports list
        setReports(prev => [...prev, report]);
        
        // Set as current report
        setCurrentReport(report);
      }
      
      return report;
    } catch (error) {
      console.error('Error generating user report:', error);
      setError('Failed to generate user report');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Generate a class report
   * 
   * @param classId Class ID
   * @returns Generated report
   */
  const generateClassReport = useCallback(async (classId: string): Promise<AnalyticsReport | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const report = await reportsService.generateClassReport(classId);
      
      if (report) {
        // Update reports list
        setReports(prev => [...prev, report]);
        
        // Set as current report
        setCurrentReport(report);
      }
      
      return report;
    } catch (error) {
      console.error('Error generating class report:', error);
      setError('Failed to generate class report');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Export a report
   * 
   * @param reportId Report ID
   * @param options Export options
   * @returns Export URL
   */
  const exportReport = useCallback(async (
    reportId: string,
    options: AnalyticsExportOptions
  ): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const url = await reportsService.exportReport(reportId, options);
      return url;
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load reports on mount
  useEffect(() => {
    loadReports();
  }, [loadReports]);
  
  return {
    reports,
    currentReport,
    loading,
    error,
    loadReports,
    loadReport,
    createReport,
    updateReport,
    deleteReport,
    generateActivityReport,
    generateUserReport,
    generateClassReport,
    exportReport,
  };
}
